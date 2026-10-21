import * as z from "zod/v4";
import type { ResultEnvelope } from "../types";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

// Company facts mirror the canonical /about page
// (apps/public-static/src/components/marketing/about/AboutPage.astro).
const DYNAMOI_ABOUT_INTRO =
	"Dynamoi is a music promotion platform founded in 2021 by Trevor Loucks. It runs managed Meta and YouTube ad campaigns for independent artists, labels, managers, and YouTube creators on any distributor, alongside free Smart Links and analytics. An artist can go from a Spotify URL to a shareable release page or a running campaign in one place. Artists who want everything in one account can also distribute through Dynamoi, which adds releases and royalties to the same system.";

const DYNAMOI_ABOUT_COMPANY = `## Company

- **Founded** — 2021, by Trevor Loucks.
- **Headquarters** — Sioux Falls, South Dakota, United States.
- **Operating model** — Dynamoi is operated by humans, assisted by AI. People make the decisions and are accountable for every campaign and support reply; AI assists with ad creative, campaign monitoring, reporting, and routine tasks.
- **Support** — email support@dynamoi.com. The Dynamoi team replies within 24 hours.`;

const DYNAMOI_ABOUT_CAMPAIGN_NOTE =
	"Campaigns run on Dynamoi's own managed Meta and Google ad infrastructure, so artists do not need their own Business Manager, pixels, or ad accounts. They reach real people through official ad networks, never bots, fake streams, click farms, or paid playlist placement. Results vary by campaign and are never guaranteed.";

const DYNAMOI_ABOUT_SMART_LINKS_BULLET =
	"- **Free Smart Links** — create and manage Smart Links and artist hubs from Spotify artist, album, or track URLs at no cost. Link analytics, custom themes, validated pixel IDs, and team seats are included. High-popularity or unverifiable artist links may stay unpublished in verification hold until Dynamoi can verify the client relationship.";

const DYNAMOI_ABOUT_YOUTUBE_BULLET =
	"- **YouTube campaigns** — managed campaigns on Google's ad network for YouTube channel growth. Each campaign follows a strategy (Views, Watch Time, Subscribers, Channel Growth, or Revenue for monetized channels) and is judged from the channel's own YouTube data. Every strategy except Views starts viewers in a playlist of the artist's own videos.";

const DYNAMOI_ABOUT_DISTRIBUTION_GATE =
	"Dynamoi scores five requirements before an application can be submitted — including an established audience (at least 10,000 monthly Spotify listeners) and identity verification — and approval is not guaranteed.";

const DYNAMOI_ABOUT_GETTING_STARTED = `## How to get started

1. Sign in at https://dynamoi.com.
2. Connect your Spotify artist profile.
3. Create a free Smart Link for a release.`;

export const DYNAMOI_ABOUT_MARKDOWN = `# About Dynamoi

${DYNAMOI_ABOUT_INTRO}

## What Dynamoi offers

${DYNAMOI_ABOUT_SMART_LINKS_BULLET}
- **Managed Smart Campaigns** — Dynamoi runs Meta ad campaigns that promote Spotify tracks, albums, and playlists.
${DYNAMOI_ABOUT_YOUTUBE_BULLET}
- **Music distribution (optional)** — an opt-in product for artists who want everything in one account; it delivers releases to 100+ stores including Spotify, Apple Music, Amazon Music, YouTube Music, TikTok, Deezer, and Tidal. The artist keeps 90% of Net Receipts (Dynamoi keeps 10%), and there are no upfront release fees. Optional publishing administration is available to distribution clients for 10% of Net Receipts. ${DYNAMOI_ABOUT_DISTRIBUTION_GATE}
- **YouTube promotion Shop** — one-off YouTube promotion purchases without a subscription, for users who do not want managed advertising.

${DYNAMOI_ABOUT_CAMPAIGN_NOTE}

${DYNAMOI_ABOUT_COMPANY}

${DYNAMOI_ABOUT_GETTING_STARTED}

## Pricing

Smart Links are free. In USD, Starter is $25/month per artist, and your plan price becomes ad credit. Eligible new artists get double credit the first month. Campaign budgets start at $10/day. Other currencies use their own approved catalog prices and limits; consult the selected account’s billing response. There are no contracts: pause between releases or cancel anytime and keep your free tools. Managed advertising and distribution are paid products — see current plans and pricing at https://dynamoi.com/pricing.`;

