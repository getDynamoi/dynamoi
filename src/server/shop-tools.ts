import * as z from "zod/v4";
import { addRecoverySafetyIssues, ResultErrorRecoverySchema } from "./output-schemas";
import { DynamoiShopQuoteDataSchema,DynamoiShopCheckoutDataSchema,DynamoiShopOrdersDataSchema } from "./wire-shop-agent-wire.generated";
import { SHOP_ORDERS_CONTRACT, SHOP_QUOTE_CONTRACT, SHOP_CHECKOUT_CONTRACT } from "./commerce.generated";
export { DynamoiShopSelectionInputSchema,DynamoiShopTargetingInputSchema,DynamoiShopGetQuoteInputSchema,DynamoiShopCreateCheckoutInputSchema,DynamoiShopQuoteDataSchema,DynamoiShopCheckoutDataSchema,DynamoiShopListOrdersInputSchema,DynamoiShopOrdersDataSchema,DYNAMOI_SHOP_FULL_SCOPE } from "./wire-shop-agent-wire.generated";
export type { DynamoiShopGetQuoteInput,DynamoiShopCreateCheckoutInput,DynamoiShopQuoteData,DynamoiShopCheckoutData,DynamoiShopOrdersData } from "./wire-shop-agent-wire.generated";
export { SHOP_MAX_TARGET_COUNTRY_CODES as DYNAMOI_SHOP_MAX_TARGET_COUNTRY_CODES } from "../shop-limits";
const ToolErrorEnvelopeSchema = z
	.object({
		kind: z.enum(["validation", "business", "platform", "unknown"]),
		message: z.string().min(1),
		...ResultErrorRecoverySchema.shape,
		status: z.literal("error"),
	})
	.strict()
	.superRefine((value, context) => {
		addRecoverySafetyIssues(value, context);
	});

const DynamoiShopQuoteOutputEnvelopeSchema = z.union([
	z
		.object({
			data: DynamoiShopQuoteDataSchema,
			status: z.literal("success"),
		})
		.strict(),
	ToolErrorEnvelopeSchema,
]);

const DynamoiShopCheckoutOutputEnvelopeSchema = z.union([
	z
		.object({
			data: DynamoiShopCheckoutDataSchema,
			status: z.literal("success"),
		})
		.strict(),
	ToolErrorEnvelopeSchema,
]);


export const SHOP_TOOL_DEFINITIONS = [
 {...SHOP_ORDERS_CONTRACT.mcp.definition,outputSchema:z.union([z.object({data:DynamoiShopOrdersDataSchema,status:z.literal("success")}).strict(),ToolErrorEnvelopeSchema])},
 {...SHOP_QUOTE_CONTRACT.mcp.definition,outputSchema:DynamoiShopQuoteOutputEnvelopeSchema},
 {...SHOP_CHECKOUT_CONTRACT.mcp.definition,outputSchema:DynamoiShopCheckoutOutputEnvelopeSchema},
] as const;
