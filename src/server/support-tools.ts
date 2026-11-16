import type { z } from "zod/v4";
import { AGENT_FEEDBACK_CONTRACT } from "./agent-feedback.generated";
import {
	ContactSupportOutputEnvelopeSchema,
	SendFeedbackOutputEnvelopeSchema,
} from "./output-schemas";

import { SUPPORT_REQUEST_CONTRACT } from "./request.generated";
export const DYNAMOI_SUPPORT_CATEGORIES =
	SUPPORT_REQUEST_CONTRACT.mcp.definition.schema.shape.category.options;
export const DynamoiContactSupportInputSchema =
	SUPPORT_REQUEST_CONTRACT.mcp.definition.schema;
export const DynamoiSendFeedbackInputSchema =
	AGENT_FEEDBACK_CONTRACT.mcp.definition.schema;

export type DynamoiContactSupportInput = z.infer<
	typeof DynamoiContactSupportInputSchema
>;
export type DynamoiSendFeedbackInput = z.infer<
	typeof DynamoiSendFeedbackInputSchema
>;

export const SUPPORT_TOOL_DEFINITIONS = [
	{
		...SUPPORT_REQUEST_CONTRACT.mcp.definition,
		outputSchema: ContactSupportOutputEnvelopeSchema,
	},
	{
		...AGENT_FEEDBACK_CONTRACT.mcp.definition,
		outputSchema: SendFeedbackOutputEnvelopeSchema,
	},
] as const;
