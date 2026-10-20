import * as z from "zod/v4";

export const YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI =
	"dynamoi://youtube/campaign-strategies";

export const YouTubeStrategyKeySchema = z.enum([
	"CHEAPEST_VIEWS",
	"ORGANIC_VIEWS",
	"SUBSCRIBERS",
	"ORGANIC_VIEWS_AND_SUBSCRIBERS",
	"ADSENSE_ROI",
]);

export type YouTubeStrategyKey = z.infer<typeof YouTubeStrategyKeySchema>;

type YouTubeStrategyGuideEntry = {
	adNetworkOptimizesFor: string;
	bestFor: string;
	goal: string;
	judgeBy: string[];
	key: YouTubeStrategyKey;
	label: string;
	misleadingSignals: string[];
	placements: string;
	requirements: string;
};

const CAMPAIGN_PERIOD_LIFT_SIGNAL =
	"Campaign-period lift: channel views above the pre-campaign baseline while the campaign runs. These are mostly ad sessions, because ad click-throughs into the playlist appear as PLAYLIST and SUBSCRIBER traffic.";
const ORGANIC_LIFT_SIGNAL =
	"Organic lift: growth in sources the ads do not touch (YT_SEARCH, RELATED_VIDEO suggested views, browse features and similar), plus lift that persists after spend stops.";
const VIEWS_PER_AD_CLICK_SIGNAL =
	"Views per ad click (the playlist waterfall signal): channel views divided by ad clicks, over days that have both.";
const CHEAP_VIEWS_MISLEAD =
	"A low cost per click or per ad network view with no organic lift is a miss, not a win.";
const CONTINUED_VIEWS_MISLEAD =
	"Ad network-credited continued views are the organic views directly attributed to the campaign by click date. Do not say whether they include the first watch after the click, and they are not proof of overall organic growth.";
const TRAFFIC_SOURCE_MISLEAD =
	"YouTube traffic sources are not organic proof: PLAYLIST and SUBSCRIBER views during the campaign are mostly ad sessions, and only a small share of ad-driven views is tagged ADVERTISING.";

