import { describe, expect, test } from "bun:test";

import {
	getYouTubeMetric,
	YOUTUBE_AGENT_KNOWLEDGE,
	YOUTUBE_CHANNEL_ANALYTICS_LAG_DAYS,
	YOUTUBE_DIRECT_ORGANIC_VIEWS_NOTE,
	YOUTUBE_FOLLOW_ON_VIEWS_CONVERSION_ACTION_ID,
	YOUTUBE_METRIC_DICTIONARY,
	YOUTUBE_METRIC_IDS,
	YOUTUBE_PROVISIONAL_CONVERSION_DAYS,
	YOUTUBE_SUBSCRIBERS_CONVERSION_ACTION_ID,
} from "./youtube-metrics";

describe("YouTube metric dictionary", () => {
	test("defines every metric id exactly once under its own key", () => {
		expect(Object.keys(YOUTUBE_METRIC_DICTIONARY).sort()).toEqual(
			[...YOUTUBE_METRIC_IDS].sort(),
		);
		for (const id of YOUTUBE_METRIC_IDS) {
			expect(getYouTubeMetric(id).id).toBe(id);
		}
	});

	test("views through the ad come from clicks, never interactions", () => {
		expect(YOUTUBE_METRIC_DICTIONARY.views_through_ad.sourceField).toBe(
			"google_ads.metrics.clicks",
		);
		expect(YOUTUBE_METRIC_DICTIONARY.cost_per_view.sourceField).toContain(
			"metrics.clicks",
		);
		expect(YOUTUBE_METRIC_DICTIONARY.interactions.class).toBe("internal");
		expect(YOUTUBE_METRIC_DICTIONARY.interactions.clientLabel).toBeNull();
	});

	test("directly attributed figures read all_conversions by action id", () => {
		for (const id of ["direct_organic_views", "direct_subscribers"] as const) {
			expect(YOUTUBE_METRIC_DICTIONARY[id].sourceField).toContain(
				"metrics.all_conversions",
			);
			expect(YOUTUBE_METRIC_DICTIONARY[id].freshness).toBe(
				"ad_account_provisional",
			);
		}
		expect(
			YOUTUBE_METRIC_DICTIONARY.direct_organic_views.sourceField,
		).toContain(YOUTUBE_FOLLOW_ON_VIEWS_CONVERSION_ACTION_ID);
		expect(YOUTUBE_METRIC_DICTIONARY.direct_subscribers.sourceField).toContain(
			YOUTUBE_SUBSCRIBERS_CONVERSION_ACTION_ID,
		);
	});

	test("channel figures are context and never attributed", () => {
		for (const id of [
			"channel_views",
			"channel_advertising_views",
			"channel_net_subscribers",
		] as const) {
			expect(YOUTUBE_METRIC_DICTIONARY[id].class).toBe("context");
			expect(YOUTUBE_METRIC_DICTIONARY[id].freshness).toBe("channel_analytics");
		}
	});

	test("freshness windows match the decided clocks", () => {
		expect(YOUTUBE_CHANNEL_ANALYTICS_LAG_DAYS).toBe(3);
		expect(YOUTUBE_PROVISIONAL_CONVERSION_DAYS).toBe(2);
	});

	test("agent text never asserts whether the credit includes the entry watch", () => {
		const text = [
			YOUTUBE_DIRECT_ORGANIC_VIEWS_NOTE,
			YOUTUBE_METRIC_DICTIONARY.direct_organic_views.meaning,
			...YOUTUBE_AGENT_KNOWLEDGE.nuances,
		]
			.join("\n")
			.split(/(?<=\.)\s+/)
			.filter((sentence) => !/unconfirmed|do not claim/i.test(sentence))
			.join(" ");
		expect(text).not.toMatch(
			/\b(includes?|excludes?) the (promoted|first|entry)/i,
		);
		expect(YOUTUBE_METRIC_DICTIONARY.direct_organic_views.meaning).toContain(
			"unconfirmed",
		);
	});

	test("client-facing text never reveals economics", () => {
		const clientText = [
			...Object.values(YOUTUBE_METRIC_DICTIONARY).flatMap((metric) =>
				metric.clientLabel ? [metric.clientLabel] : [],
			),
			YOUTUBE_AGENT_KNOWLEDGE.valueProp,
		].join("\n");
		expect(clientText).not.toMatch(
			/margin|markup|2x|half[- ]spend|pass-through/i,
		);
	});
});
