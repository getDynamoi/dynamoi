import {
	createMcpHandler,
	isLegacyRequest,
	type McpHttpHandler,
	type McpServer,
	WebStandardStreamableHTTPServerTransport,
} from "@modelcontextprotocol/server";

type HandleOptions = {
	createServer: () => McpServer;
	request: Request;
	parsedBody: unknown;
};

function methodNotAllowed(): Response {
	return new Response(
		JSON.stringify({
			error: { code: -32_000, message: "Method not allowed." },
			id: null,
			jsonrpc: "2.0",
		}),
		{
			headers: {
				Allow: "POST",
				"content-type": "application/json",
			},
			status: 405,
		},
	);
}

// CUSTOM INTEROP SHIM (2025-era clients such as ChatGPT):
// MCP SDK v2 serves 2026-07-28 requests through `createMcpHandler`, which does
// not check Accept. Its 2025-era path (`WebStandardStreamableHTTPServerTransport`,
// also behind the built-in `legacyStatelessFallback`) still answers 406 unless
// Accept lists both `application/json` and `text/event-stream`, and the built-in
// fallback always streams SSE. ChatGPT's 2025-era requests send
// `Accept: application/json` only, so this path normalizes Accept for the SDK
// check and keeps JSON response mode for clients that did not ask for SSE.
async function handleLegacyRequest(options: HandleOptions): Promise<Response> {
	const accept = options.request.headers.get("accept");
	const acceptsEventStream = accept?.includes("text/event-stream") ?? false;
	const acceptsJson =
		accept?.includes("application/json") || accept === "*/*" || !accept;
	const enableJsonResponse = !acceptsEventStream && Boolean(acceptsJson);

	let effectiveRequest = options.request;
	if (
		!(
			accept?.includes("application/json") &&
			accept.includes("text/event-stream")
		)
	) {
		const headers = new Headers(options.request.headers);
		headers.set("accept", "application/json, text/event-stream");
		// parsedBody is handed to the transport, so the request body is never read.
		effectiveRequest = new Request(options.request.url, {
			headers,
			method: options.request.method,
			signal: options.request.signal,
		});
	}

	// Each request owns a stateless server and transport: serverless routing
	// cannot guarantee a reusable session reaches the same process. Both close
	// once the response is complete or the client disconnects.
	const server = options.createServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		enableJsonResponse,
		sessionIdGenerator: undefined,
	});
	let closed = false;
	const close = () => {
		if (!closed) {
			closed = true;
			options.request.signal.removeEventListener("abort", close);
			void server.close().catch(console.error);
		}
	};
	options.request.signal.addEventListener("abort", close, { once: true });

	let response: Response;
	try {
		await server.connect(transport);
		response = await transport.handleRequest(effectiveRequest, {
			parsedBody: options.parsedBody,
		});
	} catch (error) {
		close();
		throw error;
	}
	if (!(response.body && isEventStream(response))) {
		close();
		return response;
	}
	return new Response(
		response.body.pipeThrough(new TransformStream({ flush: close })),
		{
			headers: response.headers,
			status: response.status,
			statusText: response.statusText,
		},
	);
}

function isEventStream(response: Response): boolean {
	return (response.headers.get("content-type") ?? "").includes(
		"text/event-stream",
	);
}

// One SDK handler serves every modern request; each request supplies the
// server factory for its own principal and tool profile.
const modernServerFactories = new WeakMap<Request, () => McpServer>();
let modernHandler: McpHttpHandler | undefined;

function getModernHandler(): McpHttpHandler {
	modernHandler ??= createMcpHandler(
		({ requestInfo }) => {
			const createServer =
				requestInfo && modernServerFactories.get(requestInfo);
			if (!createServer) {
				throw new Error(
					"No MCP server factory is registered for this request.",
				);
			}
			return createServer();
		},
		{ legacy: "reject", responseMode: "json" },
	);
	return modernHandler;
}

/**
 * Serves one stateless MCP POST. 2026-07-28 requests go through the SDK's
 * per-request handler; 2025-era requests (including `initialize`) go through
 * the legacy transport above. GET and DELETE have no stream or session to
 * serve, so both eras answer them with 405.
 */
export async function handleMcpHttpRequest(
	options: HandleOptions,
): Promise<Response> {
	if (options.request.method.toUpperCase() !== "POST") {
		return methodNotAllowed();
	}
	if (await isLegacyRequest(options.request, options.parsedBody)) {
		return handleLegacyRequest(options);
	}
	modernServerFactories.set(options.request, options.createServer);
	try {
		return await getModernHandler().fetch(options.request, {
			parsedBody: options.parsedBody,
		});
	} finally {
		modernServerFactories.delete(options.request);
	}
}
