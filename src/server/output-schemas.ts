import * as z from "zod/v4";
import type { GetCampaignReadinessData } from "../readiness-types";
import { ChannelResultsSchema } from "./channel-results-schema";
import { CampaignFundingPreviewOutputSchema } from "./funding-preview-schema.generated";
import { YouTubeChannelDataSchema } from "./youtube-channel-data-schema";

export const SmartCampaignRecoverySelectionSchema = z.object({
	id: z.string(),
	kind: z.string(),
});
export const SmartCampaignRecoverySchema = z.object({
	actions: z.array(z.string()),
	affectedSelection: SmartCampaignRecoverySelectionSchema.nullable(),
	kind: z.string(),
	occurredAt: z.string(),
	reasonCode: z.string().optional(),
	retryAfter: z.string().nullable(),
	stage: z.string(),
});
export const SmartCampaignLaunchProjectionSchema = z.object({
	recovery: SmartCampaignRecoverySchema.optional(),
	validationCode: z.string().optional(),
	validationStage: z.string().optional(),
});
export type SmartCampaignLaunchProjection = z.infer<
	typeof SmartCampaignLaunchProjectionSchema
>;

const ResultErrorCodeSchema = z.enum([
	"ACCOUNT_READ_ONLY",
	"INVALID_SPOTIFY_SOURCE",
	"CAPABILITY_REQUIRED",
	"INSUFFICIENT_SCOPE",
	"TENANT_ACCESS_DENIED",
	"STATE_CONFLICT",
	"QUOTE_CHANGED",
	"RATE_LIMITED",
	"OUTPUT_INVALID",
	"UNKNOWN_EFFECT",
]);

const ResultNextActionSchema = z
	.object({
		field: z.string().trim().min(1).max(120).optional(),
		kind: z.enum(["provide_input", "read_status", "reconnect", "handoff"]),
		reason: z.string().trim().min(1).max(240).optional(),
	})
	.strict();

/** Optional, additive recovery metadata for error envelopes. */
export const ResultErrorRecoverySchema = z
	.object({
		code: ResultErrorCodeSchema.optional(),
		draftId: z.string().uuid().optional(),
		failureStage: z.string().trim().min(1).max(120).optional(),
		field: z.string().trim().min(1).max(120).optional(),
		nextAction: ResultNextActionSchema.optional(),
		prerequisite: z.string().trim().min(1).max(240).optional(),
		retryAfterSeconds: z.number().int().min(0).max(86_400).optional(),
		retryable: z.boolean().optional(),
		screeningResult: z.string().trim().min(1).max(120).optional(),
	})
	.strict();

/**
 * Retryable recovery is reserved for a bounded rate-limit wait. Producers are
 * responsible for confirming that retrying their operation is safe to repeat.
 */
export function addRecoverySafetyIssues(
	value: z.infer<typeof ResultErrorRecoverySchema>,
	context: z.RefinementCtx,
) {
	if (value.retryAfterSeconds !== undefined && value.retryable !== true) {
		context.addIssue({
			code: "custom",
			message: "Retry timing requires retryable=true.",
			path: ["retryAfterSeconds"],
		});
	}
	if (value.retryable !== true) {
		return;
	}
	if (value.code !== "RATE_LIMITED") {
		context.addIssue({
			code: "custom",
			message: "Only RATE_LIMITED results may be retryable.",
			path: ["retryable"],
		});
	}
	if (value.retryAfterSeconds === undefined || value.retryAfterSeconds <= 0) {
		context.addIssue({
			code: "custom",
			message: "Retryable results require a positive retryAfterSeconds value.",
			path: ["retryAfterSeconds"],
		});
	}
}

const RESULT_ERROR_RECOVERY_FIELDS = [
	"recovery",
	"validationCode",
	"validationStage",
	"draftId",
	"failureStage",
	"screeningResult",
	"code",
	"field",
	"nextAction",
	"prerequisite",
	"retryable",
	"retryAfterSeconds",
] as const;

const MoneyDisplayOutputSchema = z
	.object({
		amount: z.number(),
		// Major-unit USD amount, present only when currency is "USD"; kept for
		// backward compatibility — new consumers should use amount + currency.
		amountUsd: z.number().optional(),
		currency: z.string(),
		formatted: z.string(),
	})
	.strict()
	.superRefine((value, context) => {
		const hasUsdAmount = value.amountUsd !== undefined;
		if (value.currency.toUpperCase() === "USD" ? !hasUsdAmount : hasUsdAmount) {
			context.addIssue({
				code: "custom",
				message: "amountUsd is required for USD and forbidden otherwise.",
				path: ["amountUsd"],
			});
		}
		if (hasUsdAmount && value.amountUsd !== value.amount) {
			context.addIssue({
				code: "custom",
				message: "amountUsd must equal amount for USD.",
				path: ["amountUsd"],
			});
		}
	});

