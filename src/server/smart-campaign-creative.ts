import { z } from "zod/v4";
import { createOutputEnvelopeSchema } from "./output-schemas";

export const CreativeSelectionSchema = z.strictObject({
	campaignId: z.uuid(),
	expectedUpdatedAt: z.iso.datetime(),
	selectedCreativeIds: z.array(z.uuid()).min(1).max(100),
});
export const CreativeGenerationSchema = CreativeSelectionSchema.omit({
	selectedCreativeIds: true,
});
export const SourceAudioUploadStatusSchema = CreativeGenerationSchema.extend({
	uploadId: z.string().min(1),
	uploadSessionId: z.uuid(),
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
		"save_setup",
		"read_budget",
		"save_budget",
		"read",
		"read_location",
		"save_location",
		"start_generation",
		"retry_generation",
		"clear_generation",
		"source_audio_upload_status",
		"abort_source_audio_upload",
		"select",
		"import_source_audio",
		"start_source_audio_upload",
		"complete_source_audio_upload",
	]),
	artistId: z.uuid(),
	budgetSave: CreativeGenerationSchema.extend({
		budgetAmountCents: z.number().int().positive(),
		budgetType: z.enum(["DAILY", "TOTAL"]),
		endDate: z.iso.date().nullable(),
	}).optional(),
	locationSave: CreativeGenerationSchema.extend({
		targeting: z.union([
			z.strictObject({ mode: z.literal("WORLDWIDE") }),
			z.strictObject({
				countryCodes: z.array(z.string().trim().length(2)).min(1).max(250),
				mode: z.literal("INCLUDE"),
			}),
		]),
	}).optional(),
	setupRequestId: z.uuidv4().optional(),
	setupSave: z
		.strictObject({
			appleMusicUrl: z.string().nullable().optional(),
			playLinkId: z.string().min(1),
			sourceSurface: z.literal("mcp").default("mcp"),
		})
		.optional(),
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
const CountrySchema = z.strictObject({
	code: z.string().length(2),
	name: z.string().min(1),
});
const LocationOutputSchema = z.strictObject({
	activeStep: z.enum(["location", "adCopy"]),
	availableCountries: z.array(CountrySchema).optional(),
	campaignId: z.uuid(),
	completedSteps: z
		.tuple([z.literal("content"), z.literal("creative"), z.literal("location")])
		.optional(),
	location: z.strictObject({
		countries: z.array(CountrySchema),
		mode: z.enum(["WORLDWIDE", "INCLUDE"]),
	}),
	recommendedCountries: z.array(CountrySchema).optional(),
	updatedAt: z.iso.datetime(),
});

export const SmartCampaignCreativeOutputSchema = z.strictObject({
	budgetDraft: z.record(z.string(), z.unknown()).optional(),
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
	generationJobId: z.uuid().optional(),
	locationDraft: LocationOutputSchema.optional(),
	selectedCreativeIds: z.array(z.uuid()).max(100),
	setupDraft: z.record(z.string(), z.unknown()).optional(),
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
	uploadStatus: z
		.strictObject({
			campaignId: z.uuid(),
			uploadedParts: z.array(
				z.strictObject({
					etag: z.string().min(1),
					partNumber: z.number().int().positive(),
					sizeBytes: z.number().int().nonnegative(),
				}),
			),
		})
		.optional(),
});

export const SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION = {
	description:
		"Use save_setup with setupSave={playLinkId, appleMusicUrl?} and a stable UUID-v4 setupRequestId per setup flow; reuse it on retries, and start a new flow for different content. It returns setupDraft. Use read_budget for budgetDraft and save_budget with budgetSave={campaignId, expectedUpdatedAt, budgetAmountCents, budgetType:DAILY|TOTAL, endDate:YYYY-MM-DD|null}. Draft budget is USD-only. Setup and budget saves only edit drafts and never launch or charge. Use read_location to read native draft targeting and save_location with locationSave={campaignId, expectedUpdatedAt, targeting:{mode:WORLDWIDE}|{mode:INCLUDE,countryCodes:[US]}} to save it. Read locationDraft first for the current revision; both location actions return locationDraft. Read generation progress, generated creatives and current selection with action=read. Use start_generation, retry_generation or clear_generation with campaignId and expectedUpdatedAt from read. Generation runs asynchronously; poll with read. Use source_audio_upload_status or abort_source_audio_upload with campaignId, expectedUpdatedAt, uploadId and uploadSessionId to inspect uploaded parts or abort the direct upload. Agents never approve or submit. Use action=select to save generated creative IDs on the draft with campaignId and expectedUpdatedAt from read. Selection never attests artist approval and never submits the campaign. Attach source MP3 audio to a draft with start_source_audio_upload, PUT each returned presigned part URL, then complete_source_audio_upload with the returned uploadId/uploadSessionId and part ETags. Both actions require campaignId, expectedUpdatedAt, fileSizeBytes, trackDurationSeconds and 0–2 hookSeconds. Read sourceAudio to confirm. Use import_source_audio with a public Dropbox share url, campaignId, expectedUpdatedAt, trackDurationSeconds and 0–2 hookSeconds (250 MiB maximum). Google Drive is unsupported because it requires a Google API key. On timeout or an ambiguous result, re-read sourceAudio before retrying.",
	destructiveHint: false,
	name: "dynamoi_manage_smart_campaign_creative",
	openWorldHint: false,
	outputSchema: createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema),
	readOnlyHint: false,
	schema: SmartCampaignCreativeInputSchema,
	title: "Manage Smart Campaign Draft Creative",
} as const;
