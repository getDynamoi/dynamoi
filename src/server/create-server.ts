import {
	type CacheHint,
	type CallToolResult,
	McpServer,
	type ServerOptions,
	type StandardSchemaWithJSON,
	type Tool,
} from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
	DYNAMOI_BETTER_AUTH_MCP_SCOPES,
	DYNAMOI_MCP_TOOL_SCOPES,
} from "../auth/protected-resource";
import type {
	ApplyForDistributionData,
	CreateSmartLinkFromSpotifyData,
	CreateSmartLinksFromSpotifyArtistData,
	GetArtistAnalyticsJsonData,
	GetArtistAnalyticsSummaryData,
	GetArtistData,
	GetArtistSummaryData,
	GetBillingData,
	GetBillingSummaryData,
	GetCampaignData,
	GetCampaignReadinessData,
	GetCampaignReadinessSummaryData,
	GetCampaignSummaryData,
	GetCurrentUserData,
	GetCurrentUserSummaryData,
	GetDistributionApplicationData,
	GetPlatformStatusData,
	GetPlatformStatusSummaryData,
	GetSmartLinkData,
	GetSmartLinkSummaryData,
	LaunchCampaignData,
	ListArtistsData,
	ListArtistsSummaryData,
	ListAvailableCountriesData,
	ListAvailableCountriesSummaryData,
	ListCampaignsJsonData,
	ListCampaignsSummaryData,
	ListMediaAssetsData,
	ListMediaAssetsSummaryData,
	ListSmartLinksData,
	ListSmartLinksSummaryData,
	ResultEnvelope,
	SearchData,
	SearchSummaryData,
	SmartLinkSettingsData,
	StartMetaConnectionData,
	StartYoutubeChannelLinkData,
	UpdateCampaignData,
	UpdateSmartLinkArtistSettingsData,
	UpdateSmartLinkData,
} from "../types";
import { DYNAMOI_MCP_VERSION } from "../version";
import {
	DYNAMOI_ABOUT_DIRECTORY_MARKDOWN,
	DYNAMOI_ABOUT_MARKDOWN,
	DYNAMOI_ABOUT_RESOURCE,
	DYNAMOI_ABOUT_TOOL_DEFINITION,
	getDynamoiAbout,
} from "./about";
import {
	DescriptiveEntitySchema,
	DynamoiAccountOverviewDescriptiveDataSchema,
	DynamoiArtistListDescriptiveDataSchema,
} from "./account-schema.generated";
import { DISTRIBUTION_TOOL_DEFINITIONS } from "./distribution-tools";
import {
	DYNAMOI_CHATGPT_APP_INSTRUCTIONS,
	DYNAMOI_MCP_INSTRUCTIONS,
} from "./instructions";
import type { OpenAiFetchData, OpenAiSearchData } from "./openai-tools";
import {
	type ContactSupportData,
	type GetResumeFundingData,
	ResultErrorRecoverySchema,
} from "./output-schemas";
import { registerDynamoiPrompts } from "./prompts";
import { registerDynamoiResources } from "./resources";
import {
	type DynamoiShopCheckoutData,
	type DynamoiShopQuoteData,
	SHOP_TOOL_DEFINITIONS,
} from "./shop-tools";
import {
	previewSmartLinkThemes,
	registerSmartLinkThemePreviewResource,
	SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
} from "./smart-link-theme-preview";
import {
	FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS,
	PHASE_4_TOOL_DEFINITIONS,
	SMART_LINK_UPDATE_OPERATION_TOOL_DEFINITIONS,
} from "./smart-link-tools";
import { SUPPORT_TOOL_DEFINITIONS } from "./support-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";
import {
	registerWorkspaceResource,
	WORKSPACE_METADATA,
	WORKSPACE_TOOL_DEFINITION,
} from "./workspace/tool";
import type { GetYouTubeChannelDataData } from "./youtube-channel-data-schema";

type DynamoiToolSecurityScheme =
	| { scopes: string[]; type: "oauth2" }
	| { type: "noauth" };

/** A tool that needs no scopes is public and callable before sign-in. */
function buildDynamoiToolSecuritySchemes(
	scopes: readonly string[],
): DynamoiToolSecurityScheme[] {
	return scopes.length === 0
		? [{ type: "noauth" }]
		: [{ scopes: [...scopes], type: "oauth2" }];
}

type DynamoiToolMetadata = {
	securitySchemes: ReturnType<typeof buildDynamoiToolSecuritySchemes>;
	ui?: { resourceUri: string };
	"openai/outputTemplate"?: string;
	"openai/ui"?: (typeof WORKSPACE_METADATA)["openai/ui"];
};

type DynamoiToolAnnotations = {
	destructiveHint: boolean;
	idempotentHint?: boolean;
	openWorldHint: boolean;
	readOnlyHint: boolean;
};

