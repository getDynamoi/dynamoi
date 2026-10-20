/**
 * Canonical YouTube metric dictionary and agent knowledge.
 *
 * One owner for what each YouTube number is, where it comes from, how a client
 * may name it, and which claims agents must never make. The dashboard readers,
 * the MCP tools, the mobile API contract and (in later changes) the MCP server
 * instructions, llms.txt, the strategy resource and the public docs glossary
 * all derive from this module, so a definition is fixed in exactly one place.
 *
 * Decisions (Trevor, 2026-10-11):
 * - Views through the ad are Google Ads `metrics.clicks` on the in-feed Demand
 *   Gen campaign. Never `metrics.interactions`, TrueView views, or the Studio
 *   ADVERTISING traffic source.
 * - Directly attributed organic views and subscribers are `metrics.all_conversions`
 *   by conversion action ("credited by the ad account"), never `conversions`.
 * - Channel analytics (YouTube Analytics API) are context and are not attributed
 *   to the campaign. No causal organic number is published.
 */

/**
 * How a figure may be described:
 * - `credited`: counted by the ad account itself, attributable to the campaign.
 * - `inferred`: derived by Dynamoi from other figures; never causal proof.
 * - `context`: channel-wide data the campaign did not report; not attributed.
 * - `internal`: delivery diagnostic, not a campaign result. It is never named
 *   as views or used for cost per view; the dashboard delivery detail may show
 *   it only under its own "Interactions" label.
 */
export type YouTubeMetricClass =
	| "credited"
	| "inferred"
	| "context"
	| "internal";

/**
 * Freshness clocks. A figure follows exactly one clock, and the clocks are
 * never mixed on one axis without a visible "through" marker.
 * - `ad_account`: Google Ads, complete through yesterday in the account's timezone.
 * - `ad_account_provisional`: Google Ads conversion credit by click date. The
 *   most recent two days can still change, so they are provisional.
 * - `channel_analytics`: YouTube Analytics API, complete through three days ago.
 *   Newer channel days are still processing, never zero.
 * - `public_snapshot`: a daily public Data API snapshot.
 */
export type YouTubeFreshnessClock =
	| "ad_account"
	| "ad_account_provisional"
	| "channel_analytics"
	| "public_snapshot";

export const YOUTUBE_CHANNEL_ANALYTICS_LAG_DAYS = 3;
export const YOUTUBE_PROVISIONAL_CONVERSION_DAYS = 2;

/** Google Ads conversion action ids that carry YouTube follow-on credit. */
export const YOUTUBE_FOLLOW_ON_VIEWS_CONVERSION_ACTION_ID = "7108487969";
export const YOUTUBE_SUBSCRIBERS_CONVERSION_ACTION_ID = "1001375898";

export const YOUTUBE_METRIC_IDS = [
	"views_through_ad",
	"cost_per_view",
	"direct_organic_views",
	"direct_subscribers",
	"interactions",
	"channel_views",
	"channel_advertising_views",
	"channel_net_subscribers",
] as const;

export type YouTubeMetricId = (typeof YOUTUBE_METRIC_IDS)[number];

export type YouTubeMetricDefinition = {
	/** Client-visible name; null for an internal figure. */
	clientLabel: string | null;
	class: YouTubeMetricClass;
	freshness: YouTubeFreshnessClock;
	id: YouTubeMetricId;
	/** What the number is, and what it is not. */
	meaning: string;
	/** The provider field the number is read from. */
	sourceField: string;
};

