import {SMART_CAMPAIGN_SUBMISSION_CONTRACT} from "./submission.generated";
import {
	LaunchCampaignOutputEnvelopeSchema,
	ListMediaAssetsOutputEnvelopeSchema,
} from "./output-schemas";
import {
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
	{...SMART_CAMPAIGN_SUBMISSION_CONTRACT.mcp.definition,outputSchema:LaunchCampaignOutputEnvelopeSchema},
] as const;
