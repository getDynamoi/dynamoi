import type { z } from "zod/v4";
import { ContactSupportOutputEnvelopeSchema } from "./output-schemas";

import { SUPPORT_REQUEST_CONTRACT } from "./request.generated";
export const DYNAMOI_SUPPORT_CATEGORIES =
	SUPPORT_REQUEST_CONTRACT.mcp.definition.schema.shape.category.options;
export const DynamoiContactSupportInputSchema =
	SUPPORT_REQUEST_CONTRACT.mcp.definition.schema;

export type DynamoiContactSupportInput = z.infer<
	typeof DynamoiContactSupportInputSchema
>;

export const SUPPORT_TOOL_DEFINITIONS = [
	{
		...SUPPORT_REQUEST_CONTRACT.mcp.definition,
		outputSchema: ContactSupportOutputEnvelopeSchema,
	},
] as const;