const DIRECTORY_DESCRIPTIVE_DATA_SCHEMAS = {
	dynamoi_get_account_overview: DynamoiAccountOverviewDescriptiveDataSchema,
	dynamoi_get_artist_analytics: z
		.object({
			artistId: z.string().optional(),
			artistName: z.string().optional(),
			dateRange: z.object({ end: z.string(), start: z.string() }).optional(),
			summary: z.string().optional(),
		})
		.passthrough(),
	dynamoi_get_campaign: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		contentTitle: z.string().optional(),
		nextActions: z.array(z.string()).optional(),
		status: z.string().optional(),
	}).passthrough(),
	dynamoi_get_platform_status: z
		.object({
			artistId: z.string().optional(),
			artistName: z.string().optional(),
			platforms: z.object({}).passthrough().optional(),
			summary: z.string().optional(),
		})
		.passthrough(),
	dynamoi_get_smart_link: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		nextActions: z.array(z.string()).optional(),
		publishState: z.string().optional(),
		releaseTitle: z.string().optional(),
		theme: z.string().optional(),
	}).passthrough(),
	dynamoi_get_youtube_channel_data: z
		.object({
			artistId: z.string().optional(),
			channelName: z.string().nullable().optional(),
			dataset: z.string().optional(),
			nextCursor: z.string().optional(),
			rowCount: z.number().optional(),
			summary: z.string().optional(),
		})
		.passthrough(),
	dynamoi_list_artists: DynamoiArtistListDescriptiveDataSchema,
	dynamoi_list_campaigns: z
		.object({
			campaigns: z.array(DescriptiveEntitySchema).optional(),
			nextCursor: z.string().optional(),
			summary: z.string().optional(),
			totalCount: z.number().optional(),
		})
		.passthrough(),
	dynamoi_preview_smart_link_themes: z
		.object({
			artistName: z.string(),
			releaseTitle: z.string(),
			themes: z.array(DescriptiveEntitySchema),
		})
		.passthrough(),
	dynamoi_search: z
		.object({
			nextCursor: z.string().optional(),
			results: z.array(DescriptiveEntitySchema).optional(),
			summary: z.string().optional(),
			totalCount: z.number().optional(),
		})
		.passthrough(),
	dynamoi_update_smart_link: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		defaultTheme: z.string().optional(),
		renderQueuedCount: z.number().optional(),
		renderWarning: z.string().nullable().optional(),
	}).passthrough(),
	dynamoi_update_smart_link_artist_hub_settings: DescriptiveEntitySchema.extend(
		{
			artistHub: z.object({}).passthrough().optional(),
			artistId: z.string().optional(),
			artistName: z.string().optional(),
			defaultTheme: z.string().optional(),
			renderQueuedCount: z.number().optional(),
			renderWarning: z.string().nullable().optional(),
		},
	).passthrough(),
	dynamoi_update_smart_link_artist_settings: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		defaultTheme: z.string().optional(),
		renderQueuedCount: z.number().optional(),
		renderWarning: z.string().nullable().optional(),
	}).passthrough(),
	dynamoi_update_smart_link_description: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		defaultTheme: z.string().optional(),
		renderQueuedCount: z.number().optional(),
		renderWarning: z.string().nullable().optional(),
	}).passthrough(),
	dynamoi_update_smart_link_release_settings: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		customDescription: z.string().nullable().optional(),
		nextActions: z.array(z.string()).optional(),
		publishState: z.string().optional(),
		releaseSettings: z.object({}).passthrough().optional(),
		releaseTitle: z.string().optional(),
		renderWarning: z.string().nullable().optional(),
		theme: z.string().optional(),
	}).passthrough(),
	fetch: DescriptiveEntitySchema,
	search: z
		.object({ results: z.array(DescriptiveEntitySchema).optional() })
		.passthrough(),
} as const;

function getAdvertisedToolOutputSchema(options: {
	canonical: z.ZodType & StandardSchemaWithJSON;
	toolName: string;
	toolProfile: DynamoiMcpToolProfile;
}): z.ZodType & StandardSchemaWithJSON {
	if (options.toolProfile !== "directory") {
		return options.canonical;
	}
	const dataSchema =
		DIRECTORY_DESCRIPTIVE_DATA_SCHEMAS[
			options.toolName as keyof typeof DIRECTORY_DESCRIPTIVE_DATA_SCHEMAS
		];
	if (!dataSchema) {
		return options.canonical;
	}
	return z
		.object({
			data: dataSchema.optional(),
			kind: z.string().optional(),
			message: z.string().optional(),
			...ResultErrorRecoverySchema.shape,
			status: z.enum(["success", "partial_success", "error"]),
		})
		.passthrough();
}

function getDynamoiToolOAuthScopes(
	toolName: keyof typeof DYNAMOI_MCP_TOOL_SCOPES,
	providerScopes: readonly string[],
): readonly string[] {
	const requiredScopes = DYNAMOI_MCP_TOOL_SCOPES[toolName];
	const missingScopes = requiredScopes.filter(
		(scope) => !providerScopes.includes(scope),
	);
	if (missingScopes.length > 0) {
		throw new Error(
			`MCP provider does not support ${toolName} scopes: ${missingScopes.join(", ")}`,
		);
	}
	return requiredScopes;
}

/**
 * `directory` is the review-safe catalog for agent-directory clients;
 * `full` is every tool. The host selects the profile from the verified
 * OAuth client identity.
 */
export type DynamoiMcpToolProfile = "full" | "directory";

type DynamoiToolRegistrationDescriptor = {
	description: string;
	destructiveHint: boolean;
	idempotentHint?: boolean;
	name: string;
	openWorldHint: boolean;
	outputSchema: z.ZodType & StandardSchemaWithJSON;
	readOnlyHint: boolean;
	schema: z.ZodObject<z.ZodRawShape>;
	title: string;
};

const DYNAMOI_TOOL_DEFINITIONS = [
	WORKSPACE_TOOL_DEFINITION,
	DYNAMOI_ABOUT_TOOL_DEFINITION,
	...PHASE_1_TOOL_DEFINITIONS,
	...PHASE_ONBOARDING_TOOL_DEFINITIONS,
	...PHASE_2_TOOL_DEFINITIONS,
	...PHASE_3_TOOL_DEFINITIONS,
	...DISTRIBUTION_TOOL_DEFINITIONS,
	...SHOP_TOOL_DEFINITIONS,
	...SUPPORT_TOOL_DEFINITIONS,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
	...PHASE_4_TOOL_DEFINITIONS,
	...SMART_LINK_UPDATE_OPERATION_TOOL_DEFINITIONS,
	...FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS,
] as const satisfies readonly DynamoiToolRegistrationDescriptor[];

