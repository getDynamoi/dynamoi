export type * from "./flow-types";
export type * from "./readiness-types";

export type ResultEnvelope<T> =
	| { status: "success"; data: T }
	| { status: "partial_success"; data: T; message: string }
	| {
			status: "error";
			recovery?: import("./server/output-schemas").SmartCampaignLaunchProjection["recovery"];
			validationCode?: string | undefined;
			validationStage?: string | undefined;
			message: string;
			kind?: "validation" | "business" | "platform" | "unknown";
			code?: ResultErrorCode;
			retryable?: boolean;
			retryAfterSeconds?: number;
			field?: string;
			prerequisite?: string;
			nextAction?: ResultNextAction;
			draftId?: string;
			failureStage?: string;
			screeningResult?: string;
	  };

/** Stable, safe error identifiers that let clients choose bounded recovery. */
export type ResultErrorCode =
	| "ACCOUNT_READ_ONLY"
	| "INVALID_SPOTIFY_SOURCE"
	| "CAPABILITY_REQUIRED"
	| "INSUFFICIENT_SCOPE"
	| "TENANT_ACCESS_DENIED"
	| "STATE_CONFLICT"
	| "QUOTE_CHANGED"
	| "RATE_LIMITED"
	| "OUTPUT_INVALID"
	| "UNKNOWN_EFFECT";

/** A server suggestion only; callers must still enforce permission and intent. */
export type ResultNextAction = {
	kind: "provide_input" | "read_status" | "reconnect" | "handoff";
	field?: string;
	reason?: string;
};

export type DistributionRequirementKey =
	| "spotify_connection"
	| "spotify_followers"
	| "monthly_listeners"
	| "meta_identity"
	| "youtube_identity";

export type GetDistributionApplicationData = {
	artistId: string;
	artistName: string;
	application: {
		status: string;
		statusLabel: string;
		submittedAt: string;
		resubmittable: boolean;
	} | null;
	eligibility:
		| "application_submitted"
		| "below_threshold"
		| "eligible"
		| "metrics_unavailable";
	requirements: Array<{
		key: DistributionRequirementKey;
		met: boolean;
		currentValue?: number | null;
		minimumValue?: number;
		observedAt?: string | null;
		description: string;
		nextAction?: string;
	}>;
	metRequirementCount: number;
	totalRequirementCount: 5;
	allRequirementsMet: boolean;
	supportedCountryCodes: string[];
	additionalSubmissionFields: string[];
	nextActions: string[];
	summary: string;
	warnings: string[];
};

export type ApplyForDistributionData = {
	artistId: string;
	artistName: string;
	alreadySubmitted: boolean;
	status: string;
	submittedAt: string;
	reviewCode: "manual_identity_review_required" | null;
	summary: string;
	nextActions: string[];
	warnings: string[];
};

export type MoneyDisplay = {
	/**
	 * Major-unit amount in `currency` (minor units divided by 10^minorDigits,
	 * e.g. 1234 minor units → 12.34 for 2-digit currencies, 1234 for JPY).
	 */
	amount: number;
	/**
	 * Major-unit USD amount. Present only when `currency` is "USD"; kept for
	 * backward compatibility — new consumers should use `amount` + `currency`.
	 */
	amountUsd?: number;
	/** Account billing currency (ISO 4217, uppercase). */
	currency: string;
	formatted: string;
};

export type AccessRole = "admin" | "editor" | "viewer";
export type ArtistTier = "none" | "starter" | "plus";
export type BillingStatus =
	| "ACTIVE"
	| "SUSPENDED"
	| "INACTIVE"
	| "NEVER_SUBSCRIBED";

export type CampaignType = "SMART_CAMPAIGN" | "YOUTUBE";
export type CampaignDisplayStatus =
	| "AWAITING_SMART_LINK"
	| "CONTENT_VALIDATION"
	| "DEPLOYING"
	| "READY_FOR_REVIEW"
	| "ACTIVE"
	| "PAUSED"
	| "SUBSCRIPTION_PAUSED"
	| "ARCHIVED"
	| "FAILED"
	| "ENDED";

export type ListArtistsData = {
	artists: Array<{
		id: string;
		name: string;
		organizationName?: string;
		tier: ArtistTier;
		billingStatus: BillingStatus;
		activeCampaignCount: number;
		role: AccessRole;
	}>;
	nextCursor?: string;
};

export type ListArtistsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type SearchResultType = "artist" | "campaign" | "smartlink";
export type SearchData = {
	results: Array<{
		type: SearchResultType;
		id: string;
		name: string;
		status?: string;
		artistName?: string;
		publicUrl?: string;
		resultReason?: string;
	}>;
	nextCursor?: string;
};

