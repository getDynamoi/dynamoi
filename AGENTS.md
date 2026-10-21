# MCP Package Agent Rules

Public standalone package `@dynamoi/mcp` (boundaries statically guarded by AST-grep).

- Releases update `package.json`, `CHANGELOG.md`, `server.json`, and `src/version.ts` together without version regression.
- Verify changes with `bun --cwd packages/mcp build` and `bun --cwd packages/mcp typecheck`.
- `cli/` is the separate npm package `dynamoi` (zero runtime dependencies, tool commands generated from `tools/list`, never hardcoded). Verify it with `bun test cli` and `bun --cwd packages/mcp typecheck`; it never auto-sets consent fields (`cli/src/run.test.ts`).
