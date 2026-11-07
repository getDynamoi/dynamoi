import { z } from "zod/v4";
import {
	BILLING_COUNTRY_READ_CONTRACT,
	BILLING_COUNTRY_SET_CONTRACT,
} from "./billing-country.generated";
import { ACCOUNT_LANGUAGE_CONTRACT } from "./language.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
export const UpdateAccountProfileSchema =
	ACCOUNT_LANGUAGE_CONTRACT.mcp.definition.schema;
export const SetArtistBillingCountrySchema =
	BILLING_COUNTRY_SET_CONTRACT.mcp.definition.schema;
export const GetArtistBillingCountrySchema =
	BILLING_COUNTRY_READ_CONTRACT.mcp.definition.schema;
const writeAnnotations = {
	destructiveHint: true,
	openWorldHint: false,
	outputSchema: AnyOutputEnvelopeSchema,
	readOnlyHint: false,
} as const;
export const ACCOUNT_SETTINGS_TOOL_DEFINITIONS = [
	{
		...BILLING_COUNTRY_READ_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...ACCOUNT_LANGUAGE_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
	{
		...BILLING_COUNTRY_SET_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;

export type AccountSettingsInput =
	| z.infer<typeof UpdateAccountProfileSchema>
	| z.infer<typeof SetArtistBillingCountrySchema>;
export type AccountEditResult = {
	applied: boolean;
	current: Record<string, string | null>;
	next: Record<string, string | null | undefined>;
	currency: string | undefined;
};

export const DeleteAccountSchema = z
	.object({
		authProvider: z.enum(["apple", "google", "email"]).nullable().optional(),
		confirm: z.boolean().optional(),
		siwaAuthorizationCode: z
			.string()
			.trim()
			.min(1)
			.max(4096)
			.nullable()
			.optional(),
	})
	.strict();
export const DELETE_ACCOUNT_TOOL_DEFINITIONS = [
	{
		...writeAnnotations,
		description:
			"Preview account deletion eligibility and blockers without changing anything. Show the irreversible consequences, then obtain explicit confirmation and call with confirm=true. Deletion starts cleanup; it does not promise all records are erased.",
		name: "dynamoi_delete_account",
		openWorldHint: true,
		schema: DeleteAccountSchema,
		title: "Delete Account",
	},
] as const;
