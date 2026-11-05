import * as z from "zod/v4";
import { YOUTUBE_CHANNEL_DATA_CONTRACT } from "./youtube-channel-data.generated";
import { YouTubeStrategyKeySchema } from "./youtube-strategy-guide";

export const DynamoiGetYouTubeChannelDataInputSchema = YOUTUBE_CHANNEL_DATA_CONTRACT.mcp.definition.schema;
export const YouTubeChannelDatasetSchema = DynamoiGetYouTubeChannelDataInputSchema.shape.dataset;
export const YOUTUBE_CHANNEL_DATASETS = YouTubeChannelDatasetSchema.options;
export type YouTubeChannelDataset = z.infer<typeof YouTubeChannelDatasetSchema>;
export const YOUTUBE_CHANNEL_DATA_DEFAULT_LIMIT = YOUTUBE_CHANNEL_DATA_CONTRACT.defaultLimit;

export type DynamoiGetYouTubeChannelDataInput = z.infer<
	typeof DynamoiGetYouTubeChannelDataInputSchema
>;

const YouTubeChannelDataRowSchema = z.record(
	z.string(),
	z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

const YouTubeChannelDataCoverageSchema = z
	.object({
		datasetLatestDay: z.string().nullable(),
		latestCompleteDay: z.string(),
		missingDays: z.array(z.string()),
		note: z.string(),
		observedThroughDay: z.string().nullable(),
		placeholderDays: z.array(z.string()),
		requestedEndDate: z.string(),
		requestedStartDate: z.string(),
		revenueThroughDay: z.string().nullable(),
	})
	.strict();

const YouTubeChannelDataCampaignSchema = z
	.object({
		campaignId: z.string(),
		createdAt: z.string(),
		endDate: z.string().nullable(),
		promotedVideos: z.array(
			z
				.object({ playlistId: z.string().nullable(), videoId: z.string() })
				.strict(),
		),
		status: z.string().nullable(),
		strategy: z
			.object({ key: YouTubeStrategyKeySchema, label: z.string() })
			.strict(),
		title: z.string().nullable(),
	})
	.strict();

const nullableNumber = z.number().nullable();
const nullableInt = z.number().int().nullable();

const YouTubeAdsenseFormatSchema = z
	.object({
		revenueUsd: nullableNumber,
		rpmUsd: nullableNumber,
		views: nullableInt,
	})
	.strict();

/**
 * The AdSense figures the Dynamoi dashboard and mobile app show, from the same
 * readers. Estimated, never a payout. Fields outside `state` are null when the
 * recovery is not ready.
 */
const YouTubeAdsenseSchema = z
	.object({
		campaigns: z.array(
			z
				.object({
					billedUsd: z.number(),
					campaignId: z.string(),
					countsThroughDay: z.string().nullable(),
					daysToGo: nullableInt,
					earnedBack: nullableNumber,
					incrementalUsd: nullableNumber,
					status: z.enum(["counting", "final", "unmeasured"]),
					title: z.string().nullable(),
				})
				.strict(),
		),
		countries: z.array(
			z
				.object({
					adsensePerAdPlaybackUsd: nullableNumber,
					code: z.string(),
					name: z.string().nullable(),
					peerAdsensePerAdPlaybackUsd: nullableNumber,
					peerDelta: nullableNumber,
					revenueUsd: z.number(),
					targeted: z.boolean(),
				})
				.strict(),
		),
		formats: z
			.object({
				longForm: YouTubeAdsenseFormatSchema,
				shorts: YouTubeAdsenseFormatSchema,
				throughDay: z.string(),
			})
			.strict()
			.nullable(),
		recovery: z
			.object({
				aboveSwing: z.boolean().nullable(),
				billedUsd: nullableNumber,
				daysCounted: nullableInt,
				daysNeeded: nullableInt,
				earnedBack: nullableNumber,
				incrementalUsd: nullableNumber,
				sinceDay: z.string().nullable(),
				state: z.enum(["ready", "building", "unavailable"]),
				swingUsd: nullableNumber,
				throughDay: z.string().nullable(),
				unavailableReason: z
					.enum(["baseline", "billing", "no_campaign", "read_failed"])
					.nullable(),
			})
			.strict()
			.nullable(),
		/** The days the figures cover; not always the requested range. */
		windowDays: z.number().int(),
		windowFromDay: z.string(),
		windowThroughDay: z.string(),
	})
	.strict();

export const YouTubeChannelDataSchema = z
	.object({
		adsense: YouTubeAdsenseSchema.nullable(),
		adsenseNote: z.string(),
		artistId: z.string(),
		campaigns: z.array(YouTubeChannelDataCampaignSchema),
		channelId: z.string(),
		channelName: z.string().nullable(),
		coverage: YouTubeChannelDataCoverageSchema,
		dataLagNote: z.string(),
		dataset: YouTubeChannelDatasetSchema,
		nextCursor: z.string().optional(),
		notAvailable: z.array(z.string()),
		rowCount: z.number().int().min(0),
		rows: z.array(YouTubeChannelDataRowSchema).optional(),
		source: z
			.object({
				attribution: z.string(),
				name: z.string(),
			})
			.strict(),
		strategyGuideResource: z.string(),
		summary: z.string(),
	})
	.strict();

export type GetYouTubeChannelDataData = z.infer<
	typeof YouTubeChannelDataSchema
>;
