import type { App } from "@modelcontextprotocol/ext-apps";
import { object } from "./data";

type WorkspaceReadResult = Awaited<ReturnType<App["callServerTool"]>>;
type WorkspaceContextResult = Awaited<ReturnType<App["updateModelContext"]>>;
export type WorkspaceBridge = {
	callServerTool: (params: {
		name: string;
		arguments: Record<string, unknown>;
	}) => Promise<WorkspaceReadResult>;
	updateModelContext: (params: {
		content: { type: "text"; text: string }[];
	}) => Promise<WorkspaceContextResult>;
	openLink: App["openLink"];
};
// A structured initial denial must clear own context even if host hydration arrives later.
export function clearDeniedInitialContext(
	result: unknown,
	clear: () => void,
): boolean {
	const response = object(result);
	const code = object(response.structuredContent)["code"];
	const denied =
		Boolean(object(response._meta)["mcp/www_authenticate"]) ||
		code === "INSUFFICIENT_SCOPE" ||
		code === "TENANT_ACCESS_DENIED";
	if (denied) {
		clear();
	}
	return denied;
}
export function envelope(result: unknown): Record<string, unknown> {
	const response = object(result);
	const body = object(response.structuredContent);
	if (response.isError || body.status !== "success") {
		if (
			object(response._meta)["mcp/www_authenticate"] ||
			body.code === "INSUFFICIENT_SCOPE"
		) {
			throw new Error(
				"Dynamoi access is unavailable. Reconnect in your host, then retry.",
			);
		}
		if (body.code === "TENANT_ACCESS_DENIED") {
			throw new Error("Artist access is unavailable. Choose another artist.");
		}
		if (
			body.code === "RATE_LIMITED" &&
			body.retryable === true &&
			typeof body.retryAfterSeconds === "number" &&
			Number.isInteger(body.retryAfterSeconds) &&
			body.retryAfterSeconds > 0 &&
			body.retryAfterSeconds <= 86_400
		) {
			throw new Error(
				`This read is rate limited. Retry after ${body.retryAfterSeconds} seconds.`,
			);
		}
		throw new Error(
			"This read could not complete. Check your Dynamoi access, then retry.",
		);
	}
	return object(body.data);
}
export function errorMessage(error: unknown): string {
	return error instanceof Error &&
		/^(Artist access|Dynamoi access|This read|Unsupported workspace|This record)/.test(
			error.message,
		)
		? error.message
		: "This read could not complete. Check your Dynamoi access, then retry.";
}

export async function openLinkMessage(
	bridge: Pick<App, "openLink">,
	url: string,
): Promise<string> {
	try {
		const result = await bridge.openLink({ url });
		if (!result.isError) {
			return "Public Smart Link opened through your host.";
		}
	} catch (error) {
		console.error("Workspace host could not open the public link", error);
		/* A declined or failed host request has the same safe fallback. */
	}
	return "The host could not open this link. Copy the displayed public URL to open it yourself.";
}
