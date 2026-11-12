import { z } from "zod/v4";
import { createOutputEnvelopeSchema } from "./output-schemas";
import {
	DRAFT_REOPEN_CONTRACT,
	MEDIA_CATALOG_CONTRACT,
} from "./drafts-media.generated";
export const DraftMediaReadInputSchema =
	DRAFT_REOPEN_CONTRACT.mcp.definition.schema;
export const DRAFT_MEDIA_READ_TOOL_DEFINITION = {
	...DRAFT_REOPEN_CONTRACT.mcp.definition,
	outputSchema: createOutputEnvelopeSchema(
		z.union([
			DRAFT_REOPEN_CONTRACT.mobile.responseSchema,
			MEDIA_CATALOG_CONTRACT.mobile.responseSchema,
		]),
	),
};
