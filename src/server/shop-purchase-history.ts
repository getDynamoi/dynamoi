import { createOutputEnvelopeSchema } from "./output-schemas";
import { SHOP_HISTORY_CONTRACT } from "./purchase-history.generated";
export const DynamoiShopHistoryInputSchema=SHOP_HISTORY_CONTRACT.mcp.definition.schema;
export const SHOP_HISTORY_TOOL_DEFINITION={...SHOP_HISTORY_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(SHOP_HISTORY_CONTRACT.mobile.responseSchema)};
