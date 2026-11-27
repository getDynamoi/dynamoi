import { Schema } from "effect";
import {
	minWire,
	strictWire,
	superRefineWire,
	enumWire,
} from "./wire-schema.generated";
import {
	addRecoverySafetyIssues,
	ResultErrorRecoverySchema,
} from "./output-schemas";
import {
	DynamoiShopQuoteDataSchema,
	DynamoiShopCheckoutDataSchema,
	DynamoiShopOrdersDataSchema,
} from "./wire-shop-agent-wire.generated";
import {
	SHOP_ORDERS_CONTRACT,
	SHOP_QUOTE_CONTRACT,
	SHOP_CHECKOUT_CONTRACT,
} from "./commerce.generated";
export {
	DynamoiShopSelectionInputSchema,
	DynamoiShopTargetingInputSchema,
	DynamoiShopGetQuoteInputSchema,
	DynamoiShopCreateCheckoutInputSchema,
	DynamoiShopQuoteDataSchema,
	DynamoiShopCheckoutDataSchema,
	DynamoiShopListOrdersInputSchema,
	DynamoiShopOrdersDataSchema,
	DYNAMOI_SHOP_FULL_SCOPE,
} from "./wire-shop-agent-wire.generated";
export type {
	DynamoiShopGetQuoteInput,
	DynamoiShopCreateCheckoutInput,
	DynamoiShopQuoteData,
	DynamoiShopCheckoutData,
	DynamoiShopOrdersData,
} from "./wire-shop-agent-wire.generated";
export { SHOP_MAX_TARGET_COUNTRY_CODES as DYNAMOI_SHOP_MAX_TARGET_COUNTRY_CODES } from "../shop-limits";
const ToolErrorEnvelopeSchema = superRefineWire(
	strictWire(
		Schema.Struct({
			kind: enumWire(["validation", "business", "platform", "unknown"]),
			message: minWire(Schema.String, 1),
			...ResultErrorRecoverySchema.fields,
			status: Schema.Literal("error"),
		}),
	),
	(value, context) => {
		addRecoverySafetyIssues(value, context);
	},
);
const DynamoiShopQuoteOutputEnvelopeSchema = Schema.Union([
	strictWire(
		Schema.Struct({
			data: DynamoiShopQuoteDataSchema,
			status: Schema.Literal("success"),
		}),
	),
	ToolErrorEnvelopeSchema,
]);
const DynamoiShopCheckoutOutputEnvelopeSchema = Schema.Union([
	strictWire(
		Schema.Struct({
			data: DynamoiShopCheckoutDataSchema,
			status: Schema.Literal("success"),
		}),
	),
	ToolErrorEnvelopeSchema,
]);
export const SHOP_TOOL_DEFINITIONS = [
	{
		...SHOP_ORDERS_CONTRACT.mcp.definition,
		outputSchema: Schema.Union([
			strictWire(
				Schema.Struct({
					data: DynamoiShopOrdersDataSchema,
					status: Schema.Literal("success"),
				}),
			),
			ToolErrorEnvelopeSchema,
		]),
	},
	{
		...SHOP_QUOTE_CONTRACT.mcp.definition,
		outputSchema: DynamoiShopQuoteOutputEnvelopeSchema,
	},
	{
		...SHOP_CHECKOUT_CONTRACT.mcp.definition,
		outputSchema: DynamoiShopCheckoutOutputEnvelopeSchema,
	},
] as const;
