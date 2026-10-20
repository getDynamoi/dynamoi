import type * as z from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

type OnboardingToolSchemas = {
	metaConnection: z.ZodObject<z.ZodRawShape>;
	youtubeChannelLink: z.ZodObject<z.ZodRawShape>;
};

export function createPhaseOnboardingToolDefinitions(
	schemas: OnboardingToolSchemas,
) {
	return [
		{
			description:
				"Use this when the user wants to grow a YouTube channel with Dynamoi campaigns or is ready to link a channel to one Dynamoi artist from chat. Set purpose=distribution_identity for the least-privilege identity connection required by a distribution application; that flow does not require advertising billing or Google Ads linking, and its result is checked with dynamoi_get_distribution_application. Use purpose=advertising (the default) for managed YouTube promotion, then poll dynamoi_get_platform_status until platforms.youtube.connected is true. The tool returns a Google OAuth URL bound to the signed-in user and artist.",
			destructiveHint: false,
			idempotentHint: true,
			name: "dynamoi_start_youtube_channel_link",
			openWorldHint: true,
			outputSchema: AnyOutputEnvelopeSchema,
			readOnlyHint: false,
			schema: schemas.youtubeChannelLink,
			title: "Start YouTube Channel Link",
		},
		{
			description:
				"Use this when the user is ready to connect a Facebook Page and Instagram professional account to one Dynamoi artist. Set purpose=distribution_identity for the least-privilege identity connection required by a distribution application; that flow does not require advertising billing, and its result is checked with dynamoi_get_distribution_application. Use purpose=advertising (the default) for Spotify Smart Campaigns; advertising requires active billing and is checked with dynamoi_get_platform_status until platforms.meta.status is oauth_complete, partnership_pending, or partnership_active. Advertising returns billing_required when inactive and billing_check_unavailable for a transient verification failure. This returns a signed Meta OAuth URL and may include a Page/Instagram selection step.",
			destructiveHint: false,
			idempotentHint: true,
			name: "dynamoi_start_meta_connection",
			openWorldHint: true,
			outputSchema: AnyOutputEnvelopeSchema,
			readOnlyHint: false,
			schema: schemas.metaConnection,
			title: "Start Meta Connection",
		},
	] as const;
}
