import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { USD_BUDGET_MINIMUMS } from "./budget-minimums";
import type { Phase3Adapter } from "./create-server";
import { registerPlaybookResources } from "./playbook-resources";
import {
	buildYouTubeCampaignStrategiesGuide,
	YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI,
} from "./youtube-strategy-guide";

export function registerDynamoiResources(
	server: McpServer,
	adapter: Phase3Adapter,
) {
	// Static resources (small, cache-friendly reference data)
	server.registerResource(
		"platform-pricing",
		"dynamoi://platform/pricing",
		{
			description:
				"USD reference budget minima. Check artist readiness for the billing currency and applicable minimums.",
			mimeType: "application/json",
			title: "Pricing",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						budgetMinimums: {
							note: "USD reference minima; use artist readiness for actual billing currency and budget minimums.",
							smartCampaign: {
								dailyUsd: USD_BUDGET_MINIMUMS.smartCampaign.dailyUsd,
								note: "Meta Ads for Spotify promotion",
								totalUsd: USD_BUDGET_MINIMUMS.smartCampaign.totalUsd,
							},
							youtube: {
								dailyUsd: USD_BUDGET_MINIMUMS.youtube.dailyUsd,
								note: "Google's ad network for YouTube channel growth",
								totalUsd: USD_BUDGET_MINIMUMS.youtube.totalUsd,
							},
						},
						includes:
							"Free Smart Links, Smart Link analytics, custom themes, validated pixel IDs, team seats, and campaign landing pages where available",
						managedAdvertising: {
							description:
								"Managed advertising subscription and payment setup happen in the Dynamoi dashboard. This MCP server can check billing readiness after setup; it does not start subscriptions or collect payment for managed advertising.",
							paymentSetupLocation: "Dynamoi dashboard",
						},
						noContracts: true,
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"platform-content-types",
		"dynamoi://platform/content-types",
		{ mimeType: "application/json", title: "Content Types" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						campaignTypes: {
							SMART_CAMPAIGN: ["TRACK", "ALBUM", "PLAYLIST"],
							YOUTUBE: ["VIDEO"],
						},
						contentTypes: ["TRACK", "ALBUM", "PLAYLIST", "VIDEO"],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	const countryTargetingResource = async (uri: URL) => ({
		contents: [
			{
				mimeType: "application/json",
				text: JSON.stringify({
					agentGuidance:
						"Always choose a campaign type before suggesting target countries. Smart Campaign and YouTube country catalogs are different.",
					smartCampaigns: {
						meaning:
							"Spotify-focused Smart Campaign markets supported by Dynamoi's Meta campaign workflow.",
						source: "SMART_CAMPAIGN_COUNTRIES",
						tool: "dynamoi_list_available_countries",
						toolInput: { campaignType: "SMART_CAMPAIGN" },
					},
					youtubeCampaigns: {
						meaning:
							"The ad network's geo targets for YouTube campaign deployment and localization.",
						source: "GOOGLE_ADS_COUNTRIES",
						tool: "dynamoi_list_available_countries",
						toolInput: { campaignType: "YOUTUBE" },
					},
				}),
				uri: uri.href,
			},
		],
	});

	server.registerResource(
		"platform-country-targeting",
		"dynamoi://platform/country-targeting",
		{
			description:
				"Explains Smart Campaign vs YouTube country-targeting catalogs.",
			mimeType: "application/json",
			title: "Country Targeting",
		},
		countryTargetingResource,
	);

	server.registerResource(
		"platform-supported-countries",
		"dynamoi://platform/supported-countries",
		{
			description:
				"Legacy alias for country-targeting guidance. Use dynamoi://platform/country-targeting for the canonical resource.",
			mimeType: "application/json",
			title: "Supported Countries",
		},
		countryTargetingResource,
	);

	server.registerResource(
		"smart-links-free-plan",
		"dynamoi://smart-links/free-plan",
		{
			description:
				"Canonical explanation of Dynamoi's free Smart Links plan and how it differs from paid managed advertising.",
			mimeType: "application/json",
			title: "Free Smart Links",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						free: true,
						included: [
							"Unlimited free Smart Links for supported Spotify artist, album, and track URLs",
							"Artist hub pages for catalog-level Smart Links",
							"Smart Link analytics",
							"Artist-level themes",
							"Validated Meta, TikTok, and Google Ads pixel IDs",
							"Artist-level public availability controls",
						],
						noCatch:
							"No per-link fee for Smart Link creation or management. High-popularity or unverifiable artist links may stay unpublished in verification hold until Dynamoi can verify the client relationship.",
						paidSeparately:
							"Managed advertising campaigns and ad budgets are separate paid products.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"smart-links-capabilities",
		"dynamoi://smart-links/capabilities",
		{ mimeType: "application/json", title: "Smart Link Capabilities" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						artistCatalogWorkflow:
							"Use dynamoi_create_smart_links_from_spotify_artist for Spotify artist URLs when the user wants the artist hub, catalog import, or all links. The tool creates/returns a starter link immediately and starts the background catalog import so the user does not need the dashboard.",
						creationInputs: {
							supportedSpotifyKinds: ["artist", "album", "track"],
							unsupportedToday: ["playlist"],
						},
						mutableFields: {
							artistLevel: [
								"defaultTheme",
								"metaPixelId",
								"tiktokPixelId",
								"googleAdsConversionId",
							],
							perLink: ["customDescription"],
						},
						pixelPolicy:
							"Only validated pixel IDs are accepted. Arbitrary JavaScript, tag snippets, and script URLs are not supported.",
						themes: ["classic", "brutalist", "aurora", "cinematic"],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"business-free-vs-paid",
		"dynamoi://business/free-vs-paid",
		{
			description:
				"Clear boundary between free Dynamoi Smart Links and paid managed advertising.",
			mimeType: "application/json",
			title: "Free Smart Links vs Paid Campaigns",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						agentGuidance:
							"Do not imply that a Smart Link creates an ad campaign. Do not imply that campaign budgets are free.",
						freeSmartLinks: {
							claim:
								"Smart Links are free to create and manage. High-popularity or unverifiable artist links may require verification before public publishing.",
							useFor:
								"Spotify landing pages, public release links, link sharing, basic link analytics, artist-level themes, and validated pixel IDs.",
						},
						managedAdvertising: {
							paid: true,
							pricing:
								"Billing and payment setup happen in the Dynamoi dashboard.",
							useFor:
								"Managed Meta and Google ad campaigns for Spotify promotion and YouTube channel growth.",
						},
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"smart-links-agent-guide",
		"dynamoi://smart-links/agent-guide",
		{
			description:
				"How agents should answer Smart Link questions using Dynamoi MCP tools.",
			mimeType: "application/json",
			title: "Smart Link Agent Guide",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						answerWith: [
							"artist hub URL when present",
							"release title",
							"artist name",
							"public URL",
							"public status",
							"one next action when relevant",
						],
						avoidByDefault: [
							"internal UUIDs",
							"database model names",
							"workflow IDs",
							"provider implementation details",
						],
						whenToUse:
							"Use Smart Link tools when the user asks for free release links, artist hubs, full-catalog Spotify landing pages, streaming landing pages, Spotify link pages, Smart Link analytics, themes, pixels, public status, or public URLs.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"mcp-tool-answering-rules",
		"dynamoi://mcp/tool-answering-rules",
		{
			description:
				"General answer rules for Dynamoi MCP tools so agents stop after useful results.",
			mimeType: "application/json",
			title: "MCP Tool Answering Rules",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						emptyStateRule:
							"If the request identifies an artist, campaign, or Smart Link, use the targeted read directly. For missing or ambiguous identity, use the relevant roster or search tool first, then read the resolved resource. For a known empty account, use dynamoi_get_account_overview.recommendedNextActions or dynamoi://playbooks/onboarding-tree to explain supported onboarding; do not treat empty lists as a terminal answer.",
						genericAdvice:
							"Answer generic music marketing questions directly unless the user asks about their Dynamoi account or asks Dynamoi to take an action.",
						stopRule:
							"If a read tool already returns the requested fact in summary form, answer the user instead of chaining more read tools.",
						userFacingFields:
							"Prefer names, public URLs, statuses, money display values, and next actions over internal IDs.",
						writeRule:
							"Before write tools, confirm what will change. After success, answer from the returned record.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	registerPlaybookResources(server);

	server.registerResource(
		"music-marketing-when-to-use-dynamoi",
		"dynamoi://music-marketing/when-to-use-dynamoi",
		{
			description:
				"When an assistant should use Dynamoi account tools versus answering music marketing questions natively.",
			mimeType: "application/json",
			title: "When To Use Dynamoi",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						answerNativelyFor: [
							"general promotion strategy",
							"songwriting, branding, release-planning, or content ideas",
							"music marketing education that does not require the user's Dynamoi data",
						],
						useToolsFor: [
							"finding the user's artists, campaigns, Smart Links, billing, platform connections, or analytics",
							"creating or editing free Smart Links",
							"confirmed campaign mutations such as pause, resume, budget update, or launch workflow",
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"platform-campaign-statuses",
		"dynamoi://platform/campaign-statuses",
		{ mimeType: "application/json", title: "Campaign Statuses" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						statuses: [
							"AWAITING_SMART_LINK",
							"CONTENT_VALIDATION",
							"DEPLOYING",
							"READY_FOR_REVIEW",
							"ACTIVE",
							"PAUSED",
							"SUBSCRIPTION_PAUSED",
							"FAILED",
							"ARCHIVED",
							"ENDED",
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"youtube-campaign-strategies",
		YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI,
		{
			description:
				"How each YouTube campaign strategy works: its goal, what the ad network optimizes for, how to judge results, advertising-tagged vs other-source views, campaign-period vs organic lift, the playlist waterfall, and when results are fair to judge.",
			mimeType: "application/json",
			title: "YouTube Campaign Strategies",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify(buildYouTubeCampaignStrategiesGuide()),
					uri: uri.href,
				},
			],
		}),
	);

	// Dynamic resources: lightweight equivalents to get_* tools
	server.registerResource(
		"artist-resource",
		new ResourceTemplate("dynamoi://artist/{artistId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Artist" },
		async (uri, variables) => {
			const artistId = variables["artistId"];
			const parsed = z.string().uuid().safeParse(artistId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid artistId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getArtist({
				artistId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"campaign-resource",
		new ResourceTemplate("dynamoi://campaign/{campaignId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Campaign" },
		async (uri, variables) => {
			const campaignId = variables["campaignId"];
			const parsed = z.string().uuid().safeParse(campaignId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid campaignId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getCampaign({
				campaignId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"smart-link-resource",
		new ResourceTemplate("dynamoi://smart-link/{playLinkId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Smart Link" },
		async (uri, variables) => {
			const playLinkId = variables["playLinkId"];
			const parsed = z.string().uuid().safeParse(playLinkId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid playLinkId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getSmartLink({
				playLinkId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"smart-link-artist-settings-resource",
		new ResourceTemplate("dynamoi://artist/{artistId}/smart-link-settings", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Smart Link Artist Settings" },
		async (uri, variables) => {
			const artistId = variables["artistId"];
			const parsed = z.string().uuid().safeParse(artistId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid artistId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getSmartLinkArtistSettings({
				artistId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);
}
