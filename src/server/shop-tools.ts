import * as z from "zod/v4";
import {
	addRecoverySafetyIssues,
	ResultErrorRecoverySchema,
} from "./output-schemas";

export const DYNAMOI_SHOP_FULL_SCOPE = "dynamoi:mcp.full" as const;
export const DYNAMOI_SHOP_MAX_TARGET_COUNTRY_CODES = 50;
const DYNAMOI_SHOP_CUSTOM_MIN_TARGET_VIEWS = 25_000;
const DYNAMOI_SHOP_CUSTOM_MAX_TARGET_VIEWS = 1_000_000;
const DYNAMOI_SHOP_CUSTOM_MIN_DURATION_DAYS = 7;
const DYNAMOI_SHOP_CUSTOM_MAX_DURATION_DAYS = 30;

const ShopPackageSelectionInputSchema = z
	.object({
		kind: z.literal("package"),
		tier: z.enum(["starter", "standard", "premium"]),
	})
	.strict();

const ShopCustomSelectionInputSchema = z
	.object({
		campaignDurationDays: z
			.number()
			.int()
			.min(DYNAMOI_SHOP_CUSTOM_MIN_DURATION_DAYS)
			.max(DYNAMOI_SHOP_CUSTOM_MAX_DURATION_DAYS),
		kind: z.literal("custom"),
		targetViews: z
			.number()
			.int()
			.min(DYNAMOI_SHOP_CUSTOM_MIN_TARGET_VIEWS)
			.max(DYNAMOI_SHOP_CUSTOM_MAX_TARGET_VIEWS),
	})
	.strict();

export const DynamoiShopSelectionInputSchema = z.discriminatedUnion("kind", [
	ShopPackageSelectionInputSchema,
	ShopCustomSelectionInputSchema,
]);

const ShopGlobalTargetingInputSchema = z
	.object({ mode: z.literal("GLOBAL") })
	.strict();

const ShopIncludedTargetingInputSchema = z
	.object({
		countryCodes: z
			.array(z.string().regex(/^[A-Z]{2}$/))
			.min(1)
			.max(DYNAMOI_SHOP_MAX_TARGET_COUNTRY_CODES),
		mode: z.literal("INCLUDE"),
	})
	.strict();

export const DynamoiShopTargetingInputSchema = z.discriminatedUnion("mode", [
	ShopGlobalTargetingInputSchema,
	ShopIncludedTargetingInputSchema,
]);

export const DynamoiShopGetQuoteInputSchema = z
	.object({
		marketLocale: z.string().trim().min(2).max(35),
		selection: DynamoiShopSelectionInputSchema,
		storefrontSlug: z
			.string()
			.trim()
			.min(1)
			.max(160)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		targeting: DynamoiShopTargetingInputSchema,
		youtubeUrl: z.string().trim().url().max(500),
	})
	.strict();

export const DynamoiShopCreateCheckoutInputSchema = z
	.object({
		expectedTotal: z
			.object({
				amountMinor: z.number().int().positive(),
				currency: z.string().regex(/^[A-Z]{3}$/),
			})
			.strict(),
		promotion: DynamoiShopGetQuoteInputSchema,
		requestId: z.string().uuid(),
	})
	.strict();

const ShopSelectionOutputSchema = DynamoiShopSelectionInputSchema;
const ShopTargetingOutputSchema = z.discriminatedUnion("mode", [
	ShopGlobalTargetingInputSchema,
	z
		.object({
			countryCodes: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
			mode: z.literal("INCLUDE"),
		})
		.strict(),
]);

const ShopMoneyOutputSchema = z
	.object({
		amountMinor: z.number().int().positive(),
		currency: z.string().regex(/^[A-Z]{3}$/),
		formatted: z.string().min(1).max(80),
	})
	.strict();

export const DynamoiShopQuoteDataSchema = z
	.object({
		campaignDurationDays: z.number().int().positive().nullable(),
		estimatedViews: z
			.object({
				basis: z.literal("rolling_30_day_cpv"),
				max: z.number().int().nonnegative(),
				min: z.number().int().nonnegative(),
				notGuaranteed: z.literal(true),
			})
			.strict()
			.nullable(),
		kind: z.literal("shop_quote"),
		reviewRequired: z.boolean(),
		selection: ShopSelectionOutputSchema,
		storefront: z
			.object({
				currency: z.string().regex(/^[A-Z]{3}$/),
				marketLocale: z.string(),
				slug: z.string(),
			})
			.strict(),
		targeting: ShopTargetingOutputSchema,
		total: ShopMoneyOutputSchema,
		video: z
			.object({
				normalizedUrl: z.string().url(),
				videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
			})
			.strict(),
	})
	.strict();

