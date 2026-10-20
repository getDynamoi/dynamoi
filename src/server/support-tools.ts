import { z } from "zod/v4";
import { ContactSupportOutputEnvelopeSchema } from "./output-schemas";

export const DYNAMOI_SUPPORT_CATEGORIES = [
	"sign_in",
	"tool_error",
	"billing",
	"campaign",
	"distribution",
	"smart_links",
	"feedback",
	"other",
] as const;

export const DynamoiContactSupportInputSchema = z
	.object({
		category: z.enum(DYNAMOI_SUPPORT_CATEGORIES),
		errorMessage: z.string().trim().max(1000).optional(),
		failedTool: z
			.string()
			.regex(/^[a-z][a-z0-9_]{0,63}$/)
			.optional(),
		message: z.string().trim().min(10).max(4000),
		subject: z.string().trim().min(3).max(150),
	})
	.strict();

export type DynamoiContactSupportInput = z.infer<
	typeof DynamoiContactSupportInputSchema
>;

export const SUPPORT_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to report a problem with Dynamoi (a tool error, sign-in or permission problem, wrong data, a billing, campaign or distribution question) or send Dynamoi feedback. Show the user the subject and message and get their OK before sending. Dynamoi attaches the signed-in account and this agent's identity, and support replies by email to the account address. Never include passwords, tokens, API keys or card numbers. Sending changes no campaign, billing or account data.",
		destructiveHint: false,
		idempotentHint: false,
		name: "dynamoi_contact_support",
		openWorldHint: false,
		outputSchema: ContactSupportOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiContactSupportInputSchema,
		title: "Contact Dynamoi Support",
	},
] as const;
