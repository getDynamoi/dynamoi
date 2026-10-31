import * as z from "zod/v4";
import { DISTRIBUTION_APPLICATION_CONTRACT } from "./distribution-application.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
export const DynamoiGetDistributionApplicationInputSchema = z
	.object({
		artistId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetDistributionStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		section: z.enum([
			"application",
			"agreement",
			"catalog",
			"releases",
			"foundation",
		]),
	})
	.strict();

export const DynamoiApplyForDistributionInputSchema =
	DISTRIBUTION_APPLICATION_CONTRACT.mcp.definition.schema;

export const DynamoiPrepareDistributionReleaseInputSchema = z
	.object({
		artistId: z.string().uuid(),
		desiredReleaseDate: z.string(),
		hasCollaborators: z.boolean(),
		labelName: z.string().nullable(),
		notes: z.string().nullable(),
		releaseTitle: z.string(),
		releaseType: z.string(),
		splits: z.array(
			z
				.object({
					payeeEmail: z.string(),
					payeeName: z.string(),
					payeeRole: z.string().nullable(),
					sharePercent: z.number(),
				})
				.strict(),
		),
		tracks: z.array(
			z
				.object({
					isrc: z.string().nullable(),
					title: z.string(),
					trackNumber: z.number(),
					versionTitle: z.string().nullable(),
				})
				.strict(),
		),
	})
	.strict();

export const DISTRIBUTION_TOOL_DEFINITIONS = [
	{
		description:
			"Prepare metadata, tracks and proposed splits for artist review in a private expiring web form. Does not submit a release, attest rights, accept agreements or invite collaborators. Full profile only.",
		destructiveHint: false,
		name: "dynamoi_prepare_distribution_release",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiPrepareDistributionReleaseInputSchema,
		title: "Prepare Release Handoff",
	},
	{
		description:
			"Read native foundation, application, agreement, catalog or release status for an accessible artist through the same owners as web/mobile. Full profile only. Release intake status requires editor access, as on web; catalog retains viewer scoping. Catalog is a status overview; releases returns the latest 20 submissions, not complete history. Rights and agreement attestation and sending releases to stores are done by the artist in web or the app.",
		destructiveHint: false,
		name: "dynamoi_get_distribution_status",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetDistributionStatusInputSchema,
		title: "Read Distribution Status",
	},
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