const STRATEGY_ENTRIES = {
	ADSENSE_ROI: {
		adNetworkOptimizesFor:
			"Google bids for viewers likely to keep watching your channel. Dynamoi then measures the extra AdSense against your usual earnings. The ad network does not use AdSense revenue while bidding.",
		bestFor:
			"Monetized channels that want channel revenue to grow faster than campaign spend.",
		goal: "Grow the channel's YouTube ad revenue from the views the campaign brings.",
		judgeBy: [
			"For each campaign, usual earnings are the weekday averages from the 28 days before that campaign, starting with the channel’s first earning day. At least 14 samples are required; otherwise there is no baseline. Pre-monetization zeros are excluded. Extra AdSense is channel AdSense minus that baseline over the campaign and 28 days after it ends, capped by available channel and billed-through dates. Each counted day belongs to one campaign (the later one), so rows add up. Negative results stay negative: “No lift yet”. Earned back in AdSense = total extra AdSense ÷ total billed budget of measurable campaigns. It appears after 14 counted days and remains provisional while data is arriving. Royalties are not included.",
			"Revenue per 1,000 monetized playbacks by country and by video.",
			CAMPAIGN_PERIOD_LIFT_SIGNAL,
			ORGANIC_LIFT_SIGNAL,
		],
		key: "ADSENSE_ROI",
		label: "Revenue",
		misleadingSignals: [
			"Cheap views or clicks from viewers who do not earn are a miss, not a win.",
			"Revenue for the latest 2-3 days is incomplete; YouTube also revises its revenue estimates.",
			TRAFFIC_SOURCE_MISLEAD,
			CONTINUED_VIEWS_MISLEAD,
		],
		placements:
			"In-feed YouTube placements (home feed, watch-next and search) plus the ad network's Discover feed.",
		requirements:
			"Monetized channels only: YouTube revenue or monetized playbacks in the last 90 days. A playlist entry point is required.",
	},
	CHEAPEST_VIEWS: {
		adNetworkOptimizesFor:
			"The most video ad views for the budget, as a fixed-length video campaign.",
		bestFor: "A launch push or a one-off view target for a single video.",
		goal: "Show the promoted video to as many viewers as possible for the budget.",
		judgeBy: [
			"Ad network-reported views and cost per view against the budget and end date.",
			"Watch time per ad network view, to check viewers actually watched.",
		],
		key: "CHEAPEST_VIEWS",
		label: "Views",
		misleadingSignals: [
			"Weak organic lift or few subscribers are expected: this strategy does not aim for them.",
			"Many ad network views come from ads shown before or during other videos, so they can carry less watch time than in-feed views.",
		],
		placements:
			"All YouTube video placements, including ads that play before or during other videos.",
		requirements:
			"One video; a playlist is optional. Uses a total budget with an end date.",
	},
	ORGANIC_VIEWS: {
		adNetworkOptimizesFor:
			"Bids for continued views after the ad, not minutes watched.",
		bestFor:
			"Channels that want ongoing views of their catalog, not just the promoted video.",
		goal: "Grow the channel's ongoing views by reaching viewers who keep watching after the ad, and look for lift that lasts beyond the spend.",
		judgeBy: [
			CAMPAIGN_PERIOD_LIFT_SIGNAL,
			ORGANIC_LIFT_SIGNAL,
			VIEWS_PER_AD_CLICK_SIGNAL,
			"Watch time, playlist starts and views per playlist start.",
			"Cost per click or per ad network view only as a secondary efficiency check.",
		],
		key: "ORGANIC_VIEWS",
		label: "Watch Time",
		misleadingSignals: [
			CHEAP_VIEWS_MISLEAD,
			TRAFFIC_SOURCE_MISLEAD,
			CONTINUED_VIEWS_MISLEAD,
		],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
	ORGANIC_VIEWS_AND_SUBSCRIBERS: {
		adNetworkOptimizesFor:
			"Both continued watching after the ad and new subscribers, balanced by the ad network.",
		bestFor:
			"Most channels that are not monetized yet; this is Dynamoi's default for them.",
		goal: "Grow views and subscribers together, and look for lift that lasts beyond the spend.",
		judgeBy: [
			CAMPAIGN_PERIOD_LIFT_SIGNAL,
			ORGANIC_LIFT_SIGNAL,
			VIEWS_PER_AD_CLICK_SIGNAL,
			"Net subscribers (gained minus lost) compared with the pre-campaign baseline.",
			"Watch time and playlist starts.",
		],
		key: "ORGANIC_VIEWS_AND_SUBSCRIBERS",
		label: "Channel Growth",
		misleadingSignals: [
			CHEAP_VIEWS_MISLEAD,
			"Subscribers gained without subscribers lost overstates growth.",
			TRAFFIC_SOURCE_MISLEAD,
			CONTINUED_VIEWS_MISLEAD,
		],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
	SUBSCRIBERS: {
		adNetworkOptimizesFor:
			"Viewers it predicts will subscribe to the channel after the ad.",
		bestFor:
			"Channels whose main goal is audience size, for example to reach monetization thresholds.",
		goal: "Grow the channel's subscriber base.",
		judgeBy: [
			"Net subscribers (gained minus lost) compared with the pre-campaign baseline.",
			"Campaign spend per net subscriber.",
		],
		key: "SUBSCRIBERS",
		label: "Subscribers",
		misleadingSignals: [
			"View volume: this strategy can trade views for subscribers.",
			"Subscribers gained without subscribers lost overstates growth.",
		],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
} as const satisfies Record<YouTubeStrategyKey, YouTubeStrategyGuideEntry>;

const VOCABULARY = {
	adNetwork:
		"Dynamoi YouTube campaigns run on Google's ad network and serve on YouTube. When reporting to users, say 'the ad network' (you may name Google once); do not repeat 'Google Ads'.",
	adNetworkReportedContinuedViews:
		"Organic views directly attributed: continued views of the artist's videos that the ad account credits to the campaign, by click date and provisional for two days. Do not claim whether the count includes the first watch after the click. It is not YouTube's channel view count and not proof of overall organic growth.",
	advertisingSourceViews:
		"Channel views YouTube tags with traffic source ADVERTISING. It undercounts ad-driven views: an ad click that lands in a playlist is credited mostly to PLAYLIST and SUBSCRIBER, not ADVERTISING.",
	campaignPeriodLift:
		"Channel views above the pre-campaign baseline during the campaign. They are mostly ad sessions, because ad click-throughs into the playlist appear as PLAYLIST and SUBSCRIBER traffic. It shows what the campaign period delivered, not what the channel keeps.",
	organicLift:
		"Growth in sources the ads do not touch (YT_SEARCH, RELATED_VIDEO suggested views, browse features and similar), plus lift that persists after spend stops. The comparison with the pre-campaign baseline, not the raw total, shows it. Neither YouTube traffic sources nor the ad network's continued views are organic proof.",
	otherSourceViews:
		"Every channel view not tagged ADVERTISING. It is not organic: it includes ad sessions credited to PLAYLIST and SUBSCRIBER.",
	strategyNames:
		"Use the strategy label with users (for example 'Revenue'); use the key (for example ADSENSE_ROI) only in tool calls.",
	viewsPerAdClick:
		"Channel views divided by ad clicks from campaign analytics, over the campaign window's days that have both. It is the playlist waterfall signal: how many views each ad click produces once playback continues through the playlist. It is not attributed per viewer.",
} as const;

const PLAYLIST_WATERFALL = {
	advice: [
		"Use long playlists, up to about 10 hours; repeat the catalog when there are not enough videos.",
		"The video after the promoted one must be the artist's own.",
		"Similar-artist videos further down the playlist are only an optional idea the artist decides on.",
		"Do not claim that every stream earns revenue.",
	],
	measurement:
		"Views per ad click (channel views divided by ad clicks, over days that have both) measures the waterfall. Ad clicks that land in a playlist are credited mostly to PLAYLIST and SUBSCRIBER, so the ADVERTISING traffic source shows only a small share of ad-driven views, and other-source views are not organic.",
	measurementLimits:
		"YouTube data reports totals by day, video and traffic source. It does not follow individual viewers from video to video, so no data source proves how many views the playlist itself caused. Report playlist starts, views per playlist start, views per ad click, campaign-period lift and organic lift; do not claim exact playlist-caused views.",
	mechanism:
		"Except the Views strategy, each campaign promotes a video as the entry point into a playlist of the artist's own videos. After a viewer clicks, playback continues through that playlist instead of YouTube autoplay choosing unrelated videos.",
	purpose:
		"Keep ad-driven and background listeners on the artist's channel. It improves listener quality; it is not a hidden view multiplier.",
} as const;

const RESULT_TIMING = {
	baseline:
		"Compare with the channel's own pre-campaign period of similar length, on complete days only.",
	dataLag:
		"YouTube views, subscribers and revenue arrive about 2-3 days late, and the latest days may be partial. Check the coverage fields (observedThroughDay, revenueThroughDay) before comparing.",
	learning:
		"The ad network learns for about 7-14 days after launch or a strategy change. Delivery and cost swing during this time; do not give a verdict in the first week.",
	missingData: "Missing days are unknown, not zero.",
} as const;

export function buildYouTubeCampaignStrategiesGuide() {
	return {
		playlistWaterfall: PLAYLIST_WATERFALL,
		resultTiming: RESULT_TIMING,
		strategies: Object.values(STRATEGY_ENTRIES),
		vocabulary: VOCABULARY,
	};
}

export type YouTubeStrategyGuide = YouTubeStrategyGuideEntry & {
	moreDetail: string;
	resultTiming: string;
};

export function buildYouTubeStrategyGuide(
	strategy: string,
): YouTubeStrategyGuide | null {
	const parsed = YouTubeStrategyKeySchema.safeParse(strategy);
	if (!parsed.success) {
		return null;
	}
	const entry: YouTubeStrategyGuideEntry = STRATEGY_ENTRIES[parsed.data];
	return {
		...entry,
		judgeBy: [...entry.judgeBy],
		misleadingSignals: [...entry.misleadingSignals],
		moreDetail: `Read ${YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI} for view definitions, the playlist waterfall and result timing.`,
		resultTiming: `${RESULT_TIMING.learning} ${RESULT_TIMING.dataLag}`,
	};
}
