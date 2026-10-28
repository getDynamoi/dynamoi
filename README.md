<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/getDynamoi/dynamoi/main/.github/assets/hero-dark.png">
    <img alt="Dynamoi: music promotion and distribution, built for AI agents" src="https://raw.githubusercontent.com/getDynamoi/dynamoi/main/.github/assets/hero-light.png" width="100%">
  </picture>
</p>

# Dynamoi MCP Server

**Music promotion and distribution, built for AI agents.**

[![npm version](https://img.shields.io/npm/v/@dynamoi/mcp?label=npm)](https://www.npmjs.com/package/@dynamoi/mcp)
[![license](https://img.shields.io/npm/l/@dynamoi/mcp)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.getDynamoi%2Fdynamoi-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.getDynamoi/dynamoi)

Dynamoi's MCP server lets your AI assistant promote music for independent
artists, labels and managers. Ask it how a campaign is doing, build free
Smart Links, and, with the artist's explicit consent, launch real Spotify and
YouTube ad campaigns. It works with whatever distributor the artist already uses.

```txt
https://dynamoi.com/mcp
```

The server is hosted, so there is nothing to install. Add the URL to any MCP
client that supports remote Streamable HTTP and OAuth, then sign in with your
Dynamoi account.

## Connect

Each client opens the Dynamoi sign-in page the first time you use it.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http dynamoi https://dynamoi.com/mcp
```

Run `/mcp` in Claude Code to sign in. For the plugin with Dynamoi skills,
see [agent plugins](https://github.com/getDynamoi/agent-plugins).

</details>

<details>
<summary><b>Claude (web and desktop)</b></summary>

Open **Settings → Connectors**, choose **Add custom connector**, and enter
`https://dynamoi.com/mcp`.

</details>

<details>
<summary><b>ChatGPT</b></summary>

Open the [Dynamoi app in the ChatGPT directory](https://chatgpt.com/plugins/plugin_asdk_app_69ceb0e849788191aa3fd4d416204a9d).
In developer mode you can instead add a custom app with the URL
`https://dynamoi.com/mcp` and OAuth sign-in.

</details>

<details>
<summary><b>Codex CLI</b></summary>

```bash
codex mcp add dynamoi --url https://dynamoi.com/mcp
codex mcp login dynamoi
```

</details>

<details>
<summary><b>Cursor</b></summary>

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=dynamoi&config=eyJ1cmwiOiJodHRwczovL2R5bmFtb2kuY29tL21jcCJ9)

Or add this to `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "dynamoi": { "url": "https://dynamoi.com/mcp" } } }
```

</details>

<details>
<summary><b>VS Code</b></summary>

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=dynamoi&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fdynamoi.com%2Fmcp%22%7D)

Or add this to `.vscode/mcp.json`:

```json
{ "servers": { "dynamoi": { "type": "http", "url": "https://dynamoi.com/mcp" } } }
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

```bash
gemini extensions install https://github.com/getDynamoi/agent-plugins --auto-update
```

Then run `/mcp auth dynamoi`.

</details>

<details>
<summary><b>OpenClaw</b></summary>

```bash
openclaw mcp add dynamoi --url https://dynamoi.com/mcp --transport streamable-http --auth oauth \
  --oauth-client-metadata-url https://dynamoi.com/api/oauth/clients/openclaw \
  --oauth-scope "offline_access dynamoi:read dynamoi:mcp.full dynamoi:billing.read dynamoi:campaign.launch dynamoi:campaign.write dynamoi:distribution.apply dynamoi:distribution.read dynamoi:platform.read dynamoi:platform.write dynamoi:smart_links.write"
openclaw mcp login dynamoi
openclaw skills install @getdynamoi/dynamoi
```

The last line adds the [`dynamoi` skill](./skills/dynamoi/SKILL.md), which teaches
the agent Dynamoi's workflows and safety rules.

</details>

<details>
<summary><b>Terminal</b></summary>

The [`dynamoi` CLI](./cli/README.md) runs every tool as a shell command:

```bash
npx dynamoi login
```

</details>

<details>
<summary><b>Any other MCP client</b></summary>

Add `https://dynamoi.com/mcp` as a remote Streamable HTTP server. The client
must handle the OAuth `401` challenge. Stdio-only clients need a
remote-to-stdio bridge. Per-client notes and OAuth scopes are in
[Connect your AI agent](https://dynamoi.com/docs/mcp-server/connect-your-agent).

</details>

## What you can ask

> How did the Smart Campaign for my new single do last week? Which countries brought the most Spotify listeners?

> Make a Smart Link for this Spotify album and give me the link to share.

> Import my Spotify catalog as Smart Links and show me the artist hub.

> Run a growth audit on my artist profile. What are the three things to fix first?

> Launch a $15/day Smart Campaign for my single in the US and Canada.

> My YouTube channel wants subscribers. Which campaign strategy fits, and what would $150 get me started with?

> Am I eligible for Dynamoi distribution yet?

## What Dynamoi does

[Dynamoi](https://dynamoi.com) is a music promotion platform for independent
artists, labels, managers and YouTube creators, on any distributor.

- **Smart Campaigns.** The Dynamoi team runs Instagram and Facebook ads for
  each release, optimized for listeners who go on to Spotify, not for likes.
- **YouTube campaigns.** Google video ads optimized for the goal the channel
  picks: subscribers, organic views or measured AdSense return.
- **Free tools.** Smart Links, analytics and growth audits on every plan.
- **Distribution, if you want it.** Eligible artists can release to 100+
  stores and keep their masters and 90% of net receipts. Artists who prefer
  their current distributor keep it and use everything else.

Campaigns run on official Meta and Google ad networks, never bots, fake
streams or playlist pitching. Results are measured and shown as they are,
including what did not work.

## Money and permissions

- **Smart Links are free.** Starter is $25/month per artist, and the plan
  includes monthly campaign credit. Campaigns run from $10 a day. See
  [pricing](https://dynamoi.com/pricing).
- **Nothing is charged without consent.** Every launch, budget change or
  card-funded resume needs the artist to accept the exact consent text, which
  the agent passes back as a version and hash. Without it the server refuses
  the call and charges nothing. The consent values are exported from
  `@dynamoi/mcp/consent`.
- **Agents never see payment details.** Plans and cards are set up only in the
  [Dynamoi dashboard](https://dynamoi.com/dashboard). Shop checkout tools
  return an unpaid Stripe link; the user pays on Stripe.
- **Each client gets one of two tool sets**, chosen from the identity it signs
  in with. Reviewed clients and apps that sign in on your own computer
  (Claude Code, Codex, Cursor, VS Code, Gemini CLI, OpenClaw and the `dynamoi`
  CLI) get All 49 tools. ChatGPT, Claude added from its directory listing and
  other web apps get 24 review-safe advertised tools: reads, Smart Links,
  distribution applications and About, with no billing, launches or checkout.
- **Sign-in is OAuth 2.1**, and every call still checks its scopes and the
  user's role for that artist. See
  [client permissions](https://dynamoi.com/docs/mcp-server/client-permissions).

## Tools

"Reads" tools are marked read-only. "Changes data" tools write to Dynamoi or
start an action with an outside provider. Full descriptions and input schemas
come from `tools/list`.

| Tool | What it does | Access | Catalog |
| --- | --- | --- | --- |
| `dynamoi_about` | What Dynamoi is and how to start. Works before sign-in. | Reads | Both |
| `dynamoi_open_workspace` | Open a read-only workspace for the authorized artist roster; supported hosts can browse campaigns and Smart Links | Reads | Both |
| `dynamoi_get_account_overview` | Signed-in account, access counts and suggested next steps | Reads | Both |
| `dynamoi_list_artists` | Artist roster, or one artist's profile and readiness | Reads | Both |
| `dynamoi_search` | Find artists, campaigns, and Smart Links by name | Reads | Both |
| `search` / `fetch` | ChatGPT deep research search and fetch | Reads | Both |
| `dynamoi_list_campaigns` | An artist's campaigns, with type and status filters | Reads | Both |
| `dynamoi_get_campaign` | One campaign, with optional analytics, delivery status, and countries | Reads | Both |
| `dynamoi_get_artist_analytics` | Artist campaign analytics; full profile also includes qualified artist-wide Smart Link totals and up to ten top links | Reads | Both |
| `dynamoi_get_growth_audit` | Spotify growth score, recommendations, listener trends, and playlist reach with status and coverage evidence | Reads | Both |
| `dynamoi_get_playlist_analytics` | Tracked playlist placements, reach, and movement with freshness and snapshot dates | Reads | Both |
| `dynamoi_get_audience_analytics` | Streaming audience by date range, country, service, and paid/free tier | Reads | Both |
| `dynamoi_get_youtube_channel_data` | Observed YouTube channel data by dataset, with coverage and campaign dates | Reads | Both |
| `dynamoi_get_platform_status` | Spotify, Meta, and YouTube connection status and setup blockers | Reads | Both |
| `dynamoi_get_distribution_application` | The five distribution requirements and application status | Reads | Both |
| `dynamoi_apply_for_distribution` | Submit a distribution application for manual review | Changes data | Both |
| `dynamoi_preview_smart_link_themes` | Visual preview of the Smart Link themes | Reads | Both |
| `dynamoi_create_smart_link_from_spotify` | Create a free Smart Link from a Spotify album or track | Changes data | Both |
| `dynamoi_create_smart_links_from_spotify_artist` | Import an artist's catalog as free Smart Links and return the artist hub | Changes data | Both |
| `dynamoi_list_smart_links` | An artist's Smart Links and public URLs | Reads | Both |
| `dynamoi_get_smart_link` | One Smart Link, with optional analytics and artist settings | Reads | Both |
| `dynamoi_update_smart_link_description` | Update one Smart Link's public description | Changes data | Directory |
| `dynamoi_update_smart_link_artist_settings` | Update an artist's Smart Link theme or validated pixel settings | Changes data | Directory |
| `dynamoi_update_smart_link` | Prior multi-action schema for description or artist settings | Changes data | Full |
| `dynamoi_update_smart_link_release_settings` | Update one Smart Link's release video or destination visibility | Changes data | Full |
| `dynamoi_update_smart_link_artist_hub_settings` | Update an artist's hub introduction, official profile links or service order | Changes data | Full |
| `dynamoi_get_action_center` | Artist Action Center revision, task states and distinct actions | Reads | Full |
| `dynamoi_get_earnings` | Authenticated payee own-USD earnings, month axis and bounded detail pages; no payout/tax authority | Reads | Full |
| `dynamoi_get_team` | Organization members and pending invitations; organization authority required. | Reads | Full |
| `dynamoi_get_audit_log` | Sanitized artist/organization audit events with scope-bound cursors. | Reads | Full |
| `dynamoi_get_referrals` | Your referral snapshot; no attribution or commission writes. Pending and available amounts are not approved or paid payouts. | Reads | Full |
| `dynamoi_get_billing` | Billing status, credit balance, promo limits and masked payment-method display | Reads | Full |
| `dynamoi_add_campaign_funds` | Create the unpaid Add campaign funds Stripe Checkout link, after the user approves the amount and currency | Changes data | Full |
| `dynamoi_get_resume_funding` | Campaign resume-funding breakdown, refusal, and consent requirements | Reads | Full |
| `dynamoi_list_available_countries` | Countries a Smart Campaign or YouTube campaign can target | Reads | Full |
| `dynamoi_get_campaign_readiness` | Check launch inputs before creating anything | Reads | Full |
| `dynamoi_list_media_assets` | Uploaded images and videos that a launch can reuse | Reads | Full |
| `dynamoi_launch_campaign` | Launch a Smart Campaign or YouTube campaign | Changes data | Full |
| `dynamoi_update_campaign` | Pause, resume, or change a campaign's budget or end date | Changes data | Full |
| `dynamoi_smart_campaign_ad_copy` | Read/save Smart Campaign creation-draft copy with shared validation and revision checks; never submits or launches | Changes data | Full |
| `dynamoi_manage_youtube_draft` | Inspect an interrupted YouTube launch draft, or discard it when the user asks | Changes data | Full |
| `dynamoi_start_meta_connection` | Start the Facebook Page and Instagram connection in the browser | Changes data | Full |
| `dynamoi_start_youtube_channel_link` | Start the YouTube channel connection in the browser | Changes data | Full |
| `dynamoi_contact_support` | Send a support request or feedback to Dynamoi | Changes data | Full |
| `dynamoi_delete_account` | Preview eligibility and explicitly start irreversible account deletion; cleanup is asynchronous and required records may be retained | Changes data | Full |
| `dynamoi_update_account_profile` | Preview or explicitly confirm a display name or preferred language change | Changes data | Full |
| `dynamoi_set_artist_billing_country` | Preview or explicitly confirm an artist checkout-currency suggestion country; existing currency stays fixed | Changes data | Full |
| `dynamoi_shop_list_orders` | Read your authorized artist’s newest Shop order status and fulfillment timestamps | Reads | Full |
| `dynamoi_shop_get_quote` | Estimate a one-off YouTube promotion | Reads | Full |
| `dynamoi_shop_create_checkout` | Create an unpaid Stripe Checkout link for that promotion | Changes data | Full |

The full-only Studio tools (`dynamoi_update_smart_link_release_settings` and
`dynamoi_update_smart_link_artist_hub_settings`) are never listed in the
directory profile. Previously approved directory clients may keep calling
`dynamoi_update_smart_link` with its approved schema and the same checks.

## FAQ

<details>
<summary><b>Do I have to switch distributors?</b></summary>

No. Campaigns, Smart Links and analytics work with music released through any
distributor. Distribution through Dynamoi is optional and application-based:
it opens at 1,000 Spotify followers and 10,000 monthly listeners, and the
artist decides whether to apply.

</details>

<details>
<summary><b>Can the assistant spend money on its own?</b></summary>

No. Paid calls are refused unless the artist accepted the consent text for
that exact budget. Keep your client's approval prompt on for tools that change
data, and no tool starts a subscription.

</details>

<details>
<summary><b>Why does ChatGPT see fewer tools than Claude Code?</b></summary>

Directory-listed and web clients get the review-safe set. Apps that sign in
on your own computer get the full set. The server decides from the OAuth
client identity, not from what the client says about itself.

</details>

<details>
<summary><b>Which MCP versions does it support?</b></summary>

MCP 2026-07-28 (stateless, with `server/discover`) and 2025-11-25 and earlier
`initialize`-based revisions, over Streamable HTTP POST. The server keeps no
sessions, so `GET` and `DELETE` return `405`. Details:
[MCP server docs](https://dynamoi.com/docs/mcp-server).

</details>

<details>
<summary><b>Can I use this package as a library?</b></summary>

Yes, if you are building against the Dynamoi MCP contract. Most people should
connect to the hosted server instead.

```bash
npm install @dynamoi/mcp
```

The package is ESM-only and built on MCP TypeScript SDK v2.

| Entry point | Main exports |
| --- | --- |
| `@dynamoi/mcp` | `createDynamoiMcpServer`, `handleMcpHttpRequest`, `getDynamoiToolDefinitions`, `DynamoiMcpToolProfile`, `Phase3Adapter`, tool schemas, About exports, result types, `DYNAMOI_MCP_VERSION` |
| `@dynamoi/mcp/auth` | `DYNAMOI_BETTER_AUTH_MCP_SCOPES`, `DYNAMOI_MCP_TOOL_SCOPES`, `buildWwwAuthenticateHeader` |
| `@dynamoi/mcp/consent` | Current and previous budget-funding consent versions, copy and hashes, plus `isCurrentProspectiveBudgetFundingConsent` and `isRenewableProspectiveBudgetFundingConsent` |

A host supplies a `Phase3Adapter` that connects each tool to its services, and
authenticates the request and checks scopes before calling
`handleMcpHttpRequest({ request, parsedBody, createServer })`. This package
does not verify tokens. Every request builds a new server.

</details>

<details>
<summary><b>Where do I get help?</b></summary>

[dynamoi.com/support](https://dynamoi.com/support) or support@dynamoi.com.
We reply within 24 hours. Agents can also send a request with
`dynamoi_contact_support`.

</details>

## Links

- [MCP server docs](https://dynamoi.com/docs/mcp-server) and [agent overview (`llms.txt`)](https://dynamoi.com/llms.txt)
- [MCP Registry entry](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.getDynamoi/dynamoi) and [npm](https://www.npmjs.com/package/@dynamoi/mcp)
- [Changelog](./CHANGELOG.md), [capability map](./CAPABILITY_PARITY.md) and [issues](https://github.com/getDynamoi/dynamoi/issues)

MIT licensed. See [LICENSE](./LICENSE).

---

**Part of Dynamoi** · [MCP server](https://github.com/getDynamoi/dynamoi) · [CLI](https://github.com/getDynamoi/dynamoi/tree/main/cli) · [Agent plugins](https://github.com/getDynamoi/agent-plugins) · [Homebrew tap](https://github.com/getDynamoi/homebrew-tap) · [Chrome extension](https://github.com/getDynamoi/browser-extension) · [dynamoi.com](https://dynamoi.com) · [Docs](https://dynamoi.com/docs) · [Support](https://dynamoi.com/support)
