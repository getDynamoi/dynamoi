import type { z } from "zod/v4";
import type { ProposalReadinessOutputSchema } from "./server/output-schemas";
import type { CampaignDisplayStatus, CampaignType } from "./types";

export type CountryCatalogSource =
	| "SMART_CAMPAIGN_COUNTRIES"
	| "GOOGLE_ADS_COUNTRIES";

export type AvailableCountry = {
	code: string;
	name: string;
	googleAdsId: number;
	dominantLanguage?: string;
};

export type ListAvailableCountriesData = {
	campaignType: CampaignType;
	source: CountryCatalogSource;
	countries: AvailableCountry[];
	totalCount: number;
	nextCursor?: string;
	notes: string[];
};

export type ListAvailableCountriesSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type ProductReadiness = {
	isReady: boolean;
	missingRequirements: string[];
	nextAction?: string;
	blockers: string[];
	warnings: string[];
};

export type GetOnboardingStatusData = {
	artistId: string;
	artistName: string;
	smartCampaign: ProductReadiness;
	youtube: ProductReadiness;
	overallNextAction?: string;
};

export type GetOnboardingStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

type ProposalReadiness = z.infer<typeof ProposalReadinessOutputSchema>;

export type GetCampaignReadinessData = {
	proposalReadiness?: ProposalReadiness | null | undefined;
	artistId: string;
	artistName: string;
	campaignType: CampaignType;
	blockingCodes: CampaignProposalBlockingCode[];
	isReady: boolean;
	blockingIssues: string[];
	budgetConstraints: GetCampaignReadinessBudgetConstraints | null;
	warnings: string[];
	missingInputs: string[];
	youtubeEntries?:
		| Array<{ playlistId?: string | null | undefined; videoId: string }>
		| undefined;
	normalizedTargeting:
		| { mode: "GLOBAL" }
		| { mode: "COUNTRIES"; countries: Array<{ code: string; name: string }> };
	recommendedNextAction: string;
};

export type CampaignProposalBlockingCode =
	| "budget_policy"
	| "currency_unavailable"
	| "daily_spending_limit"
	| "funding_unavailable"
	| "invalid_end_date"
	| "onboarding"
	| "unsupported_content_type";

export type GetCampaignReadinessBudgetConstraints = {
	budgetType: "DAILY" | "TOTAL" | null;
	currency: string;
	currencyExponent: number;
	effectiveDailyBudgetMinor: number | null;
	maximumBudgetMinor: number | null;
	maximumDailyBudgetMinor: number;
	maximumTotalBudgetMinor: number;
	minimumBudgetMinor: number | null;
	minimumCampaignDays: number;
	minimumDailyBudgetMinor: number;
	minimumEndDate: string;
	minimumTotalBudgetMinor: number;
};

export type GetCampaignReadinessSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignDeploymentStatusData = {
	campaignId: string;
	artistId: string;
	artistName: string;
	contentTitle: string;
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	deliveryState: "LIVE" | "PENDING" | "BLOCKED" | "PAUSED" | "ENDED";
	platforms: Array<{
		platform: "META" | "GOOGLE";
		status: string;
		linkedProviderId?: string;
		errorMessage?: string;
	}>;
	blockers: string[];
	warnings: string[];
	nextAction?: string;
};

export type GetCampaignDeploymentStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};
