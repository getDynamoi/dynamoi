import * as z from "zod/v4";
import {
	FUNDING_CONSENT_BUDGET_TYPE_MISMATCH_MESSAGE,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY as prospectiveFundingConsentCopy,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH as prospectiveFundingConsentCopyHash,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION as prospectiveFundingConsentVersion,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY as totalFundingConsentCopy,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH as totalFundingConsentCopyHash,
	TOTAL_BUDGET_FUNDING_CONSENT_VERSION as totalFundingConsentVersion,
} from "../consent";
import {
	DynamoiGetCurrentUserInputSchema,
	DynamoiListArtistsInputSchema,
} from "./account-schema.generated";
import { createPhaseOnboardingToolDefinitions } from "./onboarding-tool-definitions";
import { OPENAI_TOOL_DEFINITIONS } from "./openai-tools";
import {
	AnyOutputEnvelopeSchema,
	GetCampaignOutputEnvelopeSchema,
	GetCampaignReadinessOutputEnvelopeSchema,
	GetResumeFundingOutputEnvelopeSchema,
	GetYouTubeChannelDataOutputEnvelopeSchema,
	ListAvailableCountriesOutputEnvelopeSchema,
	ManageYoutubeDraftOutputEnvelopeSchema,
	UpdateCampaignOutputEnvelopeSchema,
} from "./output-schemas";
import {
	ClientRequestIdSchema,
	IsoCalendarDateSchema,
	SearchQuerySchema,
	DateRangeSchema as SharedDateRangeSchema,
	ToolFormatSchema as SharedToolFormatSchema,
	UserIntentSummarySchema,
} from "./shared-schemas";
import { DynamoiGetYouTubeChannelDataInputSchema } from "./youtube-channel-data-schema";
import {
	YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI,
	YouTubeStrategyKeySchema,
} from "./youtube-strategy-guide";

export {
	DynamoiGetCurrentUserInputSchema,
	DynamoiListArtistsInputSchema,
} from "./account-schema.generated";

const YouTubeStrategySchema = YouTubeStrategyKeySchema.describe(
	`YouTube campaign strategy. Labels for users: CHEAPEST_VIEWS = Views, ORGANIC_VIEWS = Watch Time, SUBSCRIBERS = Subscribers, ORGANIC_VIEWS_AND_SUBSCRIBERS = Channel Growth (default for non-monetized channels), ADSENSE_ROI = Revenue (monetized channels only). Read ${YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI} before recommending or changing one.`,
);

export const DateRangeSchema = SharedDateRangeSchema;
export const ToolFormatSchema = SharedToolFormatSchema;

const OnboardingAttemptIdSchema = z.string().trim().min(1).max(120).optional();
const ExpectedCampaignStatusEnum = z.enum([
	"AWAITING_SMART_LINK",
	"ACTIVE",
	"ARCHIVED",
	"CONTENT_VALIDATION",
	"DEPLOYING",
	"ENDED",
	"FAILED",
	"PAUSED",
	"READY_FOR_REVIEW",
	"SUBSCRIPTION_PAUSED",
]);
const ExpectedCampaignStatusSchema = ExpectedCampaignStatusEnum.optional();
const CampaignStatusFilterSchema = ExpectedCampaignStatusEnum.optional();

export const DynamoiSearchInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		includeArchived: z.boolean().optional(),
		limit: z.number().int().min(1).max(50).optional(),
		query: SearchQuerySchema.optional(),
		type: z.enum(["artist", "campaign", "smartlink"]).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!(data.type || data.query)) {
			ctx.addIssue({
				code: "custom",
				message: "query is required when type is not specified",
				path: ["query"],
			});
		}
	});

export const DynamoiGetArtistInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiListCampaignsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]).optional(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(50).optional(),
		status: CampaignStatusFilterSchema,
	})
	.strict();

export const DynamoiGetCampaignInputSchema = z
	.object({
		analyticsDateRange: DateRangeSchema.optional(),
		analyticsGranularity: z.enum(["TOTAL", "DAILY"]).optional(),
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		includeAnalytics: z.boolean().optional(),
		includeChannelResults: z.boolean().optional(),
		includeCountries: z.boolean().optional(),
		includeDeploymentStatus: z.boolean().optional(),
	})
	.strict();

export const DynamoiGetCampaignAnalyticsInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	})
	.strict();

export const DynamoiGetArtistAnalyticsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	})
	.strict();

export const DynamoiGetGrowthAuditInputSchema = z
	.object({ artistId: z.string().uuid() })
	.strict();

export const DynamoiGetPlaylistAnalyticsInputSchema = z
	.object({ artistId: z.string().uuid() })
	.strict();

export const DynamoiGetAudienceAnalyticsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		range: z.enum(["7d", "30d", "90d"]).default("30d"),
	})
	.strict();

export const DynamoiGetBillingInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		onboardingAttemptId: OnboardingAttemptIdSchema,
	})
	.strict();

const LocationTargetSchema = z
	.object({
		code: z.string().trim().min(1).max(8),
		name: z.string().trim().min(1).max(120),
	})
	.strict();

export const DynamoiGetPlatformStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		onboardingAttemptId: OnboardingAttemptIdSchema,
		onboardingFlow: z.enum(["meta", "youtube"]).optional(),
	})
	.strict();

export const DynamoiStartYoutubeChannelLinkInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		purpose: z.enum(["advertising", "distribution_identity"]).optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiStartMetaConnectionInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		purpose: z.enum(["advertising", "distribution_identity"]).optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiListAvailableCountriesInputSchema = z
	.object({
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(100).optional(),
		query: z.string().trim().max(120).optional(),
	})
	.strict();

export const DynamoiGetOnboardingStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

// Keep this standalone package's public limit in sync with web-shared's
// MAX_PROMOTED_VIDEOS_PER_CAMPAIGN (10).
const YouTubeEntriesSchema = z
	.array(
		z
			.object({
				playlistId: z.string().trim().min(1).max(128).optional(),
				videoId: z.string().trim().min(1).max(128),
			})
			.strict(),
	)
	.min(1)
	.max(10);

function validateYouTubeEntries(
	data: {
		youtubeEntries?: z.infer<typeof YouTubeEntriesSchema> | undefined;
		youtubeVideoId?: string | undefined;
		youtubePlaylistId?: string | undefined;
		youtubeStrategy?: string | undefined;
	},
	ctx: {
		addIssue: (issue: {
			code: "custom";
			message: string;
			path: (string | number)[];
		}) => void;
	},
) {
	if (data.youtubeEntries && (data.youtubeVideoId || data.youtubePlaylistId)) {
		ctx.addIssue({
			code: "custom",
			message:
				"Use youtubeEntries or youtubeVideoId/youtubePlaylistId, not both",
			path: ["youtubeEntries"],
		});
	}
	if (data.youtubeEntries && data.youtubeStrategy !== "CHEAPEST_VIEWS") {
		data.youtubeEntries.forEach((entry, index) => {
			if (!entry.playlistId) {
				ctx.addIssue({
					code: "custom",
					message:
						"playlistId is required unless youtubeStrategy is CHEAPEST_VIEWS",
					path: ["youtubeEntries", index, "playlistId"],
				});
			}
		});
	}
	if (
		data.youtubeEntries &&
		data.youtubeStrategy === "CHEAPEST_VIEWS" &&
		data.youtubeEntries.length > 1
	) {
		ctx.addIssue({
			code: "custom",
			message: "Views campaigns support one promoted video.",
			path: ["youtubeEntries"],
		});
	}
}

export const DynamoiGetCampaignReadinessInputSchema = z
	.object({
		adCopy: z.string().trim().max(500).optional(),
		artistId: z.string().uuid(),
		budgetAmount: z.number().finite().positive().optional(),
		budgetType: z.enum(["DAILY", "TOTAL"]).optional(),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]).optional(),
		endDate: IsoCalendarDateSchema.describe("Last day ads run").optional(),
		format: ToolFormatSchema.optional(),
		locationTargets: z.array(LocationTargetSchema).optional(),
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		youtubeEntries: YouTubeEntriesSchema.optional(),
		youtubePlaylistId: z.string().trim().min(1).max(128).optional(),
		youtubeStrategy: YouTubeStrategySchema.optional(),
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict()
	.superRefine(validateYouTubeEntries);

export const DynamoiManageYoutubeDraftInputSchema = z
	.object({
		action: z.enum(["inspect", "discard"]),
		artistId: z.string().uuid(),
		campaignId: z.string().uuid().optional(),
		expectedUpdatedAt: z.string().datetime().optional(),
		userIntentSummary: UserIntentSummarySchema.optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (data.action === "discard" && !data.campaignId) {
			ctx.addIssue({
				code: "custom",
				message: "campaignId is required to discard a draft",
				path: ["campaignId"],
			});
		}
		if (data.action === "discard" && !data.expectedUpdatedAt) {
			ctx.addIssue({
				code: "custom",
				message: "expectedUpdatedAt is required to discard a draft",
				path: ["expectedUpdatedAt"],
			});
		}
		if (data.action === "discard" && !data.userIntentSummary) {
			ctx.addIssue({
				code: "custom",
				message: "userIntentSummary is required to discard a draft",
				path: ["userIntentSummary"],
			});
		}
	});