// Keep the public name union separate from the schema-rich source tuple.
const DYNAMOI_TOOL_NAMES = DYNAMOI_TOOL_DEFINITIONS.map(
	(definition) => definition.name,
);
type DynamoiToolName = (typeof DYNAMOI_TOOL_NAMES)[number];
type DynamoiToolDefinition = Omit<DynamoiToolRegistrationDescriptor, "name"> & {
	name: DynamoiToolName;
};

const MUTATING_TOOL_NAMES = new Set<string>(
	DYNAMOI_TOOL_DEFINITIONS.filter((definition) => !definition.readOnlyHint).map(
		(definition) => definition.name,
	),
);

const DIRECTORY_EXCLUDED_TOOL_NAMES = new Set<string>([
	"dynamoi_contact_support",
	"dynamoi_shop_create_checkout",
	"dynamoi_shop_get_quote",
	"dynamoi_get_billing",
	"dynamoi_get_resume_funding",
	"dynamoi_get_campaign_readiness",
	"dynamoi_manage_youtube_draft",
	"dynamoi_launch_campaign",
	"dynamoi_list_available_countries",
	"dynamoi_list_media_assets",
	"dynamoi_start_meta_connection",
	"dynamoi_start_youtube_channel_link",
	"dynamoi_update_campaign",
	"dynamoi_update_smart_link",
	"dynamoi_update_smart_link_artist_hub_settings",
	"dynamoi_update_smart_link_release_settings",
]);

const DIRECTORY_ONLY_TOOL_NAMES = new Set<string>([
	"dynamoi_update_smart_link_artist_settings",
	"dynamoi_update_smart_link_description",
]);

const DIRECTORY_COMPATIBILITY_TOOL_NAMES = new Set<string>([
	"dynamoi_update_smart_link",
]);

export function getDynamoiToolDefinitions(options?: {
	toolProfile?: DynamoiMcpToolProfile;
}): DynamoiToolDefinition[] {
	const definitions: DynamoiToolDefinition[] = [...DYNAMOI_TOOL_DEFINITIONS];
	// The split aliases exist only in the directory catalog; full-profile
	// clients retain the original approved multi-action schema.
	if (options?.toolProfile === "full") {
		return definitions.filter(
			(definition) => !DIRECTORY_ONLY_TOOL_NAMES.has(definition.name),
		);
	}
	return definitions.filter(
		(definition) => !DIRECTORY_EXCLUDED_TOOL_NAMES.has(definition.name),
	);
}

/**
 * Directory callers may still invoke only this exact prior approved tool name
 * while clients transition to the advertised single-purpose operations.
 */
export function getDynamoiToolCompatibilityDefinitions(options?: {
	toolProfile?: DynamoiMcpToolProfile;
}): DynamoiToolDefinition[] {
	if (options?.toolProfile === "full") {
		return [];
	}
	return DYNAMOI_TOOL_DEFINITIONS.filter((definition) =>
		DIRECTORY_COMPATIBILITY_TOOL_NAMES.has(definition.name),
	);
}

