import { Schema } from "effect";
import {
	WireUuid,
	formatWire,
	maxWire,
	optionalWire,
	trimWire,
} from "./wire-schema.generated";
export { ToolFormatSchema } from "./account-schema.generated";
export const UserIntentSummarySchema = optionalWire(
	maxWire(trimWire(Schema.String), 500),
);
export const ClientRequestIdSchema = optionalWire(
	formatWire(Schema.String, WireUuid),
);
import { SMART_LINK_ANALYTICS_CONTRACT } from "./smart-link-analytics.generated";
export const IsoCalendarDateSchema =
	SMART_LINK_ANALYTICS_CONTRACT.isoCalendarDateSchema;
export const DateRangeSchema = SMART_LINK_ANALYTICS_CONTRACT.dateRangeSchema;