export function createOutputEnvelopeSchema(
	dataSchema: z.ZodType,
	options?: { allowPartial?: boolean; launch?: boolean },
) {
	const statuses = options?.allowPartial
		? (["success", "partial_success", "error"] as const)
		: (["success", "error"] as const);
	return z
		.object({
			data: dataSchema.optional(),
			kind: z
				.enum(["validation", "business", "platform", "unknown"])
				.optional(),
			message: z.string().optional(),
			...ResultErrorRecoverySchema.shape,
			...(options?.launch ? SmartCampaignLaunchProjectionSchema.shape : {}),
			status: z.enum(statuses),
		})
		.strict()
		.superRefine((value, context) => {
			if (value.status === "error" && !value.message) {
				context.addIssue({
					code: "custom",
					message: "Error tool results require a message.",
					path: ["message"],
				});
			}
			if (value.status !== "error" && value.data === undefined) {
				context.addIssue({
					code: "custom",
					message: "Successful tool results require data.",
					path: ["data"],
				});
			}
			const valueRecord = value as Record<string, unknown>;
			if (value.status !== "error") {
				for (const field of RESULT_ERROR_RECOVERY_FIELDS) {
					if (valueRecord[field] !== undefined) {
						context.addIssue({
							code: "custom",
							message: "Recovery metadata is only valid on error results.",
							path: [field],
						});
					}
				}
				return;
			}
			addRecoverySafetyIssues(value, context);
		});
}

const AnyToolDataOutputSchema = z.object({}).passthrough();

export const MediaAssetModerationOutputSchema = z.strictObject({
	assetId: z.string(),
	attemptCount: z.number().int().nonnegative(),
	errorCode: z.string().nullable(),
	errorMessage: z.string().nullable(),
	fileType: z.string().nullable(),
	provider: z
		.enum([
			"GOOGLE_VISION_SAFESEARCH",
			"GOOGLE_VIDEO_INTELLIGENCE_EXPLICIT",
			"MANUAL_ADMIN",
			"SPECIALIST_HASH_PROVIDER",
		])
		.nullable(),
	reasonCodes: z.array(z.string()),
	riskLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "SEVERE"]).nullable(),
	scannedAt: z.string().nullable(),
	status: z.enum([
		"NOT_REQUIRED",
		"PENDING",
		"SCANNING",
		"APPROVED",
		"NEEDS_REVIEW",
		"BLOCKED",
		"SCAN_FAILED",
		"PROVIDER_UNAVAILABLE",
	]),
	summary: z.record(z.string(), z.unknown()).nullable(),
	verdict: z.enum(["APPROVED", "NEEDS_REVIEW", "BLOCKED"]).nullable(),
});

const MediaAssetSummaryOutputSchema = z
	.object({
		aspectRatio: z.string().optional(),
		createdAt: z.string(),
		moderation: MediaAssetModerationOutputSchema.optional(),
		thumbnailUrl: z.string().optional(),
		fileName: z.string().optional(),
		fileType: z.string(),
		height: z.number().optional(),
		id: z.string(),
		url: z.string().optional(),
		urlExpiresAt: z.string().optional(),
		width: z.number().optional(),
	})
	.strict();

const ListMediaAssetsDataOutputSchema = z
	.object({
		assets: z.array(MediaAssetSummaryOutputSchema),
		nextCursor: z.string().optional(),
	})
	.strict();

const ListMediaAssetsSummaryOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const SmartLinkStatusSchemas = {
	claimStatus: z.enum([
		"auto_approved",
		"pending_ops_review",
		"verification_deferred",
		"approved_by_ops",
		"rejected",
	]),
	publishState: z.enum(["published", "unpublished"]),
	renderState: z.enum(["queued", "rendering", "rendered", "failed"]),
	takedownStatus: z.enum(["none", "active", "resolved"]),
	theme: z.enum(["classic", "brutalist", "aurora", "cinematic"]),
};

