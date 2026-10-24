import type {
	ArtistTier,
	BillingStatus,
	CampaignDisplayStatus,
	CampaignType,
	MoneyDisplay,
} from "./types";

export type GetBillingData = {
	/** Canonical paid plan evidence; absent on older servers. */
	plan?:
		| { state: "NONE" }
		| {
				state: "ACTIVE";
				provider: "APP_STORE" | "GOOGLE_PLAY" | "STRIPE";
				tier: "starter" | "plus";
				paidThroughAt: string | null;
				renewsAt: string | null;
				cancellation:
					| { state: "NONE" }
					| {
							state: "SCHEDULED";
							cancelAtUTC: string;
							cancelAtPeriodEnd: boolean | null;
							cancellationReason: string | null;
					  }
					| {
							state: "CANCELED";
							canceledAtUTC: string | null;
							cancellationReason: string | null;
					  };
		  };
	tier: ArtistTier;
	billingStatus: BillingStatus;
	creditBalance: MoneyDisplay | null;
	recentUsage?: {
		period: string;
		totalSpend: MoneyDisplay;
		campaignCount: number;
	};
	/**
	 * Account commercial currency (ISO 4217, uppercase). Present only for
	 * non-USD accounts; absent means USD.
	 */
	currency?: string;
	/**
	 * Amounts that have no source in the account currency yet. They are
	 * reported as null rather than relabeled from another currency.
	 */
	moneyUnavailable?: {
		currency: string;
		fields: Array<"creditBalance">;
		reason: "no_source_in_account_currency";
	};
	warnings?: string[];
	actionRequired?: string[];
};

export type GetBillingSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetPlatformStatusData = {
	platforms: {
		spotify: { connected: boolean; artistName?: string; artistUrl?: string };
		meta: {
			connected: boolean;
			status:
				| "not_connected"
				| "oauth_complete"
				| "selection_pending"
				| "partnership_pending"
				| "partnership_active";
			pageName?: string;
			tokenExpiresAt?: string;
			isTokenExpired?: boolean;
		};
		youtube: { connected: boolean; channelName?: string; channelUrl?: string };
	};
	onboardingComplete: boolean;
	missingForSmartCampaign: string[];
	missingForYouTube: string[];
	warnings?: string[];
	actionRequired?: string[];
};

export type GetPlatformStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type StartYoutubeChannelLinkData = {
	artistId: string;
	artistName: string;
	purpose: "advertising" | "distribution_identity";
	onboardingAttemptId: string;
	authorizationUrl: string;
	expiresAt: string;
	completionCheck:
		| {
				pollTools: string[];
				onboardingFlow: "youtube";
				connectedFlag: "platforms.youtube.connected";
				readyValue: true;
		  }
		| {
				pollTools: string[];
				requirementKey: "youtube_identity";
				readyValue: true;
		  };
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type StartMetaConnectionData = {
	artistId: string;
	artistName: string;
	purpose: "advertising" | "distribution_identity";
	onboardingAttemptId: string | null;
	status:
		| "authorization_url"
		| "already_connected"
		| "billing_check_unavailable"
		| "billing_required";
	authorizationUrl: string | null;
	expiresAt: string | null;
	completionCheck:
		| {
				pollTools: string[];
				onboardingFlow: "meta";
				connectedFlag: "platforms.meta.connected";
				statusField: "platforms.meta.status";
				readyStatuses: Array<
					"oauth_complete" | "partnership_pending" | "partnership_active"
				>;
		  }
		| {
				pollTools: string[];
				requirementKey: "meta_identity";
				readyValue: true;
		  };
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type PauseResumePlatformResult = {
	platform: "META" | "GOOGLE";
	success: boolean;
	message?: string;
};

export type PauseResumeCampaignData = {
	id: string;
	contentTitle: string;
	newStatus: "PAUSED" | "ACTIVE";
	platformResults: PauseResumePlatformResult[];
	warnings?: string[];
	actionRequired?: string[];
};

export type UpdateBudgetData = {
	id: string;
	contentTitle: string;
	previousBudget: MoneyDisplay;
	newBudget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	endDate?: string | undefined;
	warnings?: string[] | undefined;
	actionRequired?: string[] | undefined;
};

export type UpdateCampaignData =
	| PauseResumeCampaignData
	| UpdateBudgetData
	| {
			id: string;
			contentTitle: string;
			didChange: boolean;
			endDate: string | null;
			previousEndDate: string | null;
	  }
	| {
			campaignId: string;
			mode: "GLOBAL" | "COUNTRIES";
			locationTargets: Array<{ code: string; name: string }>;
	  }
	| {
			id: string;
			contentTitle: string;
			campaignId: string;
			strategy: string;
			inventoryConfig: string;
	  }
	| {
			id: string;
			contentTitle: string;
			newStatus: "ARCHIVED";
			warnings: string[];
	  }
	| {
			campaignId: string;
			optimizeForOrganicViews: boolean;
			optimizeForSubscribers: boolean;
	  };

export type MediaAssetSummary = {
	id: string;
	url?: string;
	urlExpiresAt?: string;
	fileType: string;
	fileName?: string;
	width?: number;
	height?: number;
	aspectRatio?: string;
	createdAt: string;
};

export type ListMediaAssetsData = {
	assets: MediaAssetSummary[];
	nextCursor?: string;
};

export type ListMediaAssetsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type LaunchCampaignData = {
	youtubeEntries?: Array<{
		videoId: string;
		playlistId: string;
		selectionIndex: number;
	}>;
	summary: string;
	id: string;
	contentTitle: string;
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	platforms: string[];
	deliveryState: "ACTIVE" | "PENDING_REVIEW" | "CONTENT_VALIDATION";
	isLive: boolean;
	nextSteps: string[];
	warnings?: string[];
};
