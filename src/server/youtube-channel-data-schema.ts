import {
	YouTubeChannelDataSchema as CanonicalYouTubeChannelDataSchema,
	YOUTUBE_CHANNEL_DATA_CONTRACT,
} from "./youtube-channel-data.generated";
export const DynamoiGetYouTubeChannelDataInputSchema =
	YOUTUBE_CHANNEL_DATA_CONTRACT.mcp.definition.schema;
export const YouTubeChannelDatasetSchema =
	DynamoiGetYouTubeChannelDataInputSchema.fields.dataset;
export const YOUTUBE_CHANNEL_DATASETS = YouTubeChannelDatasetSchema.literals;
export type YouTubeChannelDataset =
	(typeof YouTubeChannelDatasetSchema)["Type"];
export const YOUTUBE_CHANNEL_DATA_DEFAULT_LIMIT =
	YOUTUBE_CHANNEL_DATA_CONTRACT.defaultLimit;
export type DynamoiGetYouTubeChannelDataInput =
	(typeof DynamoiGetYouTubeChannelDataInputSchema)["Type"];
export const YouTubeChannelDataSchema = CanonicalYouTubeChannelDataSchema;
export type GetYouTubeChannelDataData =
	(typeof YouTubeChannelDataSchema)["Type"];
