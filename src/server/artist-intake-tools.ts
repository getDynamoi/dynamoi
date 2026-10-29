import { z } from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
export const ArtistIntakeInputSchema = z
	.object({
		action: z.enum(["search", "preview", "spotify", "youtube"]),
		countryCode: z.string().length(2).optional(),
		locale: z.string().default("en"),
		organizationId: z.string().uuid().optional(),
		query: z.string().trim().min(3).max(80).optional(),
		url: z.string().trim().min(1).optional(),
	})
	.strict();
export const ARTIST_INTAKE_TOOL_DEFINITION = {
	description:
		"Full profile only. Search Spotify artists by query, preview a Spotify artist URL, or intake an artist from a Spotify or YouTube URL. Intake creates a workspace and starts onboarding using web organization policy; organizationId selects an editable organization. Existing claims, entitlements, caps and provider quotas apply. Sign in through the app or web first.",
	destructiveHint: false,
	name: "dynamoi_onboard_artist",
	openWorldHint: true,
	outputSchema: AnyOutputEnvelopeSchema,
	readOnlyHint: false,
	schema: ArtistIntakeInputSchema,
	title: "Find and Onboard an Artist",
} as const;
