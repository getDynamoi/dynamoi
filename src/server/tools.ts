import { SMART_AD_COPY_MCP } from "./smart-ad-copy.generated";
export { DynamoiSmartCampaignAdCopyInputSchema } from "./smart-ad-copy.generated";
import {PLATFORM_ACTION_CENTER_CONTRACT} from "./platform-action-center.generated";
import {META_CAMPAIGN_GROUPS_CONTRACT} from "./meta-groups.generated";
import {CAMPAIGN_MANAGEMENT_READ_CONTRACT} from "./management-read.generated";
import {AGENT_SEARCH_CONTRACT} from "./search.generated";
import {YOUTUBE_DRAFT_SETUP_CONTRACT} from "./youtube-draft.generated";
import {CAMPAIGN_COUNTRIES_CONTRACT} from "./country-catalog.generated";
import {SMART_CAMPAIGN_SUBMISSION_CONTRACT} from "./submission.generated";
const YouTubeStrategySchema=SMART_CAMPAIGN_SUBMISSION_CONTRACT.youtubeStrategySchema;
const LocationTargetSchema=SMART_CAMPAIGN_SUBMISSION_CONTRACT.locationTargetSchema;
const YouTubeEntriesSchema=SMART_CAMPAIGN_SUBMISSION_CONTRACT.youTubeEntriesSchema;
const validateYouTubeEntries=SMART_CAMPAIGN_SUBMISSION_CONTRACT.validateYouTubeEntries;
const totalFundingConsentFields=SMART_CAMPAIGN_SUBMISSION_CONTRACT.totalFundingConsentFields;
const addFundingConsentFamilyIssue=SMART_CAMPAIGN_SUBMISSION_CONTRACT.addFundingConsentFamilyIssue;
export const DynamoiLaunchCampaignInputSchema=SMART_CAMPAIGN_SUBMISSION_CONTRACT.mcp.definition.schema;
import {CAMPAIGN_LIST_CONTRACT, CAMPAIGN_DETAIL_CONTRACT} from "./list.generated";
import { CAMPAIGN_RESUME_FUNDING_CONTRACT } from "./resume-funding.generated";
import {earningsDefinition,DynamoiGetEarningsInputSchema as EarningsInputSchema} from "./distribution-wire";
import {META_CONNECTION_CONTRACT,YOUTUBE_CONNECTION_CONTRACT} from "./connections.generated";
import {TEAM_READ_CONTRACT,TEAM_ROLE_CONTRACT} from "./team.generated";
import {REFERRALS_READ_CONTRACT,REFERRALS_CLAIM_CONTRACT} from "./referrals.generated";
import { AUDIT_SETTINGS_CONTRACT, AUDIT_ACCOUNT_CONTRACT } from "./audit-log.generated";
import * as z from "zod/v4";
import {
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY as prospectiveFundingConsentCopy,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH as prospectiveFundingConsentCopyHash,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION as prospectiveFundingConsentVersion,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY as totalFundingConsentCopy,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH as totalFundingConsentCopyHash,
	TOTAL_BUDGET_FUNDING_CONSENT_VERSION as totalFundingConsentVersion,
} from "../consent";
import {ACCOUNT_OVERVIEW_CONTRACT,ARTIST_ROSTER_CONTRACT,ARTIST_CONTEXT_CONTRACT} from "./context.generated";
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

export const DynamoiGetArtistInputSchema=ARTIST_CONTEXT_CONTRACT.detailInputSchema;
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

export const DynamoiSearchInputSchema = AGENT_SEARCH_CONTRACT.mcp.definition.schema;

export const DynamoiListCampaignsInputSchema = CAMPAIGN_LIST_CONTRACT.mcp.definition.schema;
export const DynamoiGetCampaignInputSchema = CAMPAIGN_DETAIL_CONTRACT.mcp.definition.schema;

export const DynamoiGetCampaignAnalyticsInputSchema = CAMPAIGN_DETAIL_CONTRACT.analyticsInputSchema;

export const DynamoiGetArtistAnalyticsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	})
	.strict();

export const DynamoiGetGrowthAuditInputSchema =
	GROWTH_AUDIT_CONTRACT.mcp.definition.schema;

export const DynamoiGetPlaylistAnalyticsInputSchema =
	PLAYLIST_ANALYTICS_CONTRACT.mcp.definition.schema;

export const DynamoiListCampaignDraftsInputSchema =
	CAMPAIGN_DRAFTS_CONTRACT.mcp.definition.schema;

