import * as z from "zod/v4";

export { ToolFormatSchema } from "./account-schema.generated";

export const UserIntentSummarySchema = z.string().trim().max(500).optional();

export const ClientRequestIdSchema = z.string().uuid().optional();

import { SMART_LINK_ANALYTICS_CONTRACT } from "./smart-link-analytics.generated";
export const IsoCalendarDateSchema =
	SMART_LINK_ANALYTICS_CONTRACT.isoCalendarDateSchema;
export const DateRangeSchema = SMART_LINK_ANALYTICS_CONTRACT.dateRangeSchema;
