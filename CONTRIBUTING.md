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