export const DynamoiGetCampaignDeploymentStatusInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiPauseCampaignInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiAddCampaignFundsInputSchema = z
	.object({
		amountMinor: z.number().int().positive(),
		artistId: z.string().uuid(),
		confirm: z.boolean().optional(),
		currency: z.string().length(3).optional(),
		requestId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetResumeFundingInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

const staleConsent = {
	error:
		"Stale funding consent. Show the user the current consent copy from the tool description and send its version and hash.",
};
const FundingConsentVersionSchema = z.enum(
	[prospectiveFundingConsentVersion, totalFundingConsentVersion],
	staleConsent,
);
const FundingConsentCopyHashSchema = z.enum(
	[prospectiveFundingConsentCopyHash, totalFundingConsentCopyHash],
	staleConsent,
);

const totalFundingConsentFields = {
	acceptedTotalConsentCopyHash: z
		.literal(totalFundingConsentCopyHash)
		.describe(
			`TOTAL budgets only, with acceptedTotalConsentVersion, after the client explicitly accepts: “${totalFundingConsentCopy}”`,
		)
		.optional(),
	acceptedTotalConsentVersion: z.literal(totalFundingConsentVersion).optional(),
};

/** The TOTAL pair is whole, only for a TOTAL budget, and never sent with the DAILY fields. */
function addFundingConsentFamilyIssue(
	data: Partial<
		Record<
			| "acceptedConsentCopyHash"
			| "acceptedConsentVersion"
			| "acceptedTotalConsentCopyHash"
			| "acceptedTotalConsentVersion"
			| "authorizeAutomaticDailyFunding",
			unknown
		>
	>,
	ctx: z.RefinementCtx,
	budgetType?: "DAILY" | "TOTAL",
) {
	const total = [
		data.acceptedTotalConsentCopyHash,
		data.acceptedTotalConsentVersion,
	];
	const daily =
		data.acceptedConsentCopyHash ||
		data.acceptedConsentVersion ||
		data.authorizeAutomaticDailyFunding;
	if (
		(total.some(Boolean) &&
			(!total.every(Boolean) || daily || budgetType === "DAILY")) ||
		(daily && budgetType === "TOTAL")
	) {
		ctx.addIssue({
			code: "custom",
			message: FUNDING_CONSENT_BUDGET_TYPE_MISMATCH_MESSAGE,
			path: ["acceptedTotalConsentVersion"],
		});
	}
}

export const DynamoiResumeCampaignInputSchema = z
	.object({
		acceptedConsentCopyHash: FundingConsentCopyHashSchema.optional(),
		acceptedConsentVersion: FundingConsentVersionSchema.optional(),
		authorizeAutomaticDailyFunding: z.literal(true).optional(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

export const DynamoiUpdateBudgetInputSchema = z
	.object({
		acceptedConsentCopyHash: FundingConsentCopyHashSchema.optional(),
		acceptedConsentVersion: FundingConsentVersionSchema.optional(),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),
		budgetAmount: z
			.number()
			.finite()
			.positive()
			.describe(
				"Budget in the artist's commercial currency (major units; use only exact minor units).",
			),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		endDate: IsoCalendarDateSchema.describe("Last day ads run").optional(),
		expectedCurrentBudgetAmount: z
			.number()
			.finite()
			.positive()
			.describe(
				"Current budget in the artist's commercial currency (major units).",
			)
			.optional(),
		expectedCurrentEndDate:
			IsoCalendarDateSchema.describe("Last day ads run").optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

export const DynamoiUpdateCampaignInputSchema = z
	.object({
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		...totalFundingConsentFields,
		action: z.enum([
			"pause",
			"resume",
			"update_budget",
			"change_strategy",
			"update_location",
			"update_end_date",
			"archive",
			"update_goals",
		]),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),
		budgetAmount: z
			.number()
			.finite()
			.positive()
			.describe(
				"Budget in the artist's commercial currency (major units; use only exact minor units).",
			)
			.optional(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		endDate: IsoCalendarDateSchema.describe("Last day ads run").optional(),
		expectedCurrentBudgetAmount: z
			.number()
			.finite()
			.positive()
			.describe(
				"Current budget in the artist's commercial currency (major units).",
			)
			.optional(),
		expectedCurrentEndDate:
			IsoCalendarDateSchema.describe("Last day ads run").optional(),
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		locationTargets: z
			.union([
				z.object({ mode: z.literal("GLOBAL") }).strict(),
				z
					.object({
						countries: z.array(z.string().length(2)).min(1),
						mode: z.literal("COUNTRIES"),
					})
					.strict(),
			])
			.optional(),
		optimizeForOrganicViews: z.boolean().optional(),
		optimizeForSubscribers: z.boolean().optional(),
		strategy: YouTubeStrategySchema.optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			[
				"change_strategy",
				"update_location",
				"update_end_date",
				"archive",
				"update_goals",
			].includes(data.action) &&
			!data.clientRequestId
		) {
			ctx.addIssue({
				code: "custom",
				message: "clientRequestId is required for this action",
				path: ["clientRequestId"],
			});
		}
		if (data.action === "update_budget" && data.budgetAmount === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "budgetAmount is required when action is update_budget",
				path: ["budgetAmount"],
			});
		}
		if (data.action === "update_end_date" && data.endDate === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "endDate is required",
				path: ["endDate"],
			});
		}
		if (data.action === "change_strategy" && data.strategy === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "strategy is required",
				path: ["strategy"],
			});
		}
		if (
			data.action === "update_location" &&
			data.locationTargets === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "locationTargets is required",
				path: ["locationTargets"],
			});
		}
		if (
			data.action === "update_goals" &&
			data.optimizeForOrganicViews === undefined &&
			data.optimizeForSubscribers === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optimization goal is required",
				path: ["action"],
			});
		}
		if (data.action !== "update_budget" && data.action !== "update_end_date") {
			for (const field of [
				"budgetAmount",
				"endDate",
				"expectedCurrentBudgetAmount",
				"expectedCurrentEndDate",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid when action is update_budget`,
						path: [field],
					});
				}
			}
		}
		if (
			data.action === "update_end_date" &&
			data.expectedCurrentBudgetAmount !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"expectedCurrentBudgetAmount is not valid for an end-date-only edit",
				path: ["expectedCurrentBudgetAmount"],
			});
		}
		for (const [field, action] of [
			["strategy", "change_strategy"],
			["locationTargets", "update_location"],
			["optimizeForOrganicViews", "update_goals"],
			["optimizeForSubscribers", "update_goals"],
		] as const) {
			if (data[field] !== undefined && data.action !== action) {
				ctx.addIssue({
					code: "custom",
					message: `${field} is only valid when action is ${action}`,
					path: [field],
				});
			}
		}
		if (data.action === "update_end_date" && data.budgetAmount !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: "budgetAmount is not valid for an end-date-only edit",
				path: ["budgetAmount"],
			});
		}
		if (
			data.action !== "update_budget" &&
			data.action !== "update_end_date" &&
			data.action !== "resume"
		) {
			for (const field of [
				"acceptedConsentCopyHash",
				"acceptedConsentVersion",
				"acceptedTotalConsentCopyHash",
				"acceptedTotalConsentVersion",
				"authorizeAutomaticDailyFunding",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid when action is update_budget or resume`,
						path: [field],
					});
				}
			}
		}
		addFundingConsentFamilyIssue(data, ctx);
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

export const DynamoiListMediaAssetsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		includeUrls: z.boolean().optional(),
		limit: z.number().int().min(1).max(50).optional(),
	})
	.strict();

export const DynamoiLaunchCampaignInputSchema = z
	.object({
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		...totalFundingConsentFields,
		// Creative
		adCopy: z.string().trim().max(500).optional(),
		appleMusicUrl: z.string().trim().min(1).max(500).optional(),
		artistId: z.string().uuid(),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Required for DAILY budgets. Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),

		// Budget
		budgetAmount: z
			.number()
			.finite()
			.positive()
			.describe(
				"Budget in the artist's commercial currency (major units; use only exact minor units).",
			),
		budgetSplits: z.record(
			z.enum(["META", "GOOGLE"]),
			z.number().int().min(0).max(100),
		),
		budgetType: z.enum(["DAILY", "TOTAL"]),

		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		// Idempotency (client-generated UUID)
		clientRequestId: z.string().uuid(),

		// Content
		contentTitle: z.string().trim().min(1).max(160),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]),
		endDate: IsoCalendarDateSchema.describe("Last day ads run").optional(),

		// Targeting
		locationTargets: z.array(LocationTargetSchema).optional(),

		// Smart Campaign creative selection (existing assets only in Phase 3)
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		userIntentSummary: UserIntentSummarySchema,
		youtubeEntries: YouTubeEntriesSchema.optional(),
		// YouTube content (same choices as the app's YouTube campaign setup)
		youtubePlaylistId: z.string().trim().min(1).max(128).optional(),
		youtubeStrategy: YouTubeStrategySchema.optional(),
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.budgetType === "DAILY" &&
			!(
				data.authorizeAutomaticDailyFunding &&
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"DAILY budgets require authorizeAutomaticDailyFunding with acceptedConsentCopyHash and acceptedConsentVersion",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
		addFundingConsentFamilyIssue(data, ctx, data.budgetType);

		const sum = Object.values(data.budgetSplits ?? {}).reduce(
			(acc, v) => acc + (Number.isFinite(v) ? v : 0),
			0,
		);
		if (!(sum > 0)) {
			ctx.addIssue({
				code: "custom",
				message: "budgetSplits must allocate at least one platform",
				path: ["budgetSplits"],
			});
		}

		// Require splits to sum to ~100 for predictable intent.
		if (sum > 0 && Math.abs(sum - 100) > 0.01) {
			ctx.addIssue({
				code: "custom",
				message: "budgetSplits must sum to 100",
				path: ["budgetSplits"],
			});
		}

		if (data.campaignType === "SMART_CAMPAIGN") {
			if (!data.mediaAssetIds || data.mediaAssetIds.length === 0) {
				ctx.addIssue({
					code: "custom",
					message: "mediaAssetIds is required for SMART_CAMPAIGN",
					path: ["mediaAssetIds"],
				});
			}
			if (!("META" in data.budgetSplits) || data.budgetSplits.META <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "SMART_CAMPAIGN requires a META budget split > 0",
					path: ["budgetSplits", "META"],
				});
			}
			// Smart Campaigns are Meta-only today. Keep the public contract accurate.
			if (data.budgetSplits.GOOGLE && data.budgetSplits.GOOGLE > 0) {
				ctx.addIssue({
					code: "custom",
					message: "SMART_CAMPAIGN does not support GOOGLE budget splits",
					path: ["budgetSplits", "GOOGLE"],
				});
			}
		}

		if (data.campaignType === "YOUTUBE") {
			validateYouTubeEntries(data, ctx);
			if (!(data.youtubeVideoId || data.youtubeEntries)) {
				ctx.addIssue({
					code: "custom",
					message: "youtubeVideoId is required for YOUTUBE",
					path: ["youtubeVideoId"],
				});
			}
			if (!data.youtubeStrategy) {
				ctx.addIssue({
					code: "custom",
					message: "youtubeStrategy is required for YOUTUBE",
					path: ["youtubeStrategy"],
				});
			}
			if (
				data.youtubeStrategy &&
				data.youtubeStrategy !== "CHEAPEST_VIEWS" &&
				!data.youtubePlaylistId &&
				!data.youtubeEntries
			) {
				ctx.addIssue({
					code: "custom",
					message:
						"youtubePlaylistId is required for YOUTUBE unless youtubeStrategy is CHEAPEST_VIEWS",
					path: ["youtubePlaylistId"],
				});
			}
			if (data.contentType !== "VIDEO") {
				ctx.addIssue({
					code: "custom",
					message: "contentType must be VIDEO for YOUTUBE",
					path: ["contentType"],
				});
			}
			if (!("GOOGLE" in data.budgetSplits) || data.budgetSplits.GOOGLE <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "YOUTUBE requires a GOOGLE budget split > 0",
					path: ["budgetSplits", "GOOGLE"],
				});
			}
			// YouTube campaigns are Google-only today.
			if (data.budgetSplits.META && data.budgetSplits.META > 0) {
				ctx.addIssue({
					code: "custom",
					message: "YOUTUBE does not support META budget splits",
					path: ["budgetSplits", "META"],
				});
			}
		}
	});