export type Phase3Adapter = {
	openWorkspace(
		input: unknown,
	): Promise<ResultEnvelope<import("./workspace/data").WorkspaceData>>;
	applyForDistribution(
		input: unknown,
	): Promise<ResultEnvelope<ApplyForDistributionData>>;
	getCurrentUser(
		input: unknown,
	): Promise<ResultEnvelope<GetCurrentUserData | GetCurrentUserSummaryData>>;
	getDistributionApplication(
		input: unknown,
	): Promise<ResultEnvelope<GetDistributionApplicationData>>;
	listArtists(
		input: unknown,
	): Promise<ResultEnvelope<ListArtistsData | ListArtistsSummaryData>>;
	search(
		input: unknown,
	): Promise<ResultEnvelope<SearchData | SearchSummaryData>>;
	openAiSearch(input: unknown): Promise<ResultEnvelope<OpenAiSearchData>>;
	openAiFetch(input: unknown): Promise<ResultEnvelope<OpenAiFetchData>>;
	getArtist(
		input: unknown,
	): Promise<ResultEnvelope<GetArtistData | GetArtistSummaryData>>;
	getArtistAnalytics(
		input: unknown,
	): Promise<
		ResultEnvelope<GetArtistAnalyticsJsonData | GetArtistAnalyticsSummaryData>
	>;
	getGrowthAudit(input: unknown): Promise<ResultEnvelope<unknown>>;
	getPlaylistAnalytics(input: unknown): Promise<ResultEnvelope<unknown>>;
	getAudienceAnalytics(input: unknown): Promise<ResultEnvelope<unknown>>;
	listCampaigns(
		input: unknown,
	): Promise<ResultEnvelope<ListCampaignsJsonData | ListCampaignsSummaryData>>;
	getCampaign(
		input: unknown,
	): Promise<ResultEnvelope<GetCampaignData | GetCampaignSummaryData>>;
	getResumeFunding(
		input: unknown,
	): Promise<ResultEnvelope<GetResumeFundingData | { summary: string }>>;
	getBilling(
		input: unknown,
	): Promise<ResultEnvelope<GetBillingData | GetBillingSummaryData>>;
	startMetaConnection(
		input: unknown,
	): Promise<ResultEnvelope<StartMetaConnectionData>>;
	getPlatformStatus(
		input: unknown,
	): Promise<
		ResultEnvelope<GetPlatformStatusData | GetPlatformStatusSummaryData>
	>;
	startYoutubeChannelLink(
		input: unknown,
	): Promise<ResultEnvelope<StartYoutubeChannelLinkData>>;
	listAvailableCountries(
		input: unknown,
	): Promise<
		ResultEnvelope<
			ListAvailableCountriesData | ListAvailableCountriesSummaryData
		>
	>;
	getCampaignReadiness(
		input: unknown,
	): Promise<
		ResultEnvelope<GetCampaignReadinessData | GetCampaignReadinessSummaryData>
	>;
	manageYoutubeDraft(input: unknown): Promise<ResultEnvelope<unknown>>;
	updateCampaign(input: unknown): Promise<ResultEnvelope<UpdateCampaignData>>;
	listMediaAssets(
		input: unknown,
	): Promise<ResultEnvelope<ListMediaAssetsData | ListMediaAssetsSummaryData>>;
	launchCampaign(input: unknown): Promise<ResultEnvelope<LaunchCampaignData>>;
	createSmartLinkFromSpotify(
		input: unknown,
	): Promise<ResultEnvelope<CreateSmartLinkFromSpotifyData>>;
	createSmartLinksFromSpotifyArtist(
		input: unknown,
	): Promise<ResultEnvelope<CreateSmartLinksFromSpotifyArtistData>>;
	listSmartLinks(
		input: unknown,
	): Promise<ResultEnvelope<ListSmartLinksData | ListSmartLinksSummaryData>>;
	getSmartLink(
		input: unknown,
	): Promise<ResultEnvelope<GetSmartLinkData | GetSmartLinkSummaryData>>;
	getSmartLinkArtistSettings(
		input: unknown,
	): Promise<ResultEnvelope<SmartLinkSettingsData>>;
	getYouTubeChannelData(
		input: unknown,
	): Promise<ResultEnvelope<GetYouTubeChannelDataData>>;
	updateSmartLink(
		input: unknown,
	): Promise<
		ResultEnvelope<UpdateSmartLinkData | UpdateSmartLinkArtistSettingsData>
	>;
	updateSmartLinkArtistHubSettings(
		input: unknown,
	): Promise<ResultEnvelope<UpdateSmartLinkArtistSettingsData>>;
	updateSmartLinkReleaseSettings(
		input: unknown,
	): Promise<ResultEnvelope<UpdateSmartLinkData>>;
	shopGetQuote(input: unknown): Promise<ResultEnvelope<DynamoiShopQuoteData>>;
	shopCreateCheckout(
		input: unknown,
	): Promise<ResultEnvelope<DynamoiShopCheckoutData>>;
	contactSupport(input: unknown): Promise<ResultEnvelope<ContactSupportData>>;
};

type DynamoiToolDispatcher = (
	adapter: Phase3Adapter,
	input: unknown,
	toolProfile?: DynamoiMcpToolProfile,
) => Promise<ResultEnvelope<unknown>>;

type ErrorRecoveryMetadata = Partial<
	Omit<
		Extract<ResultEnvelope<never>, { status: "error" }>,
		"message" | "status"
	>
>;

type NormalizedEnvelope = object | string | number | boolean | null | undefined;

const RECOVERY_METADATA_FIELDS = [
	"draftId",
	"failureStage",
	"screeningResult",
	"code",
	"field",
	"nextAction",
	"prerequisite",
	"retryable",
	"retryAfterSeconds",
] as const;

const SPOTIFY_SOURCE_ERROR_MESSAGES = new Set([
	"Paste a valid Spotify artist, album, or track URL.",
	"Paste a Spotify artist, album, or track URL.",
	"Open the Spotify artist profile, then copy the Spotify link.",
	"Spotify URL is missing a valid Spotify ID.",
	"Paste the public Spotify artist link, not the Spotify for Artists dashboard page.",
	"Spotify link did not resolve to a Spotify artist, album, or track URL.",
	"Spotify link redirected too many times.",
	"Spotify link could not be opened. Paste the full Spotify URL instead.",
]);

const SPOTIFY_ARTIST_CATALOG_ERROR_MESSAGES = new Set([
	"Use a Spotify artist URL for full-catalog Smart Link import. For album or track URLs, use dynamoi_create_smart_link_from_spotify.",
]);

const REVIEWER_WRITE_TOOL_NAMES = new Set([
	"dynamoi_manage_youtube_draft",
	"dynamoi_apply_for_distribution",
	"dynamoi_create_smart_link_from_spotify",
	"dynamoi_create_smart_links_from_spotify_artist",
	"dynamoi_launch_campaign",
	"dynamoi_start_meta_connection",
	"dynamoi_start_youtube_channel_link",
	"dynamoi_update_campaign",
	"dynamoi_update_smart_link",
	"dynamoi_update_smart_link_artist_settings",
	"dynamoi_update_smart_link_description",
	"dynamoi_update_smart_link_artist_hub_settings",
	"dynamoi_update_smart_link_release_settings",
]);

const SHOP_RATE_LIMIT_RETRY_AFTER_SECONDS = {
	checkout: 10 * 60,
	quote: 60,
} as const;

const SHOP_RATE_LIMIT_ERROR_PATTERNS = {
	checkout:
		/^Too many Shop checkout requests\. Try again in ([1-9]\d*) seconds\.$/,
	quote: /^Too many Shop quote requests\. Try again in ([1-9]\d*) seconds\.$/,
} as const;

