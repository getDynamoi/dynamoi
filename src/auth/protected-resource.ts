import { AUDIENCE_ANALYTICS_CONTRACT } from "../server/audience-analytics.generated";
import {
	BILLING_COUNTRY_READ_CONTRACT,
	BILLING_COUNTRY_SET_CONTRACT,
} from "../server/billing-country.generated";
import { GROWTH_AUDIT_CONTRACT } from "../server/growth-audit.generated";
import { PLAYLIST_ANALYTICS_CONTRACT } from "../server/playlist-analytics.generated";

export const DYNAMOI_BETTER_AUTH_MCP_SCOPES = [
	"dynamoi:read",
	"dynamoi:mcp.full",
	"dynamoi:billing.read",
	"dynamoi:campaign.launch",
	"dynamoi:campaign.write",
	"dynamoi:distribution.apply",
	"dynamoi:distribution.read",
	"dynamoi:platform.read",
	"dynamoi:platform.write",
	"dynamoi:smart_links.write",
] as const;
export const DYNAMOI_MCP_TOOL_SCOPES = {
	// Public product information; callable before sign-in.
	dynamoi_about: [],
	dynamoi_add_campaign_funds: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_apply_for_distribution: [
		"dynamoi:read",
		"dynamoi:distribution.apply",
	],
	dynamoi_contact_support: ["dynamoi:read"],
	dynamoi_create_smart_link_from_spotify: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_create_smart_links_from_spotify_artist: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_delete_account: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_get_account_overview: ["dynamoi:read"],
	dynamoi_get_action_center: ["dynamoi:read", "dynamoi:platform.read"],
	dynamoi_get_artist_analytics: ["dynamoi:read"],
	dynamoi_onboard_artist: ["dynamoi:read", "dynamoi:mcp.full"],
	[AUDIENCE_ANALYTICS_CONTRACT.mcp.definition.name]:
		AUDIENCE_ANALYTICS_CONTRACT.mcp.scopes,
	[BILLING_COUNTRY_READ_CONTRACT.mcp.definition.name]:
		BILLING_COUNTRY_READ_CONTRACT.mcp.scopes,
	dynamoi_get_audit_log: ["dynamoi:read"],
	dynamoi_get_billing: ["dynamoi:read", "dynamoi:billing.read"],
	dynamoi_get_campaign: ["dynamoi:read"],
	dynamoi_get_campaign_readiness: ["dynamoi:read"],
	dynamoi_get_distribution_application: [
		"dynamoi:read",
		"dynamoi:distribution.read",
	],
	dynamoi_get_distribution_status: [
		"dynamoi:read",
		"dynamoi:distribution.read",
		"dynamoi:mcp.full",
	],
	dynamoi_get_earnings: ["dynamoi:read", "dynamoi:distribution.read"],
	[GROWTH_AUDIT_CONTRACT.mcp.definition.name]: GROWTH_AUDIT_CONTRACT.mcp.scopes,
	dynamoi_get_platform_status: ["dynamoi:read", "dynamoi:platform.read"],
	dynamoi_prepare_distribution_release: [
		"dynamoi:read",
		"dynamoi:distribution.apply",
		"dynamoi:mcp.full",
	],
	[PLAYLIST_ANALYTICS_CONTRACT.mcp.definition.name]:
		PLAYLIST_ANALYTICS_CONTRACT.mcp.scopes,
	dynamoi_claim_referral_code: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_get_referrals: ["dynamoi:read"],
	dynamoi_get_resume_funding: ["dynamoi:read", "dynamoi:billing.read"],
	dynamoi_get_smart_link: ["dynamoi:read"],
	dynamoi_get_team: ["dynamoi:read"],
	dynamoi_get_youtube_channel_data: ["dynamoi:read"],
	dynamoi_launch_campaign: ["dynamoi:read", "dynamoi:campaign.launch"],
	dynamoi_list_artists: ["dynamoi:read"],
	dynamoi_list_available_countries: ["dynamoi:read"],
	dynamoi_list_campaigns: ["dynamoi:read"],
	dynamoi_list_media_assets: ["dynamoi:read"],
	dynamoi_list_smart_links: ["dynamoi:read"],
	dynamoi_manage_smart_campaign_creative: [
		"dynamoi:read",
		"dynamoi:campaign.write",
	],
	dynamoi_manage_team: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_manage_youtube_draft: ["dynamoi:read", "dynamoi:campaign.write"],
	dynamoi_open_workspace: ["dynamoi:read"],
	dynamoi_preview_smart_link_themes: ["dynamoi:read"],
	dynamoi_search: ["dynamoi:read"],
	[BILLING_COUNTRY_SET_CONTRACT.mcp.definition.name]:
		BILLING_COUNTRY_SET_CONTRACT.mcp.scopes,
	dynamoi_shop_create_checkout: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_shop_get_quote: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_shop_list_orders: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_smart_campaign_ad_copy: ["dynamoi:read", "dynamoi:campaign.write"],
	dynamoi_smart_link_controls: ["dynamoi:read", "dynamoi:smart_links.write"],
	dynamoi_start_meta_connection: ["dynamoi:read", "dynamoi:platform.write"],
	dynamoi_start_youtube_channel_link: [
		"dynamoi:read",
		"dynamoi:platform.write",
	],
	dynamoi_update_account_profile: ["dynamoi:read", "dynamoi:mcp.full"],
	dynamoi_update_campaign: ["dynamoi:read", "dynamoi:campaign.write"],
	dynamoi_update_smart_link: ["dynamoi:read", "dynamoi:smart_links.write"],
	dynamoi_update_smart_link_artist_hub_settings: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_update_smart_link_artist_settings: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_update_smart_link_description: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_update_smart_link_release_settings: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	fetch: ["dynamoi:read"],
	search: ["dynamoi:read"],
} as const satisfies Record<string, readonly string[]>;

export function buildWwwAuthenticateHeader(options: {
	resourceMetadataUrl: string;
	errorDescription?: string;
	error?: "insufficient_scope" | "invalid_token";
	scope?: string;
}): string {
	const scope = options.scope ?? "dynamoi:read";
	const params = [
		`resource_metadata="${escapeHeaderValue(options.resourceMetadataUrl)}"`,
		`scope="${escapeHeaderValue(scope)}"`,
	];
	// RFC 6750 section 3.1: an initial challenge is not a rejected token.
	// Callers must explicitly identify invalid tokens or insufficient scopes.
	if (options.error) {
		const errorDescription =
			options.errorDescription ??
			(options.error === "insufficient_scope"
				? "Additional Dynamoi permissions are required."
				: "Sign in to Dynamoi to continue.");
		params.push(
			`error="${escapeHeaderValue(options.error)}"`,
			`error_description="${escapeHeaderValue(errorDescription)}"`,
		);
	}
	return `Bearer ${params.join(", ")}`;
}

function escapeHeaderValue(value: string): string {
	const containsControlCharacter = Array.from(value).some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint <= 31 || codePoint === 127;
	});
	if (containsControlCharacter) {
		throw new Error(
			"WWW-Authenticate values cannot contain control characters.",
		);
	}
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