const SmartLinkSummaryOutputSchema = z
	.object({
		artistHubUrl: z.string(),
		artistId: z.string(),
		artistName: z.string(),
		claimStatus: SmartLinkStatusSchemas.claimStatus,
		createdAt: z.string(),
		id: z.string(),
		isPublic: z.boolean(),
		localizedPublicUrls: z.array(z.string()).optional(),
		publicUrl: z.string(),
		publishState: SmartLinkStatusSchemas.publishState,
		releaseSlug: z.string(),
		releaseTitle: z.string(),
		releaseType: z.string(),
		renderState: SmartLinkStatusSchemas.renderState,
		spotifyUrl: z.string().nullable(),
		takedownStatus: SmartLinkStatusSchemas.takedownStatus,
		theme: SmartLinkStatusSchemas.theme,
		updatedAt: z.string(),
	})
	.strict();

const SmartLinkDetailsOutputSchema = SmartLinkSummaryOutputSchema.extend({
	actionRequired: z.array(z.string()).optional(),
	customDescription: z.string().nullable(),
	nextActions: z.array(z.string()),
	originalSpotifyUrl: z.string().nullable(),
	summary: z.string(),
	warnings: z.array(z.string()).optional(),
}).strict();

const ListSmartLinksDataOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		smartLinks: z.array(SmartLinkSummaryOutputSchema),
	})
	.strict();

const ListSmartLinksSummaryOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const AvailableCountryOutputSchema = z
	.object({
		code: z.string(),
		dominantLanguage: z.string().optional(),
		googleAdsId: z.number(),
		name: z.string(),
	})
	.strict();

const ListAvailableCountriesDataOutputSchema = z
	.object({
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		countries: z.array(AvailableCountryOutputSchema),
		nextCursor: z.string().optional(),
		notes: z.array(z.string()),
		source: z.enum(["SMART_CAMPAIGN_COUNTRIES", "GOOGLE_ADS_COUNTRIES"]),
		totalCount: z.number(),
	})
	.strict();

const SummaryCountOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const SummaryWarningsActionsOutputSchema = z
	.object({
		actionRequired: z.array(z.string()).optional(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
	})
	.strict();

const NormalizedTargetingOutputSchema = z.union([
	z.object({ mode: z.literal("GLOBAL") }).strict(),
	z
		.object({
			countries: z.array(
				z.object({ code: z.string(), name: z.string() }).strict(),
			),
			mode: z.literal("COUNTRIES"),
		})
		.strict(),
]);

const CampaignProposalBlockerOutputSchema = z.object({
	code: z.enum([
		"budget_policy",
		"currency_unavailable",
		"daily_spending_limit",
		"funding_unavailable",
		"invalid_end_date",
		"onboarding",
		"unsupported_content_type",
	]),
	field: z.string().optional(),
	message: z.string(),
});
export const ProposalReadinessOutputSchema = z.object({
	blockers: z.array(CampaignProposalBlockerOutputSchema),
	isSubmissionReady: z.boolean(),
	submissionBlockers: z.array(CampaignProposalBlockerOutputSchema),
});

type CampaignReadinessOutputWithFundingPreview = GetCampaignReadinessData & {
	fundingPreview?: z.infer<typeof CampaignFundingPreviewOutputSchema> | null;
};

const GetCampaignReadinessDataOutputSchema: z.ZodType<CampaignReadinessOutputWithFundingPreview> =
	z
		.object({
			artistId: z.string(),
			artistName: z.string(),
			blockingCodes: z.array(CampaignProposalBlockerOutputSchema.shape.code),
			blockingIssues: z.array(z.string()),
			budgetConstraints: z
				.object({
					budgetType: z.enum(["DAILY", "TOTAL"]).nullable(),
					currency: z.string().length(3),
					currencyExponent: z.number().int().min(0).max(3),
					effectiveDailyBudgetMinor: z.number().int().nonnegative().nullable(),
					maximumBudgetMinor: z.number().int().nonnegative().nullable(),
					maximumDailyBudgetMinor: z.number().int().nonnegative(),
					maximumTotalBudgetMinor: z.number().int().nonnegative(),
					minimumBudgetMinor: z.number().int().nonnegative().nullable(),
					minimumCampaignDays: z.number().int().positive(),
					minimumDailyBudgetMinor: z.number().int().nonnegative(),
					minimumEndDate: z.iso.date(),
					minimumTotalBudgetMinor: z.number().int().nonnegative(),
				})
				.strict()
				.nullable(),
			campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
			fundingPreview: CampaignFundingPreviewOutputSchema.nullable().optional(),
			isReady: z.boolean(),
			missingInputs: z.array(z.string()),
			normalizedTargeting: NormalizedTargetingOutputSchema,
			proposalReadiness: ProposalReadinessOutputSchema.nullable().optional(),
			recommendedNextAction: z.string(),
			warnings: z.array(z.string()),
			youtubeEntries: z
				.array(
					z
						.object({
							playlistId: z.string().nullable().optional(),
							videoId: z.string(),
						})
						.strict(),
				)
				.optional(),
		})
		.strict();

const CreateSmartLinkFromSpotifyDataOutputSchema =
	SmartLinkDetailsOutputSchema.extend({
		outcome: z.enum(["created", "existing"]),
		workflowWarning: z.string().nullable(),
	}).strict();

const CreateSmartLinksFromSpotifyArtistDataOutputSchema = z
	.object({
		artistCreatedFromSpotify: z.boolean().optional(),
		artistHubUrl: z.string(),
		artistId: z.string(),
		artistName: z.string(),
		catalogImportStatus: z.enum(["started", "start_failed"]),
		currentSmartLinkCount: z.number(),
		existingCount: z.number(),
		initialSmartLink: SmartLinkSummaryOutputSchema.nullable(),
		newlyAvailableCount: z.number(),
		nextActions: z.array(z.string()),
		smartLinks: z.array(SmartLinkSummaryOutputSchema),
		spotifyArtistUrl: z.string(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
	})
	.strict();

const LaunchCampaignDataOutputSchema = z
	.object({
		budget: MoneyDisplayOutputSchema,
		budgetType: z.enum(["DAILY", "TOTAL"]),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentTitle: z.string(),
		deliveryState: z.enum(["ACTIVE", "PENDING_REVIEW", "CONTENT_VALIDATION"]),
		id: z.string(),
		isLive: z.boolean(),
		nextSteps: z.array(z.string()),
		outcome: z.enum(["created", "replayed"]).optional(),
		platforms: z.array(z.string()),
		status: z.string(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
		youtubeEntries: z
			.array(
				z
					.object({
						playlistId: z.string(),
						selectionIndex: z.number(),
						videoId: z.string(),
					})
					.strict(),
			)
			.optional(),
	})
	.strict();

export const AnyOutputEnvelopeSchema = createOutputEnvelopeSchema(
	AnyToolDataOutputSchema,
	{ allowPartial: true },
);

const CampaignEndDateOutputSchema = z.string().describe("Last day ads run");

export const GetCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	z
		.object({
			analytics: z
				.object({
					countsAvailability: z
						.enum(["available", "incomplete", "sample", "not_linked"])
						.optional(),
				})
				.passthrough()
				.optional(),
			channelResults: ChannelResultsSchema.optional(),
			endDate: CampaignEndDateOutputSchema.optional(),
			summary: z.string(),
		})
		.passthrough(),
	{ allowPartial: true },
);

export const UpdateCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	z.union([
		z
			.object({
				actionRequired: z.array(z.string()).optional(),
				contentTitle: z.string(),
				id: z.string(),
				newStatus: z.enum(["PAUSED", "ACTIVE"]),
				platformResults: z.array(
					z
						.object({
							message: z.string().optional(),
							platform: z.enum(["META", "GOOGLE"]),
							success: z.boolean(),
						})
						.strict(),
				),
				warnings: z.array(z.string()).optional(),
			})
			.strict(),
		z
			.object({
				actionRequired: z.array(z.string()).optional(),
				budgetType: z.enum(["DAILY", "TOTAL"]),
				contentTitle: z.string(),
				endDate: CampaignEndDateOutputSchema.optional(),
				id: z.string(),
				newBudget: MoneyDisplayOutputSchema,
				previousBudget: MoneyDisplayOutputSchema,
				warnings: z.array(z.string()).optional(),
			})
			.strict(),
		z
			.object({
				contentTitle: z.string(),
				didChange: z.boolean(),
				endDate: CampaignEndDateOutputSchema.nullable(),
				id: z.string(),
				previousEndDate: CampaignEndDateOutputSchema.nullable(),
			})
			.strict(),
		z
			.object({
				campaignId: z.string(),
				locationTargets: z.array(
					z.object({ code: z.string(), name: z.string() }).strict(),
				),
				mode: z.enum(["GLOBAL", "COUNTRIES"]),
			})
			.strict(),
		z
			.object({
				campaignId: z.string(),
				contentTitle: z.string(),
				id: z.string(),
				inventoryConfig: z.string(),
				strategy: z.string(),
			})
			.strict(),
		z
			.object({
				contentTitle: z.string(),
				id: z.string(),
				newStatus: z.literal("ARCHIVED"),
				warnings: z.array(z.string()),
			})
			.strict(),
		z
			.object({
				campaignId: z.string(),
				optimizeForOrganicViews: z.boolean(),
				optimizeForSubscribers: z.boolean(),
			})
			.strict(),
	]),
	{ allowPartial: true },
);

export const ListMediaAssetsOutputEnvelopeSchema = createOutputEnvelopeSchema(
	z.union([
		ListMediaAssetsDataOutputSchema,
		ListMediaAssetsSummaryOutputSchema,
	]),
);

export const LaunchCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	LaunchCampaignDataOutputSchema,
	{ launch: true },
);