function mapShopRateLimitRecovery(
	toolName: string,
	message: string,
): ErrorRecoveryMetadata | undefined {
	const kind =
		toolName === "dynamoi_shop_get_quote"
			? "quote"
			: toolName === "dynamoi_shop_create_checkout"
				? "checkout"
				: undefined;
	if (!kind) {
		return undefined;
	}

	const match = SHOP_RATE_LIMIT_ERROR_PATTERNS[kind].exec(message);
	if (!match || match[0] !== message) {
		return undefined;
	}
	const retryAfterSeconds = Number(match[1]);
	if (
		!Number.isSafeInteger(retryAfterSeconds) ||
		retryAfterSeconds < 1 ||
		retryAfterSeconds > SHOP_RATE_LIMIT_RETRY_AFTER_SECONDS[kind]
	) {
		return undefined;
	}
	return {
		code: "RATE_LIMITED",
		retryAfterSeconds,
		retryable: true,
	};
}

function mapKnownErrorRecovery(
	toolName: string,
	kind: unknown,
	message: string,
): ErrorRecoveryMetadata | undefined {
	if (kind === "unknown" && MUTATING_TOOL_NAMES.has(toolName)) {
		return {
			code: "UNKNOWN_EFFECT",
			nextAction: {
				kind: "read_status",
				reason:
					"Inspect the existing operation or resource identity before retrying.",
			},
			prerequisite:
				"The existing operation or resource identity must be inspected before replaying.",
			retryable: false,
		};
	}
	if (kind !== "business") {
		return undefined;
	}
	const shopRateLimitRecovery = mapShopRateLimitRecovery(toolName, message);
	if (shopRateLimitRecovery) {
		return shopRateLimitRecovery;
	}
	if (
		REVIEWER_WRITE_TOOL_NAMES.has(toolName) &&
		message === "Reviewer accounts are read-only in MCP."
	) {
		return {
			code: "ACCOUNT_READ_ONLY",
			nextAction: {
				kind: "handoff",
				reason: "Use an authorized non-reviewer account for this write.",
			},
			prerequisite: "A non-reviewer account with write access is required.",
			retryable: false,
		};
	}

	const isSingleReleaseSpotifyTool =
		toolName === "dynamoi_create_smart_link_from_spotify";
	const isArtistCatalogSpotifyTool =
		toolName === "dynamoi_create_smart_links_from_spotify_artist";
	if (
		(isSingleReleaseSpotifyTool || isArtistCatalogSpotifyTool) &&
		(SPOTIFY_SOURCE_ERROR_MESSAGES.has(message) ||
			(isArtistCatalogSpotifyTool &&
				SPOTIFY_ARTIST_CATALOG_ERROR_MESSAGES.has(message)))
	) {
		const field = isArtistCatalogSpotifyTool
			? "spotifyArtistUrl"
			: "spotifyUrl";
		const expectedInput = isArtistCatalogSpotifyTool
			? "Provide a public Spotify artist URL."
			: "Provide a public Spotify artist, album, or track URL.";
		return {
			code: "INVALID_SPOTIFY_SOURCE",
			field,
			nextAction: {
				field,
				kind: "provide_input",
				reason: expectedInput,
			},
			prerequisite: expectedInput,
			retryable: false,
		};
	}

	if (
		(toolName === "dynamoi_update_smart_link" ||
			toolName === "dynamoi_update_smart_link_description" ||
			toolName === "dynamoi_update_smart_link_artist_settings" ||
			toolName === "dynamoi_update_smart_link_artist_hub_settings" ||
			toolName === "dynamoi_update_smart_link_release_settings") &&
		message ===
			"Smart Link changed since it was last read. Read it again before updating."
	) {
		return {
			code: "STATE_CONFLICT",
			field: "expectedUpdatedAt",
			nextAction: {
				kind: "read_status",
				reason:
					"Read the existing Smart Link again, then resubmit only with its current state.",
			},
			prerequisite: "Read the Smart Link before updating it.",
			retryable: false,
		};
	}

	if (
		toolName === "dynamoi_shop_create_checkout" &&
		message ===
			"The Shop quote changed. Get a new quote before creating checkout."
	) {
		return {
			code: "QUOTE_CHANGED",
			field: "expectedTotal",
			nextAction: {
				field: "expectedTotal",
				kind: "provide_input",
				reason:
					"Get a fresh quote, ask the user to confirm its total, then submit with that total and the same requestId.",
			},
			prerequisite:
				"Get a fresh Shop quote and obtain renewed user confirmation for its total before creating checkout.",
			retryable: false,
		};
	}

	return undefined;
}

function normalizeKnownErrorRecovery(
	envelope: unknown,
	toolName: string,
): NormalizedEnvelope {
	if (
		envelope === null ||
		envelope === undefined ||
		typeof envelope === "string" ||
		typeof envelope === "number" ||
		typeof envelope === "boolean"
	) {
		return envelope;
	}
	if (typeof envelope !== "object" || Array.isArray(envelope)) {
		return typeof envelope === "object" ? envelope : null;
	}
	const record = envelope as Record<string, unknown>;
	if (record["status"] !== "error") {
		return record;
	}
	const message = record["message"];
	if (
		RECOVERY_METADATA_FIELDS.some((field) => record[field] !== undefined) ||
		typeof message !== "string"
	) {
		return record;
	}
	const recovery = mapKnownErrorRecovery(toolName, record["kind"], message);
	return recovery ? { ...record, ...recovery } : envelope;
}