export const PHASE_1_TOOL_DEFINITIONS = [
	{
		description:
			"Start here when a musician asks to promote a new single, check how a release is doing, make a song link, get music on Spotify, or grow a YouTube channel and the artist is not yet identified. Use this when the user explicitly asks about the signed-in Dynamoi account itself, such as who is logged in, how many organizations or artists it can access, or whether account-level platform connections exist. Pass intent to match that explicit account question; it defaults to account_overview. Do not use this to confirm a specific Meta or YouTube onboarding attempt because this account-level state can span multiple artists; use dynamoi_get_platform_status for the target artist instead. Do not use this to enumerate artists one by one; use dynamoi_list_artists for that. Never use this to 'check context' before answering generic Instagram, lyrics, songwriting, or marketing-advice questions, even if Dynamoi is attached.",
		destructiveHint: false,
		name: "dynamoi_get_account_overview",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCurrentUserInputSchema,
		title: "Get Account Overview",
	},
	{
		description:
			"Use this when the user wants to see which artists or YouTube channels they manage, along with billing status, active campaign count, and their role. Pass artistId when you need the full profile/readiness details for one artist instead of a roster page. Do not use this for campaign details; use dynamoi_list_campaigns or dynamoi_get_campaign. Never use this for generic social-media or marketing advice, including Instagram follower-growth questions, unless the user explicitly asked about their Dynamoi roster. If the result is empty, the user is brand-new — do not stop with 'no records found'; route through dynamoi_get_account_overview.recommendedNextActions.",
		destructiveHint: false,
		name: "dynamoi_list_artists",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListArtistsInputSchema,
		title: "List Artists",
	},
	{
		description:
			"Use this when the user mentions an artist, release, campaign, or smart link but you do not yet know the exact record to inspect. Do not use this for analytics summaries or billing questions once you already know the target record. If the result is empty for a brand-new user (no artists yet), do not respond 'no records found' as a terminal answer — instead suggest creating their first artist hub via dynamoi_create_smart_links_from_spotify_artist.",
		destructiveHint: false,
		name: "dynamoi_search",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiSearchInputSchema,
		title: "Search Dynamoi",
	},
	...OPENAI_TOOL_DEFINITIONS,
	{
		description:
			"Use this when the user wants to browse campaigns for one artist, optionally filtered by type or status. Do not use this for a single campaign deep dive; use dynamoi_get_campaign for that. Never use this to personalize generic marketing advice. If the user has no artists yet, do not call this — route via dynamoi_get_account_overview first.",
		destructiveHint: false,
		name: "dynamoi_list_campaigns",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListCampaignsInputSchema,
		title: "List Campaigns",
	},
	{
		description:
			"Use this when the user wants full details for one campaign, including budget, targeting, platform status, and next actions. YouTube campaigns return youtubeStrategy and strategyGuide: read the guide's goal and judgeBy before interpreting results. Set includeAnalytics=true for paid delivery, includeChannelResults=true for observed YouTube channel results with paid and organic views (never attributed to the campaign), includeDeploymentStatus=true for delivery/deployment blockers, and includeCountries=true only when the full country list is needed. Do not use this for a campaign list; use dynamoi_list_campaigns instead. After a successful launch or campaign mutation, prefer format=summary when you need a follow-up read to relay the final answer.",
		destructiveHint: false,
		name: "dynamoi_get_campaign",
		openWorldHint: false,
		outputSchema: GetCampaignOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignInputSchema,
		title: "Get Campaign",
	},
	{
		description:
			'Use this for "how is my release doing?" and "are my ads working?" questions about an artist\'s Dynamoi campaigns. Use this when the user wants artist-level performance across all campaigns, including 30-day rollups or daily breakdowns. Pass granularity=DAILY when the user asks for a daily breakdown. Pass format=summary when the user wants a written rollup, a strongest-campaign verdict, or a direct answer you can relay immediately. If this tool already returned the requested strongest-campaign comparison, stop and answer instead of calling more analytics tools. For one campaign\'s metrics, use dynamoi_get_campaign with includeAnalytics=true.',
		destructiveHint: false,
		name: "dynamoi_get_artist_analytics",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetArtistAnalyticsInputSchema,
		title: "Get Artist Analytics",
	},
	{
		description:
			"Use this when the user asks for an artist's Spotify monthly listeners, listener growth over time, growth audit or score, playlist reach, or growth recommendations. The response carries its status, coverage dates, and limitations; preserve unavailable or stale status and do not treat a missing metric as zero. This is Spotify and market insight data, not paid campaign performance.",
		destructiveHint: false,
		name: "dynamoi_get_growth_audit",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetGrowthAuditInputSchema,
		title: "Get Spotify Growth Audit",
	},
	{
		description:
			"Use this when the user asks about an artist's tracked playlist placements, reach, or playlist movement. The response includes freshness and snapshot dates with the playlist and movement rows. These observed placements are not attributed to a paid campaign.",
		destructiveHint: false,
		name: "dynamoi_get_playlist_analytics",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetPlaylistAnalyticsInputSchema,
		title: "Get Playlist Analytics",
	},
	{
		description:
			"Use this when the user asks about an artist's streaming audience by country, service, paid/free tier, or daily trend. Choose range=7d, 30d, or 90d; it defaults to 30d. The response comes from audience analytics and preserves the requested date range. If the source is temporarily unavailable, report that instead of treating it as zero audience.",
		destructiveHint: false,
		name: "dynamoi_get_audience_analytics",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetAudienceAnalyticsInputSchema,
		title: "Get Audience Analytics",
	},
	{
		description:
			'Use this for "how is my YouTube channel doing?" or "what is growing my channel?" once a channel is linked. Use this to analyze an artist\'s own connected YouTube channel\'s estimated ad revenue to inform AdSense strategy and channel growth, alongside subscribers, views, watch time or country, device and subscribed-status breakdowns: paged channel data from the YouTube Analytics warehouse or explicitly qualified synthetic/sample data. Pick one dataset: channel_daily (views, watch time, subscribers gained and lost, likes, shares, playlist starts, estimated revenue, ad revenue, gross revenue, monetized playbacks, CPM and playback-based CPM), video_daily (per-video metrics with titles; filter with videoIds), country_daily, traffic_source_daily, search_term_daily (YouTube search terms for the whole channel), subscribed_status_daily, device_daily, operating_system_daily, playback_location_daily, creator_content_type_daily, or video_catalog (video titles and publish dates). traffic_source_daily rows with source ADVERTISING carry trafficClass=paid and every other source carries trafficClass=organic, but that label only groups sources and is not organic proof: ad clicks that land in a playlist are credited mostly to PLAYLIST and SUBSCRIBER, so trafficClass=organic rows include ad sessions. Organic lift is growth in sources ads do not touch (YT_SEARCH, RELATED_VIDEO, browse features) or lift that persists after spend stops. Warehouse data is observed on the channel, not attributed to any campaign. Preserve the returned source, coverage, freshness, and synthetic/sample qualifications; do not treat synthetic/sample data as observed channel results, campaign attribution, or actual earnings/payouts. Treat returned ad revenue as estimated revenue, not an AdSense payout. The first page of any dataset (including format=summary) also carries one adsense block, the same figures the Dynamoi dashboard and app show: formats (long-form versus Shorts AdSense revenue and RPM), recovery and campaigns (incremental AdSense since each campaign and whether it earned back the billed amount), and countries (AdSense per ad playback against similar channels). It is estimated, not a payout, and covers windowFromDay to windowThroughDay, which is not always the requested range: compare against those fields. recovery.state building or unavailable and null figures mean unknown, never zero; adsense is null outside the YouTube Partner Program, on later pages, or when temporarily unavailable (adsenseNote explains). Compare periods yourself and use the campaigns block (dates, strategy, promoted videos) as context. YouTube data arrives about 2-3 days late and revenue can lag further: check coverage before comparing, and treat placeholderDays and missingDays as unknown, never zero. Not available yet: audience demographics, per-video traffic sources and per-video search terms. Needs a connected channel; a channel that must be reconnected is refused. Returns no ad spend. Before judging a campaign\'s strategy, read the strategyGuide from dynamoi_get_campaign. Page with nextCursor; format=summary returns only the summary, coverage and adsense.',
		destructiveHint: false,
		name: "dynamoi_get_youtube_channel_data",
		openWorldHint: false,
		outputSchema: GetYouTubeChannelDataOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetYouTubeChannelDataInputSchema,
		title: "Get YouTube Channel Data",
	},
	{
		description:
			"Use this when the user asks about billing state, credit balance, promo limits, subscription status, campaign-fund deposits, or whether billing blocks launches for one artist. This is a read-only status check; it does not create checkout links or collect payment. Each deposit in prefundPayments is pending (payment not yet confirmed), cleared (Stripe says paid and the funds are usable), failed (the payment did not complete) or held (paid, but funding is on hold for review and not usable yet). A Checkout link alone is never a deposit. To add campaign funds use dynamoi_add_campaign_funds; for other billing setup tell the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.' Then call this tool again to confirm the status. Do not use this for campaign analytics or platform connection troubleshooting.",
		destructiveHint: false,
		name: "dynamoi_get_billing",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetBillingInputSchema,
		title: "Get Billing",
	},
	{
		description:
			"Read the existing campaign's resume funding breakdown before requesting funding consent: campaign budget, funded-window coverage, usable credits, immediate charge, payment method, refusal and current consent. Amounts carry their commercial currency and minor-unit exponent. This read never reserves funds, authorizes collection or resumes delivery. A refusal is not a zero-charge approval. Use dynamoi_update_campaign to resume only after explicit user consent when required.",
		destructiveHint: false,
		name: "dynamoi_get_resume_funding",
		openWorldHint: false,
		outputSchema: GetResumeFundingOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetResumeFundingInputSchema,
		title: "Get Resume Funding",
	},
	{
		description:
			"Use this when the user wants to know whether Spotify, Meta, or YouTube are connected and what setup steps still block launches. When polling after a connection-start flow, pass the returned onboardingAttemptId and onboardingFlow so Dynamoi ops can correlate the browser step. Do not use this for detailed billing questions. Never use this to personalize generic Instagram or marketing-advice questions.",
		destructiveHint: false,
		name: "dynamoi_get_platform_status",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetPlatformStatusInputSchema,
		title: "Get Platform Status",
	},
	{
		description:
			"Use this when the user asks which countries they can target for a Smart Campaign or YouTube campaign. Always pass campaignType because Smart Campaign and YouTube country catalogs are different. Do not use this for generic country marketing advice.",
		destructiveHint: false,
		name: "dynamoi_list_available_countries",
		openWorldHint: false,
		outputSchema: ListAvailableCountriesOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListAvailableCountriesInputSchema,
		title: "List Available Countries",
	},
	{
		description:
			'Use this when a musician wants to promote a new single or release with ads ("promote my new single", "run ads for my song"): it checks whether a Smart Campaign or YouTube campaign is ready before dynamoi_launch_campaign. This validates readiness and targeting without creating a campaign. Complete budget inputs also return the shared, nonbinding campaign funding preview with known or unavailable credit coverage, card upper bounds and expiry timing. For TOTAL budgets the preview describes total-daily funding for web and native creation; MCP TOTAL launch uses existing credits only, cannot authorize card funding, and does not accept the preview\'s total-daily consent. Do not use this to create or mutate campaigns.',
		destructiveHint: false,
		name: "dynamoi_get_campaign_readiness",
		openWorldHint: false,
		outputSchema: GetCampaignReadinessOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignReadinessInputSchema,
		title: "Get Campaign Readiness",
	},
] as const;

