import {
	readDefinition,
	prepareDefinition,
	DynamoiPrepareDistributionReleaseInputSchema as PrepareInputSchema,
} from "./distribution-wire";
import * as z from "zod/v4";
import { DISTRIBUTION_APPLICATION_CONTRACT } from "./distribution-application.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
export const DynamoiGetDistributionApplicationInputSchema = z
	.object({
		artistId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetDistributionStatusInputSchema = readDefinition.schema;

export const DynamoiApplyForDistributionInputSchema =
	DISTRIBUTION_APPLICATION_CONTRACT.mcp.definition.schema;

export const DynamoiPrepareDistributionReleaseInputSchema = PrepareInputSchema;

export const DISTRIBUTION_TOOL_DEFINITIONS = [
	{ ...prepareDefinition, outputSchema: AnyOutputEnvelopeSchema },
	{ ...readDefinition, outputSchema: AnyOutputEnvelopeSchema },
	{
		description:
			'Use this for "get my music on Spotify" or "distribute my song": Dynamoi distributes to 100+ stores and artists keep 90% of net receipts. Use this when the user asks whether an artist qualifies for Dynamoi music distribution, wants the five application requirements, or wants the status of an existing distribution application. It checks Spotify connection, at least 1,000 Spotify followers, at least 10,000 verified monthly listeners, connected Facebook Page plus Instagram professional identity, and a connected YouTube channel. Meeting all five requirements permits an application but never guarantees approval. When the connection tools are available, use purpose=distribution_identity for missing Meta or YouTube identity; otherwise tell the user: \'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.\' Identity connections do not require advertising billing.',
		destructiveHint: false,
		name: "dynamoi_get_distribution_application",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetDistributionApplicationInputSchema,
		title: "Check Distribution Application",
	},
	{
		...DISTRIBUTION_APPLICATION_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;
