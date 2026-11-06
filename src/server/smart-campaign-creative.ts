import { z } from "zod/v4";
import {createOutputEnvelopeSchema} from "./output-schemas";
import {SMART_DRAFT_LOCATION_CONTRACT} from "./draft-location.generated";
import {SMART_DRAFT_LOCATION_READ_CONTRACT} from "./draft-location-read.generated";
const {UploadedSelectionSchema,CreativeSelectionSchema,CreativeGenerationSchema,SourceAudioUploadStatusSchema,SourceAudioUploadSchema,SourceAudioImportSchema,SourceAudioUploadCompleteSchema,SmartCampaignCreativeInputSchema,GeneratedCreativeSchema,MediaUploadResultSchema}=SMART_DRAFT_LOCATION_CONTRACT.schemas;
export {CreativeSelectionSchema,CreativeGenerationSchema,SourceAudioUploadStatusSchema,SourceAudioUploadSchema,SourceAudioImportSchema,SourceAudioUploadCompleteSchema,SmartCampaignCreativeInputSchema};
export const SmartCampaignCreativeOutputSchema = z.strictObject({
	budgetDraft: z.record(z.string(), z.unknown()).optional(),
	campaignId: z.uuid(),
	catalog: z
		.strictObject({
			items: z
				.array(
					z.strictObject({
						createdAt: z.string(),
						eligibleForPromotion: z.boolean().nullable(),
						id: z.string(),
						mediaType: z.string(),
						text: z.string().max(2000),
					}),
				)
				.max(25),
			nextCursor: z.string().nullable(),
			source: z.enum(["facebook", "instagram"]),
		})
		.optional(),
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
	locationDraft: SMART_DRAFT_LOCATION_READ_CONTRACT.locationOutputSchema.optional(),
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

export const SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION={...SMART_DRAFT_LOCATION_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema)} as const;
