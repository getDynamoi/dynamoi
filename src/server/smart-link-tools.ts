import { z } from "zod/v4";
import { ToolFormatSchema } from "./shared-schemas";
import {
	CREATE_SMART_LINK_FROM_SPOTIFY_DEFINITION,
	CREATE_SMART_LINKS_FROM_SPOTIFY_ARTIST_DEFINITION,
	DynamoiCreateSmartLinkFromSpotifyInputSchema,
	DynamoiCreateSmartLinksFromSpotifyArtistInputSchema,
	DynamoiGetSmartLinkArtistSettingsInputSchema,
	DynamoiGetSmartLinkInputSchema,
	DynamoiListSmartLinksInputSchema,
	DynamoiUpdateSmartLinkArtistHubSettingsInputSchema,
	DynamoiUpdateSmartLinkInputSchema,
	DynamoiUpdateSmartLinkReleaseSettingsInputSchema,
	LIST_SMART_LINKS_DEFINITION,
	UPDATE_SMART_LINK_ARTIST_HUB_SETTINGS_DEFINITION,
	UPDATE_SMART_LINK_ARTIST_SETTINGS_DEFINITION,
	UPDATE_SMART_LINK_DEFINITION,
	UPDATE_SMART_LINK_DESCRIPTION_DEFINITION,
	UPDATE_SMART_LINK_RELEASE_SETTINGS_DEFINITION,
} from "./smart-link-wire.generated";

export {
	DynamoiCreateSmartLinkFromSpotifyInputSchema,
	DynamoiCreateSmartLinksFromSpotifyArtistInputSchema,
	DynamoiGetSmartLinkArtistSettingsInputSchema,
	DynamoiGetSmartLinkInputSchema,
	DynamoiListSmartLinksInputSchema,
	DynamoiUpdateSmartLinkArtistHubSettingsInputSchema,
	DynamoiUpdateSmartLinkArtistSettingsInputSchema,
	DynamoiUpdateSmartLinkDescriptionInputSchema,
	DynamoiUpdateSmartLinkInputSchema,
	DynamoiUpdateSmartLinkReleaseSettingsInputSchema,
} from "./smart-link-wire.generated";

import {
	AnyOutputEnvelopeSchema,
	CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
	CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
	ListSmartLinksOutputEnvelopeSchema,
} from "./output-schemas";
import { SMART_LINK_PROMOTE_CONTRACT } from "./promote-request.generated";
import { SMART_LINK_ANALYTICS_CONTRACT } from "./smart-link-analytics.generated";

export function parseDynamoiGetSmartLinkInput(rawInput: unknown) {
	return DynamoiGetSmartLinkInputSchema.parse(rawInput);
}

/**
 * Handler-side superset: the directory schema stays the public contract for
 * theme/pixel writes and the hub tool adds the hub fields.
 */

export function parseDynamoiCreateSmartLinksFromSpotifyArtistInput(
	rawInput: unknown,
) {
	return DynamoiCreateSmartLinksFromSpotifyArtistInputSchema.parse(rawInput);
}

export function parseDynamoiGetSmartLinkAnalyticsInput(rawInput: unknown) {
	return DynamoiGetSmartLinkAnalyticsInputSchema.parse(rawInput);
}

export function parseDynamoiCreateSmartLinkFromSpotifyInput(rawInput: unknown) {
	return DynamoiCreateSmartLinkFromSpotifyInputSchema.parse(rawInput);
}

export function parseDynamoiListSmartLinksInput(rawInput: unknown) {
	return DynamoiListSmartLinksInputSchema.parse(rawInput);
}

export function parseDynamoiGetSmartLinkArtistSettingsInput(rawInput: unknown) {
	return DynamoiGetSmartLinkArtistSettingsInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkInput(rawInput: unknown) {
	return DynamoiUpdateSmartLinkInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkArtistSettingsInput(
	rawInput: unknown,
) {
	return DynamoiUpdateSmartLinkArtistHubSettingsInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkArtistHubSettingsInput(
	rawInput: unknown,
) {
	return DynamoiUpdateSmartLinkArtistHubSettingsInputSchema.parse(rawInput);
}

export function parseDynamoiUpdateSmartLinkReleaseSettingsInput(
	rawInput: unknown,
) {
	return DynamoiUpdateSmartLinkReleaseSettingsInputSchema.parse(rawInput);
}

export const PHASE_4_TOOL_DEFINITIONS = [
	{
		...CREATE_SMART_LINK_FROM_SPOTIFY_DEFINITION,
		outputSchema: CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
	},
	{
		...CREATE_SMART_LINKS_FROM_SPOTIFY_ARTIST_DEFINITION,
		outputSchema: CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
	},
	{
		...LIST_SMART_LINKS_DEFINITION,
		outputSchema: ListSmartLinksOutputEnvelopeSchema,
	},
	{
		...SMART_LINK_ANALYTICS_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{ ...UPDATE_SMART_LINK_DEFINITION, outputSchema: AnyOutputEnvelopeSchema },
] as const;

/** Directory-facing operation-specific replacements for the legacy dispatcher. */
export const SMART_LINK_UPDATE_OPERATION_TOOL_DEFINITIONS = [
	{
		...UPDATE_SMART_LINK_DESCRIPTION_DEFINITION,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...UPDATE_SMART_LINK_ARTIST_SETTINGS_DEFINITION,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;

export const DynamoiSmartLinkControlsInputSchema =
	SMART_LINK_PROMOTE_CONTRACT.mcp.definition.schema;

/** Full-profile-only Smart Link writes; the directory contract never lists them. */
export const FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS = [
	{
		...SMART_LINK_PROMOTE_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...UPDATE_SMART_LINK_ARTIST_HUB_SETTINGS_DEFINITION,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...UPDATE_SMART_LINK_RELEASE_SETTINGS_DEFINITION,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;

const SmartLinkAnalyticsDateRangeSchema =
	SMART_LINK_ANALYTICS_CONTRACT.analyticsDateRangeSchema;
export const DynamoiGetSmartLinkAnalyticsInputSchema = z
	.object({
		dateRange: SmartLinkAnalyticsDateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
		includeBreakdowns: z.boolean().optional(),
		playLinkId: z.string().uuid(),
	})
	.strict();
