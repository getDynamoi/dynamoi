import * as z from "zod/v4";
import {
	AnyOutputEnvelopeSchema,
	CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
	CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
	ListSmartLinksOutputEnvelopeSchema,
} from "./output-schemas";
import {
	ClientRequestIdSchema,
	DateRangeSchema,
	RequiredClientRequestIdSchema,
	ToolFormatSchema,
	UserIntentSummarySchema,
} from "./shared-schemas";

const SmartLinkAnalyticsDateRangeSchema = DateRangeSchema.superRefine(
	(range, ctx) => {
		const days =
			(Date.parse(range.end) - Date.parse(range.start)) / 86_400_000 + 1;
		if (days > 366) {
			ctx.addIssue({
				code: "custom",
				message: "Smart-link analytics date windows cover at most 366 days",
				path: ["end"],
			});
		}
	},
);

const SmartLinkStatusFiltersSchema = {
	claimStatus: z
		.enum([
			"auto_approved",
			"pending_ops_review",
			"verification_deferred",
			"approved_by_ops",
			"rejected",
		])
		.optional(),
	publishState: z.enum(["published", "unpublished"]).optional(),
	renderState: z.enum(["queued", "rendering", "rendered", "failed"]).optional(),
} as const;

const SmartLinkThemeSchema = z.enum([
	"classic",
	"brutalist",
	"aurora",
	"cinematic",
]);
export const DynamoiCreateSmartLinkFromSpotifyInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: RequiredClientRequestIdSchema.optional(),
		customDescription: z.string().trim().max(500).optional(),
		format: ToolFormatSchema.optional(),
		spotifyUrl: z.string().trim().min(1).max(500),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiCreateSmartLinksFromSpotifyArtistInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
		clientRequestId: RequiredClientRequestIdSchema.optional(),
		format: ToolFormatSchema.optional(),
		spotifyArtistUrl: z.string().trim().min(1).max(500),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiListSmartLinksInputSchema = z
	.object({
		artistId: z.string().uuid(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(50).optional(),
		query: z.string().trim().max(120).optional(),
		...SmartLinkStatusFiltersSchema,
	})
	.strict();

const DynamoiGetSmartLinkInputShape = {
	artistId: z.string().uuid().optional(),
	dateRange: SmartLinkAnalyticsDateRangeSchema.optional(),
	format: ToolFormatSchema.optional(),
	granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	includeAnalytics: z.boolean().optional(),
	includeArtistSettings: z.boolean().optional(),
	includeBreakdowns: z.boolean().optional(),
	playLinkId: z.string().uuid().optional(),
	spotifyUrl: z.string().trim().min(1).max(500).optional(),
} as const;

function validateDynamoiGetSmartLinkInput(
	data: z.infer<z.ZodObject<typeof DynamoiGetSmartLinkInputShape>>,
	ctx: z.RefinementCtx,
) {
	const settingsOnly =
		data.includeArtistSettings === true &&
		!data.playLinkId &&
		!data.spotifyUrl &&
		Boolean(data.artistId);
	if (
		!(data.playLinkId || (data.artistId && data.spotifyUrl) || settingsOnly)
	) {
		ctx.addIssue({
			code: "custom",
			message:
				"Provide playLinkId, artistId with spotifyUrl, or artistId with includeArtistSettings=true",
			path: ["playLinkId"],
		});
	}
	if (
		(data.dateRange || data.granularity || data.includeBreakdowns) &&
		data.includeAnalytics !== true
	) {
		ctx.addIssue({
			code: "custom",
			message:
				"dateRange, granularity, and includeBreakdowns require includeAnalytics=true",
			path: ["includeAnalytics"],
		});
	}
}

const StrictDynamoiGetSmartLinkInputSchema = z
	.object(DynamoiGetSmartLinkInputShape)
	.strict()
	.superRefine(validateDynamoiGetSmartLinkInput);

export const DynamoiGetSmartLinkInputSchema =
	StrictDynamoiGetSmartLinkInputSchema;

export function parseDynamoiGetSmartLinkInput(rawInput: unknown) {
	return StrictDynamoiGetSmartLinkInputSchema.parse(rawInput);
}

export const DynamoiGetSmartLinkAnalyticsInputSchema = z
	.object({
		dateRange: SmartLinkAnalyticsDateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
		includeBreakdowns: z.boolean().optional(),
		playLinkId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetSmartLinkArtistSettingsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiUpdateSmartLinkInputSchema = z
	.object({
		action: z.enum(["update_description", "update_artist_settings"]),
		artistId: z.string().uuid().optional(),
		clientRequestId: ClientRequestIdSchema,
		customDescription: z.string().max(500).nullable().optional(),
		expectedUpdatedAt: z.string().datetime().optional(),
		googleAdsConversionId: z.string().trim().max(32).nullable().optional(),
		metaPixelId: z.string().trim().max(32).nullable().optional(),
		playLinkId: z.string().uuid().optional(),
		theme: SmartLinkThemeSchema.optional(),
		tiktokPixelId: z.string().trim().max(32).nullable().optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.action === "update_description" &&
			data.customDescription === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"customDescription is required when action is update_description",
				path: ["customDescription"],
			});
		}
		if (data.action !== "update_artist_settings" && !data.playLinkId) {
			ctx.addIssue({
				code: "custom",
				message: "playLinkId is required when action is update_description",
				path: ["playLinkId"],
			});
		}
		if (data.action === "update_artist_settings") {
			if (!data.artistId) {
				ctx.addIssue({
					code: "custom",
					message: "artistId is required when action is update_artist_settings",
					path: ["artistId"],
				});
			}
			if (
				data.theme === undefined &&
				data.metaPixelId === undefined &&
				data.tiktokPixelId === undefined &&
				data.googleAdsConversionId === undefined
			) {
				ctx.addIssue({
					code: "custom",
					message: "Provide at least one setting to update",
					path: ["theme"],
				});
			}
		}
		if (data.action !== "update_artist_settings") {
			for (const field of [
				"artistId",
				"googleAdsConversionId",
				"metaPixelId",
				"theme",
				"tiktokPixelId",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid for update_artist_settings`,
						path: [field],
					});
				}
			}
		}
	});

export const DynamoiUpdateSmartLinkArtistSettingsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		googleAdsConversionId: z.string().trim().max(32).nullable().optional(),
		metaPixelId: z.string().trim().max(32).nullable().optional(),
		theme: SmartLinkThemeSchema.optional(),
		tiktokPixelId: z.string().trim().max(32).nullable().optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.theme === undefined &&
			data.metaPixelId === undefined &&
			data.tiktokPixelId === undefined &&
			data.googleAdsConversionId === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "Provide at least one setting to update",
				path: ["theme"],
			});
		}
	});

export const DynamoiUpdateSmartLinkDescriptionInputSchema = z
	.object({
		clientRequestId: ClientRequestIdSchema,
		customDescription: z.string().max(500).nullable(),
		expectedUpdatedAt: z.string().datetime().optional(),
		playLinkId: z.string().uuid(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

const ArtistHubSettingsShape = {
	hubDescription: z.string().max(500).nullable().optional(),
	profileLinks: z
		.array(
			z
				.object({
					isHidden: z.boolean(),
					service: z.enum([
						"spotify",
						"applemusic",
						"youtube",
						"instagram",
						"facebook",
						"tiktok",
						"soundcloud",
						"bandcamp",
						"deezer",
						"tidal",
						"boomplay",
						"audiomack",
					]),
					url: z.string().max(1024).nullable(),
				})
				.strict(),
		)
		.max(12)
		.optional(),
	servicePriority: z.array(z.string().max(32)).max(4).optional(),
	servicePriorityMode: z.enum(["country", "fixed"]).optional(),
} as const;

/**
 * Handler-side superset: the directory schema stays the public contract for
 * theme/pixel writes and the full-only hub tool adds the hub fields.
 */
const ArtistStudioSettingsHandlerInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		googleAdsConversionId: z.string().trim().max(32).nullable().optional(),
		metaPixelId: z.string().trim().max(32).nullable().optional(),
		...ArtistHubSettingsShape,
		theme: SmartLinkThemeSchema.optional(),
		tiktokPixelId: z.string().trim().max(32).nullable().optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.theme === undefined &&
			data.metaPixelId === undefined &&
			data.tiktokPixelId === undefined &&
			data.googleAdsConversionId === undefined &&
			data.hubDescription === undefined &&
			data.profileLinks === undefined &&
			data.servicePriority === undefined &&
			data.servicePriorityMode === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "Provide at least one setting to update",
				path: ["theme"],
			});
		}
	});

export const DynamoiUpdateSmartLinkArtistHubSettingsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		...ArtistHubSettingsShape,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.hubDescription === undefined &&
			data.profileLinks === undefined &&
			data.servicePriority === undefined &&
			data.servicePriorityMode === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "Provide at least one Artist Hub setting to update",
				path: ["hubDescription"],
			});
		}
	});

export const DynamoiUpdateSmartLinkReleaseSettingsInputSchema = z
	.object({
		clientRequestId: ClientRequestIdSchema,
		customDescription: z.string().max(500).nullable().optional(),
		expectedUpdatedAt: z.string().datetime().optional(),
		expectedVersion: z.string().min(1).max(128).optional(),
		playLinkId: z.string().uuid(),
		serviceOverrides: z
			.array(
				z
					.object({
						hidden: z.boolean(),
						service: z.string().max(32),
						url: z.string().max(1024).nullable(),
					})
					.strict(),
			)
			.max(15)
			.optional(),
		userIntentSummary: UserIntentSummarySchema,
		youtubeUrl: z.string().max(512).nullable().optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.customDescription === undefined &&
			data.youtubeUrl === undefined &&
			data.serviceOverrides === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "Provide at least one release setting to update",
				path: ["customDescription"],
			});
		}
	});

export function parseDynamoiCreateSmartLinksFromSpotifyArtistInput(
	rawInput: unknown,
) {
	return DynamoiCreateSmartLinksFromSpotifyArtistInputSchema.parse(rawInput);
}

export function parseDynamoiGetSmartLinkAnalyticsInput(rawInput: unknown) {
	return DynamoiGetSmartLinkAnalyticsInputSchema.parse(rawInput);
}

export function parseDynamoiCreateSmartLinkFromSpotifyInput(rawInput: unknown) {
	return DynamoiCreateSmartLinkFromSpotifyInputSchema.parse(rawInput);
}

export function parseDynamoiListSmartLinksInput(rawInput: unknown) {
	return DynamoiListSmartLinksInputSchema.parse(rawInput);
}

export function parseDynamoiGetSmartLinkArtistSettingsInput(rawInput: unknown) {
	return DynamoiGetSmartLinkArtistSettingsInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkInput(rawInput: unknown) {
	return DynamoiUpdateSmartLinkInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkArtistSettingsInput(
	rawInput: unknown,
) {
	return ArtistStudioSettingsHandlerInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkArtistHubSettingsInput(
	rawInput: unknown,
) {
	return DynamoiUpdateSmartLinkArtistHubSettingsInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkReleaseSettingsInput(
	rawInput: unknown,
) {
	return DynamoiUpdateSmartLinkReleaseSettingsInputSchema.parse(rawInput);
}

export const PHASE_4_TOOL_DEFINITIONS = [
	{
		description:
			"Use this for \"make a link for my song\" or a release or link-in-bio page for a new single. Use this when the user wants to create one free Dynamoi Smart Link from a Spotify album or track URL/URI, or a single starter release from a Spotify artist URL. For full-catalog artist imports or artist hub requests, prefer dynamoi_create_smart_links_from_spotify_artist. Smart Links are free to create and manage. High-popularity or unverifiable artist links may stay unpublished in verification hold until Dynamoi can verify the client relationship. This does not create a paid ad campaign. Spotify playlist URLs are not supported today. This is also how to add a release missing from an artist's imported catalog: the user pastes that release's exact Spotify album, single, or EP URL. If the Smart Link already exists, return the existing link instead of creating a duplicate; if customDescription is provided, update that Smart Link's public description. In the final answer, lead with the public URL and do not expose internal IDs unless asked.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_create_smart_link_from_spotify",
		openWorldHint: true,
		outputSchema: CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiCreateSmartLinkFromSpotifyInputSchema,
		title: "Create Free Smart Link from Spotify",
	},
	{
		description:
			"Use this when the user gives a Spotify artist URL and wants Dynamoi to create, import, or refresh free Smart Links for the artist catalog and return the artist hub. If the signed-in user has no Dynamoi artist yet, omit artistId so Dynamoi can create the first artist from the Spotify artist profile. This starts the background catalog import so the user does not need to open the dashboard. Smart Links are free to create and manage. High-popularity or unverifiable artist catalog links may stay unpublished in verification hold until Dynamoi can verify the client relationship. This does not create a paid ad campaign. In the final answer, lead with the artist hub URL and current public Smart Link URLs; do not expose internal IDs unless asked.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_create_smart_links_from_spotify_artist",
		openWorldHint: true,
		outputSchema: CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiCreateSmartLinksFromSpotifyArtistInputSchema,
		title: "Create Free Smart Links for Spotify Artist",
	},
	{
		description:
			"Use this when the user wants to list free Smart Links for one artist, including release title, public URL, publish state, claim state, render state, and theme. Do not use this for paid campaign lists; use dynamoi_list_campaigns for campaigns. In the final answer, show public URLs and avoid internal IDs unless asked. If empty for an artist with connected Spotify, suggest dynamoi_create_smart_links_from_spotify_artist for catalog import or dynamoi_create_smart_link_from_spotify for one release instead of stopping at 'no Smart Links yet'.",
		destructiveHint: false,
		name: "dynamoi_list_smart_links",
		openWorldHint: false,
		outputSchema: ListSmartLinksOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListSmartLinksInputSchema,
		title: "List Smart Links",
	},
	{
		description:
			"Use this when the user wants full details for one free Smart Link, including release, Spotify URL, public play.dynamoi.com URL, current status, theme source, and next actions. Set includeAnalytics=true for visit/click analytics and includeArtistSettings=true for artist-level theme/pixel settings. In the final answer, lead with the public URL and do not expose internal IDs unless asked.",
		destructiveHint: false,
		name: "dynamoi_get_smart_link",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetSmartLinkInputSchema,
		title: "Get Smart Link",
	},
	{
		description:
			"Use this when the user wants to change one Smart Link's public description or update artist-level Smart Link theme/pixel settings. Set action to update_description or update_artist_settings. Public availability is artist-wide in the dashboard; this tool does not publish or unpublish individual links. Theme-only updates switch instantly; description or pixel changes may queue background rendering.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_smart_link",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkInputSchema,
		title: "Update Smart Link",
	},
] as const;

/** Directory-facing operation-specific replacements for the legacy dispatcher. */
export const SMART_LINK_UPDATE_OPERATION_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to update one Smart Link's public description. This tool only changes that link's description; it cannot change artist-level theme or pixel settings and does not publish or unpublish links. Confirm the requested description before calling. A description change may queue background rendering.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_smart_link_description",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkDescriptionInputSchema,
		title: "Update Smart Link Description",
	},
	{
		description:
			"Use this when the user wants to change artist-level Smart Link theme or validated pixel settings. This tool only changes artist settings; it cannot change a link description or publish or unpublish links. Confirm the requested settings before calling. Theme-only changes switch instantly; pixel changes may queue background rendering.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_smart_link_artist_settings",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkArtistSettingsInputSchema,
		title: "Update Smart Link Artist Settings",
	},
] as const;

/** Full-profile-only Smart Link writes; the directory contract never lists them. */
export const FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to change the artist-level Smart Link introduction, official profile links or service order. Omitted fields preserve stored values; null explicitly clears supported fields. Theme and pixel changes belong to dynamoi_update_smart_link_artist_settings. Confirm the requested settings before calling. The result includes the saved artistHub readback. A partial save is reported truthfully; read the current introduction, profile links and service order with dynamoi_get_smart_link (artistId, includeArtistSettings=true; see artistHub) before retrying.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_smart_link_artist_hub_settings",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkArtistHubSettingsInputSchema,
		title: "Update Smart Link Artist Hub Settings",
	},
	{
		description:
			"Use this when the user wants to change one Smart Link's release video or catalog destination visibility. Pass the read version as expectedVersion. Set any of customDescription, youtubeUrl or serviceOverrides; omitted fields preserve stored values and null explicitly clears supported fields. Public availability is artist-wide in the dashboard; this tool does not publish or unpublish individual links. Confirm the requested settings before calling. The result includes the saved releaseSettings readback; after an ambiguous failure, read it with dynamoi_get_smart_link (playLinkId; see releaseSettings) before retrying. A description or video change may queue background rendering.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_smart_link_release_settings",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkReleaseSettingsInputSchema,
		title: "Update Smart Link Release Settings",
	},
] as const;
