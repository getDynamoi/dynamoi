# Dynamoi MCP capability parity

## Release truth

The current source does **not** implement 100% dashboard,
iOS, Android and MCP workflow parity. Universal client registration and full
catalog access are authorization capabilities, not evidence of workflow parity.
The canonical catalog owner is `getDynamoiToolDefinitions` in
`src/server/create-server.ts`; do not maintain a second availability registry here.

The full profile serves 37 tools. The directory profile advertises 24 tools:
22 Dynamoi operations and the OpenAI Connector `search` and `fetch` tools.
It uses separate directory-only tools for Smart Link description and artist
settings updates. The prior combined schema remains callable for compatibility
requests from already-approved clients. On `/mcp`, the host picks the profile
from the verified OAuth client ID; `/mcp/directory` always serves the directory
profile. Every other authenticated client on `/mcp` gets the full profile,
whatever its vendor or client-ID format. Each call still requires its own
scopes and resource RBAC; the Shop tools also require `dynamoi:mcp.full`.
Unauthenticated requests get the directory profile, where only discovery
methods, the public `dynamoi_about` tool and the `dynamoi://about` resource
work. Everything else is refused.

## Implemented boundaries and gaps

| Family | Existing agent surface | Not equivalent or still missing |
| --- | --- | --- |
| Account/artist orientation | Account overview, roster and single-artist reads | Organization invites/roles, full artist settings and account deletion |
| Smart Links | Spotify ingestion, list/detail, description, artist theme/pixels, per-link analytics and theme previews | Full studio/availability controls, every field, aggregate analytics and promotion request workflow |
| Campaigns | List/detail, provider analytics, readiness, existing-asset launch, YouTube draft inspect/discard, pause/resume and eligible single-provider budgets | Draft state machines, source uploads, creative generation/selection/approval, screening, existing targeting edits and multi-provider budgets |
| Analytics | Campaign-provider rollups, growth audit (`dynamoi_get_growth_audit`), tracked playlist analytics (`dynamoi_get_playlist_analytics`), streaming audience analytics (`dynamoi_get_audience_analytics`), per-link analytics and observed YouTube channel data (`dynamoi_get_youtube_channel_data`) | Artist-wide Smart Link aggregation |
| Connections | Meta and YouTube browser OAuth handoffs and status reads | Headless provider login, owner selection or bypass of ownership verification |
| Distribution | Five scored requirements, application state and explicit adult-attested application submission for manual review | Agreement execution, release intake/catalog, rights/splits, royalties, tax, payout and takedown workflows |
| Billing and Shop | Managed billing observations and read-only existing-campaign resume funding breakdown (`dynamoi_get_resume_funding`); unpaid Add campaign funds Checkout creation (`dynamoi_add_campaign_funds`); full-profile Shop quote and unpaid Stripe checkout creation | Managed subscription changes, invoice/funding workflows or agent payment settlement. Shop checkout is not a campaign launch or paid order. |

A real campaign launch, budget edit or pause/resume runs the same shared
backend functions as web and mobile. Operations that need automatic daily card
funding — launches and budget updates (DAILY or TOTAL), and resumes of
campaigns that require card funding — must carry the funding-consent fields
(`authorizeAutomaticDailyFunding` with the exact `acceptedConsentVersion` and
`acceptedConsentCopyHash`, plus `clientRequestId`) after the user is shown the
consent copy for the budget type (the TOTAL consent only on a TOTAL budget);
without them the shared path refuses before any provider call.
Existing owners retain RBAC, spending authority and idempotency checks. Demo
responses remain simulations with no provider, billing or campaign effects.

The native parity manifest is itself incomplete: planned/partial entries must
not be presented as completed mobile behavior. StoreKit, Play Billing, APNs and
native session mechanics are client-specific implementations; removing them from
an agent operation count does not make the underlying commerce journey complete.

## Protocol boundary

`handleMcpHttpRequest` uses MCP TypeScript SDK v2. It serves 2026-07-28
requests (`server/discover`, per-request `_meta`) statelessly, and 2025-era
`initialize`-based requests (2025-11-25 and earlier) through a stateless
per-request transport. That transport answers in JSON when the client does not
accept SSE. Only POST is served: GET and DELETE return 405. There is no
standalone SSE subscription channel and no session resumption. CIMD uses the
`mcp-2026-07-28` metadata profile. Authentication challenges, discovery and
both protocol eras must still be tested against the deployed edge and origin.
Do not advertise universal host compatibility without host journey tests.

## Read-only workspace

`dynamoi_open_workspace` exposes a bounded authorized artist roster and an MCP Apps HTML resource with global/thread entrypoints. The view reads existing campaign and Smart Link records through individually registered directory read tools. Selected context is explicit and bounded; only the selected record and artist IDs, displayed name/status and qualified observed results are shared, with no billing fields, raw records or spend. Host support is capability-detected. The existing theme-preview resource is retained. Composer mentions, settings, file viewers, events and public host acceptance are not implemented or claimed.