export type SearchSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

// OpenAiSearchData / OpenAiFetchData live in server/openai-tools.ts
// (re-exported through the package entrypoint).

export type GetCurrentUserArtistSummary = {
	id: string;
	name: string;
	slug: string | null;
	hasConnectedMeta: boolean;
	hasConnectedSpotify: boolean;
	hasConnectedYoutube: boolean;
	artistHasActiveCampaigns: boolean;
	smartLinkCount: number;
};

export type GetCurrentUserState = {
	hasAnyArtist: boolean;
	hasAnyConnectedMeta: boolean;
	hasAnyConnectedSpotify: boolean;
	hasAnyConnectedYoutube: boolean;
	hasAnySmartLink: boolean;
	hasAnyActiveCampaign: boolean;
	isFirstSession: boolean;
};

export type GetCurrentUserData = {
	user: {
		name?: string;
	};
	organizationCount: number;
	artistCount: number;
	artists: {
		count: number;
		summaries: GetCurrentUserArtistSummary[];
	};
	state: GetCurrentUserState;
	recommendedNextActions: string[];
	hints: string[];
};

export type SmartLinkClaimStatus =
	| "auto_approved"
	| "pending_ops_review"
	| "verification_deferred"
	| "approved_by_ops"
	| "rejected";
export type SmartLinkPublishState = "published" | "unpublished";
export type SmartLinkTakedownStatus = "none" | "active" | "resolved";
export type SmartLinkRenderState =
	| "queued"
	| "rendering"
	| "rendered"
	| "failed";
export type SmartLinkTheme = "classic" | "brutalist" | "aurora" | "cinematic";

export type SmartLinkSummary = {
	id: string;
	artistId: string;
	artistName: string;
	artistHubUrl: string;
	releaseTitle: string;
	releaseType: string;
	releaseSlug: string;
	spotifyUrl: string | null;
	publicUrl: string;
	localizedPublicUrls?: string[];
	isPublic: boolean;
	claimStatus: SmartLinkClaimStatus;
	publishState: SmartLinkPublishState;
	takedownStatus: SmartLinkTakedownStatus;
	renderState: SmartLinkRenderState;
	theme: SmartLinkTheme;
	createdAt: string;
	updatedAt: string;
	version?: string;
};

/**
 * Full-profile readback of the Artist Hub fields the hub settings tool writes.
 * Never present in the directory profile.
 */
export type SmartLinkArtistHubReadback = {
	version?: string | undefined;
	hubDescription: string | null;
	profileLinks: Array<{
		isHidden: boolean;
		label: string;
		service: string;
		url: string | null;
	}>;
	servicePriority: string[];
	servicePriorityMode: "country" | "fixed";
};

/**
 * Full-profile readback of the release fields the release settings tool
 * writes. Never present in the directory profile.
 */
export type SmartLinkReleaseSettingsReadback = {
	customDescription: string | null;
	services: Array<{
		effectiveUrl: string | null;
		hidden: boolean;
		label: string;
		overrideUrl: string | null;
		service: string;
	}>;
	youtubeUrl: string | null;
};

export type SmartLinkSettingsData = {
	artistHub?: SmartLinkArtistHubReadback;
	artistId: string;
	artistName: string;
	isEnabled: boolean;
	defaultTheme: SmartLinkTheme;
	pixels: {
		metaPixelId: string | null;
		tiktokPixelId: string | null;
		googleAdsConversionId: string | null;
	};
	availableThemes: SmartLinkTheme[];
	summary?: string;
	warnings?: string[];
};

export type ListSmartLinksData = {
	smartLinks: SmartLinkSummary[];
	nextCursor?: string;
};

