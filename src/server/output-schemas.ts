import { Schema } from "effect";
import {
	WireIsoDate,
	WireIsoDateTime,
	type WireRefinementContext,
	WireUuid,
	extendWire,
	formatWire,
	lengthWire,
	maxWire,
	minWire,
	optionalWire,
	passthroughWire,
	strictWire,
	superRefineWire,
	trimWire,
	fromLegacyWire,
	enumWire,
	nullableWire,
	recordWire,
} from "./wire-schema.generated";
import {
	DailyBudgetReviewOutputSchema as LegacyDailyBudgetReviewOutputSchema,
	TotalBudgetRaiseOutputSchema as LegacyTotalBudgetRaiseOutputSchema,
} from "./budget-review-schemas.generated";
import { BulkSmartLinkResponseSchema } from "./intake-native.generated";
import { SMART_CAMPAIGN_SUBMISSION_CONTRACT } from "./submission.generated";
import { SUPPORT_REQUEST_CONTRACT } from "./request.generated";
import type { GetCampaignReadinessData } from "../readiness-types";
import { ChannelResultsSchema as LegacyChannelResultsSchema } from "./channel-results-schema";
import { CampaignFundingPreviewOutputSchema as LegacyCampaignFundingPreviewOutputSchema } from "./funding-preview-schema.generated";
import { YouTubeChannelDataSchema } from "./youtube-channel-data-schema";
const DailyBudgetReviewOutputSchema = fromLegacyWire(
	LegacyDailyBudgetReviewOutputSchema,
);
const TotalBudgetRaiseOutputSchema = fromLegacyWire(
	LegacyTotalBudgetRaiseOutputSchema,
);
const ChannelResultsSchema = fromLegacyWire(LegacyChannelResultsSchema);
const CampaignFundingPreviewOutputSchema = fromLegacyWire(
	LegacyCampaignFundingPreviewOutputSchema,
);
export const SmartCampaignRecoverySelectionSchema =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.recoverySelectionSchema;
export const SmartCampaignRecoverySchema =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.recoverySchema;
export const SmartCampaignLaunchProjectionSchema =
	SMART_CAMPAIGN_SUBMISSION_CONTRACT.launchProjectionSchema;
export type SmartCampaignLaunchProjection =
	(typeof SmartCampaignLaunchProjectionSchema)["Type"];
