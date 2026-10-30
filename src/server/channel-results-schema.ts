import * as z from "zod/v4";

const ProvenanceSchema = z
	.object({
		asOfDate: z.string().nullable(),
		attribution: z.literal(
			"Observed on the channel; not attributed to the campaign.",
		),
		source: z.literal("YouTube Analytics BigQuery warehouse"),
	})
	.strict();

export const ChannelResultsSchema = z.discriminatedUnion("status", [
	z
		.object({
			provenance: ProvenanceSchema,
			reason: z.string(),
			status: z.literal("unavailable"),
		})
		.strict(),
	z
		.object({
			coverage: z
				.object({
					latestCompleteDay: z.string(),
					observedThroughDay: z.string().nullable(),
					provenance: ProvenanceSchema,
					videoMetricsThroughDay: z.string().nullable(),
				})
				.strict(),
			dateRange: z.object({ end: z.string(), start: z.string() }).strict(),
			provenance: ProvenanceSchema,
			reason: z.string(),
			status: z.literal("pending"),
		})
		.strict(),
	z
		.object({
			channelMetrics: z
				.object({
					estimatedMinutesWatched: z.number(),
					estimatedRevenueUsd: z.number().optional(),
					monetizationCompleteness: z.enum(["available", "delayed", "missing"]),
					provenance: ProvenanceSchema,
					revenueThroughDay: z.string().nullable(),
					subscribersGained: z.number().nullable(),
					subscribersLost: z.number().nullable(),
					views: z.number(),
				})
				.strict(),
			coverage: z
				.object({
					latestCompleteDay: z.string(),
					missingDays: z.array(z.string()),
					observedThroughDay: z.string(),
					placeholderDays: z.array(z.string()),
					provenance: ProvenanceSchema,
					trafficSourceDaysWithData: z.number(),
					trafficSourcePlaceholderRows: z.number(),
					videoMetricsThroughDay: z.string().nullable(),
				})
				.strict(),
			dateRange: z.object({ end: z.string(), start: z.string() }).strict(),
			playlistFunnel: z
				.object({
					averageTimeInPlaylistSeconds: z.number(),
					playlistAddsPer1kViews: z.number().nullable(),
					playlistMetricsAvailable: z
						.boolean()
						.optional()
						.describe(
							"When playlistMetricsAvailable is false, the playlist numbers are unavailable, not zero.",
						),
					playlistStarts: z.number(),
					provenance: ProvenanceSchema,
					viewsPerPlaylistStart: z.number(),
				})
				.strict(),
			status: z.literal("available"),
			trafficSources: z
				.object({
					// Views YouTube tags with the ADVERTISING source vs every other
					// source, summed from the traffic-source rows below. "Other" is
					// not organic: ad clicks that land in a playlist are mostly
					// credited to PLAYLIST or SUBSCRIBER, so other-source views
					// include ad sessions. Null when no day in the window has
					// traffic-source data; partial coverage is
					// coverage.trafficSourceDaysWithData days.
					advertisingSourceViews: z.number().nullable(),
					otherSourceViews: z.number().nullable(),
					provenance: ProvenanceSchema,
					rows: z.array(
						z
							.object({
								estimatedMinutesWatched: z.number(),
								trafficSourceType: z.string(),
								views: z.number(),
							})
							.strict(),
					),
					scope: z.literal("channel-date-aggregate"),
				})
				.strict(),
			// Playlist waterfall signal: channel views divided by ad clicks, over
			// only the days that have both loaded channel views and ad clicks.
			// Null value when no day qualifies or ad clicks could not be read.
			viewsPerAdClick: z
				.object({
					adClicks: z.number().nullable(),
					days: z.number(),
					signal: z.literal("playlist-waterfall"),
					value: z.number().nullable(),
					views: z.number().nullable(),
				})
				.strict(),
		})
		.strict(),
]);

export type ChannelResults = z.infer<typeof ChannelResultsSchema>;