export type ListSmartLinksSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type GetSmartLinkData = SmartLinkSummary & {
	customDescription: string | null;
	releaseSettings?: SmartLinkReleaseSettingsReadback;
	originalSpotifyUrl: string | null;
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetSmartLinkSummaryData = {
	version?: string;
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type SmartLinkAnalyticsTotals = {
	anonymousVisits: number;
	streamingServiceClicks: number | null;
	streamingServiceClickUsers: number | null;
	uniqueVisitors: number;
	youtubeVideoPlays: number;
	youtubeVideoPlayUsers: number;
	saveFollowEvents: number;
	saveFollowUsers: number;
};

export type GetSmartLinkAnalyticsData = {
	countsAvailability?: "available" | "incomplete";
	playLinkId: string;
	artistId: string;
	releaseTitle: string;
	dateRange: { start: string; end: string };
	totals: SmartLinkAnalyticsTotals;
	daily?: Array<
		SmartLinkAnalyticsTotals & {
			date: string;
			serviceClickEvidence: "available" | "partial" | "unavailable";
		}
	>;
	serviceClickEvidence: "available" | "partial" | "unavailable";
	serviceClickCoverage: { fromDate: string; throughDate: string } | null;
	lastUpdatedAtIso: string | null;
	uniqueMetricAggregation: "sum_daily_per_link_uniques";
	breakdowns?: {
		serviceClicks?: Record<string, number>;
		countryViews?: Record<string, number>;
		countryClicks?: Record<string, number>;
		referrerViews?: Record<string, number>;
		referrerClicks?: Record<string, number>;
		utmViews?: Record<string, number>;
		utmClicks?: Record<string, number>;
		deviceViews?: Record<string, number>;
		deviceClicks?: Record<string, number>;
		localeViews?: Record<string, number>;
		localeClicks?: Record<string, number>;
		themeViews?: Record<string, number>;
		themeClicks?: Record<string, number>;
	};
	warnings?: string[];
};

export type ArtistSmartLinkAnalyticsData = Omit<
	GetSmartLinkAnalyticsData,
	"artistId" | "playLinkId" | "releaseTitle" | "breakdowns"
> & {
	topLinks: {
		playLinkId: string;
		releaseTitle: string;
		serviceClickEvidence: "available" | "partial" | "unavailable";
		totals: SmartLinkAnalyticsTotals;
	}[];
	reportedLinkCount: number;
};

export type GetSmartLinkAnalyticsSummaryData = {
	summary: string;
	warnings?: string[];
};

export type CreateSmartLinkFromSpotifyData = GetSmartLinkData & {
	outcome: "created" | "existing";
	workflowWarning: string | null;
};

export type CreateSmartLinksFromSpotifyArtistData = {
	artistId: string;
	artistName: string;
	artistHubUrl: string;
	spotifyArtistUrl: string;
	artistCreatedFromSpotify?: boolean;
	catalogImportStatus: "started" | "start_failed";
	initialSmartLink: SmartLinkSummary | null;
	currentSmartLinkCount: number;
	newlyAvailableCount: number;
	existingCount: number;
	smartLinks: SmartLinkSummary[];
	summary: string;
	nextActions: string[];
	warnings?: string[];
};

export type UpdateSmartLinkData = GetSmartLinkData & {
	renderWarning: string | null;
};

export type UpdateSmartLinkArtistSettingsData = SmartLinkSettingsData & {
	renderQueuedCount: number;
	renderWarning: string | null;
};

export type GetCurrentUserSummaryData = {
	summary: string;
	organizationCount: number;
	artistCount: number;
	recommendedNextActions: string[];
};

export type GetArtistData = {
	id: string;
	name: string;
	slug: string;
	tier: ArtistTier;
	billingStatus: BillingStatus;
	connections: {
		spotify: { connected: boolean; artistName?: string };
		meta: { connected: boolean; status?: string };
		youtube: { connected: boolean; channelName?: string };
	};
	onboarding: {
		smartCampaign: {
			isReady: boolean;
			missingRequirements: string[];
			nextAction?: string;
		};
		youtube: {
			isReady: boolean;
			missingRequirements: string[];
			nextAction?: string;
		};
	};
	organization?: { id: string; name: string };
	warnings?: string[];
	actionRequired?: string[];
};

export type GetArtistSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type ListCampaignsJsonData = {
	campaigns: Array<{
		id: string;
		contentTitle: string;
		campaignType: CampaignType;
		status: CampaignDisplayStatus;
		budget: MoneyDisplay;
		budgetType: "DAILY" | "TOTAL";
		platforms: string[];
		createdAt: string;
		/** Last day ads run (Pacific time). */
		endDate?: string;
		endDateLabel?: string;
	}>;
	nextCursor?: string;
};

export type ListCampaignsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type GetCampaignData = {
	channelResults?: import("./server/channel-results-schema").ChannelResults;
	summary: string;
	id: string;
	contentTitle: string;
	contentType: "TRACK" | "ALBUM" | "PLAYLIST" | "VIDEO";
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	locationTargets:
		| { mode: "GLOBAL" }
		| {
				mode: "COUNTRIES";
				countryCount: number;
				countries?: Array<{ code: string; name: string }>;
		  };
	platforms: Array<{
		name: "META" | "GOOGLE";
		status: string;
		budgetAllocation: MoneyDisplay;
	}>;
	createdAt: string;
	updatedAt: string;
	/** Last day ads run (Pacific time). */
	endDate?: string;
	endDateLabel?: string;
	artistId: string;
	artistName: string;
	smartLinkUrl?: string;
	blockedReason?: string;
	nextAction?: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignAnalyticsJsonData = {
	/** Count-read completeness; sample identifies the existing demo reader. Independent of spend/status notes. */
	countsAvailability?: "available" | "incomplete" | "sample" | "not_linked";
	/**
	 * YouTube campaigns only, and only when the ad network reported it. Organic
	 * views directly attributed: follow-on views the ad account credits to the
	 * campaign by click date (provisional for two days). The field name predates
	 * that definition and is kept for compatibility. Whether the credit includes
	 * the first watch after the click is unconfirmed. `daily` appears with DAILY
	 * granularity.
	 */
	adNetworkReportedContinuedViews?: {
		daily?: Array<{ date: string; views: number }>;
		note: string;
		total: number;
	};
	/**
	 * YouTube campaigns only: present, as "pending", when organic views directly
	 * attributed and subscribers are not available yet. They are withheld rather
	 * than reported as zero, so an absent figure with this marker is not zero.
	 */
	directCreditAvailability?: { note: string; status: "pending" };
	/**
	 * YouTube campaigns only: subscriptions the ad account credits to the
	 * campaign (all_conversions by click date, provisional for two days).
	 */
	subscribersDirectlyAttributed?: { note: string; total: number };
	/**
	 * YouTube campaigns only: viewers who clicked the ad through to the YouTube
	 * watch page (Google Ads clicks). Not interactions and not TrueView views.
	 */
	viewsThroughAd?: { note: string; total: number };
	campaignId: string;
	contentTitle: string;
	status: CampaignDisplayStatus;
	dateRange: { start: string; end: string };
	totals: {
		impressions: number;
		clicks: number;
		/**
		 * Summed spend in the artist's currency. `null` when today's exchange
		 * rate is unavailable or when spend is not reported for this campaign
		 * (a warning says so); counts stay, and CPC and CPM are then `null` too.
		 */
		spend: MoneyDisplay | null;
		cpc: MoneyDisplay | null;
		cpm: MoneyDisplay | null;
		ctr: number | null;
	};
	byPlatform?: Array<{
		platform: "META" | "GOOGLE";
		impressions: number;
		clicks: number;
		/** `null` when today's exchange rate is unavailable or spend is not reported. */
		spend: MoneyDisplay | null;
		daily?: Array<{
			date: string;
			impressions: number;
			clicks: number;
			/** `null` when today's exchange rate is unavailable or spend is not reported. */
			spend: MoneyDisplay | null;
		}>;
	}>;
	daily?: Array<{
		date: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay | null;
	}>;
	warnings?: string[];
};

export type GetCampaignAnalyticsSummaryData = {
	summary: string;
	warnings?: string[];
};

export type GetArtistAnalyticsJsonData = {
	/** Full profile only; canonical artist-wide link aggregate, distinct from campaigns. */
	smartLinks?: ArtistSmartLinkAnalyticsData;
	/** Count-read completeness; sample identifies the existing demo reader. */
	countsAvailability?: "available" | "incomplete" | "sample" | "not_linked";
	artistId: string;
	campaignCount: number;
	dateRange: { start: string; end: string };
	totals: {
		impressions: number;
		clicks: number;
		/**
		 * In the artist's currency; `null` when today's exchange rate is unavailable
		 * or when spend is not reported for the selection (a warning says so).
		 */
		spend: MoneyDisplay | null;
		cpc: MoneyDisplay | null;
		cpm: MoneyDisplay | null;
		ctr: number | null;
	};
	byPlatform?: Array<{
		platform: "META" | "GOOGLE";
		impressions: number;
		clicks: number;
		spend: MoneyDisplay | null;
		daily?: Array<{
			date: string;
			impressions: number;
			clicks: number;
			spend: MoneyDisplay | null;
		}>;
	}>;
	daily?: Array<{
		date: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay | null;
	}>;
	strongestCampaign?: {
		campaignId: string;
		contentTitle: string;
		status: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
	};
	warnings?: string[];
};

export type GetArtistAnalyticsSummaryData = {
	smartLinks?: ArtistSmartLinkAnalyticsData;
	/** Count-read completeness; sample identifies the existing demo reader. */
	countsAvailability?: "available" | "incomplete" | "sample" | "not_linked";
	summary: string;
	campaignCount?: number;
	dateRange?: { start: string; end: string };
	hasDailyBreakdown?: boolean;
	strongestCampaign?: {
		campaignId: string;
		contentTitle: string;
		status: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
	};
	warnings?: string[];
};
