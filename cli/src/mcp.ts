import { accessToken, MCP_URL, refresh } from "./oauth.ts";
import { loadCredentials } from "./store.ts";

export type Tool = {
	annotations?: { readOnlyHint?: boolean };
	description?: string;
	inputSchema: JsonSchema;
	name: string;
	title?: string;
};

export type JsonSchema = {
	[key: string]: unknown;
	const?: unknown;
	description?: string;
	enum?: unknown[];
	items?: JsonSchema;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	type?: string | string[];
};

export type ToolResult = {
	content?: { text?: string; type: string }[];
	isError?: boolean;
	structuredContent?: unknown;
};

type RpcResponse = { error?: { message: string }; result?: unknown };

/** Streamable HTTP replies are JSON, or one SSE `message` event carrying JSON. */
async function readRpc(response: Response): Promise<RpcResponse> {
	const text = await response.text();
	if (
		(response.headers.get("content-type") ?? "").includes("text/event-stream")
	) {
		const data = text
			.split(/\r?\n/u)
			.filter((line) => line.startsWith("data:"))
			.map((line) => line.slice(5).trim())
			.pop();
		return JSON.parse(data ?? "{}") as RpcResponse;
	}
	return JSON.parse(text || "{}") as RpcResponse;
}

async function post(method: string, params: unknown, token: string | null) {
	return fetch(MCP_URL, {
		body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
		headers: {
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
			"mcp-protocol-version": "2025-06-18",
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		method: "POST",
	});
}

async function rpc<T>(method: string, params?: unknown): Promise<T> {
	let response = await post(method, params, await accessToken());
	if (response.status === 401) {
		const stored = await loadCredentials();
		const next = stored ? await refresh(stored) : null;
		if (next) {
			response = await post(method, params, next.accessToken);
		}
	}
	if (response.status === 401) {
		throw new Error("Not signed in. Run `dynamoi login`.");
	}
	const body = await readRpc(response);
	if (body.error || !response.ok) {
		throw new Error(
			body.error?.message ?? `Dynamoi returned HTTP ${response.status}.`,
		);
	}
	return body.result as T;
}

export async function listTools(): Promise<Tool[]> {
	const tools: Tool[] = [];
	let cursor: string | undefined;
	do {
		const page = await rpc<{ nextCursor?: string; tools: Tool[] }>(
			"tools/list",
			cursor ? { cursor } : {},
		);
		tools.push(
			...page.tools.filter((tool) => tool.name.startsWith("dynamoi_")),
		);
		cursor = page.nextCursor;
	} while (cursor);
	return tools;
}

export const callTool = (name: string, args: Record<string, unknown>) =>
	rpc<ToolResult>("tools/call", { arguments: args, name });
