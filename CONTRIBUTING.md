# Contributing

Thanks for taking the time to contribute!

This repository is the public MCP contract for Dynamoi: tool definitions,
schemas, types, OAuth scope maps and the stateless HTTP handler. The hosted
server at `https://dynamoi.com/mcp` runs inside Dynamoi's main application,
which supplies the adapter, authentication and business logic. Changes to tool
contracts, schemas and types can be proposed here.

## Development

Requirements:
- Bun (see `packageManager` in `package.json` for the pinned version)

Common commands:
- Install: `bun install`
- Build: `bun run build`
- Test: `bun test`
- Typecheck: `bun x tsrs --noEmit -p tsconfig.json`
- Registry metadata check: `bun run registry:validate`

## Changelog

We use [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Add user-facing
changes to `CHANGELOG.md` under `[Unreleased]`. Call out anything that breaks
package consumers or MCP clients under **Breaking changes**.

## Release Process (maintainers)

1. Move the `[Unreleased]` entries under a new dated version heading.
2. Bump the version in all three places together: `package.json`, the
   `version` in `server.json`, and the fallback in `src/version.ts`.
   Never publish a lower version.
3. Run `bun run build`, `bun test` and `bun run registry:validate`.
4. Merge to `main`. The `publish` workflow runs `changeset publish`, which
   publishes the `package.json` version to npm only if that version is not on
   npm yet. It authenticates with npm Trusted Publishing (GitHub OIDC, no
   stored token) and attaches provenance. The workflow then publishes
   `server.json` to the official MCP Registry as a remote-only entry for
   `https://dynamoi.com/mcp` (no npm `packages` entry).

Versions are bumped by hand, so do not add Changeset files or run
`changeset version`.

The `dynamoi` CLI lives in `cli/` with its own `package.json` version, and the
same workflow publishes it (`workspaces` lets `changeset publish` see both
packages). Bump `cli/package.json` when the CLI changes; it needs no
`server.json` or `src/version.ts` entry. Test it with `bun test cli`.

## README

`README.md` is the GitHub and npm landing page; depth belongs on
[dynamoi.com/docs](https://dynamoi.com/docs/mcp-server). The monorepo's
`scripts/public/static/validate-agent-discovery-assets.ts` checks its tool
table, profile counts and positioning copy.

## Artist workspace (`dynamoi_open_workspace`)

`dynamoi_open_workspace({})` returns an authorized artist roster and declares a read-only MCP Apps resource with global and thread entrypoints. On supported hosts, browse campaigns and Smart Links, inspect reported metrics, and deliberately share the selected record and artist references with the next conversation turn. Channel observations retain their own window, provenance and coverage; they are not attributed to the campaign. No pricing, checkout or campaign-write controls appear in this workspace. Unsupported hosts retain the ordinary text and tool result.

The existing Smart Link theme preview remains separate. Composer mentions, settings, file viewers and events are not advertised. Local App/AppBridge fixtures establish their tested contract only; actual ChatGPT host support and public approval require separate evidence.

The browser bridge is bundled locally with the compatible MCP Apps v2 SDK; no CDN is needed. `bun scripts/build-workspace.cjs` regenerates the checked-in source bundle and `bun scripts/build-workspace.cjs --check` verifies reproducibility from the package directory. The ordinary package build runs the same owner. Keep the generated script synchronized with its browser/view/data sources.
