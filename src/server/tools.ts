import { BILLING_READ_MCP } from "./billing-read.generated";
import { FUNDING_CHECKOUT_CONTRACT } from "./funding-checkout.generated";
import { ARTIST_ANALYTICS_CONTRACT } from "./artist-analytics.generated";
import { ONBOARDING_PLATFORM_STATUS_CONTRACT } from "./reads.generated";
import { CAMPAIGN_READINESS_MCP } from "./readiness-input.generated";
import { SMART_AD_COPY_MCP } from "./smart-ad-copy.generated";
export { DynamoiSmartCampaignAdCopyInputSchema } from "./smart-ad-copy.generated";
import { PLATFORM_ACTION_CENTER_CONTRACT } from "./platform-action-center.generated";
import { META_CAMPAIGN_GROUPS_CONTRACT } from "./meta-groups.generated";
import { CAMPAIGN_MANAGEMENT_READ_CONTRACT } from "./management-read.generated";
import { AGENT_SEARCH_CONTRACT } from "./search.generated";
import { YOUTUBE_DRAFT_SETUP_CONTRACT } from "./youtube-draft.generated";
import { CAMPAIGN_COUNTRIES_CONTRACT } from "./country-catalog.generated";
import { SMART_CAMPAIGN_SUBMISSION_CONTRACT } from "./submission.generated";
const YouTubeStrategySchema =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.youtubeStrategySchema;
const totalFundingConsentFields =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.totalFundingConsentFields;
export const DynamoiLaunchCampaignInputSchema =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.mcp.definition.schema;
import {
	CAMPAIGN_LIST_CONTRACT,
	CAMPAIGN_DETAIL_CONTRACT,
} from "./list.generated";
import { CAMPAIGN_RESUME_FUNDING_CONTRACT } from "./resume-funding.generated";
import {
	earningsDefinition,
	DynamoiGetEarningsInputSchema as EarningsInputSchema,
} from "./distribution-wire";
import {
	META_CONNECTION_CONTRACT,
	YOUTUBE_CONNECTION_CONTRACT,
} from "./connections.generated";
import { TEAM_READ_CONTRACT, TEAM_ROLE_CONTRACT } from "./team.generated";
import {
	REFERRALS_READ_CONTRACT,
	REFERRALS_CLAIM_CONTRACT,
} from "./referrals.generated";
import { AUDIT_SETTINGS_CONTRACT } from "./audit-log.generated";
import * as z from "zod/v4";
import {
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH as prospectiveFundingConsentCopyHash,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION as prospectiveFundingConsentVersion,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH as totalFundingConsentCopyHash,
	TOTAL_BUDGET_FUNDING_CONSENT_VERSION as totalFundingConsentVersion,
} from "../consent";
import {
	ACCOUNT_OVERVIEW_CONTRACT,
	ARTIST_ROSTER_CONTRACT,
	ARTIST_CONTEXT_CONTRACT,
} from "./context.generated";
import { AUDIENCE_ANALYTICS_CONTRACT } from "./audience-analytics.generated";
import { CAMPAIGN_DRAFTS_CONTRACT } from "./drafts.generated";
import { GROWTH_AUDIT_CONTRACT } from "./growth-audit.generated";
import { OPENAI_TOOL_DEFINITIONS } from "./openai-tools";
import {
	createOutputEnvelopeSchema,
	AnyOutputEnvelopeSchema,
	TeamOutputEnvelopeSchema,
	GetCampaignOutputEnvelopeSchema,
	GetCampaignReadinessOutputEnvelopeSchema,
	GetResumeFundingOutputEnvelopeSchema,
	GetYouTubeChannelDataOutputEnvelopeSchema,
	ListAvailableCountriesOutputEnvelopeSchema,
	ManageYoutubeDraftOutputEnvelopeSchema,
	UpdateCampaignOutputEnvelopeSchema,
} from "./output-schemas";
import { PLAYLIST_ANALYTICS_CONTRACT } from "./playlist-analytics.generated";
import {
	ClientRequestIdSchema,
	IsoCalendarDateSchema,
	DateRangeSchema as SharedDateRangeSchema,
	ToolFormatSchema as SharedToolFormatSchema,
	UserIntentSummarySchema,
} from "./shared-schemas";
import { YOUTUBE_CHANNEL_DATA_CONTRACT } from "./youtube-channel-data.generated";

export {
	DynamoiGetCurrentUserInputSchema,
	DynamoiListArtistsInputSchema,
} from "./account-schema.generated";

export const DynamoiGetArtistInputSchema =
	ARTIST_CONTEXT_CONTRACT.detailInputSchema;
