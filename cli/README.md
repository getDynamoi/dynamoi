# dynamoi

**Music promotion and distribution, built for AI agents.**

[![npm version](https://img.shields.io/npm/v/dynamoi?label=npm)](https://www.npmjs.com/package/dynamoi)
[![license](https://img.shields.io/npm/l/dynamoi)](./LICENSE)

The command line for [Dynamoi](https://dynamoi.com): music promotion that works
with any distributor. Run real Spotify and YouTube ad campaigns, and see what
each one moved. Smart Links, analytics and growth audits are free. Artists who
want everything in one account can also release to 100+ stores through Dynamoi.
Use it from a terminal, a script or an agent that can run shell commands.

It is a thin client for Dynamoi's hosted MCP server at
`https://dynamoi.com/mcp`, so it follows the same account, tools and consent
rules as the apps. It has no tool list of its own: every command comes from the
server's tool schemas, so new tools appear without an update.

## Install

```bash
npm install --global dynamoi
# or run it once
npx dynamoi tools
```

Node 20 or newer.

## Sign in

```bash
dynamoi login    # opens your browser; sign in with your Dynamoi account
dynamoi whoami
dynamoi logout   # revokes the session and deletes stored tokens
```

`dynamoi login` uses OAuth 2.1 with PKCE and a loopback redirect on
`127.0.0.1`, the same sign-in as Claude Code and Codex. There are no API keys.
Tokens go to your OS keychain (macOS Keychain, or the Secret Service on Linux)
and fall back to a `0600` file in `$XDG_CONFIG_HOME/dynamoi` (default
`~/.config/dynamoi`). Sessions refresh on their own. Because the app signs in on
your own computer, it gets the Full tool set; before sign-in you see only the
directory set.

## Use

```bash
dynamoi tools                                   # every tool your account can use
dynamoi help get-campaign                       # flags for one tool
dynamoi list-artists
dynamoi get-artist-analytics --artist-id <id> --json
```

A command is the tool name without its `dynamoi_` prefix, with dashes. Flags come
from the tool's input schema: `--artist-id` is `artistId`. Booleans are
`--flag` or `--no-flag`, lists repeat the flag or take commas, and objects take a
JSON string. `--input '<json>'` passes the whole argument object. `--json` prints
the structured result.

## Paid and consequential actions

Tools that spend money or submit something on your behalf require explicit
confirmation arguments (`confirm...`, `authorize...`, `accepted...`). The CLI
never sets them for you:

- In a terminal, it shows the tool's summary and asks `[y/N]` before granting a
  required yes/no confirmation.
- Without a terminal, such as in a script or an agent, pass the flag yourself,
  for example `--confirm-application-submission`.
- Consent versions and hashes are always passed explicitly. Read them in
  `dynamoi help <tool>`.

Dynamoi's server refuses the action without them. Results are never guaranteed.

## Links

- [Dynamoi](https://dynamoi.com) and [pricing](https://dynamoi.com/pricing)
- [MCP server and library (`@dynamoi/mcp`)](https://github.com/getDynamoi/dynamoi)
- [MCP server docs](https://dynamoi.com/docs/mcp-server)

MIT licensed.
