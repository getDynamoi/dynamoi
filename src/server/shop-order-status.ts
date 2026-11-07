import { createOutputEnvelopeSchema } from "./output-schemas";
import { SHOP_PAUSE_CONTRACT,SHOP_RESUME_CONTRACT,SHOP_RESTART_CONTRACT } from "./shop-order-status.generated";
export const DynamoiShopPauseInputSchema=SHOP_PAUSE_CONTRACT.mcp.definition.schema;
export const DynamoiShopResumeInputSchema=SHOP_RESUME_CONTRACT.mcp.definition.schema;
export const DynamoiShopRestartInputSchema=SHOP_RESTART_CONTRACT.mcp.definition.schema;
export const SHOP_STATUS_TOOL_DEFINITIONS=[{...SHOP_PAUSE_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(SHOP_PAUSE_CONTRACT.mobile.responseSchema)},{...SHOP_RESUME_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(SHOP_RESUME_CONTRACT.mobile.responseSchema)},{...SHOP_RESTART_CONTRACT.mcp.definition,outputSchema:createOutputEnvelopeSchema(SHOP_RESTART_CONTRACT.mobile.responseSchema)}] as const;
