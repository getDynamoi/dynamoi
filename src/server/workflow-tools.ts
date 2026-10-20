import {
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH,
	TOTAL_BUDGET_FUNDING_CONSENT_VERSION,
} from "../consent";
import {
	LaunchCampaignOutputEnvelopeSchema,
	ListMediaAssetsOutputEnvelopeSchema,
} from "./output-schemas";
import {
	DynamoiLaunchCampaignInputSchema,
	DynamoiListMediaAssetsInputSchema,
} from "./tools";

export const PHASE_3_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to choose from uploaded images or videos that can be reused in a campaign launch. Do not use this when the user only wants campaign status or analytics. Use format=json when you need asset IDs for a follow-up launch. Request includeUrls only when the assistant must display or inspect public-safe asset URLs.",
		destructiveHint: false,
		name: "dynamoi_list_media_assets",
		openWorldHint: false,
		outputSchema: ListMediaAssetsOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListMediaAssetsInputSchema,
		title: "List Media Assets",
	},
	{
		description: `Use this when the user explicitly wants to create a new Smart Campaign or YouTube Campaign and start the launch workflow with provided details. Ads are not necessarily live until the returned delivery state is ACTIVE. DAILY budgets require authorizeAutomaticDailyFunding=true plus the exact acceptedConsentVersion ("${PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION}") and acceptedConsentCopyHash ("${PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH}"); first show the user this exact consent copy: "${PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY}". A TOTAL budget uses its own consent: show "${TOTAL_BUDGET_FUNDING_CONSENT_COPY}" and send acceptedTotalConsentVersion ("${TOTAL_BUDGET_FUNDING_CONSENT_VERSION}") and acceptedTotalConsentCopyHash ("${TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH}"), without authorizeAutomaticDailyFunding. Every budget is funded from credit first, then prepaid funds, then the saved card; a budget type refuses the other's consent, and without consent the launch is refused and never charged. YOUTUBE campaigns require youtubeStrategy and either legacy youtubeVideoId/youtubePlaylistId or ordered youtubeEntries (up to 10 videoId/playlistId pairs); playlistId is optional for CHEAPEST_VIEWS, which supports one video. After a successful launch, answer from the returned campaign details directly instead of chaining more tools unless the user explicitly asked for more.`,
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_launch_campaign",
		openWorldHint: true,
		outputSchema: LaunchCampaignOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiLaunchCampaignInputSchema,
		title: "Start Campaign Launch Workflow",
	},
] as const;