const DYNAMOI_TOOL_DISPATCHERS = {
	dynamoi_about: (_adapter, _input, toolProfile) =>
		Promise.resolve(getDynamoiAbout({ toolProfile })),
	dynamoi_apply_for_distribution: (adapter, input) =>
		adapter.applyForDistribution(input),
	dynamoi_contact_support: (adapter, input) => adapter.contactSupport(input),
	dynamoi_create_smart_link_from_spotify: (adapter, input) =>
		adapter.createSmartLinkFromSpotify(input),
	dynamoi_create_smart_links_from_spotify_artist: (adapter, input) =>
		adapter.createSmartLinksFromSpotifyArtist(input),
	dynamoi_get_account_overview: (adapter, input) =>
		adapter.getCurrentUser(input),
	dynamoi_get_artist_analytics: (adapter, input) =>
		adapter.getArtistAnalytics(input),
	dynamoi_get_audience_analytics: (adapter, input) =>
		adapter.getAudienceAnalytics(input),
	dynamoi_get_billing: (adapter, input) => adapter.getBilling(input),
	dynamoi_get_campaign: (adapter, input) => adapter.getCampaign(input),
	dynamoi_get_campaign_readiness: (adapter, input) =>
		adapter.getCampaignReadiness(input),
	dynamoi_get_distribution_application: (adapter, input) =>
		adapter.getDistributionApplication(input),
	dynamoi_get_growth_audit: (adapter, input) => adapter.getGrowthAudit(input),
	dynamoi_get_platform_status: (adapter, input) =>
		adapter.getPlatformStatus(input),
	dynamoi_get_playlist_analytics: (adapter, input) =>
		adapter.getPlaylistAnalytics(input),
	dynamoi_get_resume_funding: (adapter, input) =>
		adapter.getResumeFunding(input),
	dynamoi_get_smart_link: (adapter, input) => adapter.getSmartLink(input),
	dynamoi_get_youtube_channel_data: (adapter, input) =>
		adapter.getYouTubeChannelData(input),
	dynamoi_launch_campaign: (adapter, input) => adapter.launchCampaign(input),
	dynamoi_list_artists: (adapter, input) => adapter.listArtists(input),
	dynamoi_list_available_countries: (adapter, input) =>
		adapter.listAvailableCountries(input),
	dynamoi_list_campaigns: (adapter, input) => adapter.listCampaigns(input),
	dynamoi_list_media_assets: (adapter, input) => adapter.listMediaAssets(input),
	dynamoi_list_smart_links: (adapter, input) => adapter.listSmartLinks(input),
	dynamoi_manage_youtube_draft: (adapter, input) =>
		adapter.manageYoutubeDraft(input),
	dynamoi_open_workspace: (adapter, input) => adapter.openWorkspace(input),
	dynamoi_preview_smart_link_themes: (_adapter, input) =>
		Promise.resolve(previewSmartLinkThemes(input)),
	dynamoi_search: (adapter, input) => adapter.search(input),
	dynamoi_shop_create_checkout: (adapter, input) =>
		adapter.shopCreateCheckout(input),
	dynamoi_shop_get_quote: (adapter, input) => adapter.shopGetQuote(input),
	dynamoi_start_meta_connection: (adapter, input) =>
		adapter.startMetaConnection(input),
	dynamoi_start_youtube_channel_link: (adapter, input) =>
		adapter.startYoutubeChannelLink(input),
	dynamoi_update_campaign: (adapter, input) => adapter.updateCampaign(input),
	dynamoi_update_smart_link: (adapter, input) => adapter.updateSmartLink(input),
	dynamoi_update_smart_link_artist_hub_settings: (adapter, input) =>
		adapter.updateSmartLinkArtistHubSettings(input),
	dynamoi_update_smart_link_artist_settings: (adapter, input) =>
		adapter.updateSmartLink({
			...(input as Record<string, unknown>),
			action: "update_artist_settings",
		}),
	dynamoi_update_smart_link_description: (adapter, input) =>
		adapter.updateSmartLink({
			...(input as Record<string, unknown>),
			action: "update_description",
		}),
	dynamoi_update_smart_link_release_settings: (adapter, input) =>
		adapter.updateSmartLinkReleaseSettings(input),
	fetch: (adapter, input) => adapter.openAiFetch(input),
	search: (adapter, input) => adapter.openAiSearch(input),
} satisfies Record<DynamoiToolName, DynamoiToolDispatcher>;

/** Longest a tool response waits for the host's observer before answering. */
const DEFAULT_OBSERVER_TIMEOUT_MS = 3000;

/**
 * Runs the host observer without letting it change or delay a tool result.
 * Throws, rejections and hangs are all absorbed: a hung observer is abandoned
 * after the timeout and any late rejection is swallowed, so it can never
 * become an unhandled rejection or a second outcome.
 */
async function runObserverBounded(
	observe: () => Promise<void> | void,
	timeoutMs: number,
): Promise<void> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const observed = (async () => {
		try {
			await observe();
		} catch {
			// Observability must never change a tool result.
		}
	})();
	const timedOut = new Promise<void>((resolve) => {
		timer = setTimeout(resolve, timeoutMs);
	});
	try {
		await Promise.race([observed, timedOut]);
	} finally {
		clearTimeout(timer);
	}
}

function snapshotForObserver(value: unknown) {
	try {
		return structuredClone(value);
	} catch {
		if (
			value === null ||
			(typeof value !== "object" && typeof value !== "function")
		) {
			return value;
		}
		try {
			if (value instanceof Error) {
				const snapshot = new Error(
					"The thrown error could not be cloned for observation.",
				);
				try {
					const name = value.name;
					if (typeof name === "string") {
						snapshot.name = name;
					}
				} catch {
					// Keep the fallback snapshot isolated if a custom error accessor throws.
				}
				try {
					const message = value.message;
					if (typeof message === "string") {
						snapshot.message = message;
					}
				} catch {
					// Keep the fallback snapshot isolated if a custom error accessor throws.
				}
				try {
					const stack = value.stack;
					if (typeof stack === "string") {
						snapshot.stack = stack;
					}
				} catch {
					// Keep the fallback snapshot isolated if a custom error accessor throws.
				}
				return snapshot;
			}
		} catch {
			// Fall through to a static object for arbitrary uncloneable values.
		}
		return {
			kind: "unknown",
			message: "The thrown value could not be cloned for observation.",
		};
	}
}

