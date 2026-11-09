import {
	BILLING_COUNTRY_READ_CONTRACT,
	BILLING_COUNTRY_SET_CONTRACT,
} from "./billing-country.generated";
import { ACCOUNT_LANGUAGE_CONTRACT } from "./language.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";
import { ACCOUNT_DELETION_CONTRACT } from "./settings.generated";
export const UpdateAccountProfileSchema =
	ACCOUNT_LANGUAGE_CONTRACT.mcp.definition.schema;
export const SetArtistBillingCountrySchema =
	BILLING_COUNTRY_SET_CONTRACT.mcp.definition.schema;
export const GetArtistBillingCountrySchema =
	BILLING_COUNTRY_READ_CONTRACT.mcp.definition.schema;
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

export const DeleteAccountSchema =
	ACCOUNT_DELETION_CONTRACT.mcp.definition.schema;
export const DELETE_ACCOUNT_TOOL_DEFINITIONS = [
	{
		...ACCOUNT_DELETION_CONTRACT.mcp.definition,
		outputSchema: AnyOutputEnvelopeSchema,
	},
] as const;