const ResultErrorCodeSchema = enumWire([
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
const ResultNextActionSchema = strictWire(
	Schema.Struct({
		field: optionalWire(maxWire(minWire(trimWire(Schema.String), 1), 120)),
		kind: enumWire(["provide_input", "read_status", "reconnect", "handoff"]),
		reason: optionalWire(maxWire(minWire(trimWire(Schema.String), 1), 240)),
	}),
);
/** Optional, additive recovery metadata for error envelopes. */
export const ResultErrorRecoverySchema = strictWire(
	Schema.Struct({
		code: optionalWire(ResultErrorCodeSchema),
		draftId: optionalWire(formatWire(Schema.String, WireUuid)),
		failureStage: optionalWire(
			maxWire(minWire(trimWire(Schema.String), 1), 120),
		),
		field: optionalWire(maxWire(minWire(trimWire(Schema.String), 1), 120)),
		nextAction: optionalWire(ResultNextActionSchema),
		prerequisite: optionalWire(
			maxWire(minWire(trimWire(Schema.String), 1), 240),
		),
		retryAfterSeconds: optionalWire(
			maxWire(minWire(Schema.Finite.check(Schema.isInt()), 0), 86400),
		),
		retryable: optionalWire(Schema.Boolean),
		screeningResult: optionalWire(
			maxWire(minWire(trimWire(Schema.String), 1), 120),
		),
	}),
);
/**
 * Retryable recovery is reserved for a bounded rate-limit wait. Producers are
 * responsible for confirming that retrying their operation is safe to repeat.
 */
export function addRecoverySafetyIssues(
	value: (typeof ResultErrorRecoverySchema)["Type"],
	context: WireRefinementContext,
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
const MoneyDisplayOutputSchema = superRefineWire(
	strictWire(
		Schema.Struct({
			amount: Schema.Finite,
			// Major-unit USD amount, present only when currency is "USD"; kept for
			// backward compatibility — new consumers should use amount + currency.
			amountUsd: optionalWire(Schema.Finite),
			currency: Schema.String,
			formatted: Schema.String,
		}),
	),
	(value, context) => {
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
	},
);
export function createOutputEnvelopeSchema(
	dataSchema: Schema.Codec<unknown, unknown>,
	options?: {
		allowPartial?: boolean;
		launch?: boolean;
		team?: boolean;
	},
) {
	const statuses = options?.allowPartial
		? (["success", "partial_success", "error"] as const)
		: (["success", "error"] as const);
	const firstFields = { data: optionalWire(dataSchema) };
	const teamFields = {
		reason: optionalWire(enumWire(["member_changed", "invitation_changed"])),
	};
	const commonFields = {
		kind: optionalWire(
			enumWire(["validation", "business", "platform", "unknown"]),
		),
		message: optionalWire(Schema.String),
		...ResultErrorRecoverySchema.fields,
	};
	const lastFields = { status: enumWire(statuses) };
	const envelope = options?.team
		? options.launch
			? Schema.Struct({
					...firstFields,
					...teamFields,
					...commonFields,
					...SmartCampaignLaunchProjectionSchema.fields,
					...lastFields,
				})
			: Schema.Struct({
					...firstFields,
					...teamFields,
					...commonFields,
					...lastFields,
				})
		: options?.launch
			? Schema.Struct({
					...firstFields,
					...commonFields,
					...SmartCampaignLaunchProjectionSchema.fields,
					...lastFields,
				})
			: Schema.Struct({ ...firstFields, ...commonFields, ...lastFields });
	return superRefineWire(strictWire(envelope), (value, context) => {
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
const AnyToolDataOutputSchema = passthroughWire(Schema.Struct({}));
export const MediaAssetModerationOutputSchema = strictWire(
	Schema.Struct({
		assetId: Schema.String,
		attemptCount: Schema.Finite.check(Schema.isInt()).check(
			Schema.isGreaterThanOrEqualTo(0),
		),
		errorCode: nullableWire(Schema.String),
		errorMessage: nullableWire(Schema.String),
		fileType: nullableWire(Schema.String),
		provider: nullableWire(
			enumWire([
				"GOOGLE_VISION_SAFESEARCH",
				"GOOGLE_VIDEO_INTELLIGENCE_EXPLICIT",
				"MANUAL_ADMIN",
				"SPECIALIST_HASH_PROVIDER",
			]),
		),
		reasonCodes: Schema.mutable(Schema.Array(Schema.String)),
		riskLevel: nullableWire(
			enumWire(["NONE", "LOW", "MEDIUM", "HIGH", "SEVERE"]),
		),
		scannedAt: nullableWire(Schema.String),
		status: enumWire([
			"NOT_REQUIRED",
			"PENDING",
			"SCANNING",
			"APPROVED",
			"NEEDS_REVIEW",
			"BLOCKED",
			"SCAN_FAILED",
			"PROVIDER_UNAVAILABLE",
		]),
		summary: nullableWire(recordWire(Schema.String, Schema.Unknown)),
		verdict: nullableWire(enumWire(["APPROVED", "NEEDS_REVIEW", "BLOCKED"])),
	}),
);
const MediaAssetSummaryOutputSchema = strictWire(
	Schema.Struct({
		aspectRatio: optionalWire(Schema.String),
		createdAt: Schema.String,
		fileName: optionalWire(Schema.String),
		fileType: Schema.String,
		height: optionalWire(Schema.Finite),
		id: Schema.String,
		moderation: optionalWire(MediaAssetModerationOutputSchema),
		thumbnailUrl: optionalWire(Schema.String),
		url: optionalWire(Schema.String),
		urlExpiresAt: optionalWire(Schema.String),
		width: optionalWire(Schema.Finite),
	}),
);
const ListMediaAssetsDataOutputSchema = strictWire(
	Schema.Struct({
		assets: Schema.mutable(Schema.Array(MediaAssetSummaryOutputSchema)),
		nextCursor: optionalWire(Schema.String),
	}),
);
const ListMediaAssetsSummaryOutputSchema = strictWire(
	Schema.Struct({
		nextCursor: optionalWire(Schema.String),
		summary: Schema.String,
		totalCount: Schema.Finite,
	}),
);
const SmartLinkStatusSchemas = {
	claimStatus: enumWire([
		"auto_approved",
		"pending_ops_review",
		"verification_deferred",
		"approved_by_ops",
		"rejected",
	]),
	publishState: enumWire(["published", "unpublished"]),
	renderState: enumWire(["queued", "rendering", "rendered", "failed"]),
	takedownStatus: enumWire(["none", "active", "resolved"]),
	theme: enumWire(["classic", "brutalist", "aurora", "cinematic"]),
};
const SmartLinkSummaryOutputSchema = strictWire(
	Schema.Struct({
		artistHubUrl: Schema.String,
		artistId: Schema.String,
		artistName: Schema.String,
		claimStatus: SmartLinkStatusSchemas.claimStatus,
		createdAt: Schema.String,
		id: Schema.String,
		isPublic: Schema.Boolean,
		localizedPublicUrls: optionalWire(
			Schema.mutable(Schema.Array(Schema.String)),
		),
		publicUrl: Schema.String,
		publishState: SmartLinkStatusSchemas.publishState,
		releaseSlug: Schema.String,
		releaseTitle: Schema.String,
		releaseType: Schema.String,
		renderState: SmartLinkStatusSchemas.renderState,
		spotifyUrl: nullableWire(Schema.String),
		takedownStatus: SmartLinkStatusSchemas.takedownStatus,
		theme: SmartLinkStatusSchemas.theme,
		updatedAt: Schema.String,
	}),
);
const SmartLinkDetailsOutputSchema = strictWire(
	extendWire(SmartLinkSummaryOutputSchema, {
		actionRequired: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
		customDescription: nullableWire(Schema.String),
		nextActions: Schema.mutable(Schema.Array(Schema.String)),
		originalSpotifyUrl: nullableWire(Schema.String),
		summary: Schema.String,
		warnings: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
	}),
);
const ListSmartLinksDataOutputSchema = strictWire(
	Schema.Struct({
		nextCursor: optionalWire(Schema.String),
		smartLinks: Schema.mutable(Schema.Array(SmartLinkSummaryOutputSchema)),
	}),
);
const ListSmartLinksSummaryOutputSchema = strictWire(
	Schema.Struct({
		nextCursor: optionalWire(Schema.String),
		summary: Schema.String,
		totalCount: Schema.Finite,
	}),
);
const AvailableCountryOutputSchema = strictWire(
	Schema.Struct({
		code: Schema.String,
		dominantLanguage: optionalWire(Schema.String),
		googleAdsId: Schema.Finite,
		name: Schema.String,
	}),
);
const ListAvailableCountriesDataOutputSchema = strictWire(
	Schema.Struct({
		campaignType: enumWire(["SMART_CAMPAIGN", "YOUTUBE"]),
		countries: Schema.mutable(Schema.Array(AvailableCountryOutputSchema)),
		nextCursor: optionalWire(Schema.String),
		notes: Schema.mutable(Schema.Array(Schema.String)),
		source: enumWire(["SMART_CAMPAIGN_COUNTRIES", "GOOGLE_ADS_COUNTRIES"]),
		totalCount: Schema.Finite,
	}),
);
const SummaryCountOutputSchema = strictWire(
	Schema.Struct({
		nextCursor: optionalWire(Schema.String),
		summary: Schema.String,
		totalCount: Schema.Finite,
	}),
);
const SummaryWarningsActionsOutputSchema = strictWire(
	Schema.Struct({
		actionRequired: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
		summary: Schema.String,
		warnings: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
	}),
);
const NormalizedTargetingOutputSchema = Schema.Union([
	strictWire(Schema.Struct({ mode: Schema.Literal("GLOBAL") })),
	strictWire(
		Schema.Struct({
			countries: Schema.mutable(
				Schema.Array(
					strictWire(
						Schema.Struct({ code: Schema.String, name: Schema.String }),
					),
				),
			),
			mode: Schema.Literal("COUNTRIES"),
		}),
	),
]);
const CampaignProposalBlockerOutputSchema = Schema.Struct({
	code: enumWire([
		"budget_policy",
		"currency_unavailable",
		"daily_spending_limit",
		"funding_unavailable",
		"invalid_end_date",
		"onboarding",
		"unsupported_content_type",
	]),
	field: optionalWire(Schema.String),
	message: Schema.String,
});
export const ProposalReadinessOutputSchema = Schema.Struct({
	blockers: Schema.mutable(Schema.Array(CampaignProposalBlockerOutputSchema)),
	isSubmissionReady: Schema.Boolean,
	submissionBlockers: Schema.mutable(
		Schema.Array(CampaignProposalBlockerOutputSchema),
	),
});
type CampaignReadinessOutputWithFundingPreview = GetCampaignReadinessData & {
	fundingPreview?: (typeof CampaignFundingPreviewOutputSchema)["Type"] | null;
};
const GetCampaignReadinessDataOutputSchema: Schema.Codec<CampaignReadinessOutputWithFundingPreview> =
	strictWire(
		Schema.Struct({
			artistId: Schema.String,
			artistName: Schema.String,
			blockingCodes: Schema.mutable(
				Schema.Array(CampaignProposalBlockerOutputSchema.fields.code),
			),
			blockingIssues: Schema.mutable(Schema.Array(Schema.String)),
			budgetConstraints: nullableWire(
				strictWire(
					Schema.Struct({
						budgetType: nullableWire(enumWire(["DAILY", "TOTAL"])),
						currency: lengthWire(Schema.String, 3),
						currencyExponent: maxWire(
							minWire(Schema.Finite.check(Schema.isInt()), 0),
							3,
						),
						effectiveDailyBudgetMinor: nullableWire(
							Schema.Finite.check(Schema.isInt()).check(
								Schema.isGreaterThanOrEqualTo(0),
							),
						),
						maximumBudgetMinor: nullableWire(
							Schema.Finite.check(Schema.isInt()).check(
								Schema.isGreaterThanOrEqualTo(0),
							),
						),
						maximumDailyBudgetMinor: Schema.Finite.check(Schema.isInt()).check(
							Schema.isGreaterThanOrEqualTo(0),
						),
						maximumTotalBudgetMinor: Schema.Finite.check(Schema.isInt()).check(
							Schema.isGreaterThanOrEqualTo(0),
						),
						minimumBudgetMinor: nullableWire(
							Schema.Finite.check(Schema.isInt()).check(
								Schema.isGreaterThanOrEqualTo(0),
							),
						),
						minimumCampaignDays: Schema.Finite.check(Schema.isInt()).check(
							Schema.isGreaterThan(0),
						),
						minimumDailyBudgetMinor: Schema.Finite.check(Schema.isInt()).check(
							Schema.isGreaterThanOrEqualTo(0),
						),
						minimumEndDate: WireIsoDate,
						minimumTotalBudgetMinor: Schema.Finite.check(Schema.isInt()).check(
							Schema.isGreaterThanOrEqualTo(0),
						),
					}),
				),
			),
			campaignType: enumWire(["SMART_CAMPAIGN", "YOUTUBE"]),
			fundingPreview: optionalWire(
				nullableWire(CampaignFundingPreviewOutputSchema),
			),
			isReady: Schema.Boolean,
			missingInputs: Schema.mutable(Schema.Array(Schema.String)),
			normalizedTargeting: NormalizedTargetingOutputSchema,
			proposalReadiness: optionalWire(
				nullableWire(ProposalReadinessOutputSchema),
			),
			recommendedNextAction: Schema.String,
			warnings: Schema.mutable(Schema.Array(Schema.String)),
			youtubeEntries: optionalWire(
				Schema.mutable(
					Schema.Array(
						strictWire(
							Schema.Struct({
								playlistId: optionalWire(nullableWire(Schema.String)),
								videoId: Schema.String,
							}),
						),
					),
				),
			),
		}),
	);
const CreateSmartLinkFromSpotifyDataOutputSchema = strictWire(
	extendWire(SmartLinkDetailsOutputSchema, {
		outcome: enumWire(["created", "existing"]),
		workflowWarning: nullableWire(Schema.String),
	}),
);
const CreateSmartLinksFromSpotifyArtistDataOutputSchema =
	BulkSmartLinkResponseSchema;
const LaunchCampaignDataOutputSchema = strictWire(
	Schema.Struct({
		budget: MoneyDisplayOutputSchema,
		budgetType: enumWire(["DAILY", "TOTAL"]),
		campaignType: enumWire(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentTitle: Schema.String,
		deliveryState: enumWire(["ACTIVE", "PENDING_REVIEW", "CONTENT_VALIDATION"]),
		id: Schema.String,
		isLive: Schema.Boolean,
		nextSteps: Schema.mutable(Schema.Array(Schema.String)),
		outcome: optionalWire(enumWire(["created", "replayed"])),
		platforms: Schema.mutable(Schema.Array(Schema.String)),
		status: Schema.String,
		summary: Schema.String,
		warnings: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
		youtubeEntries: optionalWire(
			Schema.mutable(
				Schema.Array(
					strictWire(
						Schema.Struct({
							playlistId: Schema.String,
							selectionIndex: Schema.Finite,
							videoId: Schema.String,
						}),
					),
				),
			),
		),
	}),
);
export const TeamOutputEnvelopeSchema = createOutputEnvelopeSchema(
	AnyToolDataOutputSchema,
	{ allowPartial: true, team: true },
);
export const AnyOutputEnvelopeSchema = createOutputEnvelopeSchema(
	AnyToolDataOutputSchema,
	{ allowPartial: true },
);
const CampaignEndDateOutputSchema = Schema.String.annotate({
	description: "Last day ads run",
});
export const GetCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	passthroughWire(
		Schema.Struct({
			analytics: optionalWire(
				passthroughWire(
					Schema.Struct({
						countsAvailability: optionalWire(
							enumWire(["available", "incomplete", "sample", "not_linked"]),
						),
					}),
				),
			),
			channelResults: optionalWire(ChannelResultsSchema),
			endDate: optionalWire(CampaignEndDateOutputSchema),
			summary: Schema.String,
		}),
	),
	{ allowPartial: true },
);
export const CampaignBudgetPreviewDataSchema = strictWire(
	Schema.Struct({
		phase: Schema.Literal("preview"),
		preview: strictWire(
			Schema.Struct({
				action: Schema.Literal("update_budget"),
				campaignId: Schema.String,
				artistId: Schema.String,
				contentTitle: Schema.String,
				budgetType: enumWire(["DAILY", "TOTAL"]),
				previousBudget: MoneyDisplayOutputSchema,
				newBudget: MoneyDisplayOutputSchema,
				endDate: nullableWire(CampaignEndDateOutputSchema),
				expected: strictWire(
					Schema.Struct({
						expectedFundingHash: optionalWire(
							Schema.String.check(
								Schema.isPattern(/^[a-f0-9]{64}$/u, {
									toJsonSchema: () => ({ pattern: /^[a-f0-9]{64}$/u.source }),
								}),
							),
						),
					}),
				),
				review: Schema.Union([
					DailyBudgetReviewOutputSchema,
					TotalBudgetRaiseOutputSchema,
				]),
			}),
		),
	}),
);
export const UpdateCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	Schema.Union([
		CampaignBudgetPreviewDataSchema,
		strictWire(
			Schema.Struct({
				phase: Schema.Literal("preview"),
				preview: strictWire(
					Schema.Struct({
						action: enumWire(["pause", "resume", "archive", "unarchive"]),
						campaignId: Schema.String,
						artistId: Schema.String,
						contentTitle: Schema.String,
						currentStatus: Schema.String,
						expected: strictWire(
							Schema.Struct({
								expectedUpdatedAt: WireIsoDateTime(),
								expectedCurrentStatus: Schema.String,
								expectedFundingHash: optionalWire(
									Schema.String.check(
										Schema.isPattern(/^[a-f0-9]{64}$/u, {
											toJsonSchema: () => ({
												pattern: /^[a-f0-9]{64}$/u.source,
											}),
										}),
									),
								),
							}),
						),
						funding: nullableWire(
							Schema.suspend(() => ResumeFundingDataSchema),
						),
					}),
				),
			}),
		),
		strictWire(
			Schema.Struct({
				actionRequired: optionalWire(
					Schema.mutable(Schema.Array(Schema.String)),
				),
				contentTitle: Schema.String,
				id: Schema.String,
				newStatus: enumWire(["PAUSED", "ACTIVE"]),
				platformResults: Schema.mutable(
					Schema.Array(
						strictWire(
							Schema.Struct({
								message: optionalWire(Schema.String),
								platform: enumWire(["META", "GOOGLE"]),
								success: Schema.Boolean,
							}),
						),
					),
				),
				warnings: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
			}),
		),
		strictWire(
			Schema.Struct({
				actionRequired: optionalWire(
					Schema.mutable(Schema.Array(Schema.String)),
				),
				budgetType: enumWire(["DAILY", "TOTAL"]),
				contentTitle: Schema.String,
				endDate: optionalWire(CampaignEndDateOutputSchema),
				id: Schema.String,
				newBudget: MoneyDisplayOutputSchema,
				previousBudget: MoneyDisplayOutputSchema,
				warnings: optionalWire(Schema.mutable(Schema.Array(Schema.String))),
			}),
		),
		strictWire(
			Schema.Struct({
				contentTitle: Schema.String,
				didChange: Schema.Boolean,
				endDate: nullableWire(CampaignEndDateOutputSchema),
				id: Schema.String,
				previousEndDate: nullableWire(CampaignEndDateOutputSchema),
			}),
		),
		strictWire(
			Schema.Struct({
				campaignId: Schema.String,
				locationTargets: Schema.mutable(
					Schema.Array(
						strictWire(
							Schema.Struct({ code: Schema.String, name: Schema.String }),
						),
					),
				),
				mode: enumWire(["GLOBAL", "COUNTRIES"]),
			}),
		),
		strictWire(
			Schema.Struct({
				campaignId: Schema.String,
				contentTitle: Schema.String,
				id: Schema.String,
				inventoryConfig: Schema.String,
				strategy: Schema.String,
			}),
		),
		strictWire(
			Schema.Struct({
				contentTitle: Schema.String,
				id: Schema.String,
				newStatus: Schema.Literal("ARCHIVED"),
				warnings: Schema.mutable(Schema.Array(Schema.String)),
			}),
		),
		strictWire(
			Schema.Struct({
				campaignId: Schema.String,
				optimizeForOrganicViews: Schema.Boolean,
				optimizeForSubscribers: Schema.Boolean,
			}),
		),
	]),
	{ allowPartial: true },
);
export const ListMediaAssetsOutputEnvelopeSchema = createOutputEnvelopeSchema(
	Schema.Union([
		ListMediaAssetsDataOutputSchema,
		ListMediaAssetsSummaryOutputSchema,
	]),
);
export const LaunchCampaignOutputEnvelopeSchema = createOutputEnvelopeSchema(
	LaunchCampaignDataOutputSchema,
	{ launch: true },
);
export const ManageYoutubeDraftOutputEnvelopeSchema = strictWire(
	createOutputEnvelopeSchema(
		Schema.Union([
			strictWire(
				Schema.Struct({
					artistId: formatWire(Schema.String, WireUuid),
					draft: nullableWire(
						passthroughWire(
							Schema.Struct({
								campaignId: formatWire(Schema.String, WireUuid),
								completedSteps: Schema.mutable(Schema.Array(Schema.String)),
								content: passthroughWire(
									Schema.Struct({
										screening: nullableWire(
											passthroughWire(Schema.Struct({ status: Schema.String })),
										),
									}),
								),
							}),
						),
					),
					failureStage: nullableWire(Schema.String),
					updatedAt: nullableWire(formatWire(Schema.String, WireIsoDateTime())),
				}),
			),
			strictWire(
				Schema.Struct({
					artistId: formatWire(Schema.String, WireUuid),
					campaignId: formatWire(Schema.String, WireUuid),
					discarded: Schema.Literal(true),
				}),
			),
		]),
	).mapFields(
		(fields) => ({
			...fields,
			...{ stepResult: optionalWire(passthroughWire(Schema.Struct({}))) },
		}),
		{ unsafePreserveChecks: true },
	),
);
export const ListAvailableCountriesOutputEnvelopeSchema =
	createOutputEnvelopeSchema(
		Schema.Union([
			ListAvailableCountriesDataOutputSchema,
			SummaryCountOutputSchema,
		]),
	);
export const GetCampaignReadinessOutputEnvelopeSchema =
	createOutputEnvelopeSchema(
		Schema.Union([
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
export const ContactSupportDataSchema =
	SUPPORT_REQUEST_CONTRACT.mobile.responseSchema;
export type ContactSupportData = (typeof ContactSupportDataSchema)["Type"];
export const ContactSupportOutputEnvelopeSchema = createOutputEnvelopeSchema(
	ContactSupportDataSchema,
);
export const SendFeedbackDataSchema = strictWire(
	Schema.Struct({
		message: Schema.Literal("Thanks — recorded."),
		status: Schema.Literal("recorded"),
	}),
);
export type SendFeedbackData = (typeof SendFeedbackDataSchema)["Type"];
export const SendFeedbackOutputEnvelopeSchema = createOutputEnvelopeSchema(
	SendFeedbackDataSchema,
);
export const ListSmartLinksOutputEnvelopeSchema = createOutputEnvelopeSchema(
	Schema.Union([
		ListSmartLinksDataOutputSchema,
		ListSmartLinksSummaryOutputSchema,
	]),
);
export const ResumeFundingDataSchema = Schema.Struct({
	appliedCreditsCents: Schema.Finite.check(Schema.isInt()).check(
		Schema.isGreaterThanOrEqualTo(0),
	),
	appliedCreditsMinor: optionalWire(
		Schema.Finite.check(Schema.isInt()).check(Schema.isGreaterThanOrEqualTo(0)),
	),
	budgetCents: Schema.Finite.check(Schema.isInt()).check(
		Schema.isGreaterThanOrEqualTo(0),
	),
	budgetMinor: optionalWire(
		Schema.Finite.check(Schema.isInt()).check(Schema.isGreaterThanOrEqualTo(0)),
	),
	consent: nullableWire(
		Schema.Struct({
			copy: minWire(Schema.String, 1),
			copyHash: minWire(Schema.String, 1),
			version: minWire(Schema.String, 1),
		}),
	),
	/** The current funded window already covers this budget. */
	coveredByFundedWindow: Schema.Boolean,
	currency: lengthWire(Schema.String, 3),
	currencyExponent: optionalWire(
		maxWire(minWire(Schema.Finite.check(Schema.isInt()), 0), 3),
	),
	deliveryWindowCents: Schema.Finite.check(Schema.isInt()).check(
		Schema.isGreaterThanOrEqualTo(0),
	),
	deliveryWindowMinor: optionalWire(
		Schema.Finite.check(Schema.isInt()).check(Schema.isGreaterThanOrEqualTo(0)),
	),
	/** The first window: the rest of today plus all of tomorrow. */
	firstWindow: Schema.Boolean,
	formatted: Schema.Struct({
		appliedCredits: Schema.String,
		budget: Schema.String,
		deliveryWindow: Schema.String,
		netImmediateCharge: Schema.String,
	}),
	isTotal: Schema.Boolean,
	netImmediateChargeCents: Schema.Finite.check(Schema.isInt()).check(
		Schema.isGreaterThanOrEqualTo(0),
	),
	netImmediateChargeMinor: optionalWire(
		Schema.Finite.check(Schema.isInt()).check(Schema.isGreaterThanOrEqualTo(0)),
	),
	paymentMethod: nullableWire(
		Schema.Struct({
			brand: nullableWire(Schema.String),
			displayName: Schema.String,
			last4: nullableWire(Schema.String),
		}),
	),
	/** The engine would refuse this resume without charging. */
	refusal: nullableWire(
		enumWire([
			"card_collection_closed",
			"credit_review_required",
			"payment_method_required",
		]),
	),
});
export type GetResumeFundingData = (typeof ResumeFundingDataSchema)["Type"];
export const GetResumeFundingOutputEnvelopeSchema = createOutputEnvelopeSchema(
	Schema.Union([
		ResumeFundingDataSchema,
		Schema.Struct({ summary: Schema.String }),
	]),
);
