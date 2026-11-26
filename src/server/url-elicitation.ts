import {
	CLIENT_CAPABILITIES_META_KEY,
	type CallToolResult,
	createRequestStateCodec,
	inputRequired,
	inputResponse,
	ProtocolError,
	ProtocolErrorCode,
	type RequestStateCodec,
	type ServerContext,
} from "@modelcontextprotocol/server";

/** Input-response key for the single browser handoff a tool call can request. */
const HANDOFF_KEY = "handoff";
const MAX_SEALED_STATE_BYTES = 8 * 1024;

/** The state sealed between rounds; the finalized result is never recomputed. */
export type UrlElicitationState = {
	finalized: CallToolResult;
	principalId: string | null;
	toolName: string;
};

export type UrlElicitationOptions = {
	/** Signed codec; its `verify` is also installed as `ServerOptions.requestState.verify`. */
	requestState: RequestStateCodec<UrlElicitationState>;
	/** Binds sealed state to the authenticated user. */
	principalId?: string | undefined;
};

const ALLOWED_HOSTS = new Set([
	"dynamoi.com",
	"checkout.stripe.com",
	"accounts.google.com",
	"facebook.com",
	"www.facebook.com",
	"business.facebook.com",
]);

function isAllowedHandoffUrl(value: string): boolean {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return false;
	}
	return (
		url.protocol === "https:" &&
		url.username === "" &&
		url.password === "" &&
		(ALLOWED_HOSTS.has(url.hostname) || url.hostname.endsWith(".dynamoi.com"))
	);
}

const VERIFY_TOOL_BY_NAME: Record<string, string> = {
	dynamoi_start_meta_connection: "dynamoi_get_platform_status",
	dynamoi_start_youtube_channel_link: "dynamoi_get_platform_status",
	dynamoi_add_campaign_funds: "dynamoi_get_billing",
	dynamoi_shop_create_checkout: "dynamoi_shop_list_orders",
	dynamoi_prepare_shop_rebuy_checkout: "dynamoi_shop_list_orders",
};

/** Tools whose successful result carries a canonical user-present browser URL. */
function isUrlElicitationTool(toolName: string): boolean {
	return toolName in VERIFY_TOOL_BY_NAME;
}

function extractHandoffUrl(
	toolName: string,
	result: CallToolResult,
): string | undefined {
	if (result.isError) return undefined;
	const data = (result.structuredContent as { data?: unknown } | undefined)
		?.data;
	if (!data || typeof data !== "object") return undefined;
	const record = data as Record<string, unknown>;
	if (
		toolName === "dynamoi_add_campaign_funds" &&
		record["kind"] !== "add_funds_checkout"
	) {
		return undefined;
	}
	const field =
		toolName === "dynamoi_start_meta_connection" ||
		toolName === "dynamoi_start_youtube_channel_link"
			? "authorizationUrl"
			: "checkoutUrl";
	const url = record[field];
	return typeof url === "string" && isAllowedHandoffUrl(url) ? url : undefined;
}

function invalidState(): ProtocolError {
	return new ProtocolError(
		ProtocolErrorCode.InvalidParams,
		"Invalid or expired requestState",
	);
}

function withNote(result: CallToolResult, note: string): CallToolResult {
	return {
		...result,
		content: [...result.content, { text: note, type: "text" as const }],
	};
}

/**
 * Round 2: the user answered the URL prompt. Returns the sealed round-1 result
 * with a status note and never dispatches the tool again. Returns `undefined`
 * when the request carries no handoff answer (round 1).
 */
export function resumeUrlElicitation(
	toolName: string,
	ctx: ServerContext,
	options: UrlElicitationOptions,
): CallToolResult | undefined {
	const answer = inputResponse(ctx.mcpReq.inputResponses, HANDOFF_KEY);
	if (answer.kind !== "elicit") return undefined;
	const state = ctx.mcpReq.requestState<UrlElicitationState>();
	if (
		!state ||
		typeof state !== "object" ||
		state.toolName !== toolName ||
		!state.finalized ||
		!Array.isArray(state.finalized.content) ||
		(options.principalId !== undefined &&
			state.principalId !== options.principalId)
	) {
		throw invalidState();
	}
	if (answer.action === "accept") {
		return withNote(
			state.finalized,
			`The user opened the browser handoff. Use ${VERIFY_TOOL_BY_NAME[toolName] ?? "the matching read tool"} to verify the updated state before telling them it is complete.`,
		);
	}
	return withNote(
		state.finalized,
		"The interactive browser prompt was dismissed. The handoff URL in this result remains available if the user wants to open it manually.",
	);
}

/**
 * Round 1: when the host supports URL elicitation, trade a handoff result for
 * an input-required response that seals the finalized result. Returns
 * `undefined` to send the plain-URL result unchanged.
 */
export async function requestUrlElicitation(input: {
	ctx: ServerContext;
	finalized: CallToolResult;
	options: UrlElicitationOptions;
	toolName: string;
}): Promise<ReturnType<typeof inputRequired> | undefined> {
	const { ctx, finalized, options, toolName } = input;
	if (!isUrlElicitationTool(toolName)) return undefined;
	// The SDK types the envelope as an empty object; the key is the wire contract.
	const envelope = ctx.mcpReq.envelope as
		Record<string, { elicitation?: { url?: unknown } } | undefined> | undefined;
	if (
		envelope?.[CLIENT_CAPABILITIES_META_KEY]?.elicitation?.url === undefined
	) {
		return undefined;
	}
	const url = extractHandoffUrl(toolName, finalized);
	if (!url) return undefined;
	const requestState = await options.requestState.mint({
		finalized,
		principalId: options.principalId ?? null,
		toolName,
	});
	if (Buffer.byteLength(requestState) > MAX_SEALED_STATE_BYTES)
		return undefined;
	return inputRequired({
		inputRequests: {
			[HANDOFF_KEY]: inputRequired.elicitUrl({
				message: "Open this Dynamoi link in your browser to continue.",
				url,
			}),
		},
		requestState,
	});
}

/** Builds the signed 15-minute state codec from a server-held 32-byte key. */
export function createUrlElicitationOptions(input: {
	key: Uint8Array;
	principalId: string;
}): UrlElicitationOptions {
	return {
		principalId: input.principalId,
		requestState: createRequestStateCodec<UrlElicitationState>({
			key: input.key,
			ttlSeconds: 15 * 60,
		}),
	};
}
