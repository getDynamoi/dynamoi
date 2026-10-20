/**
 * Current prospective daily funding consent. A launch or resume funds one
 * first window (the rest of today plus the next full day) in one charge;
 * routine renewals then fund each following day. Like the total-budget
 * consent, the checkbox carries the term that matters at the moment of
 * consent (a daily charge to the default payment method until the campaign is
 * paused or ended); the rest of the charging terms are the Terms of Service
 * section linked beside it. v7 makes credit-first allocation explicit; its
 * funding and collection terms are identical.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION =
	"managed-ads-prospective-daily-v7";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY =
	"Charge my default payment method daily for this campaign's budget, after my available credits, until I pause or end it.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH =
	"f49b33a4f7e8aa3cc814d5057d03e97eaa0c35a9f3f2bc0315dbd031efa0f356";

/**
 * The previous daily consent, with the same terms as v6 spelled out in the
 * copy. Campaigns that accepted it keep renewing under it; new launches and
 * resumes require v7.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_VERSION =
	"managed-ads-prospective-daily-v5";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY =
	"Automatically charge my payment method for this campaign's daily budget, after credits and campaign funds: the rest of today and tomorrow now, then each day ahead, until I pause or end the campaign. Unused funds stay available.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH =
	"14a318c6ef3defc44a13aa4813f0af9d3432db1c2910bada98581e762b35f9e2";

/**
 * The daily consent before v5, with the same terms as v5 plus a funding time
 * zone in the copy. Campaigns that accepted it keep renewing under it; new
 * launches and resumes require v7.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION =
	"managed-ads-prospective-daily-v4";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY =
	"Automatically charge my payment method for this campaign's daily budget, after credits and campaign funds: the rest of today and tomorrow (Pacific time) now, then each day ahead, until I pause or end the campaign. Unused funds stay available.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH =
	"e40485780d7b025c7a10bde969a25eecdcb0b4ebf1783251440e870fd8e10a60";

/**
 * The Pacific-day consent, with the same terms as v4. Campaigns that
 * accepted it keep renewing under it; new launches and resumes require v7.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION =
	"managed-ads-prospective-daily-v3";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the rest of today and all of tomorrow (Pacific time) now, then each following day up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH =
	"53647786746f962c91f5cad78d8bba531c478109041b2808a4a81efbe380abf1";

/**
 * The earlier 24-hour-window daily consent. Campaigns that accepted it keep
 * renewing under its exact terms; new launches and resumes require v7.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION =
	"managed-ads-prospective-daily-v2";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the first approximately 24 hours now and each following 24-hour window up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH =
	"06bbd517d58f345a767be9aaeb59f4959d11c6db16e7d07cb889f3ce7950f805";

/**
 * Total-budget campaign funding consent. A total budget is funded one Pacific
 * day at a time like a daily budget: a launch or resume funds the rest of
 * today and all of tomorrow, then each following day, never more than the
 * total budget in all. Client copy only. The checkbox carries the two terms
 * that matter at the moment of consent (a daily charge to the default payment
 * method, capped by the total budget); the rest of the charging terms are the
 * Terms of Service section linked beside it.
 */
export const TOTAL_BUDGET_FUNDING_CONSENT_VERSION =
	"managed-ads-total-daily-v3";
export const TOTAL_BUDGET_FUNDING_CONSENT_COPY =
	"Charge my default payment method daily for this campaign, after my available credits, up to my total budget.";
export const TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH =
	"8bece5f58e0c94b04b35ac1a98f0e8a142ed968bbe34dcc0d51fe52e2c0d75bd";

/** Whether a client-submitted total-budget consent is exactly the current pair. */
export function isCurrentTotalBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		input.copyVersion === TOTAL_BUDGET_FUNDING_CONSENT_VERSION &&
		input.copyHash === TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH
	);
}

/**
 * Whether a client-submitted consent is exactly the current (version, hash)
 * pair. New launches and resumes accept only this pair; earlier versions stay
 * renewable for campaigns that already accepted them, but a client must not
 * be able to name one for a new authorization after showing the current copy.
 */
export function isCurrentProspectiveBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION &&
		input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH
	);
}

export const FUNDING_CONSENT_BUDGET_TYPE_MISMATCH_MESSAGE =
	"The funding consent does not match this budget type. Send acceptedConsentVersion and acceptedConsentCopyHash (with authorizeAutomaticDailyFunding) only for a DAILY budget, and acceptedTotalConsentVersion and acceptedTotalConsentCopyHash only for a TOTAL budget.";

/** Whether a submitted pair is the current one for the budget type (never interchangeable). */
export function isCurrentFundingConsent(
	input: { copyHash?: string | undefined; copyVersion?: string | undefined },
	budgetType: "DAILY" | "TOTAL",
): boolean {
	const pair = {
		copyHash: input.copyHash ?? "",
		copyVersion: input.copyVersion ?? "",
	};
	return budgetType === "TOTAL"
		? isCurrentTotalBudgetFundingConsent(pair)
		: isCurrentProspectiveBudgetFundingConsent(pair);
}

/** The consent fields the handlers read: the TOTAL pair when sent, else the DAILY fields. */
export function fundingConsentFields(input: {
	acceptedConsentCopyHash?: string | undefined;
	acceptedConsentVersion?: string | undefined;
	acceptedTotalConsentCopyHash?: string | undefined;
	acceptedTotalConsentVersion?: string | undefined;
	authorizeAutomaticDailyFunding?: true | undefined;
}) {
	return input.acceptedTotalConsentVersion && input.acceptedTotalConsentCopyHash
		? {
				acceptedConsentCopyHash: input.acceptedTotalConsentCopyHash,
				acceptedConsentVersion: input.acceptedTotalConsentVersion,
				authorizeAutomaticDailyFunding: true as const,
			}
		: {
				acceptedConsentCopyHash: input.acceptedConsentCopyHash,
				acceptedConsentVersion: input.acceptedConsentVersion,
				authorizeAutomaticDailyFunding: input.authorizeAutomaticDailyFunding,
			};
}

/** Previous exact consent pair; existing receipts remain renewable. */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_VERSION =
	"managed-ads-prospective-daily-v6";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY =
	"Charge my default payment method daily for this campaign's budget, until I pause or end it.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY_HASH =
	"b4c2d0b0eef5a3d54165c4225e9b316d473f07f8581b0715f803575fc815557b";

/** Previous exact consent pair; existing receipts remain renewable. */
export const TOTAL_BUDGET_FUNDING_CONSENT_V2_VERSION =
	"managed-ads-total-daily-v2";
export const TOTAL_BUDGET_FUNDING_CONSENT_V2_COPY =
	"Charge my default payment method daily for this campaign, up to my total budget.";
export const TOTAL_BUDGET_FUNDING_CONSENT_V2_COPY_HASH =
	"e6afbb5d76383f9f336f4924caaf51022c686fa5b77bba4e2f480a1d5a118aed";

/** Exact (version, hash) pairs whose accepted campaigns may renew daily. */
export function isRenewableProspectiveBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		isCurrentProspectiveBudgetFundingConsent(input) ||
		isCurrentTotalBudgetFundingConsent(input) ||
		(input.copyVersion === TOTAL_BUDGET_FUNDING_CONSENT_V2_VERSION &&
			input.copyHash === TOTAL_BUDGET_FUNDING_CONSENT_V2_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH)
	);
}