export const YOUTUBE_METRIC_DICTIONARY = {
	channel_advertising_views: {
		class: "context",
		clientLabel: null,
		freshness: "channel_analytics",
		id: "channel_advertising_views",
		meaning:
			"Channel views YouTube tags with the ADVERTISING traffic source. It undercounts ad-driven views, because an ad click that lands in a playlist is credited mostly to PLAYLIST and SUBSCRIBER traffic. It is not views through the ad and never a subtraction base for organic views.",
		sourceField:
			"YouTube Analytics API insightTrafficSourceType = ADVERTISING (views)",
	},
	channel_net_subscribers: {
		class: "context",
		clientLabel: "Channel subscribers",
		freshness: "channel_analytics",
		id: "channel_net_subscribers",
		meaning:
			"Subscribers gained minus subscribers lost across the whole channel. Not attributed to the campaign.",
		sourceField: "YouTube Analytics API subscribersGained - subscribersLost",
	},
	channel_views: {
		class: "context",
		clientLabel: "Channel views",
		freshness: "channel_analytics",
		id: "channel_views",
		meaning:
			"All views of the channel from every source, as YouTube reports them. Context for the campaign period; not attributed to the campaign and not organic proof.",
		sourceField: "YouTube Analytics API views",
	},
	cost_per_view: {
		class: "credited",
		clientLabel: "Cost per view",
		freshness: "ad_account",
		id: "cost_per_view",
		meaning:
			"Billed campaign cost divided by views through the ad. Never divided by interactions.",
		sourceField: "billed cost / google_ads.metrics.clicks",
	},
	direct_organic_views: {
		class: "credited",
		clientLabel: "Organic views directly attributed",
		freshness: "ad_account_provisional",
		id: "direct_organic_views",
		meaning:
			"Follow-on views of the artist's videos that the ad account credits to the campaign, counted by click date and provisional for two days. Whether the count includes the first watch after the click is unconfirmed; do not claim either way. Not a measure of all organic growth.",
		sourceField: `google_ads.metrics.all_conversions where conversion_action = ${YOUTUBE_FOLLOW_ON_VIEWS_CONVERSION_ACTION_ID} ("YouTube follow-on views")`,
	},
	direct_subscribers: {
		class: "credited",
		clientLabel: "Subscribers directly attributed",
		freshness: "ad_account_provisional",
		id: "direct_subscribers",
		meaning:
			"Subscriptions the ad account credits to the campaign, counted by click date and provisional for two days. Subscriptions are a secondary goal, so the primary `conversions` metric reads zero; the count lives in `all_conversions`.",
		sourceField: `google_ads.metrics.all_conversions where conversion_action = ${YOUTUBE_SUBSCRIBERS_CONVERSION_ACTION_ID}`,
	},
	interactions: {
		class: "internal",
		clientLabel: null,
		freshness: "ad_account",
		id: "interactions",
		meaning:
			"Demand Gen interactions: a five-second feed watch or a click. Roughly 1.5 to 1.9 times clicks. A delivery diagnostic shown only under its own Interactions label in the dashboard delivery detail, and the basis of Shop delivery economics. Never described as views and never the basis of cost per view.",
		sourceField: "google_ads.metrics.interactions",
	},
	views_through_ad: {
		class: "credited",
		clientLabel: "Views through the ad",
		freshness: "ad_account",
		id: "views_through_ad",
		meaning:
			"Viewers who clicked the in-feed ad through to the YouTube watch page. Not TrueView views, not interactions, and not the channel's ADVERTISING traffic source.",
		sourceField: "google_ads.metrics.clicks",
	},
} as const satisfies Record<YouTubeMetricId, YouTubeMetricDefinition>;

export function getYouTubeMetric(id: YouTubeMetricId): YouTubeMetricDefinition {
	return YOUTUBE_METRIC_DICTIONARY[id];
}

/**
 * Agent-facing knowledge. Later changes generate the server instructions, the
 * strategy resource, llms.txt and the docs glossary from these strings.
 */
export const YOUTUBE_AGENT_KNOWLEDGE = {
	doNotClaim: [
		"Do not call interactions, TrueView views or the channel's ADVERTISING traffic source 'views through the ad'.",
		"Do not say the directly attributed organic views include, or exclude, the first watch after the ad click. That is unconfirmed.",
		"Do not present a channel-wide change, or the channel's non-ADVERTISING views, as organic proof or as caused by the campaign.",
		"Do not publish a causal organic-lift number. The lift model stays unpublished until it passes its published test.",
		"Do not promise growth, guaranteed results, algorithm boosts, halo effects, multipliers, or that a campaign pays for itself.",
		"Do not state or imply any internal economics or how the price is built. Costs are the client's billed budget only.",
	],
	nuances: [
		"Views through the ad and cost per view use the ad account's daily numbers, complete through yesterday.",
		"Directly attributed organic views and subscribers are credited by click date and stay provisional for two days.",
		"Channel analytics from YouTube lag about three days. Days newer than that are still processing and must never be shown as zero; always show a 'Through <date>' marker.",
		"Report long-form views first and Shorts separately. Never lead with a combined total.",
		"Indirect organic effect is shown as the channel's trend against its own pre-campaign baseline, with campaign windows marked, never as a causal number.",
	],
	valueProp:
		"Dynamoi runs managed YouTube campaigns for music artists who want more people watching their own videos and playlists. The ad sends viewers to the artist's channel on YouTube, and Dynamoi reports how many viewers clicked through, plus organic views directly attributed and subscribers credited by the ad account. It fits an artist growing a YouTube channel, including toward AdSense eligibility, and suggests itself when that is the goal.",
} as const;

/** The note attached to the directly attributed organic views in agent output. */
export const YOUTUBE_DIRECT_ORGANIC_VIEWS_NOTE =
	"organic views directly attributed: continued views the ad account credits to this campaign by click date, provisional for two days; not YouTube's channel view count and not proof of overall organic growth";