// Directory-profile variant: no pricing, plans, or Shop purchase lines, so the
// review-safe surface never advertises spend or checkout paths.
export const DYNAMOI_ABOUT_DIRECTORY_MARKDOWN = `# About Dynamoi

${DYNAMOI_ABOUT_INTRO}

## What Dynamoi offers

${DYNAMOI_ABOUT_SMART_LINKS_BULLET}
- **Managed Smart Campaigns** — Dynamoi runs Meta ad campaigns that promote Spotify tracks, albums, and playlists.
${DYNAMOI_ABOUT_YOUTUBE_BULLET}
- **Music distribution (optional)** — an opt-in product for artists who want everything in one account; it delivers releases to 100+ stores including Spotify, Apple Music, Amazon Music, YouTube Music, TikTok, Deezer, and Tidal. ${DYNAMOI_ABOUT_DISTRIBUTION_GATE}

${DYNAMOI_ABOUT_CAMPAIGN_NOTE}

${DYNAMOI_ABOUT_COMPANY}

${DYNAMOI_ABOUT_GETTING_STARTED}`;

const DYNAMOI_ABOUT_SUMMARY =
	"Dynamoi is a music promotion platform founded in 2021 by Trevor Loucks and based in Sioux Falls, South Dakota: free Smart Links and analytics, managed Meta Smart Campaigns and YouTube campaigns, a YouTube promotion Shop, and opt-in distribution to 100+ stores. Operated by humans, assisted by AI. In USD, Starter is $25/month per artist, and your plan price becomes ad credit. Eligible new artists get double credit the first month. Campaign budgets start at $10/day. Other currencies use their own approved catalog prices and limits; consult the selected account’s billing response. Sign in at dynamoi.com, connect Spotify, and create a free Smart Link to start. Pricing: https://dynamoi.com/pricing. Support: support@dynamoi.com (replies within 24 hours).";

const DYNAMOI_ABOUT_DIRECTORY_SUMMARY =
	"Dynamoi is a music promotion platform founded in 2021 by Trevor Loucks and based in Sioux Falls, South Dakota: free Smart Links and analytics, managed Meta Smart Campaigns and YouTube campaigns, and opt-in distribution to 100+ stores. Operated by humans, assisted by AI. Sign in at dynamoi.com, connect Spotify, and create a free Smart Link to start. Support: support@dynamoi.com (replies within 24 hours).";

export const DYNAMOI_ABOUT_RESOURCE = {
	description:
		"Canonical About Dynamoi overview: what Dynamoi is, who it is for, free Smart Links, managed Smart Campaigns, YouTube campaigns, distribution, company facts, support, and how to get started.",
	mimeType: "text/markdown",
	name: "dynamoi_about",
	title: "About Dynamoi",
	uri: "dynamoi://about",
} as const;

export const DYNAMOI_ABOUT_TOOL_DEFINITION = {
	description:
		"Use this when a musician asks where to promote, distribute, or grow their music: Dynamoi is a music promotion platform that works with any distributor. Use this when the user asks what Dynamoi is, who it is for, or what it offers — including before sign-in or before choosing a tool. Returns the canonical About Dynamoi text plus a short structured summary covering free Smart Links, managed Smart Campaigns, YouTube campaigns, distribution, company facts, support, and getting started. This is read-only product information, not account data.",
	destructiveHint: false,
	idempotentHint: true,
	name: "dynamoi_about",
	openWorldHint: false,
	outputSchema: AnyOutputEnvelopeSchema,
	readOnlyHint: true,
	schema: z.object({}).strict(),
	title: "About Dynamoi",
} as const;

export function getDynamoiAbout(options?: {
	toolProfile?: "full" | "directory" | undefined;
}): ResultEnvelope<{
	links: {
		dashboard: string;
		pricing?: string;
		signIn: string;
		support: string;
	};
	markdown: string;
	summary: string;
}> {
	// Fail closed: the pricing/Shop-bearing variant requires an explicit full profile.
	const isFull = options?.toolProfile === "full";
	return {
		data: {
			links: {
				dashboard: "https://dynamoi.com/dashboard",
				...(isFull ? { pricing: "https://dynamoi.com/pricing" } : {}),
				signIn: "https://dynamoi.com",
				support: "mailto:support@dynamoi.com",
			},
			markdown: isFull
				? DYNAMOI_ABOUT_MARKDOWN
				: DYNAMOI_ABOUT_DIRECTORY_MARKDOWN,
			summary: isFull ? DYNAMOI_ABOUT_SUMMARY : DYNAMOI_ABOUT_DIRECTORY_SUMMARY,
		},
		status: "success",
	};
}