export const DynamoiGetAudienceAnalyticsInputSchema =
	AUDIENCE_ANALYTICS_CONTRACT.mcp.definition.schema;

export const DynamoiGetBillingInputSchema = z
	.object({
		action: z.enum(["summary", "native_commerce"]).optional(),
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		onboardingAttemptId: OnboardingAttemptIdSchema,
	})
	.strict();

export const DynamoiManageTeamInputSchema=TEAM_ROLE_CONTRACT.mcp.definition.schema;
export const DynamoiGetTeamInputSchema=TEAM_READ_CONTRACT.mcp.definition.schema;
export const DynamoiGetAuditLogInputSchema = AUDIT_SETTINGS_CONTRACT.mcp.definition.schema;
export const DynamoiClaimReferralCodeInputSchema = REFERRALS_CLAIM_CONTRACT.mcp.definition.schema;
export const DynamoiGetReferralsInputSchema = REFERRALS_READ_CONTRACT.mcp.definition.schema;

export const DynamoiGetActionCenterInputSchema = PLATFORM_ACTION_CENTER_CONTRACT.mcp.definition.schema;

export const DynamoiGetEarningsInputSchema = EarningsInputSchema;

export const DynamoiGetPlatformStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		onboardingAttemptId: OnboardingAttemptIdSchema,
		onboardingFlow: z.enum(["meta", "youtube"]).optional(),
	})
	.strict();

export const DynamoiStartYoutubeChannelLinkInputSchema=YOUTUBE_CONNECTION_CONTRACT.mcp.definition.schema;
export const DynamoiStartMetaConnectionInputSchema=META_CONNECTION_CONTRACT.mcp.definition.schema;

export const DynamoiListAvailableCountriesInputSchema = CAMPAIGN_COUNTRIES_CONTRACT.mcp.definition.schema;

export const DynamoiGetOnboardingStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

// Keep this standalone package's public limit in sync with web-shared's
// MAX_PROMOTED_VIDEOS_PER_CAMPAIGN (10).
export const DynamoiManageYoutubeDraftInputSchema=YOUTUBE_DRAFT_SETUP_CONTRACT.mcp.definition.schema;

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

export const DynamoiGetResumeFundingInputSchema = CAMPAIGN_RESUME_FUNDING_CONTRACT.mcp.definition.schema;

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
			"unarchive",
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
		expectedUpdatedAt: z.iso.datetime().optional(),
		expectedFundingHash: z.string().regex(/^[a-f0-9]{64}$/u).optional(),
		phase: z.enum(["preview", "confirm"]).describe("Pause, resume and archive require preview first; confirm only after the human approves that exact preview.").optional(),
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
		if(data.phase && !["pause","resume","archive","unarchive"].includes(data.action)) ctx.addIssue({code:"custom",message:"Review phase is only supported for pause, resume, archive and unarchive",path:["phase"]});
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

