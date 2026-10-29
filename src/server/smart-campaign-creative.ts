import { z } from "zod/v4";
import { createOutputEnvelopeSchema } from "./output-schemas";

export const CreativeSelectionSchema = z.strictObject({
	campaignId: z.uuid(),
	expectedUpdatedAt: z.iso.datetime(),
	selectedCreativeIds: z.array(z.uuid()).min(1).max(100),
});
export const SourceAudioUploadSchema = z.strictObject({
	campaignId: z.uuid(),
	expectedUpdatedAt: z.iso.datetime(),
	fileSizeBytes: z.number().int().positive().max(262_144_000),
	hookSeconds: z.array(z.number().int().nonnegative()).max(2),
	trackDurationSeconds: z.number().positive(),
});
export const SourceAudioImportSchema = SourceAudioUploadSchema.omit({
	fileSizeBytes: true,
}).extend({ url: z.string().max(8192) });
export const SourceAudioUploadCompleteSchema = SourceAudioUploadSchema.extend({
	parts: z
		.array(
			z.strictObject({
				etag: z.string().min(1).max(200),
				partNumber: z.number().int().min(1).max(10_000),
			}),
		)
		.min(1)
		.max(10_000),
	uploadId: z.string().min(1).max(2048),
	uploadSessionId: z.uuid(),
});
export const SmartCampaignCreativeInputSchema = z.strictObject({
	action: z.enum([
		"read",
		"select",
		"import_source_audio",
		"start_source_audio_upload",
		"complete_source_audio_upload",
	]),
	artistId: z.uuid(),
	url: z.string().max(8192).optional(),
	...CreativeSelectionSchema.partial().shape,
	...SourceAudioUploadCompleteSchema.partial().shape,
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
	sourceAudio: z
		.strictObject({
			fileName: z.string().nullable(),
			fileSizeBytes: z.number().nullable(),
			hookSeconds: z.array(z.number()),
			isUploaded: z.boolean(),
			trackDurationSeconds: z.number().nullable(),
		})
		.optional(),
	updatedAt: z.iso.datetime().nullable(),
	upload: z
		.strictObject({
			campaignId: z.uuid(),
			expiresAt: z.iso.datetime(),
			partSizeBytes: z.number(),
			presignedPartUrls: z.array(z.string()),
			uploadId: z.string(),
			uploadSessionId: z.uuid(),
		})
		.optional(),
});

export const SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION = {
	description:
		"Read generation progress, generated creatives and current selection with action=read. Use action=select to save generated creative IDs on the draft with campaignId and expectedUpdatedAt from read. Selection never attests artist approval and never submits the campaign. Attach source MP3 audio to a draft with start_source_audio_upload, PUT each returned presigned part URL, then complete_source_audio_upload with the returned uploadId/uploadSessionId and part ETags. Both actions require campaignId, expectedUpdatedAt, fileSizeBytes, trackDurationSeconds and 0–2 hookSeconds. Read sourceAudio to confirm. Use import_source_audio with a public Dropbox share url, campaignId, expectedUpdatedAt, trackDurationSeconds and 0–2 hookSeconds (250 MiB maximum). Google Drive is unsupported because it requires a Google API key. On timeout or an ambiguous result, re-read sourceAudio before retrying.",
	destructiveHint: false,
	name: "dynamoi_manage_smart_campaign_creative",
	openWorldHint: false,
	outputSchema: createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema),
	readOnlyHint: false,
	schema: SmartCampaignCreativeInputSchema,
	title: "Read or Select Smart Campaign Creative",
} as const;