function asTextResult(envelope: unknown) {
	const isToolError =
		Boolean(envelope) &&
		typeof envelope === "object" &&
		(envelope as { status?: unknown }).status === "error";
	const plainText = (() => {
		if (!envelope || typeof envelope !== "object") {
			return JSON.stringify(envelope);
		}

		const status = (envelope as { status?: unknown }).status;
		if (status === "error") {
			const message = (envelope as { message?: unknown }).message;
			return typeof message === "string" && message.trim().length > 0
				? message
				: JSON.stringify(envelope);
		}

		const data = (envelope as { data?: unknown }).data;
		if (data && typeof data === "object") {
			const summary = (data as { summary?: unknown }).summary;
			if (typeof summary === "string" && summary.trim().length > 0) {
				return summary;
			}
		}

		return JSON.stringify(envelope);
	})();

	type McpToolCallResult = {
		content: Array<{ text: string; type: "text" }>;
		structuredContent: Record<string, unknown>;
		isError?: boolean;
	};

	const result: McpToolCallResult = {
		content: [{ text: plainText, type: "text" as const }],
		structuredContent: envelope as Record<string, unknown>,
	};
	if (isToolError) {
		result.isError = true;
	}

	return result;
}

function asValidatedTextResult(options: {
	envelope: unknown;
	outputSchema: z.ZodType;
	toolName: string;
}) {
	const envelope = normalizeKnownErrorRecovery(
		options.envelope,
		options.toolName,
	);
	const parsed = options.outputSchema.safeParse(envelope);
	if (!parsed.success) {
		return asTextResult({
			code: "OUTPUT_INVALID",
			kind: "validation",
			message: `Tool ${options.toolName} returned an invalid result shape.`,
			nextAction: {
				kind: "read_status",
				reason: "Inspect the existing operation identity before retrying.",
			},
			prerequisite:
				"The existing operation or resource identity must be inspected before replaying.",
			retryable: false,
			status: "error",
		} satisfies ResultEnvelope<never>);
	}
	return asTextResult(envelope);
}

// Lists vary by the caller's authorization, so clients may reuse them briefly
// but never share them across principals.
const PRIVATE_LIST_CACHE_HINT: CacheHint = {
	cacheScope: "private",
	ttlMs: 60_000,
};

const DYNAMOI_CACHE_HINTS: NonNullable<ServerOptions["cacheHints"]> = {
	"prompts/list": PRIVATE_LIST_CACHE_HINT,
	"resources/list": PRIVATE_LIST_CACHE_HINT,
	"resources/templates/list": PRIVATE_LIST_CACHE_HINT,
	"server/discover": PRIVATE_LIST_CACHE_HINT,
	"tools/list": PRIVATE_LIST_CACHE_HINT,
};

type JsonSchemaObject = Record<string, unknown>;

function isObjectShapedJsonSchema(schema: JsonSchemaObject): boolean {
	if (schema["type"] !== undefined) {
		return schema["type"] === "object";
	}
	if (
		[
			"properties",
			"patternProperties",
			"additionalProperties",
			"required",
		].some((key) => key in schema)
	) {
		return true;
	}
	return ["oneOf", "anyOf", "allOf"].some((key) => {
		const members = schema[key];
		return (
			Array.isArray(members) &&
			members.length > 0 &&
			members.every(
				(member) =>
					typeof member === "object" &&
					member !== null &&
					isObjectShapedJsonSchema(member as JsonSchemaObject),
			)
		);
	});
}

/** The JSON Schema the SDK would advertise, without the `$schema` dialect key. */
function toAdvertisedJsonSchema(
	schema: z.ZodType,
	io: "input" | "output",
): JsonSchemaObject {
	// Some MCP clients reject schemas that carry `$schema`; it is informational.
	const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, {
		io,
		target: "draft-2020-12",
	}) as JsonSchemaObject;
	return jsonSchema["type"] === undefined &&
		(io === "input" || isObjectShapedJsonSchema(jsonSchema))
		? { type: "object", ...jsonSchema }
		: jsonSchema;
}

type AdvertisedTool = Tool & {
	securitySchemes: DynamoiToolMetadata["securitySchemes"];
};

