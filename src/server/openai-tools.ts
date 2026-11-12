import { AnyOutputEnvelopeSchema } from "./output-schemas";
import {
	OPENAI_SEARCH_CONTRACT,
	OPENAI_FETCH_CONTRACT,
} from "./protocols.generated";

/**
 * OpenAI ChatGPT Connectors / Deep Research spec requires every connector
 * to expose tools literally named `search` and `fetch`. These schemas are
 * intentionally minimal to match the spec exactly.
 */

/**
 * OpenAI ChatGPT Connectors / Deep Research search tool result shape.
 * The spec requires `results: [{id, title, url?, text?}]`. We prefix `id`
 * with `${type}:` so the matching `fetch` tool can route.
 */
export type OpenAiSearchData = {
	results: Array<{
		id: string;
		title: string;
		url?: string;
		text?: string;
	}>;
};

/**
 * OpenAI Deep Research fetch tool result shape.
 * The spec requires `id`, `title`, `text`, `url`, optional `metadata`.
 */
export type OpenAiFetchData = {
	id: string;
	title: string;
	text: string;
	url: string;
	metadata?: Record<string, unknown>;
};

export const DynamoiOpenAiSearchInputSchema =
	OPENAI_SEARCH_CONTRACT.mcp.definition.schema;
export const DynamoiOpenAiFetchInputSchema =
	OPENAI_FETCH_CONTRACT.mcp.definition.schema;
export const OPENAI_TOOL_DEFINITIONS = [
	{
		...OPENAI_SEARCH_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...OPENAI_FETCH_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;
