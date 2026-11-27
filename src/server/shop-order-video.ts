import { Schema } from "effect";
import { optionalWire, strictWire } from "./wire-schema.generated";
import { createOutputEnvelopeSchema } from "./output-schemas";
import {
	SHOP_ATTACH_VIDEO_CONTRACT,
	SHOP_REPLACE_VIDEO_CONTRACT,
} from "./order-video.generated";
export const DynamoiShopAttachVideoInputSchema =
	SHOP_ATTACH_VIDEO_CONTRACT.mcp.definition.schema;
export const DynamoiShopReplaceVideoInputSchema =
	SHOP_REPLACE_VIDEO_CONTRACT.mcp.definition.schema;
export const SHOP_VIDEO_TOOL_DEFINITIONS = [
	{
		...SHOP_ATTACH_VIDEO_CONTRACT.mcp.definition,
		outputSchema: strictWire(
			createOutputEnvelopeSchema(
				SHOP_ATTACH_VIDEO_CONTRACT.mobile.responseSchema,
			).mapFields(
				(fields) => ({
					...fields,
					...{ validationCode: optionalWire(Schema.String) },
				}),
				{ unsafePreserveChecks: true },
			),
		),
	},
	{
		...SHOP_REPLACE_VIDEO_CONTRACT.mcp.definition,
		outputSchema: strictWire(
			createOutputEnvelopeSchema(
				SHOP_REPLACE_VIDEO_CONTRACT.mobile.responseSchema,
			).mapFields(
				(fields) => ({
					...fields,
					...{ validationCode: optionalWire(Schema.String) },
				}),
				{ unsafePreserveChecks: true },
			),
		),
	},
] as const;
