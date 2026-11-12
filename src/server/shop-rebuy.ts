import { createOutputEnvelopeSchema } from "./output-schemas";
import {
	SHOP_REBUY_CUSTOM_CONTRACT,
	SHOP_REBUY_PRESETS_CONTRACT,
	SHOP_REBUY_CHECKOUT_CONTRACT,
} from "./rebuy-contract.generated";
export const DynamoiShopRebuyCustomInputSchema =
	SHOP_REBUY_CUSTOM_CONTRACT.mcp.definition.schema;
export const DynamoiShopRebuyPresetsInputSchema =
	SHOP_REBUY_PRESETS_CONTRACT.mcp.definition.schema;
export const DynamoiShopRebuyCheckoutInputSchema =
	SHOP_REBUY_CHECKOUT_CONTRACT.mcp.definition.schema;
export const SHOP_REBUY_TOOL_DEFINITIONS = [
	{
		...SHOP_REBUY_CUSTOM_CONTRACT.mcp.definition,
		outputSchema: createOutputEnvelopeSchema(
			SHOP_REBUY_CUSTOM_CONTRACT.mobile.responseSchema,
		),
	},
	{
		...SHOP_REBUY_PRESETS_CONTRACT.mcp.definition,
		outputSchema: createOutputEnvelopeSchema(
			SHOP_REBUY_PRESETS_CONTRACT.mobile.responseSchema,
		),
	},
	{
		...SHOP_REBUY_CHECKOUT_CONTRACT.mcp.definition,
		outputSchema: createOutputEnvelopeSchema(
			SHOP_REBUY_CHECKOUT_CONTRACT.mobile.responseSchema,
		),
	},
] as const;
