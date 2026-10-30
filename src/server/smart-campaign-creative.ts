import { z } from "zod/v4";
import { createOutputEnvelopeSchema } from "./output-schemas";

const UploadedSelectionSchema = z.strictObject({
	fileName: z.string().default(""),
	fileSize: z.number().int().nonnegative().default(0),
	fileType: z.string().default(""),
	id: z.string().default(""),
	mediaAssetId: z.uuid(),
});
export const CreativeSelectionSchema = z.strictObject({
	campaignId: z.uuid(),
	expectedUpdatedAt: z.iso.datetime(),
	selectedCreativeIds: z.array(z.uuid()).min(1).max(100).optional(),
	selectedSocialPosts: z.array(z.string().min(1).max(200)).max(10).optional(),
	source: z.enum(["generate", "posts", "upload"]).optional(),
	uploadedAssets: z.array(UploadedSelectionSchema).max(30).optional(),
});
export const CreativeGenerationSchema = CreativeSelectionSchema.pick({
	campaignId: true,
	expectedUpdatedAt: true,
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
		"start_media_upload",
		"media_upload_status",
		"complete_media_upload",
		"abort_media_upload",
	]),
	artistId: z.uuid(),
	budgetSave: CreativeGenerationSchema.extend({
		budgetAmountCents: z.number().int().positive(),
		budgetAmountMinor: z.number().int().positive().optional(),
		budgetType: z.enum(["DAILY", "TOTAL"]),
		currency: z.string().length(3).optional(),
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
	mediaUpload: z
		.strictObject({
			assetId: z.uuid().optional(),
			contentType: z.enum(["image/jpeg", "image/png", "video/mp4"]).optional(),
			fileName: z.string().min(1).max(512).optional(),
			fileSizeBytes: z.number().int().positive().max(1_073_741_824).optional(),
			fileType: z.enum(["image/jpeg", "image/png", "video/mp4"]).optional(),
			key: z.string().min(1).max(2048).optional(),
			parts: SourceAudioUploadCompleteSchema.shape.parts.optional(),
			uploadId: z.string().min(1).max(2048).optional(),
		})
		.optional(),
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

const MediaUploadResultSchema = z.union([
	z.strictObject({
		expiresAt: z.iso.datetime(),
		key: z.string(),
		partSizeBytes: z.number().int().positive(),
		presignedPartUrls: z.array(z.url()),
		uploadId: z.string(),
	}),
	z.strictObject({
		completed: z.boolean(),
		uploadedParts: z.array(
			z.strictObject({
				etag: z.string(),
				partNumber: z.number().int().positive(),
				sizeBytes: z.number().int().nonnegative(),
			}),
		),
	}),
	z.strictObject({
		etag: z.string(),
		key: z.string(),
		mediaAssetId: z.uuid(),
		moderationStatus: z.string(),
	}),
	z.strictObject({ ok: z.literal(true) }),
]);

export const SmartCampaignCreativeOutputSchema = z.strictObject({
	budgetDraft: z.record(z.string(), z.unknown()).optional(),
	campaignId: z.uuid(),
	draftState: z.enum(["available", "missing"]).optional(),
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
	mediaUpload: MediaUploadResultSchema.optional(),
	selectedCreativeIds: z.array(z.uuid()).max(100),
	selectedSocialPosts: z.array(z.string()).optional(),
	setupDraft: z.record(z.string(), z.unknown()).optional(),
	source: z.enum(["generate", "posts", "upload"]).nullable().optional(),
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
	uploadedAssets: z
		.array(
			UploadedSelectionSchema.extend({
				uploadStatus: z.enum(["success", "error"]),
			}),
		)
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
		"Use save_setup with setupSave={playLinkId, appleMusicUrl?} and a stable UUID-v4 setupRequestId per setup flow; reuse it on retries, and start a new flow for different content. It returns setupDraft. Use read_budget for budgetDraft and save_budget with budgetSave={campaignId, expectedUpdatedAt, budgetAmountCents, budgetAmountMinor?, currency?, budgetType:DAILY|TOTAL, endDate:YYYY-MM-DD|null}. Amounts are exact minor units in the artist currency; use the budget policy from read_budget. Setup and budget saves only edit drafts and never launch or charge. Use read_location to read native draft targeting and save_location with locationSave={campaignId, expectedUpdatedAt, targeting:{mode:WORLDWIDE}|{mode:INCLUDE,countryCodes:[US]}} to save it. Read locationDraft first for the current revision; both location actions return locationDraft. Read generation progress, generated creatives and current selection with action=read. Use start_generation, retry_generation or clear_generation with campaignId and expectedUpdatedAt from read. Generation runs asynchronously; poll with read. Use source_audio_upload_status or abort_source_audio_upload with campaignId, expectedUpdatedAt, uploadId and uploadSessionId to inspect uploaded parts or abort the direct upload. Agents never approve or submit. Use action=select with campaignId and expectedUpdatedAt from read, source=generate|posts|upload, and selectedCreativeIds, selectedSocialPosts (owned META:post IDs), or uploadedAssets=[{mediaAssetId}] from dynamoi_list_media_assets. Omit selectedCreativeIds for social or uploaded media. Uploaded metadata is resolved by the server; only owned, moderation-approved uploads can be selected. Selection never attests artist approval and never submits the campaign. Upload private JPEG/PNG/MP4 campaign media (1 GiB maximum) with start_media_upload, campaignId, expectedUpdatedAt and mediaUpload={assetId:UUID,fileName,fileSizeBytes,contentType}. Retain the returned key/uploadId and PUT each presigned part URL. Complete with complete_media_upload, a freshly inspected expectedUpdatedAt, and mediaUpload={assetId,fileName,fileSizeBytes,fileType,key,uploadId,parts:[{partNumber,etag}]}. Use media_upload_status or abort_media_upload with campaignId and mediaUpload={key,uploadId}; both remain usable after draft edits. A completed status means retry completion, not re-upload. Completion returns only a moderation receipt; poll dynamoi_list_media_assets and select only after APPROVED. Uploads do not edit the draft selection. Attach source MP3 audio to a draft with start_source_audio_upload, PUT each returned presigned part URL, then complete_source_audio_upload with the returned uploadId/uploadSessionId and part ETags. Both actions require campaignId, expectedUpdatedAt, fileSizeBytes, trackDurationSeconds and 0–2 hookSeconds. Read sourceAudio to confirm. Use import_source_audio with a public Dropbox share url, campaignId, expectedUpdatedAt, trackDurationSeconds and 0–2 hookSeconds (250 MiB maximum). Google Drive is unsupported because it requires a Google API key. On timeout or an ambiguous result, re-read sourceAudio before retrying.",
	destructiveHint: false,
	name: "dynamoi_manage_smart_campaign_creative",
	openWorldHint: false,
	outputSchema: createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema),
	readOnlyHint: false,
	schema: SmartCampaignCreativeInputSchema,
	title: "Manage Smart Campaign Draft Creative",
} as const;
