# dynamoi

**Music promotion and distribution, built for AI agents.**

[![npm version](https://img.shields.io/npm/v/dynamoi?label=npm)](https://www.npmjs.com/package/dynamoi)
[![license](https://img.shields.io/npm/l/dynamoi)](./LICENSE)

The `dynamoi` command line runs [Dynamoi](https://dynamoi.com) music promotion
from a terminal, a script or any agent that can run shell commands. Check
campaign results, build free Smart Links, and launch Spotify and YouTube ad
campaigns, with the same account, tools and consent rules as the Dynamoi apps.
It works with any distributor.

<p align="center">
  <img alt="Running dynamoi --help in a terminal" src="https://raw.githubusercontent.com/getDynamoi/dynamoi/main/.github/assets/cli-help.gif" width="720">
</p>

## Install

```bash
# npm, run once without installing
npx dynamoi --help

# Homebrew (macOS and Linux)
brew trust getdynamoi/tap && brew install getdynamoi/tap/dynamoi

# npm, installed globally
npm install --global dynamoi
```

Needs Node 20 or newer. Homebrew installs Node for you.

## Commands

| Command | What it does |
| --- | --- |
| `dynamoi login` | Sign in through your browser |
| `dynamoi whoami` | Show the signed-in account |
| `dynamoi logout` | Revoke the session and delete stored tokens |
| `dynamoi tools` | List every tool your account can use |
| `dynamoi tools --query "<intent>"` | Find up to ten matching tools; use `--limit 1..10` and `--json` as needed |
| `dynamoi help <tool>` | Show one tool's flags; `--json` returns its exact catalog definition |
| `dynamoi <tool> [--flag value]` | Run a tool. Add `--json` for machine-readable output |

```bash
dynamoi list-artists
dynamoi get-artist-analytics --artist-id <id> --json
dynamoi get-growth-audit --artist-id <id>
```

A command is the tool name without its `dynamoi_` prefix, with dashes. Flags
come from the tool's input schema, so `--artist-id` is `artistId`. Booleans
take `--flag` or `--no-flag`, lists repeat the flag or take commas, objects
take a JSON string, and `--input '<json>'` passes the whole argument object.

The CLI has no tool list of its own. Every command is generated from the
schemas of Dynamoi's hosted MCP server at `https://dynamoi.com/mcp`, so new
tools appear without an update.

For bounded discovery, start with `dynamoi tools --query "billing payment method" --json`,
then use the returned `schemaCommand` to load only the selected definition.
Search reads the current server catalog and returns names, short descriptions,
and read/write annotations; it never invokes a tool. Matching is by keyword,
so an unrelated result is not evidence that an operation is supported. The CLI
still fetches the full catalog over HTTP; the bounded result limits what an
agent needs to read. Exact schemas, defaults,
and consent requirements come from `dynamoi help <tool> --json`. Ordinary
`dynamoi tools --json` still returns the complete input-schema list.

## How sign-in works

`dynamoi login` uses OAuth 2.1 with PKCE and a loopback redirect on
`127.0.0.1`, the same sign-in as Claude Code and Codex. There are no API keys
to copy. Tokens are stored in your OS keychain (macOS Keychain, or the Secret
Service on Linux), with a `0600` file in `~/.config/dynamoi` as the fallback,
and sessions refresh on their own. Because the CLI signs in on your own
computer, it gets the full tool set.

## Paid actions need your yes

Tools that spend money or submit something for you require explicit
confirmation arguments (`confirm...`, `authorize...`, `accepted...`), and the
CLI never fills them in for you.

- In a terminal, it shows the tool's summary and asks `[y/N]` first.
- In a script or an agent, you pass the flag yourself, for example
  `--confirm-application-submission`.
- Budget consent versions and hashes are always passed explicitly. Find them
  with `dynamoi help <tool>`.

Without them, Dynamoi's server refuses the action and charges nothing.

## Links

- [Dynamoi](https://dynamoi.com) and [pricing](https://dynamoi.com/pricing)
- [MCP server and library](https://github.com/getDynamoi/dynamoi)
- [MCP server docs](https://dynamoi.com/docs/mcp-server)

MIT licensed.

---

**Part of Dynamoi** · [MCP server](https://github.com/getDynamoi/dynamoi) · [CLI](https://github.com/getDynamoi/dynamoi/tree/main/cli) · [Agent plugins](https://github.com/getDynamoi/agent-plugins) · [Homebrew tap](https://github.com/getDynamoi/homebrew-tap) · [Chrome extension](https://github.com/getDynamoi/browser-extension) · [dynamoi.com](https://dynamoi.com) · [Docs](https://dynamoi.com/docs) · [Support](https://dynamoi.com/support)
