import type * as z from "zod/v4";
import {
	YouTubeChannelDataSchema as CanonicalYouTubeChannelDataSchema,
	YOUTUBE_CHANNEL_DATA_CONTRACT,
} from "./youtube-channel-data.generated";

export const DynamoiGetYouTubeChannelDataInputSchema =
	YOUTUBE_CHANNEL_DATA_CONTRACT.mcp.definition.schema;
export const YouTubeChannelDatasetSchema =
	DynamoiGetYouTubeChannelDataInputSchema.shape.dataset;
export const YOUTUBE_CHANNEL_DATASETS = YouTubeChannelDatasetSchema.options;
export type YouTubeChannelDataset = z.infer<typeof YouTubeChannelDatasetSchema>;
export const YOUTUBE_CHANNEL_DATA_DEFAULT_LIMIT =
	YOUTUBE_CHANNEL_DATA_CONTRACT.defaultLimit;

export type DynamoiGetYouTubeChannelDataInput = z.infer<
	typeof DynamoiGetYouTubeChannelDataInputSchema
>;

export const YouTubeChannelDataSchema = CanonicalYouTubeChannelDataSchema;

export type GetYouTubeChannelDataData = z.infer<
	typeof YouTubeChannelDataSchema
>;
