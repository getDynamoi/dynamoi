import * as z from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
export const DynamoiGetDistributionApplicationInputSchema = z
	.object({
		artistId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetDistributionStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		section: z.enum(["application", "agreement", "catalog", "releases"]),
	})
	.strict();

export const DynamoiApplyForDistributionInputSchema = z
	.object({
		adultSignerAttestation: z.literal(true),
		applicantCountry: z.string().trim().length(2),
		artistId: z.string().uuid(),
		confirmApplicationSubmission: z.literal(true),
		payoutCountry: z.string().trim().length(2),
		taxResidencyCountry: z.string().trim().length(2),
		userIntentSummary: z.string().trim().min(1).max(500),
	})
	.strict();

export const DISTRIBUTION_TOOL_DEFINITIONS = [
	{
		description:
			"Read application, agreement, catalog or release status for an accessible artist through the same owners as web/mobile. Full profile only. Release intake status requires editor access, as on web; catalog retains viewer scoping. Catalog is a status overview; releases returns the latest 20 submissions, not complete history. Rights and agreement attestation and sending releases to stores are done by the artist in web or the app.",
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
		description:
			"Submit an artist's application for Dynamoi music distribution after the user explicitly asks to apply and all five eligibility requirements are met. This records an application for manual review; it does not approve distribution, accept an agreement, submit a release, transfer rights, configure splits or tax forms, or deliver music to stores. All three valid ISO 3166-1 alpha-2 country or territory codes, an adult signer attestation, confirmApplicationSubmission=true, and a concise userIntentSummary are required. Country, tax, payout, sanctions, and provider-delivery checks remain manual progression gates after intake; a valid code does not imply approval. Repeated submission is idempotent for an active application.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_apply_for_distribution",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiApplyForDistributionInputSchema,
		title: "Apply for Music Distribution",
	},
] as const;