export const ManageYoutubeDraftOutputEnvelopeSchema =
	createOutputEnvelopeSchema(
		z.union([
			z
				.object({
					artistId: z.string().uuid(),
					draft: z
						.object({
							campaignId: z.string().uuid(),
							completedSteps: z.array(z.string()),
							content: z
								.object({
									screening: z
										.object({ status: z.string() })
										.passthrough()
										.nullable(),
								})
								.passthrough(),
						})
						.passthrough()
						.nullable(),
					failureStage: z.string().nullable(),
					updatedAt: z.string().datetime().nullable(),
				})
				.strict(),
			z
				.object({
					artistId: z.string().uuid(),
					campaignId: z.string().uuid(),
					discarded: z.literal(true),
				})
				.strict(),
		]),
	).safeExtend({ stepResult: z.object({}).passthrough().optional() });

export const ListAvailableCountriesOutputEnvelopeSchema =
	createOutputEnvelopeSchema(
		z.union([ListAvailableCountriesDataOutputSchema, SummaryCountOutputSchema]),
	);

export const GetCampaignReadinessOutputEnvelopeSchema =
	createOutputEnvelopeSchema(
		z.union([
			GetCampaignReadinessDataOutputSchema,
			SummaryWarningsActionsOutputSchema,
		]),
	);

export const GetYouTubeChannelDataOutputEnvelopeSchema =
	createOutputEnvelopeSchema(YouTubeChannelDataSchema);

export const CreateSmartLinkFromSpotifyOutputEnvelopeSchema =
	createOutputEnvelopeSchema(CreateSmartLinkFromSpotifyDataOutputSchema);

export const CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema =
	createOutputEnvelopeSchema(CreateSmartLinksFromSpotifyArtistDataOutputSchema);

export const ContactSupportDataSchema = z
	.object({
		kind: z.literal("support_request"),
		reference: z.string().min(1),
		replyChannel: z.literal("account_email"),
		status: z.literal("received"),
	})
	.strict();

export type ContactSupportData = z.infer<typeof ContactSupportDataSchema>;

export const ContactSupportOutputEnvelopeSchema = createOutputEnvelopeSchema(
	ContactSupportDataSchema,
);

export const ListSmartLinksOutputEnvelopeSchema = createOutputEnvelopeSchema(
	z.union([ListSmartLinksDataOutputSchema, ListSmartLinksSummaryOutputSchema]),
);

export const ResumeFundingDataSchema = z.object({
	appliedCreditsCents: z.number().int().nonnegative(),
	appliedCreditsMinor: z.number().int().nonnegative().optional(),
	budgetCents: z.number().int().nonnegative(),
	budgetMinor: z.number().int().nonnegative().optional(),
	/** The daily funding consent to show and accept; null when not required. */
	consent: z
		.object({
			copy: z.string().min(1),
			copyHash: z.string().min(1),
			version: z.string().min(1),
		})
		.nullable(),
	/** The current funded window already covers this budget. */
	coveredByFundedWindow: z.boolean(),
	currency: z.string().length(3),
	currencyExponent: z.number().int().min(0).max(3).optional(),
	deliveryWindowCents: z.number().int().nonnegative(),
	deliveryWindowMinor: z.number().int().nonnegative().optional(),
	/** The first window: the rest of today plus all of tomorrow. */
	firstWindow: z.boolean(),
	formatted: z.object({
		appliedCredits: z.string(),
		budget: z.string(),
		deliveryWindow: z.string(),
		netImmediateCharge: z.string(),
	}),
	isTotal: z.boolean(),
	netImmediateChargeCents: z.number().int().nonnegative(),
	netImmediateChargeMinor: z.number().int().nonnegative().optional(),
	paymentMethod: z
		.object({
			brand: z.string().nullable(),
			displayName: z.string(),
			last4: z.string().nullable(),
		})
		.nullable(),
	/** The engine would refuse this resume without charging. */
	refusal: z
		.enum([
			"card_collection_closed",
			"credit_review_required",
			"payment_method_required",
		])
		.nullable(),
});

export type GetResumeFundingData = z.infer<typeof ResumeFundingDataSchema>;
export const GetResumeFundingOutputEnvelopeSchema = createOutputEnvelopeSchema(
	z.union([ResumeFundingDataSchema, z.object({ summary: z.string() })]),
);
