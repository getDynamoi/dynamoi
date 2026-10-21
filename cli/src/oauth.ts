import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { callbackPage } from "./callback-page.ts";
import { type Credentials, loadCredentials, saveCredentials } from "./store.ts";

const BASE_URL = "https://dynamoi.com";
export const MCP_URL = `${BASE_URL}/mcp`;

type ServerMetadata = {
	authorization_endpoint: string;
	issuer: string;
	registration_endpoint: string;
	revocation_endpoint?: string;
	scopes_supported?: string[];
	token_endpoint: string;
	userinfo_endpoint?: string;
};

type TokenResponse = {
	access_token: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
};

const b64url = (bytes: Buffer) => bytes.toString("base64url");

/** An error response may carry no JSON body; the status code still reports it. */
async function jsonBody<T>(response: Response): Promise<Partial<T>> {
	try {
		return (await response.json()) as Partial<T>;
	} catch {
		// Non-JSON body: callers fall back to the HTTP status.
		return {};
	}
}

async function serverMetadata(): Promise<ServerMetadata> {
	const response = await fetch(
		`${BASE_URL}/.well-known/oauth-authorization-server`,
	);
	if (!response.ok) {
		throw new Error(
			`Dynamoi sign-in is unavailable (HTTP ${response.status}).`,
		);
	}
	return (await response.json()) as ServerMetadata;
}

async function postForm<T>(
	url: string,
	body: Record<string, string>,
): Promise<T> {
	const response = await fetch(url, {
		body: new URLSearchParams(body),
		headers: { accept: "application/json" },
		method: "POST",
	});
	const json = await jsonBody<
		T & { error?: string; error_description?: string }
	>(response);
	if (!response.ok) {
		throw new Error(
			json.error_description ?? json.error ?? `HTTP ${response.status}`,
		);
	}
	return json as T;
}

function toCredentials(
	token: TokenResponse,
	clientId: string,
	previous?: Credentials,
): Credentials {
	return {
		accessToken: token.access_token,
		clientId,
		expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
		refreshToken: token.refresh_token ?? previous?.refreshToken,
		scope: token.scope ?? previous?.scope ?? "",
	};
}

function openBrowser(url: string): void {
	const [cmd, args]: [string, string[]] =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url.replaceAll("&", "^&")]]
				: ["xdg-open", [url]];
	spawn(cmd, args, { detached: true, stdio: "ignore" })
		.on("error", () => undefined)
		.unref();
}

/** Waits for the one loopback redirect and returns its query parameters. */
function listenForRedirect(
	state: string,
): Promise<{ port: number; result: Promise<URLSearchParams> }> {
	return new Promise((resolveListening, rejectListening) => {
		let settle: (params: URLSearchParams) => void;
		let fail: (error: Error) => void;
		const result = new Promise<URLSearchParams>((resolve, reject) => {
			settle = resolve;
			fail = reject;
		});
		const timer = setTimeout(() => {
			server.close();
			fail(new Error("Timed out waiting for browser sign-in."));
		}, 5 * 60_000);
		const server = createServer((request, response) => {
			const url = new URL(request.url ?? "/", "http://127.0.0.1");
			if (url.pathname !== "/callback") {
				response.writeHead(404).end();
				return;
			}
			const ok = url.searchParams.get("state") === state;
			response
				.writeHead(ok ? 200 : 400, {
					"content-type": "text/html; charset=utf-8",
				})
				.end(callbackPage(ok));
			if (ok) {
				clearTimeout(timer);
				server.close();
				settle(url.searchParams);
			}
		});
		server.once("error", rejectListening);
		server.listen(0, "127.0.0.1", () =>
			resolveListening({
				port: (server.address() as AddressInfo).port,
				result,
			}),
		);
	});
}

