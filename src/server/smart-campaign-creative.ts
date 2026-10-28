import { z } from "zod/v4";
import { createOutputEnvelopeSchema } from "./output-schemas";

export const CreativeSelectionSchema = z.strictObject({
	campaignId: z.uuid(),
	expectedUpdatedAt: z.iso.datetime(),
	selectedCreativeIds: z.array(z.uuid()).min(1).max(100),
});
export const SmartCampaignCreativeInputSchema = z.strictObject({
	action: z.enum(["read", "select"]),
	artistId: z.uuid(),
	...CreativeSelectionSchema.partial().shape,
});

const GeneratedCreativeSchema = z.strictObject({
	clipDurationSeconds: z.number().nonnegative(),
	clipStartSeconds: z.number().nonnegative(),
	errorMessage: z.string().max(2000).nullable(),
	id: z.uuid(),
	progressPercent: z.number().min(0).max(100).nullable(),
	status: z.enum(["COMPLETED", "FAILED", "PENDING", "PROCESSING"]),
	templateVariant: z.string().max(100),
	thumbnailUrl: z.string().max(8192),
	videoUrl: z.string().max(8192),
});
export const SmartCampaignCreativeOutputSchema = z.strictObject({
	campaignId: z.uuid(),
	generation: z
		.strictObject({
			items: z.array(GeneratedCreativeSchema).max(100),
			jobId: z.uuid(),
			phase: z.enum([
				"ANALYZING_AUDIO",
				"CHECKING_RENDERER",
				"FAILED",
				"FINALIZING",
				"PREPARING_TEMPLATES",
				"RENDERING",
			]),
		})
		.nullable(),
	selectedCreativeIds: z.array(z.uuid()).max(100),
	updatedAt: z.iso.datetime().nullable(),
});

export const SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION = {
	description:
		"Read generation progress, generated creatives and current selection with action=read. Use action=select to save generated creative IDs on the draft with campaignId and expectedUpdatedAt from read. Selection never attests artist approval and never submits the campaign. Upload your source audio yourself in the app or web; agents can read generation progress and pick generated creatives.",
	destructiveHint: false,
	name: "dynamoi_manage_smart_campaign_creative",
	openWorldHint: false,
	outputSchema: createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema),
	readOnlyHint: false,
	schema: SmartCampaignCreativeInputSchema,
	title: "Read or Select Smart Campaign Creative",
} as const;