export const PHASE_1_TOOL_DEFINITIONS = [
 {...META_CAMPAIGN_GROUPS_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(META_CAMPAIGN_GROUPS_CONTRACT.mobile.responseSchema)},
 {...CAMPAIGN_MANAGEMENT_READ_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(CAMPAIGN_MANAGEMENT_READ_CONTRACT.mobile.responseSchema)},
 { ...ACCOUNT_OVERVIEW_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
 { ...ARTIST_ROSTER_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	{...AGENT_SEARCH_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	...OPENAI_TOOL_DEFINITIONS,
	{...CAMPAIGN_LIST_CONTRACT.mcp.definition, outputSchema: AnyOutputEnvelopeSchema},
	{...CAMPAIGN_DETAIL_CONTRACT.mcp.definition, outputSchema: GetCampaignOutputEnvelopeSchema},
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
	{ ...YOUTUBE_CHANNEL_DATA_CONTRACT.mcp.definition, outputSchema: GetYouTubeChannelDataOutputEnvelopeSchema },	{
		description:
			"Use action=native_commerce for the native commerce projection (full profile, read-only; no subscription changes or invoices). Use this when the user asks about billing state, credit balance, promo limits, subscription status, campaign-fund deposits, or whether billing blocks launches for one artist. This is a read-only status check; it does not create checkout links or collect payment. paymentMethod contains only the shared masked display details (brand or bank, type, last four digits and expiry); null means details are unavailable, not proof that no method exists. Each deposit in prefundPayments is pending (payment not yet confirmed), cleared (Stripe says paid and the funds are usable), failed (the payment did not complete) or held (paid, but funding is on hold for review and not usable yet). A Checkout link alone is never a deposit. To add campaign funds, use the Dynamoi dashboard at https://dynamoi.com/dashboard; for other billing setup tell the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.' Then call this tool again to confirm the status. Do not use this for campaign analytics or platform connection troubleshooting.",
		destructiveHint: false,
		name: "dynamoi_get_billing",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetBillingInputSchema,
		title: "Get Billing",
	},
	{...PLATFORM_ACTION_CENTER_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	{...earningsDefinition, outputSchema: AnyOutputEnvelopeSchema},
	{...TEAM_READ_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	{...TEAM_ROLE_CONTRACT.mcp.definition,outputSchema:TeamOutputEnvelopeSchema},
	{ ...AUDIT_SETTINGS_CONTRACT.mcp.definition, outputSchema: AnyOutputEnvelopeSchema.or(AUDIT_ACCOUNT_CONTRACT.mcp.accountResponseSchema) },
	{...REFERRALS_CLAIM_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	{...REFERRALS_READ_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
	{
		...CAMPAIGN_RESUME_FUNDING_CONTRACT.mcp.definition,
		outputSchema: GetResumeFundingOutputEnvelopeSchema,
	},	{
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
	{...CAMPAIGN_COUNTRIES_CONTRACT.mcp.definition,outputSchema:ListAvailableCountriesOutputEnvelopeSchema},
	{
		description:
			'Use this when a musician wants to promote a new single or release with ads ("promote my new single", "run ads for my song"): it checks whether a Smart Campaign or YouTube campaign is ready before launching the campaign. This validates readiness and targeting without creating a campaign. Complete budget inputs also return the shared, nonbinding campaign funding preview with known or unavailable credit coverage, card upper bounds and expiry timing. A preview is not consent. TOTAL launch requires the client to accept the current TOTAL funding consent and pass acceptedTotalConsentVersion plus acceptedTotalConsentCopyHash; never pass DAILY consent fields for TOTAL. Funding uses credit first, then prepaid funds, then the saved card, subject to the launch guards. Do not use this to create or mutate campaigns.',
		destructiveHint: false,
		name: "dynamoi_get_campaign_readiness",
		openWorldHint: true,
		outputSchema: GetCampaignReadinessOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignReadinessInputSchema,
		title: "Get Campaign Readiness",
	},
] as const;

export const PHASE_ONBOARDING_TOOL_DEFINITIONS = [
 {...YOUTUBE_CONNECTION_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
 {...META_CONNECTION_CONTRACT.mcp.definition,outputSchema:AnyOutputEnvelopeSchema},
] as const;

export const PHASE_2_TOOL_DEFINITIONS = [
	{...SMART_AD_COPY_MCP.definition,outputSchema:AnyOutputEnvelopeSchema},
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
	{...YOUTUBE_DRAFT_SETUP_CONTRACT.mcp.definition,outputSchema:ManageYoutubeDraftOutputEnvelopeSchema},
	{
		description: `Use only when the user explicitly requests a campaign change. Resume isn't available for fixed-flight YouTube campaigns. Duplicate the campaign to relaunch it. For pause, resume, archive and unarchive, first request phase=preview with one clientRequestId. Show that exact preview to the human; only after approval send phase=confirm with its expectedUpdatedAt, expectedCurrentStatus and (for resume) expectedFundingHash and the same request ID. Omitting phase never executes these status actions. Actions: pause, resume, update_budget, update_end_date (DAILY or TOTAL budget; TOTAL end-date extensions may require the same funding consent fields as update_budget or resume), update_location (GLOBAL or catalog-valid countries), change_strategy (managed YouTube Demand Gen), update_goals (YouTube optimization toggles), archive (never deletes), unarchive (restores PAUSED without funding or activating providers). Inspect the campaign first and supply expectedCurrentStatus where possible. For resume, update_budget, or a TOTAL update_end_date that needs automatic daily card funding, first show the user the exact consent copy for the campaign's budget type, then pass the request's clientRequestId and, for DAILY, authorizeAutomaticDailyFunding=true with acceptedConsentVersion and acceptedConsentCopyHash: "${prospectiveFundingConsentCopy}" (version "${prospectiveFundingConsentVersion}", hash "${prospectiveFundingConsentCopyHash}"); for TOTAL, acceptedTotalConsentVersion and acceptedTotalConsentCopyHash: "${totalFundingConsentCopy}" (version "${totalFundingConsentVersion}", hash "${totalFundingConsentCopyHash}"). A budget type refuses the other's consent. Without them, a resume that needs card funding is refused with: "Review and accept the daily funding authorization to resume this campaign." When retrying the same action, reuse the same clientRequestId.`,
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
