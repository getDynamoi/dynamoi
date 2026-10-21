import { spawn } from "node:child_process";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export type Credentials = {
	accessToken: string;
	clientId: string;
	/** Epoch milliseconds. */
	expiresAt: number;
	refreshToken?: string;
	scope: string;
};

const SERVICE = "dynamoi-cli";
const ACCOUNT = "default";

/** Runs a keychain helper with the secret on stdin when its CLI allows it. */
function exec(
	cmd: string,
	args: string[],
	stdin?: string,
): Promise<string | null> {
	return new Promise((resolve) => {
		const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "ignore"] });
		let out = "";
		const timer = setTimeout(() => child.kill(), 5000);
		child.stdout.on("data", (chunk) => {
			out += chunk;
		});
		child.on("error", () => resolve(null));
		child.on("close", (code) => {
			clearTimeout(timer);
			resolve(code === 0 ? out : null);
		});
		child.stdin.on("error", () => undefined);
		child.stdin.end(stdin);
	});
}

const keychain =
	process.platform === "darwin"
		? {
				clear: () =>
					exec("security", [
						"delete-generic-password",
						"-s",
						SERVICE,
						"-a",
						ACCOUNT,
					]),
				read: () =>
					exec("security", [
						"find-generic-password",
						"-s",
						SERVICE,
						"-a",
						ACCOUNT,
						"-w",
					]),
				// `security` takes the secret only as an argument.
				write: (secret: string) =>
					exec("security", [
						"add-generic-password",
						"-U",
						"-s",
						SERVICE,
						"-a",
						ACCOUNT,
						"-w",
						secret,
					]),
			}
		: process.platform === "linux"
			? {
					clear: () =>
						exec("secret-tool", [
							"clear",
							"service",
							SERVICE,
							"account",
							ACCOUNT,
						]),
					read: () =>
						exec("secret-tool", [
							"lookup",
							"service",
							SERVICE,
							"account",
							ACCOUNT,
						]),
					write: (secret: string) =>
						exec(
							"secret-tool",
							[
								"store",
								"--label=Dynamoi CLI",
								"service",
								SERVICE,
								"account",
								ACCOUNT,
							],
							secret,
						),
				}
			: null;

function credentialsFile(): string {
	const config = process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config");
	return path.join(config, "dynamoi", "credentials.json");
}

function parse(raw: string | null): Credentials | null {
	try {
		const value = JSON.parse(raw ?? "") as Partial<Credentials>;
		return typeof value.accessToken === "string" &&
			typeof value.clientId === "string"
			? (value as Credentials)
			: null;
	} catch {
		return null;
	}
}

/** OS keychain first, then a 0600 file under the XDG config directory. */
export async function loadCredentials(): Promise<Credentials | null> {
	const fromKeychain = parse((await keychain?.read()) ?? null);
	if (fromKeychain) {
		return fromKeychain;
	}
	try {
		return parse(await readFile(credentialsFile(), "utf8"));
	} catch {
		// No credentials file: the user is signed out.
		return null;
	}
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
	const secret = JSON.stringify(credentials);
	if (keychain && (await keychain.write(secret)) !== null) {
		await rm(credentialsFile(), { force: true });
		return;
	}
	const file = credentialsFile();
	await mkdir(path.dirname(file), { mode: 0o700, recursive: true });
	await writeFile(file, secret, { mode: 0o600 });
	await chmod(file, 0o600);
}

export async function clearCredentials(): Promise<void> {
	await keychain?.clear();
	await rm(credentialsFile(), { force: true });
}
