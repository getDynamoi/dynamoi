import * as z from "zod/v4";
import { IsoCalendarDateSchema, ToolFormatSchema } from "./shared-schemas";
import { YouTubeStrategyKeySchema } from "./youtube-strategy-guide";

export const YOUTUBE_CHANNEL_DATASETS = [
	"channel_daily",
	"video_daily",
	"country_daily",
	"traffic_source_daily",
	"search_term_daily",
	"subscribed_status_daily",
	"device_daily",
	"operating_system_daily",
	"playback_location_daily",
	"creator_content_type_daily",
	"video_catalog",
] as const;

export const YouTubeChannelDatasetSchema = z.enum(YOUTUBE_CHANNEL_DATASETS);
export type YouTubeChannelDataset = z.infer<typeof YouTubeChannelDatasetSchema>;

/** Datasets that accept a videoIds filter. */
const YOUTUBE_CHANNEL_VIDEO_DATASETS: readonly YouTubeChannelDataset[] = [
	"video_daily",
	"video_catalog",
];

const YOUTUBE_CHANNEL_DATA_MAX_RANGE_DAYS = 400;
const YOUTUBE_CHANNEL_DATA_MAX_VIDEO_IDS = 50;
export const YOUTUBE_CHANNEL_DATA_DEFAULT_LIMIT = 500;
const YOUTUBE_CHANNEL_DATA_MAX_LIMIT = 1000;

const YouTubeVideoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/, {
	message: "must be an 11-character video ID",
});

function inclusiveDaySpan(start: string, end: string): number {
	const startMs = Date.parse(`${start}T00:00:00.000Z`);
	const endMs = Date.parse(`${end}T00:00:00.000Z`);
	return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export const DynamoiGetYouTubeChannelDataInputSchema = z
	.object({
		artistId: z.string().uuid(),
		cursor: z.string().min(1).max(1000).optional(),
		dataset: YouTubeChannelDatasetSchema,
		endDate: IsoCalendarDateSchema,
		format: ToolFormatSchema.optional(),
		limit: z
			.number()
			.int()
			.min(1)
			.max(YOUTUBE_CHANNEL_DATA_MAX_LIMIT)
			.optional(),
		startDate: IsoCalendarDateSchema,
		videoIds: z
			.array(YouTubeVideoIdSchema)
			.min(1)
			.max(YOUTUBE_CHANNEL_DATA_MAX_VIDEO_IDS)
			.optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (data.startDate > data.endDate) {
			ctx.addIssue({
				code: "custom",
				message: "startDate must be on or before endDate",
				path: ["startDate"],
			});
		} else if (
			inclusiveDaySpan(data.startDate, data.endDate) >
			YOUTUBE_CHANNEL_DATA_MAX_RANGE_DAYS
		) {
			ctx.addIssue({
				code: "custom",
				message: `The date range can cover at most ${YOUTUBE_CHANNEL_DATA_MAX_RANGE_DAYS} days`,
				path: ["endDate"],
			});
		}
		if (
			data.videoIds &&
			!YOUTUBE_CHANNEL_VIDEO_DATASETS.includes(data.dataset)
		) {
			ctx.addIssue({
				code: "custom",
				message: "videoIds only applies to video_daily and video_catalog",
				path: ["videoIds"],
			});
		}
	});

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