export const DynamoiShopCheckoutDataSchema = z
	.object({
		checkoutUrl: z.string().url(),
		expiresAt: z.string().datetime({ offset: true }),
		kind: z.literal("shop_checkout"),
		orderCreated: z.literal(false),
		paymentCompleted: z.literal(false),
		status: z.literal("checkout_required"),
		total: ShopMoneyOutputSchema,
	})
	.strict();

const ToolErrorEnvelopeSchema = z
	.object({
		kind: z.enum(["validation", "business", "platform", "unknown"]),
		message: z.string().min(1),
		...ResultErrorRecoverySchema.shape,
		status: z.literal("error"),
	})
	.strict()
	.superRefine((value, context) => {
		addRecoverySafetyIssues(value, context);
	});

const DynamoiShopQuoteOutputEnvelopeSchema = z.union([
	z
		.object({
			data: DynamoiShopQuoteDataSchema,
			status: z.literal("success"),
		})
		.strict(),
	ToolErrorEnvelopeSchema,
]);

const DynamoiShopCheckoutOutputEnvelopeSchema = z.union([
	z
		.object({
			data: DynamoiShopCheckoutDataSchema,
			status: z.literal("success"),
		})
		.strict(),
	ToolErrorEnvelopeSchema,
]);

export type DynamoiShopGetQuoteInput = z.infer<
	typeof DynamoiShopGetQuoteInputSchema
>;
export type DynamoiShopCreateCheckoutInput = z.infer<
	typeof DynamoiShopCreateCheckoutInputSchema
>;
export type DynamoiShopQuoteData = z.infer<typeof DynamoiShopQuoteDataSchema>;
export type DynamoiShopCheckoutData = z.infer<
	typeof DynamoiShopCheckoutDataSchema
>;

export const DynamoiShopListOrdersInputSchema = z
	.object({
		artistId: z.string().trim().min(1).max(255),
		limit: z.number().int().min(1).max(20).default(10),
		orderId: z.string().trim().min(1).max(255).optional(),
	})
	.strict();
export const DynamoiShopOrdersDataSchema = z
	.object({
		orders: z
			.array(
				z
					.object({
						campaignStatus: z.string().nullable(),
						completedAt: z.string().nullable(),
						createdAt: z.string(),
						deploymentCompletedAt: z.string().nullable(),
						orderId: z.string(),
						status: z.string(),
					})
					.strict(),
			)
			.max(20),
	})
	.strict();
export type DynamoiShopOrdersData = z.infer<typeof DynamoiShopOrdersDataSchema>;

export const SHOP_TOOL_DEFINITIONS = [
	{
		description:
			"Read up to 20 newest Shop orders for an authorized artist, optionally filtered by order ID. Returns observed order status, campaign status and fulfillment timestamps. No refunds or fulfillment changes.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_shop_list_orders",
		openWorldHint: false,
		outputSchema: z.union([
			z
				.object({
					data: DynamoiShopOrdersDataSchema,
					status: z.literal("success"),
				})
				.strict(),
			ToolErrorEnvelopeSchema,
		]),
		readOnlyHint: true,
		schema: DynamoiShopListOrdersInputSchema,
		title: "Read Shop Orders",
	},
	{
		description:
			"Calculate a read-only Dynamoi Shop estimate for a one-off YouTube video promotion. The server derives storefront price, currency, targeting, and estimated views. This does not reserve a price, create checkout, collect payment, create an order, or launch a campaign.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_shop_get_quote",
		openWorldHint: false,
		outputSchema: DynamoiShopQuoteOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiShopGetQuoteInputSchema,
		title: "Get Shop Promotion Estimate",
	},
	{
		description:
			"After explicit user intent, revalidate and re-quote a one-off Dynamoi Shop YouTube promotion and create an unpaid Stripe Checkout Session. The expected total is a compare-and-reject guard, never a price instruction. This does not charge the user, create an order, or launch a campaign; the user must open and complete Stripe Checkout.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_shop_create_checkout",
		openWorldHint: true,
		outputSchema: DynamoiShopCheckoutOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiShopCreateCheckoutInputSchema,
		title: "Create Unpaid Shop Checkout",
	},
] as const;
