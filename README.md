# Dynamoi MCP Server

**Music promotion and distribution, built for AI agents.**

[![npm version](https://img.shields.io/npm/v/@dynamoi/mcp?label=npm)](https://www.npmjs.com/package/@dynamoi/mcp)
[![license](https://img.shields.io/npm/l/@dynamoi/mcp)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.getDynamoi%2Fdynamoi-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.getDynamoi/dynamoi)
[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=dynamoi&config=eyJ1cmwiOiJodHRwczovL2R5bmFtb2kuY29tL21jcCJ9)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=dynamoi&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fdynamoi.com%2Fmcp%22%7D)

Music promotion and distribution from your AI agent. Connect Claude, ChatGPT, Codex or Cursor
to check results and manage Smart Links and, where your assistant allows
purchases, launch and fund Spotify and YouTube campaigns with the artist's
explicit consent. Distribution is optional and application-based: artists who
distribute with Dynamoi can manage releases there too. Use the hosted MCP server, or use this package as a library.

```txt
https://dynamoi.com/mcp
```

The hosted server needs no install. Point any MCP client that supports remote
Streamable HTTP and OAuth at that URL, and the user signs in with their
Dynamoi account.

## About Dynamoi

Dynamoi is a music promotion platform founded in 2021 by Trevor Loucks. It
runs managed Meta and YouTube ad campaigns for independent artists, labels,
managers, and YouTube creators on any distributor, alongside free Smart Links
and analytics. Artists who want everything in one account can also distribute
through Dynamoi.

- **Free Smart Links:** release pages and artist hubs built from Spotify
  URLs, with link analytics, themes, validated pixel IDs, and team seats.
- **Managed Smart Campaigns:** Meta ads that promote Spotify tracks, albums,
  and playlists.
- **YouTube campaigns:** managed Google Ads campaigns for YouTube channel
  growth.
- **Music distribution (optional):** delivery to 100+ stores. Applications are
  scored against five requirements, and approval is not guaranteed.
- **YouTube promotion Shop:** one-off YouTube video promotion with no
  subscription.

Campaigns run on Dynamoi's own managed Meta and Google ad infrastructure. They
reach real people through official ad networks, never bots, fake streams, or
paid playlist placement. Results vary and are never guaranteed.

Dynamoi is based in Sioux Falls, South Dakota, and is operated by humans,
assisted by AI. People make the decisions and are accountable for every
campaign and support reply. AI helps with ad creative, campaign monitoring,
reporting, and routine tasks.

Smart Links are free. Starter is $25/month per artist, and your plan
price becomes ad credit. Eligible new artists get double credit the first month.
Campaign budgets start at $10/day. See
[pricing](https://dynamoi.com/pricing).

Agents can read the same overview before sign-in through the `dynamoi_about`
tool or the `dynamoi://about` resource.

## Connect

Each client opens the Dynamoi sign-in page on first use.

### ChatGPT

Open the [Dynamoi app in the ChatGPT directory](https://chatgpt.com/plugins/plugin_asdk_app_69ceb0e849788191aa3fd4d416204a9d).
In developer mode you can instead add a custom app with the MCP server URL
`https://dynamoi.com/mcp` and OAuth authentication. ChatGPT gets the
[directory catalog](#which-tools-a-client-sees).

### Claude (web and desktop)

Open **Settings → Connectors**, choose **Add custom connector**, and enter
`https://dynamoi.com/mcp`.

### Claude Code

```bash
claude mcp add --transport http dynamoi https://dynamoi.com/mcp
```

Then run `/mcp` in Claude Code to sign in.

The Dynamoi plugin from the
[agent plugins repository](https://github.com/getDynamoi/agent-plugins)
bundles Dynamoi skills with the directory catalog on
`https://dynamoi.com/mcp/directory`:

```txt
/plugin marketplace add getDynamoi/agent-plugins
/plugin install dynamoi@dynamoi
```

### Cursor

Use the **Add to Cursor** badge above, or add Dynamoi to `~/.cursor/mcp.json`
(or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "dynamoi": {
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

### VS Code

Use the **Install in VS Code** badge above, or add Dynamoi to
`.vscode/mcp.json`:

```json
{
  "servers": {
    "dynamoi": {
      "type": "http",
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

### Gemini CLI

Install the Dynamoi extension from the
[agent plugins repository](https://github.com/getDynamoi/agent-plugins):

```bash
gemini extensions install https://github.com/getDynamoi/agent-plugins
```

### Codex CLI

```bash
codex mcp add dynamoi --url https://dynamoi.com/mcp
codex mcp login dynamoi
```

Or add the server to `~/.codex/config.toml` and run `codex mcp login dynamoi`:

```toml
[mcp_servers.dynamoi]
url = "https://dynamoi.com/mcp"
```

### OpenClaw

```bash
openclaw mcp add dynamoi --url https://dynamoi.com/mcp --transport streamable-http --auth oauth \
  --oauth-client-metadata-url https://dynamoi.com/api/oauth/clients/openclaw \
  --oauth-scope "offline_access dynamoi:read dynamoi:mcp.full dynamoi:billing.read dynamoi:campaign.launch dynamoi:campaign.write dynamoi:distribution.apply dynamoi:distribution.read dynamoi:platform.read dynamoi:platform.write dynamoi:smart_links.write"
openclaw mcp login dynamoi
```

The metadata URL is Dynamoi's reviewed client document for OpenClaw, which
recognizes OpenClaw by its published identity. OpenClaw gets Full access with
or without it, because it signs in on your own computer.

The [`dynamoi` skill](./skills/dynamoi/SKILL.md) teaches OpenClaw agents the
Dynamoi workflows and safety rules. Install it from ClawHub with
`openclaw skills install @getdynamoi/dynamoi`.

### Command line

The [`dynamoi` CLI](./cli/README.md) signs in once with OAuth and runs any
Dynamoi tool as a command, generated from the live tool schemas:

```bash
npm install --global dynamoi
dynamoi login
dynamoi tools
```

### Other MCP clients

Use `https://dynamoi.com/mcp` as a remote Streamable HTTP server. The client
must handle an OAuth 401 challenge (MCP authorization). Stdio-only clients
need a remote-to-stdio bridge.

## Which tools a client sees

Every client gets one of two tiers. The server picks it from the identity the
OAuth client signs in with, not from anything the client claims about itself.

| Tier | Who gets it | What it includes |
| --- | --- | --- |
| **Full** | Reviewed clients (Codex CLI, Claude on the web or desktop and Claude Code, OpenClaw via Dynamoi's client document) and any app that signs in on your own computer (loopback or `https://vscode.dev/redirect` return addresses, no device code), such as Claude Code, Codex, OpenClaw, Cursor, VS Code and Gemini CLI | All 38 tools, plus the Dynamoi prompts and reference resources, including campaign launches, budget changes and Shop checkout links |
| **Directory** | ChatGPT, Claude added from the directory listing (`https://dynamoi.com/mcp/directory`), unreviewed web apps, device-code sign-ins and requests made before sign-in | 24 review-safe advertised tools: reads, Smart Links, distribution and About. No billing, campaign launch or changes, platform connection starters, or Shop checkout, and the scopes they need are never granted. |

Seeing a tool is not permission to call it. A Full client can approve every
scope for its tools; a Directory client is never granted the scopes that Full
tools need, so those calls are refused.

Signing in does not skip permission checks. Every tool call still needs its
OAuth scopes, and the user's role must allow access to the artist, campaign,
or Smart Link.

## Tools

"Reads" tools are marked read-only. "Changes data" tools write to Dynamoi or
start an action with an outside provider.

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
| `dynamoi_get_artist_analytics` | Artist-level analytics across campaigns | Reads | Both |
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
| `dynamoi_get_billing` | Billing status, credit balance, and promo limits | Reads | Full |
| `dynamoi_get_resume_funding` | Campaign resume-funding breakdown, refusal, and consent requirements | Reads | Full |
| `dynamoi_list_available_countries` | Countries a Smart Campaign or YouTube campaign can target | Reads | Full |
| `dynamoi_get_campaign_readiness` | Check launch inputs before creating anything | Reads | Full |
| `dynamoi_list_media_assets` | Uploaded images and videos that a launch can reuse | Reads | Full |
| `dynamoi_launch_campaign` | Launch a Smart Campaign or YouTube campaign | Changes data | Full |
| `dynamoi_update_campaign` | Pause, resume, or change a campaign's budget or end date | Changes data | Full |
| `dynamoi_manage_youtube_draft` | Inspect an interrupted YouTube launch draft, or discard it when the user asks | Changes data | Full |
| `dynamoi_start_meta_connection` | Start the Facebook Page and Instagram connection in the browser | Changes data | Full |
| `dynamoi_start_youtube_channel_link` | Start the YouTube channel connection in the browser | Changes data | Full |
| `dynamoi_contact_support` | Send a support request or feedback to Dynamoi | Changes data | Full |
| `dynamoi_shop_get_quote` | Estimate a one-off YouTube promotion | Reads | Full |
| `dynamoi_shop_create_checkout` | Create an unpaid Stripe Checkout link for that promotion | Changes data | Full |

Full tool descriptions and input schemas come from `tools/list`, or from
`getDynamoiToolDefinitions()` in this package.

The full-only Studio tools (`dynamoi_update_smart_link_release_settings` and
`dynamoi_update_smart_link_artist_hub_settings`) are not part of the approved
directory contract and are never listed in the directory profile.

Previously approved directory clients may continue calling the exact
`dynamoi_update_smart_link` name with its approved schema. New directory tool
lists omit that compatibility handler and advertise the two single-purpose
operations above. Compatibility calls keep the same Smart Link write scope,
confirmation, account, and domain checks.

## Money and safety

- **Smart Links are free.** Creating or updating them never charges anyone.
- **Launches and budget changes are real.** `dynamoi_launch_campaign` and
  `dynamoi_update_campaign` go through the same backend checks as the Dynamoi
  web and mobile apps: permissions, promo limits, and repeat-request
  protection. Whether a person approves each call is up to the MCP client's
  tool-approval settings, so keep approval on for tools that change data.
- **Every budget needs the user's funding consent.** A `DAILY` or `TOTAL`
  budget is funded one window at a time: available credits and campaign funds
  first, then the card the user saved in Dynamoi is charged automatically (a
  `TOTAL` budget never beyond its total). The agent must show the user the exact
  consent text for the budget type, then send, for `DAILY`,
  `authorizeAutomaticDailyFunding: true` with `acceptedConsentVersion` and
  `acceptedConsentCopyHash`, or, for `TOTAL`, `acceptedTotalConsentVersion` and
  `acceptedTotalConsentCopyHash`. This applies to
  launches, budget updates, and resumes that need card funding. A `DAILY`
  budget refuses the `TOTAL` consent and the reverse; without consent the
  request is refused and never charged. The consent values are exported from
  `@dynamoi/mcp/consent`.
- **Agents never handle payment credentials.** Subscriptions, plans, and
  billing setup happen only in the [Dynamoi dashboard](https://dynamoi.com/dashboard),
  where subscriptions start through hosted Stripe Checkout. No tool starts a
  subscription.
- **Shop checkout is only a link.** `dynamoi_shop_create_checkout` creates an
  unpaid Stripe Checkout Session. The user pays on Stripe, and no order exists
  until the payment is verified.
- **Distribution applications start a manual review.** Submitting one does not
  approve distribution, accept an agreement, or deliver music to stores.
- **The directory catalog** exposes no tools that spend money, start a
  subscription, or create a checkout.

## Authentication

Dynamoi uses OAuth 2.1 through its authorization server at
`https://dynamoi.com/api/auth`. Clients find it through the server's metadata:

- Protected resource: `https://dynamoi.com/.well-known/oauth-protected-resource/mcp`
- Authorization server: `https://dynamoi.com/.well-known/oauth-authorization-server`

| Topic | Support |
| --- | --- |
| Client registration | Client ID Metadata Documents (preferred) and dynamic client registration |
| Grants | Authorization code with PKCE (`S256`), refresh token, and the device authorization grant for CLI and headless agents (`https://dynamoi.com/api/auth/device/code`) |
| Tokens | Bearer tokens in the `Authorization` header. DPoP signing algorithms are advertised. |

Without a token, a request gets a `401` with a `WWW-Authenticate` challenge.
That challenge asks for every scope the client's catalog uses, so one consent
covers the whole catalog. A full-catalog client that signed in with fewer
scopes is asked once for the rest.

| Scope | Allows |
| --- | --- |
| `dynamoi:read` | Reading the account, artists, campaigns, analytics, and Smart Links. Every signed-in tool needs it. |
| `dynamoi:platform.read` | Checking Spotify, Meta, and YouTube connection status |
| `dynamoi:platform.write` | Starting Meta and YouTube connection flows |
| `dynamoi:smart_links.write` | Creating and updating free Smart Links |
| `dynamoi:distribution.read` | Checking distribution requirements and application status |
| `dynamoi:distribution.apply` | Submitting a distribution application |
| `dynamoi:billing.read` | Reading billing status, credit balance, and promo limits |
| `dynamoi:campaign.launch` | Launching new campaigns |
| `dynamoi:campaign.write` | Pausing, resuming, and changing campaign budgets |
| `dynamoi:mcp.full` | Using the Shop quote and checkout tools |

## Protocol support

- MCP **2026-07-28**: stateless requests with per-request `_meta`, including
  `server/discover`.
- MCP **2025-11-25** and earlier `initialize`-based revisions, for clients
  that have not moved to 2026-07-28.
- Streamable HTTP, POST only. Responses are JSON, or SSE for 2025-era
  clients that accept it. The server keeps no sessions and opens no
  standalone stream, so `GET` and `DELETE` return `405`.

## Using the package

Most people should connect to the hosted server. Install the package if you
are building against the Dynamoi MCP contract: tool definitions, Zod schemas,
result types, OAuth scope maps, or the stateless HTTP handler.

```bash
npm install @dynamoi/mcp
```

The package is ESM-only and built on MCP TypeScript SDK v2
(`@modelcontextprotocol/server`).

| Entry point | Main exports |
| --- | --- |
| `@dynamoi/mcp` | `createDynamoiMcpServer`, `handleMcpHttpRequest`, `getDynamoiToolDefinitions`, `DynamoiMcpToolProfile`, `Phase3Adapter`, tool definition arrays and input schemas, Shop schemas, About exports (`getDynamoiAbout`, `DYNAMOI_ABOUT_*`), result and data types, `DYNAMOI_MCP_VERSION` |
| `@dynamoi/mcp/auth` | `DYNAMOI_BETTER_AUTH_MCP_SCOPES`, `DYNAMOI_MCP_TOOL_SCOPES`, `buildWwwAuthenticateHeader` |
| `@dynamoi/mcp/consent` | `PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION`, `PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY`, `PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH` (current v6), the previous v5, v4, v3 and v2 constants, `isCurrentProspectiveBudgetFundingConsent`, and `isRenewableProspectiveBudgetFundingConsent` |

A host provides a `Phase3Adapter`, which connects each tool to its own
services. It also verifies the caller before it serves a request:

```ts
import {
  createDynamoiMcpServer,
  handleMcpHttpRequest,
  type DynamoiMcpToolProfile,
  type Phase3Adapter,
} from "@dynamoi/mcp";

export async function handleMcp(
  request: Request,
  adapter: Phase3Adapter,
  toolProfile: DynamoiMcpToolProfile,
): Promise<Response> {
  // Authenticate the request and check scopes first; this package does not
  // verify tokens. The profile defaults to "directory" if you omit it.
  const parsedBody = request.method === "POST" ? await request.json() : null;
  return handleMcpHttpRequest({
    request,
    parsedBody,
    createServer: () => createDynamoiMcpServer({ adapter, toolProfile }),
  });
}
```

`createDynamoiMcpServer` also accepts `authorizeToolCall` (answer a call
before it runs, for example with a step-up challenge), `onToolCall` (a
telemetry hook), and `oauthScopes`.

Every request builds a new server. `handleMcpHttpRequest` sends 2026-07-28
requests to the SDK's stateless handler and 2025-era requests to a stateless
per-request transport.

## Links

| Resource | URL |
| --- | --- |
| MCP server docs | <https://dynamoi.com/docs/mcp-server> |
| ChatGPT app | <https://chatgpt.com/plugins/plugin_asdk_app_69ceb0e849788191aa3fd4d416204a9d> |
| Agent plugins (Claude Code, Gemini CLI) | <https://github.com/getDynamoi/agent-plugins> |
| MCP Registry | <https://registry.modelcontextprotocol.io/v0/servers?search=io.github.getDynamoi/dynamoi> |
| Agent overview (`llms.txt`) | <https://dynamoi.com/llms.txt> |
| Support | <https://dynamoi.com/support> or support@dynamoi.com (replies within 24 hours) |
| Pricing | <https://dynamoi.com/pricing> |
| npm | <https://www.npmjs.com/package/@dynamoi/mcp> |
| Source and issues | <https://github.com/getDynamoi/dynamoi> |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |
| Capability map | [CAPABILITY_PARITY.md](./CAPABILITY_PARITY.md) |

MIT licensed. See [LICENSE](./LICENSE).

## Artist workspace

`dynamoi_open_workspace({})` returns an authorized artist roster and declares a read-only MCP Apps resource with global and thread entrypoints. On supported hosts, browse campaigns and Smart Links, inspect reported metrics, and deliberately share the selected record and artist references with the next conversation turn. Channel observations retain their own window, provenance and coverage; they are not attributed to the campaign. No pricing, checkout or campaign-write controls appear in this workspace. Unsupported hosts retain the ordinary text and tool result.

The existing Smart Link theme preview remains separate. Composer mentions, settings, file viewers and events are not advertised. Local App/AppBridge fixtures establish their tested contract only; actual ChatGPT host support and public approval require separate evidence.

The browser bridge is bundled locally with the compatible MCP Apps v2 SDK; no CDN is needed. `bun scripts/build-workspace.cjs` regenerates the checked-in source bundle and `bun scripts/build-workspace.cjs --check` verifies reproducibility from the package directory. The ordinary package build runs the same owner. Keep the generated script synchronized with its browser/view/data sources.
