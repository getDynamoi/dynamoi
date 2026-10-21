// Canonical public messaging for the Dynamoi MCP server. Registry metadata
// (package.json and server.json), the public server card, agent discovery
// documents, and docs metadata reuse these strings so the wording cannot drift.

/** Product name for the hosted MCP server. */
export const DYNAMOI_MCP_SERVER_NAME = "Dynamoi MCP Server";

/** One-line tagline. */
export const DYNAMOI_MCP_TAGLINE = "Music marketing for AI agents";

/**
 * Short description. The MCP Registry caps `server.json` descriptions at 100
 * characters, and `package.json` and `server.json` must equal this exactly.
 */
export const DYNAMOI_MCP_SHORT_DESCRIPTION =
	"Music distribution and promotion for AI agents: releases, Spotify and YouTube ads, Smart Links.";

/** Standard description for docs metadata, listings, and discovery summaries. */
export const DYNAMOI_MCP_STANDARD_DESCRIPTION =
	"Full-service music distribution and promotion from your AI agent. Connect Claude, ChatGPT, Codex or Cursor to check results, manage releases and Smart Links, and, where your assistant allows purchases, launch Spotify and YouTube campaigns.";

/** Registry limit for `server.json` descriptions. */
export const DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH = 100;
