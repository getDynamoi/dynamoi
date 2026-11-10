import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

function asTextPrompt(text: string) {
	return {
		messages: [
			{
				content: { text, type: "text" as const },
				role: "user" as const,
			},
		],
	};
}

export function registerDynamoiPrompts(server: McpServer) {
	server.registerPrompt(
		"dynamoi_find_smart_link_url",
		{
			argsSchema: z.object({
				artistId: z.string().uuid().optional(),
				query: z.string().trim().optional(),
			}),
			description:
				"Find a user's free Smart Link URL and answer with public URLs, titles, and statuses.",
			title: "Find Smart Link URL",
		},
		(args) =>
			asTextPrompt(
				[
					"Find my Dynamoi Smart Link URL.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, use dynamoi_search or dynamoi_list_artists to identify the artist first.",
					args.query ? `Search query: ${args.query}` : "",
					"",
					"Use dynamoi_list_smart_links or dynamoi_search with type=smartlink.",
					"In the final answer, show the release title, artist, public URL, and status. Do not show internal IDs unless I ask for them.",
				]
					.filter(Boolean)
					.join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_explain_free_smart_links",
		{
			argsSchema: z.object({}),
			description:
				"Explain Dynamoi free Smart Links and how they differ from paid managed advertising.",
			title: "Explain Free Smart Links",
		},
		() =>
			asTextPrompt(
				[
					"Explain Dynamoi free Smart Links.",
					"Use MCP resources if needed, especially dynamoi://smart-links/free-plan and dynamoi://business/free-vs-paid.",
					"Be clear: Smart Links are free to create and manage. High-popularity or unverifiable artist links may require verification before public publishing. Managed advertising and ad budgets are separate paid services.",
					"Do not inspect my account data unless I ask about my artists, links, campaigns, billing, or settings.",
				].join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_create_free_smart_link",
		{
			argsSchema: z.object({
				artistId: z.string().uuid().optional(),
				spotifyUrl: z.string().trim().optional(),
			}),
			description:
				"Create free Smart Links from a Spotify artist, album, or track URL.",
			title: "Create Free Smart Link",
		},
		(args) =>
			asTextPrompt(
				[
					"Create a free Dynamoi Smart Link.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, list artists first and ask me which artist owns the link.",
					args.spotifyUrl
						? `Spotify URL: ${args.spotifyUrl}`
						: "Ask me for a Spotify artist, album, or track URL. Playlist URLs are not supported today.",
					"",
					"Smart Links are free to create and manage. High-popularity or unverifiable artist links may require verification before public publishing. This does not create a paid campaign.",
					"If the Spotify URL is an artist URL and I want my hub/catalog, use dynamoi_create_smart_links_from_spotify_artist: use phase=preview, then after approval call phase=confirm with the returned previewId and exact confirmedCount (at most 25). Each nextOffset requires a new preview and confirmation. Preview writes nothing. If it is an album or track URL, use dynamoi_create_smart_link_from_spotify.",
				].join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_audit_campaigns",
		{
			argsSchema: z.object({
				artistId: z.string().uuid().optional(),
			}),
			description:
				"Audit an artist's campaigns and summarize what is working and what to fix next.",
			title: "Audit Campaigns",
		},
		(args) =>
			asTextPrompt(
				[
					"Audit my campaigns in Dynamoi.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, start by listing artists and ask me which one to audit.",
					"",
					"Steps:",
					"1. Use dynamoi_list_campaigns and dynamoi_get_campaign with includeAnalytics=true for the last 7-14 days when one campaign needs a deeper read.",
					"2. Identify any campaigns that are paused, failed, or stuck in a pre-active state and explain why using dynamoi_get_campaign and dynamoi_get_platform_status.",
					"3. Recommend 3-5 next actions with clear priorities.",
				].join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_release_launch_plan",
		{
			argsSchema: z.object({
				artistId: z.string().uuid().optional(),
				contentTitle: z.string().trim().optional(),
				contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]).optional(),
			}),
			description:
				"Create a pragmatic release launch plan and propose a Dynamoi campaign setup.",
			title: "Release Launch Plan",
		},
		(args) =>
			asTextPrompt(
				[
					"Help me plan a release launch using Dynamoi.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, list artists first.",
					args.contentType ? `Content type: ${args.contentType}` : "",
					args.contentTitle ? `Title: ${args.contentTitle}` : "",
					"",
					"Ask any missing questions first (links, creative, budget, countries, dates).",
					"Then propose the simplest campaign plan that fits today’s supported platforms:",
					"- Smart Campaign (Meta) for Spotify releases",
					"- YouTube campaign for videos",
					"",
					"If we proceed to launch:",
					"- For Smart Campaign: dynamoi_launch_campaign only returns a human workspace handoff; the human finishes setup, reviews the funding summary and submits there.",
					"- For YouTube: use dynamoi_launch_campaign with youtubeVideoId.",
				]
					.filter(Boolean)
					.join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_why_campaign_blocked",
		{
			argsSchema: z.object({
				campaignId: z.string().uuid(),
			}),
			description:
				"Diagnose why a campaign is blocked/stuck and recommend the next fix.",
			title: "Why Is My Campaign Blocked?",
		},
		(args) =>
			asTextPrompt(
				[
					"My campaign seems blocked or stuck. Diagnose it and tell me what to do next.",
					`Campaign ID: ${args.campaignId}`,
					"",
					"Steps:",
					"1. Use dynamoi_get_campaign with includeDeploymentStatus=true to inspect current status and blockers.",
					"2. Use dynamoi_get_platform_status for the artist to check Meta/Google connection state.",
					"3. If appropriate, suggest safe next actions and confirm before calling dynamoi_update_campaign.",
				].join("\n"),
			),
	);
}
