// USD campaign budget minimums published to MCP clients. This package is
// standalone, so it cannot import web-shared; check-backend-parity pins these
// to the currency catalog's USD row.
export const USD_BUDGET_MINIMUMS = {
	smartCampaign: { dailyUsd: 10, totalUsd: 50 },
	youtube: { dailyUsd: 10, totalUsd: 75 },
} as const;