export const PHASE_ONBOARDING_TOOL_DEFINITIONS =
	createPhaseOnboardingToolDefinitions({
		metaConnection: DynamoiStartMetaConnectionInputSchema,
		youtubeChannelLink: DynamoiStartYoutubeChannelLinkInputSchema,
	});

export const PHASE_2_TOOL_DEFINITIONS = [
	{
		description:
			"Create the same unpaid Stripe Checkout the dashboard's Add campaign funds button creates, in the artist's bound currency, and return its URL for the user to open and pay. Call it first WITHOUT confirm to get the exact amount and currency; show both to the user and obtain their explicit approval, then call again with confirm=true, that currency, the same amountMinor and the same requestId (retrying within 24 hours returns the same session; once a payment exists for that requestId, or after a day, use a new requestId). This never charges anyone or records a deposit: funds count as cleared only after Stripe says paid, which dynamoi_get_billing reports in prefundPayments (pending, cleared, failed or held). Refused when funding is on hold, billing setup is required, the amount is outside the allowed range or the currency is not live.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_add_campaign_funds",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiAddCampaignFundsInputSchema,
		title: "Add Campaign Funds",
	},
	{
		description:
			"Inspect an artist's open YouTube draft with action=inspect after an interrupted launch. Returns completed steps, screening, failure stage, and updatedAt. Use action=discard only when the user explicitly asks to discard that draft, supplying its campaignId, expectedUpdatedAt from inspect, and userIntentSummary. Discard cannot be undone.",
		destructiveHint: true,
		name: "dynamoi_manage_youtube_draft",
		openWorldHint: false,
		outputSchema: ManageYoutubeDraftOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiManageYoutubeDraftInputSchema,
		title: "Manage YouTube Draft",
	},
	{
		description: `Use only when the user explicitly requests a campaign change. Resume isn't available for fixed-flight YouTube campaigns. Duplicate the campaign to relaunch it. Actions: pause, resume, update_budget, update_end_date (DAILY or TOTAL budget; TOTAL end-date extensions may require the same funding consent fields as update_budget or resume), update_location (GLOBAL or catalog-valid countries), change_strategy (managed YouTube Demand Gen), update_goals (YouTube optimization toggles), archive (never deletes). Inspect the campaign first and supply expectedCurrentStatus where possible. For resume, update_budget, or a TOTAL update_end_date that needs automatic daily card funding, first show the user the exact consent copy for the campaign's budget type, then pass the request's clientRequestId and, for DAILY, authorizeAutomaticDailyFunding=true with acceptedConsentVersion and acceptedConsentCopyHash: "${prospectiveFundingConsentCopy}" (version "${prospectiveFundingConsentVersion}", hash "${prospectiveFundingConsentCopyHash}"); for TOTAL, acceptedTotalConsentVersion and acceptedTotalConsentCopyHash: "${totalFundingConsentCopy}" (version "${totalFundingConsentVersion}", hash "${totalFundingConsentCopyHash}"). A budget type refuses the other's consent. Without them, a resume that needs card funding is refused with: "Review and accept the daily funding authorization to resume this campaign." When retrying the same action, reuse the same clientRequestId.`,
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_campaign",
		openWorldHint: true,
		outputSchema: UpdateCampaignOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateCampaignInputSchema,
		title: "Update Campaign",
	},
] as const;