/** OAuth 2.1 authorization code with PKCE over a loopback redirect (RFC 8252). */
export async function login(
	print: (line: string) => void,
	open: (url: string) => void = openBrowser,
): Promise<Credentials> {
	const meta = await serverMetadata();
	const state = b64url(randomBytes(16));
	const { port, result } = await listenForRedirect(state);
	const redirectUri = `http://127.0.0.1:${port}/callback`;
	const scope = (meta.scopes_supported ?? []).join(" ");
	const registration = await fetch(meta.registration_endpoint, {
		body: JSON.stringify({
			client_name: "Dynamoi CLI",
			grant_types: ["authorization_code", "refresh_token"],
			redirect_uris: [redirectUri],
			response_types: ["code"],
			scope,
			token_endpoint_auth_method: "none",
		}),
		headers: { "content-type": "application/json" },
		method: "POST",
	});
	const client = await jsonBody<{ client_id: string }>(registration);
	if (!(registration.ok && client.client_id)) {
		throw new Error(
			`Could not register the CLI (HTTP ${registration.status}).`,
		);
	}
	const verifier = b64url(randomBytes(32));
	const authorize = new URL(meta.authorization_endpoint);
	authorize.search = new URLSearchParams({
		client_id: client.client_id,
		code_challenge: b64url(createHash("sha256").update(verifier).digest()),
		code_challenge_method: "S256",
		redirect_uri: redirectUri,
		resource: MCP_URL,
		response_type: "code",
		scope,
		state,
	}).toString();
	print(`Open this URL to sign in to Dynamoi:\n${authorize}`);
	open(authorize.toString());

	const params = await result;
	const error = params.get("error");
	const code = params.get("code");
	if (error || !code) {
		throw new Error(
			params.get("error_description") ?? error ?? "Sign-in failed.",
		);
	}
	const iss = params.get("iss");
	if (iss && iss !== meta.issuer) {
		throw new Error("Sign-in response came from an unexpected issuer.");
	}
	const token = await postForm<TokenResponse>(meta.token_endpoint, {
		client_id: client.client_id,
		code,
		code_verifier: verifier,
		grant_type: "authorization_code",
		redirect_uri: redirectUri,
		resource: MCP_URL,
	});
	const credentials = toCredentials(token, client.client_id);
	await saveCredentials(credentials);
	return credentials;
}

export async function refresh(
	credentials: Credentials,
): Promise<Credentials | null> {
	if (!credentials.refreshToken) {
		return null;
	}
	try {
		const meta = await serverMetadata();
		const token = await postForm<TokenResponse>(meta.token_endpoint, {
			client_id: credentials.clientId,
			grant_type: "refresh_token",
			refresh_token: credentials.refreshToken,
			resource: MCP_URL,
		});
		const next = toCredentials(token, credentials.clientId, credentials);
		await saveCredentials(next);
		return next;
	} catch {
		return null;
	}
}

/** A usable access token, refreshed when it is within a minute of expiry. */
export async function accessToken(): Promise<string | null> {
	const stored = await loadCredentials();
	if (!stored) {
		return null;
	}
	if (stored.expiresAt - Date.now() > 60_000) {
		return stored.accessToken;
	}
	return (await refresh(stored))?.accessToken ?? null;
}

export async function revoke(credentials: Credentials): Promise<void> {
	const token = credentials.refreshToken ?? credentials.accessToken;
	const meta = await serverMetadata();
	if (meta.revocation_endpoint) {
		try {
			await postForm(meta.revocation_endpoint, {
				client_id: credentials.clientId,
				token,
			});
		} catch {
			// Best effort: the local tokens are deleted either way.
		}
	}
}

export async function userInfo(
	token: string,
): Promise<Record<string, unknown>> {
	const meta = await serverMetadata();
	const response = await fetch(meta.userinfo_endpoint ?? "", {
		headers: { authorization: `Bearer ${token}` },
	});
	if (!response.ok) {
		throw new Error(
			`Could not read the signed-in account (HTTP ${response.status}).`,
		);
	}
	return (await response.json()) as Record<string, unknown>;
}
