import { AnyOutputEnvelopeSchema } from "./output-schemas";
import {
	PUBLIC_SPOTIFY_POPULARITY_CONTRACT,
	PUBLIC_YOUTUBE_CHANNEL_AUDIT_CONTRACT,
} from "./public-try-tools.generated";

// Zero-auth, read-only "try before signup" tools, full profile only. Their
// empty scopes advertise the noauth security scheme.
export const PUBLIC_TRY_TOOL_DEFINITIONS = [
	{
		...PUBLIC_SPOTIFY_POPULARITY_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...PUBLIC_YOUTUBE_CHANNEL_AUDIT_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;