export const DateRangeSchema = SharedDateRangeSchema;
export const ToolFormatSchema = SharedToolFormatSchema;

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

export const DynamoiSearchInputSchema =
	AGENT_SEARCH_CONTRACT.mcp.definition.schema;

export const DynamoiListCampaignsInputSchema =
	CAMPAIGN_LIST_CONTRACT.mcp.definition.schema;
export const DynamoiGetCampaignInputSchema =
	CAMPAIGN_DETAIL_CONTRACT.mcp.definition.schema;

export const DynamoiGetCampaignAnalyticsInputSchema =
	CAMPAIGN_DETAIL_CONTRACT.analyticsInputSchema;

export const DynamoiGetArtistAnalyticsInputSchema =
	ARTIST_ANALYTICS_CONTRACT.mcp.definition.schema;

export const DynamoiGetGrowthAuditInputSchema =
	GROWTH_AUDIT_CONTRACT.mcp.definition.schema;

export const DynamoiGetPlaylistAnalyticsInputSchema =
	PLAYLIST_ANALYTICS_CONTRACT.mcp.definition.schema;

export const DynamoiListCampaignDraftsInputSchema =
	CAMPAIGN_DRAFTS_CONTRACT.mcp.definition.schema;

export const DynamoiGetAudienceAnalyticsInputSchema =
	AUDIENCE_ANALYTICS_CONTRACT.mcp.definition.schema;

export const DynamoiGetBillingInputSchema = BILLING_READ_MCP.definition.schema;

export const DynamoiManageTeamInputSchema =
	TEAM_ROLE_CONTRACT.mcp.definition.schema;
export const DynamoiGetTeamInputSchema =
	TEAM_READ_CONTRACT.mcp.definition.schema;
export const DynamoiGetAuditLogInputSchema =
	AUDIT_SETTINGS_CONTRACT.mcp.definition.schema;
export const DynamoiClaimReferralCodeInputSchema =
	REFERRALS_CLAIM_CONTRACT.mcp.definition.schema;
export const DynamoiGetReferralsInputSchema =
	REFERRALS_READ_CONTRACT.mcp.definition.schema;

export const DynamoiGetActionCenterInputSchema =
	PLATFORM_ACTION_CENTER_CONTRACT.mcp.definition.schema;

export const DynamoiGetEarningsInputSchema = EarningsInputSchema;

export const DynamoiGetPlatformStatusInputSchema =
	ONBOARDING_PLATFORM_STATUS_CONTRACT.mcp.definition.schema;

export const DynamoiStartYoutubeChannelLinkInputSchema =
	YOUTUBE_CONNECTION_CONTRACT.mcp.definition.schema;
export const DynamoiStartMetaConnectionInputSchema =
	META_CONNECTION_CONTRACT.mcp.definition.schema;

export const DynamoiListAvailableCountriesInputSchema =
	CAMPAIGN_COUNTRIES_CONTRACT.mcp.definition.schema;

export const DynamoiGetOnboardingStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

// Keep this standalone package's public limit in sync with web-shared's
// MAX_PROMOTED_VIDEOS_PER_CAMPAIGN (10).
export const DynamoiManageYoutubeDraftInputSchema =
	YOUTUBE_DRAFT_SETUP_CONTRACT.mcp.definition.schema;

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

export const DynamoiAddCampaignFundsInputSchema =
	FUNDING_CHECKOUT_CONTRACT.mcp.definition.schema;

export const DynamoiGetResumeFundingInputSchema =
	CAMPAIGN_RESUME_FUNDING_CONTRACT.mcp.definition.schema;

const FundingConsentVersionSchema = z.enum([
	prospectiveFundingConsentVersion,
	totalFundingConsentVersion,
]);
const FundingConsentCopyHashSchema = z.enum([
	prospectiveFundingConsentCopyHash,
	totalFundingConsentCopyHash,
]);

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
	.strict();

export const DynamoiUpdateBudgetInputSchema = z
	.object({
		acceptedConsentCopyHash: FundingConsentCopyHashSchema.optional(),
		acceptedConsentVersion: FundingConsentVersionSchema.optional(),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe("Accepted for older clients; ignored.")
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
	.strict();

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
			"unarchive",
			"update_goals",
		]),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe("Accepted for older clients; ignored.")
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
		expectedUpdatedAt: z.iso.datetime().optional(),
		expectedFundingHash: z
			.string()
			.regex(/^[a-f0-9]{64}$/u)
			.optional(),
		phase: z
			.enum(["preview", "confirm"])
			.describe(
				"Pause, resume and archive require preview first; confirm only after the human approves that exact preview.",
			)
			.optional(),
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
			data.phase &&
			!["pause", "resume", "archive", "unarchive"].includes(data.action)
		)
			ctx.addIssue({
				code: "custom",
				message:
					"Review phase is only supported for pause, resume, archive and unarchive",
				path: ["phase"],
			});
		if (
			[
				"pause",
				"resume",
				"change_strategy",
				"update_location",
				"update_end_date",
				"archive",
				"unarchive",
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
	});

