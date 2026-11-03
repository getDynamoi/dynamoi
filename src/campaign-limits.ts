/** Public campaign policy shared by standalone adapters and backend owners. */
export const CAMPAIGN_CREATIVE_SELECTION_LIMIT = 10;
export const CAMPAIGN_CREATIVE_TOTAL_SELECTION_LIMIT =
	3 * CAMPAIGN_CREATIVE_SELECTION_LIMIT;
export const MIN_CAMPAIGN_DAYS = 5;
export const MAX_SOURCE_AUDIO_MIB = 250;
export const MAX_SOURCE_AUDIO_BYTES = MAX_SOURCE_AUDIO_MIB * 1024 * 1024;

const MIN_DAILY_CAMPAIGN_BUDGET_USD = 10;
export const USD_BUDGET_MINIMUMS = {
	smartCampaign: {
		dailyUsd: MIN_DAILY_CAMPAIGN_BUDGET_USD,
		totalUsd: MIN_DAILY_CAMPAIGN_BUDGET_USD * MIN_CAMPAIGN_DAYS,
	},
	youtube: { dailyUsd: MIN_DAILY_CAMPAIGN_BUDGET_USD, totalUsd: 75 },
} as const;
