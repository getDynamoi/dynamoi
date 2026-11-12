// Canonical public messaging for the Dynamoi MCP server. Registry metadata
// (package.json and server.json), the public server card, agent discovery
// documents, and docs metadata reuse these strings so the wording cannot drift.

/** Product name for the hosted MCP server. */
export const DYNAMOI_MCP_SERVER_NAME = "Dynamoi MCP Server";

/** One-line tagline. */
export const DYNAMOI_MCP_TAGLINE =
	"Music promotion and distribution, built for AI agents.";

/**
 * Short description. The MCP Registry caps `server.json` descriptions at 100
 * characters, and `package.json` and `server.json` must equal this exactly.
 */
export const DYNAMOI_MCP_SHORT_DESCRIPTION =
	"Promote a song on Spotify or promote a video on YouTube from your AI agent. Free Smart Links.";

/** Standard description for docs metadata, listings, and discovery summaries. */
export const DYNAMOI_MCP_STANDARD_DESCRIPTION =
	"Dynamoi is how artists promote a song on Spotify or promote a video on YouTube, from the AI agent they already use. Connect Claude, ChatGPT, Codex or Cursor to check results and manage Smart Links and, where your assistant allows purchases, launch and fund Spotify and YouTube campaigns with the artist's explicit consent. Smart Links are free, with no plan or subscription needed: a free smart link for music for every release, and a free link in bio for musicians through the artist hub. Works with any distributor. Distribution is optional and application-based: artists who distribute with Dynamoi can manage releases there too.";

/** Registry limit for `server.json` descriptions. */
export const DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH = 100;