export function createDynamoiMcpServer(options: {
	adapter: Phase3Adapter;
	/**
	 * Runs before a tool dispatches. A returned result answers the call
	 * instead, for example an OAuth step-up challenge the host detected.
	 */
	authorizeToolCall?: (toolName: string) => CallToolResult | undefined;
	onToolCall?: (input: {
		durationMs: number;
		error?: unknown;
		result?: unknown;
		toolName: string;
	}) => Promise<void> | void;
	/** Bounds how long a tool response waits for `onToolCall`. */
	observerTimeoutMs?: number;
	oauthScopes?: readonly string[];
	toolProfile?: DynamoiMcpToolProfile;
	websiteUrl?: string;
}): McpServer {
	const toolProfile = options.toolProfile ?? "directory";
	const observerTimeoutMs =
		options.observerTimeoutMs ?? DEFAULT_OBSERVER_TIMEOUT_MS;
	const server = new McpServer(
		{
			name: "dynamoi",
			version: DYNAMOI_MCP_VERSION,
			websiteUrl: options.websiteUrl ?? "https://dynamoi.com",
		},
		{
			maxToolInputElements: 10_000,
			cacheHints: DYNAMOI_CACHE_HINTS,
			// Every request builds a fresh server, so lists never change mid-connection.
			capabilities: {
				resources: { listChanged: false },
				tools: { listChanged: false },
				...(toolProfile === "full" ? { prompts: { listChanged: false } } : {}),
			},
			instructions:
				toolProfile === "directory"
					? DYNAMOI_CHATGPT_APP_INSTRUCTIONS
					: DYNAMOI_MCP_INSTRUCTIONS,
		},
	);

	const advertisedDefinitions = getDynamoiToolDefinitions({ toolProfile });
	const advertisedNames = new Set(
		advertisedDefinitions.map((definition) => definition.name),
	);
	const definitionsToRegister = [
		...advertisedDefinitions,
		...getDynamoiToolCompatibilityDefinitions({ toolProfile }),
	];
	const advertisedTools: AdvertisedTool[] = [];
	for (const def of definitionsToRegister) {
		const title = def.title;
		const dispatcher = DYNAMOI_TOOL_DISPATCHERS[def.name];
		const idempotentHint =
			"idempotentHint" in def && typeof def.idempotentHint === "boolean"
				? def.idempotentHint
				: undefined;
		const meta: DynamoiToolMetadata = {
			securitySchemes: buildDynamoiToolSecuritySchemes(
				getDynamoiToolOAuthScopes(
					def.name,
					options.oauthScopes ?? DYNAMOI_BETTER_AUTH_MCP_SCOPES,
				),
			),
		};
		if (def.name === "dynamoi_preview_smart_link_themes") {
			meta["openai/outputTemplate"] = SMART_LINK_THEME_PREVIEW_RESOURCE_URI;
			meta.ui = { resourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI };
		}
		if (def.name === "dynamoi_open_workspace") {
			Object.assign(meta, WORKSPACE_METADATA);
		}
		const annotations: DynamoiToolAnnotations = {
			destructiveHint: def.destructiveHint,
			openWorldHint: def.openWorldHint,
			readOnlyHint: def.readOnlyHint,
		};
		if (typeof idempotentHint === "boolean") {
			annotations.idempotentHint = idempotentHint;
		}
		const outputSchema = getAdvertisedToolOutputSchema({
			canonical: def.outputSchema,
			toolName: def.name,
			toolProfile,
		});
		if (advertisedNames.has(def.name)) {
			advertisedTools.push({
				_meta: meta,
				annotations,
				description: def.description,
				inputSchema: toAdvertisedJsonSchema(
					def.schema,
					"input",
				) as Tool["inputSchema"],
				name: def.name,
				outputSchema: toAdvertisedJsonSchema(
					outputSchema,
					"output",
				) as Tool["outputSchema"],
				securitySchemes: meta.securitySchemes,
				title,
			});
		}
		server.registerTool(
			def.name,
			{
				_meta: meta,
				annotations,
				description: def.description,
				inputSchema: def.schema,
				outputSchema,
				title,
			},
			async (input: unknown) => {
				const denied = options.authorizeToolCall?.(def.name);
				if (denied) {
					return denied;
				}
				const startedAt = Date.now();
				try {
					const envelope = await dispatcher(
						options.adapter,
						input,
						toolProfile,
					);
					const finalized = asValidatedTextResult({
						envelope,
						outputSchema: def.outputSchema,
						toolName: def.name,
					});
					await runObserverBounded(
						() =>
							options.onToolCall?.({
								durationMs: Date.now() - startedAt,
								result: snapshotForObserver(finalized.structuredContent),
								toolName: def.name,
							}),
						observerTimeoutMs,
					);
					return finalized;
				} catch (error) {
					// Preserve the dispatcher failure when observability also fails.
					await runObserverBounded(
						() =>
							options.onToolCall?.({
								durationMs: Date.now() - startedAt,
								error: snapshotForObserver(error),
								toolName: def.name,
							}),
						observerTimeoutMs,
					);
					throw error;
				}
			},
		);
	}

	// OpenAI reads per-tool auth from a top-level `securitySchemes` field that
	// the SDK's generated list omits, so this server advertises the final tool
	// shape itself. Both eras and both response modes serve the same list.
	server.server.removeRequestHandler("tools/list");
	server.server.setRequestHandler("tools/list", () => ({
		tools: advertisedTools,
	}));

	server.registerResource(
		DYNAMOI_ABOUT_RESOURCE.name,
		DYNAMOI_ABOUT_RESOURCE.uri,
		{
			cacheHint: { cacheScope: "public", ttlMs: 60 * 60 * 1000 },
			description: DYNAMOI_ABOUT_RESOURCE.description,
			mimeType: DYNAMOI_ABOUT_RESOURCE.mimeType,
			title: DYNAMOI_ABOUT_RESOURCE.title,
		},
		async (uri) => ({
			contents: [
				{
					mimeType: DYNAMOI_ABOUT_RESOURCE.mimeType,
					text:
						toolProfile === "directory"
							? DYNAMOI_ABOUT_DIRECTORY_MARKDOWN
							: DYNAMOI_ABOUT_MARKDOWN,
					uri: uri.href,
				},
			],
		}),
	);
	registerSmartLinkThemePreviewResource(server);
	registerWorkspaceResource(server);

	if (toolProfile === "full") {
		registerDynamoiPrompts(server);
		registerDynamoiResources(server, options.adapter);
	}

	return server;
}