export { DynamoiListMediaAssetsInputSchema } from "./media-moderation.generated";

export const DynamoiGetCampaignReadinessInputSchema =
	CAMPAIGN_READINESS_MCP.definition.schema;

export const PHASE_1_TOOL_DEFINITIONS = [
	{
		...META_CAMPAIGN_GROUPS_CONTRACT.mcp.definition,
		outputSchema: createOutputEnvelopeSchema(
			META_CAMPAIGN_GROUPS_CONTRACT.mobile.responseSchema,
		),
	},
	{
		...CAMPAIGN_MANAGEMENT_READ_CONTRACT.mcp.definition,
		outputSchema: createOutputEnvelopeSchema(
			CAMPAIGN_MANAGEMENT_READ_CONTRACT.mobile.responseSchema,
		),
	},
	{
		...ACCOUNT_OVERVIEW_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...ARTIST_ROSTER_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...AGENT_SEARCH_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	...OPENAI_TOOL_DEFINITIONS,
	{
		...CAMPAIGN_LIST_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...CAMPAIGN_DETAIL_CONTRACT.mcp.definition,
		outputSchema: GetCampaignOutputEnvelopeSchema,
	},
	{
		...ARTIST_ANALYTICS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...GROWTH_AUDIT_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...PLAYLIST_ANALYTICS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...CAMPAIGN_DRAFTS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...AUDIENCE_ANALYTICS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...YOUTUBE_CHANNEL_DATA_CONTRACT.mcp.definition,
		outputSchema: GetYouTubeChannelDataOutputEnvelopeSchema,
	},
	{ ...BILLING_READ_MCP.definition, outputSchema: AnyOutputEnvelopeSchema },
	{
		...PLATFORM_ACTION_CENTER_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{ ...earningsDefinition, outputSchema: AnyOutputEnvelopeSchema },
	{
		...TEAM_READ_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...TEAM_ROLE_CONTRACT.mcp.definition,
		outputSchema: TeamOutputEnvelopeSchema,
	},
	{
		...AUDIT_SETTINGS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema.or(
			AUDIT_SETTINGS_CONTRACT.mcp.accountResponseSchema,
		),
	},
	{
		...REFERRALS_CLAIM_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...REFERRALS_READ_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...CAMPAIGN_RESUME_FUNDING_CONTRACT.mcp.definition,
		outputSchema: GetResumeFundingOutputEnvelopeSchema,
	},
	{
		...ONBOARDING_PLATFORM_STATUS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...CAMPAIGN_COUNTRIES_CONTRACT.mcp.definition,
		outputSchema: ListAvailableCountriesOutputEnvelopeSchema,
	},
	{
		...CAMPAIGN_READINESS_MCP.definition,
		outputSchema: GetCampaignReadinessOutputEnvelopeSchema,
	},
] as const;

export const PHASE_ONBOARDING_TOOL_DEFINITIONS = [
	{
		...YOUTUBE_CONNECTION_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...META_CONNECTION_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;

export const PHASE_2_TOOL_DEFINITIONS = [
	{ ...SMART_AD_COPY_MCP.definition, outputSchema: AnyOutputEnvelopeSchema },
	{
		...FUNDING_CHECKOUT_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...YOUTUBE_DRAFT_SETUP_CONTRACT.mcp.definition,
		outputSchema: ManageYoutubeDraftOutputEnvelopeSchema,
	},
	{
		description: `Use only when the user explicitly requests a campaign change. Resume isn't available for fixed-flight YouTube campaigns. Duplicate the campaign to relaunch it. For pause, resume, archive and unarchive, first request phase=preview with one clientRequestId. Show that exact preview to the human; only after approval send phase=confirm with its expectedUpdatedAt, expectedCurrentStatus and (for resume) expectedFundingHash and the same request ID. Omitting phase never executes these status actions. Actions: pause, resume, update_budget, update_end_date (DAILY or TOTAL budget), update_location (GLOBAL or catalog-valid countries), change_strategy (managed YouTube Demand Gen), update_goals (YouTube optimization toggles), archive (never deletes), unarchive (restores PAUSED without funding or activating providers). Inspect the campaign first and supply expectedCurrentStatus where possible. When retrying the same action, reuse the same clientRequestId.`,
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
