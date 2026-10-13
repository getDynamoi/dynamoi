import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	isCurrentProspectiveBudgetFundingConsent,
	isRenewableProspectiveBudgetFundingConsent,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_VERSION,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY_HASH,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_VERSION,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
} from "../consent";
import {
	DynamoiOpenAiFetchInputSchema,
	DynamoiOpenAiSearchInputSchema,
} from "./openai-tools";
import {
	DynamoiCreateSmartLinkFromSpotifyInputSchema,
	DynamoiCreateSmartLinksFromSpotifyArtistInputSchema,
	DynamoiUpdateSmartLinkArtistHubSettingsInputSchema,
	DynamoiUpdateSmartLinkInputSchema,
	DynamoiUpdateSmartLinkReleaseSettingsInputSchema,
	FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS,
	PHASE_4_TOOL_DEFINITIONS,
} from "./smart-link-tools";
import {
	DynamoiGetArtistAnalyticsInputSchema,
	DynamoiGetAudienceAnalyticsInputSchema,
	DynamoiGetBillingInputSchema,
	DynamoiGetCampaignInputSchema,
	DynamoiGetCampaignReadinessInputSchema,
	DynamoiGetCurrentUserInputSchema,
	DynamoiGetGrowthAuditInputSchema,
	DynamoiGetPlatformStatusInputSchema,
	DynamoiGetPlaylistAnalyticsInputSchema,
	DynamoiLaunchCampaignInputSchema,
	DynamoiListAvailableCountriesInputSchema,
	DynamoiListCampaignsInputSchema,
	DynamoiManageYoutubeDraftInputSchema,
	DynamoiResumeCampaignInputSchema,
	DynamoiUpdateBudgetInputSchema,
	DynamoiUpdateCampaignInputSchema,
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";

function getToolDefinition<T extends { description: string; name: string }>(
	definitions: readonly T[],
	name: string,
): T {
	const definition = definitions.find((candidate) => candidate.name === name);
	if (!definition) {
		throw new Error(`Missing tool definition: ${name}`);
	}
	return definition;
}

describe("mcp/tools phase 1 definitions", () => {
	test("campaign status filters accept the projected ENDED state", () => {
		expect(
			DynamoiListCampaignsInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				status: "ENDED",
			}).status,
		).toBe("ENDED");
	});

	test("update campaign copy describes both end-date paths and funding consent", () => {
		const description = getToolDefinition(
			PHASE_2_TOOL_DEFINITIONS,
			"dynamoi_update_campaign",
		).description;
		expect(description).toContain("update_end_date (DAILY or TOTAL budget");
		expect(description).toContain(
			"TOTAL end-date extensions may require the same funding consent fields",
		);
		expect(description).toContain(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY);
	});

	test("public connector surface stays compact", () => {
		const publicTools = [
			...PHASE_1_TOOL_DEFINITIONS,
			...PHASE_ONBOARDING_TOOL_DEFINITIONS,
			...PHASE_2_TOOL_DEFINITIONS,
			...PHASE_3_TOOL_DEFINITIONS,
			...PHASE_4_TOOL_DEFINITIONS,
		];
		// The requested resume-funding read and insight reads add four tools to the 24-tool core catalog.
		// Exact cardinality prevents unreviewed catalog growth.
		expect(publicTools).toHaveLength(28);
		const resumeReads = publicTools.filter(
			(tool) => tool.name === "dynamoi_get_resume_funding",
		);
		expect(resumeReads).toHaveLength(1);
		expect(resumeReads[0]?.readOnlyHint).toBe(true);
		const toolNames = publicTools.map((tool) => tool.name);
		expect(toolNames).toContain("dynamoi_start_meta_connection");
		expect(toolNames).not.toContain("dynamoi_start_subscription_checkout");
		expect(toolNames).toContain("dynamoi_get_growth_audit");
		expect(toolNames).toContain("dynamoi_get_playlist_analytics");
		expect(toolNames).toContain("dynamoi_get_audience_analytics");
	});

	test("insight reads use narrow artist inputs and an explicit audience range", () => {
		const artistId = "00000000-0000-0000-0000-000000000000";
		expect(DynamoiGetGrowthAuditInputSchema.parse({ artistId })).toEqual({
			artistId,
		});
		expect(DynamoiGetPlaylistAnalyticsInputSchema.parse({ artistId })).toEqual({
			artistId,
		});
		expect(
			DynamoiGetGrowthAuditInputSchema.safeParse({ artistId, range: "30d" })
				.success,
		).toBe(false);
		expect(
			DynamoiGetPlaylistAnalyticsInputSchema.safeParse({
				artistId,
				format: "summary",
			}).success,
		).toBe(false);
		expect(DynamoiGetAudienceAnalyticsInputSchema.parse({ artistId })).toEqual({
			artistId,
			range: "30d",
		});
		expect(
			DynamoiGetAudienceAnalyticsInputSchema.safeParse({
				artistId,
				range: "all",
			}).success,
		).toBe(false);
	});

	test("read tools include required annotations", () => {
		for (const def of PHASE_1_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(true);
			expect(def.destructiveHint).toBe(false);
			expect(def.openWorldHint).toBe(false);
			expect(def.outputSchema).toBeDefined();
		}
	});

	test("manages YouTube draft through one action tool", () => {
		const tools = [
			...PHASE_1_TOOL_DEFINITIONS,
			...PHASE_2_TOOL_DEFINITIONS,
		].filter((tool) => tool.name.includes("youtube_draft"));
		expect(tools.map((tool) => tool.name)).toEqual([
			"dynamoi_manage_youtube_draft",
		]);
		expect(
			DynamoiManageYoutubeDraftInputSchema.safeParse({
				action: "inspect",
				artistId: "11111111-1111-4111-8111-111111111111",
			}).success,
		).toBe(true);
		expect(
			DynamoiManageYoutubeDraftInputSchema.safeParse({
				action: "discard",
				artistId: "11111111-1111-4111-8111-111111111111",
				campaignId: "22222222-2222-4222-8222-222222222222",
				userIntentSummary: "Discard this draft",
			}).success,
		).toBe(false);
		expect(
			DynamoiManageYoutubeDraftInputSchema.safeParse({
				action: "discard",
				artistId: "11111111-1111-4111-8111-111111111111",
				campaignId: "22222222-2222-4222-8222-222222222222",
				expectedUpdatedAt: "2026-09-24T12:00:00.000Z",
				userIntentSummary: "Discard this draft",
			}).success,
		).toBe(true);
	});

	test("get campaign schema supports consolidated include flags", () => {
		const parsed = DynamoiGetCampaignInputSchema.parse({
			analyticsGranularity: "DAILY",
			campaignId: "00000000-0000-0000-0000-000000000000",
			includeAnalytics: true,
			includeChannelResults: true,
			includeCountries: true,
			includeDeploymentStatus: true,
		});
		expect(parsed.includeCountries).toBe(true);
		expect(parsed.includeAnalytics).toBe(true);
		expect(parsed.includeChannelResults).toBe(true);
		expect(parsed.includeDeploymentStatus).toBe(true);
	});

	test("get artist analytics schema accepts uuid artistId", () => {
		const parsed = DynamoiGetArtistAnalyticsInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
		});
		expect(parsed.artistId).toBe("00000000-0000-0000-0000-000000000000");
	});

	test("current user schema defaults intent to account_overview", () => {
		expect(DynamoiGetCurrentUserInputSchema.parse({}).intent).toBe(
			"account_overview",
		);

		const parsed = DynamoiGetCurrentUserInputSchema.parse({
			intent: "platform_connection_check",
		});
		expect(parsed.intent).toBe("platform_connection_check");
	});

	test("polling schemas accept onboarding attempt correlation", () => {
		const billing = DynamoiGetBillingInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			onboardingAttemptId: "11111111-1111-4111-8111-111111111111",
		});
		expect(billing.onboardingAttemptId).toBe(
			"11111111-1111-4111-8111-111111111111",
		);

		const platform = DynamoiGetPlatformStatusInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			onboardingAttemptId: "11111111-1111-4111-8111-111111111111",
			onboardingFlow: "youtube",
		});
		expect(platform.onboardingFlow).toBe("youtube");
	});

	test("artist analytics metadata guides direct summary answers", () => {
		const definition = getToolDefinition(
			PHASE_1_TOOL_DEFINITIONS,
			"dynamoi_get_artist_analytics",
		);
		expect(definition.description).toContain("Pass format=summary");
		expect(definition.description).toContain("stop and answer");
	});

	test("available countries schema requires campaignType", () => {
		expect(() => DynamoiListAvailableCountriesInputSchema.parse({})).toThrow();
		const parsed = DynamoiListAvailableCountriesInputSchema.parse({
			campaignType: "SMART_CAMPAIGN",
			query: "United",
		});
		expect(parsed.campaignType).toBe("SMART_CAMPAIGN");
	});

	test("campaign readiness schema accepts no-write preflight inputs", () => {
		const parsed = DynamoiGetCampaignReadinessInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			budgetAmount: 100,
			budgetType: "TOTAL",
			campaignType: "YOUTUBE",
			contentType: "VIDEO",
			endDate: "2026-06-01",
			locationTargets: [{ code: "US", name: "United States" }],
			youtubeVideoId: "abc123",
		});
		expect(parsed.campaignType).toBe("YOUTUBE");
		expect(parsed.endDate).toBe("2026-06-01");
		expect(parsed.locationTargets?.[0]?.code).toBe("US");
	});

	test("YouTube entry schemas enforce ordered-list limits, exclusive forms, and playlist rules", () => {
		const base = {
			artistId: "00000000-0000-0000-0000-000000000000",
			campaignType: "YOUTUBE" as const,
			youtubeStrategy: "ORGANIC_VIEWS" as const,
		};
		const entries = Array.from({ length: 10 }, (_, index) => ({
			playlistId: `playlist-${index}`,
			videoId: `video-${index}`,
		}));
		expect(
			DynamoiGetCampaignReadinessInputSchema.parse({
				...base,
				youtubeEntries: entries,
			}).youtubeEntries,
		).toEqual(entries);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: [],
			}).success,
		).toBe(false);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: [...entries, entries[0]],
			}).success,
		).toBe(false);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: entries,
				youtubeVideoId: "legacy",
			}).success,
		).toBe(false);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: [{ videoId: "video" }],
			}).success,
		).toBe(false);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: [{ videoId: "video" }],
				youtubeStrategy: "CHEAPEST_VIEWS",
			}).success,
		).toBe(true);
		expect(
			DynamoiGetCampaignReadinessInputSchema.safeParse({
				...base,
				youtubeEntries: [{ videoId: "a" }, { videoId: "b" }],
				youtubeStrategy: "CHEAPEST_VIEWS",
			}).success,
		).toBe(false);
	});

	test("campaign readiness schema rejects impossible calendar end dates", () => {
		expect(() =>
			DynamoiGetCampaignReadinessInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				budgetAmount: 100,
				budgetType: "TOTAL",
				campaignType: "YOUTUBE",
				endDate: "2026-02-31",
			}),
		).toThrow();
	});
	test("OpenAI Connectors search and fetch tools are registered as read tools", () => {
		const search = getToolDefinition(PHASE_1_TOOL_DEFINITIONS, "search");
		expect(search.description).toContain("OpenAI ChatGPT Deep Research");
		expect(search.description).toContain("dynamoi_search");

		const fetchDef = getToolDefinition(PHASE_1_TOOL_DEFINITIONS, "fetch");
		expect(fetchDef.description).toContain("Deep Research");
		expect(fetchDef.description).toContain("artist:<uuid>");
	});

	test("OpenAI search schema requires a non-empty query", () => {
		expect(() => DynamoiOpenAiSearchInputSchema.parse({})).toThrow();
		expect(() => DynamoiOpenAiSearchInputSchema.parse({ query: "" })).toThrow();
		const ok = DynamoiOpenAiSearchInputSchema.parse({ query: "Bandlamudi" });
		expect(ok.query).toBe("Bandlamudi");
	});

	test("OpenAI fetch schema requires a non-empty id", () => {
		expect(() => DynamoiOpenAiFetchInputSchema.parse({})).toThrow();
		expect(() => DynamoiOpenAiFetchInputSchema.parse({ id: "" })).toThrow();
		const ok = DynamoiOpenAiFetchInputSchema.parse({
			id: "artist:00000000-0000-0000-0000-000000000000",
		});
		expect(ok.id.startsWith("artist:")).toBe(true);
	});

	test("read tool descriptions include empty-state fallback hints for new users", () => {
		const listArtists = getToolDefinition(
			PHASE_1_TOOL_DEFINITIONS,
			"dynamoi_list_artists",
		);
		expect(listArtists.description).toContain("brand-new");
		expect(listArtists.description).toContain(
			"dynamoi_get_account_overview.recommendedNextActions",
		);

		const search = getToolDefinition(
			PHASE_1_TOOL_DEFINITIONS,
			"dynamoi_search",
		);
		expect(search.description).toContain(
			"dynamoi_create_smart_links_from_spotify_artist",
		);

		const listCampaigns = getToolDefinition(
			PHASE_1_TOOL_DEFINITIONS,
			"dynamoi_list_campaigns",
		);
		expect(listCampaigns.description).toContain(
			"route via dynamoi_get_account_overview first",
		);
	});
});

describe("mcp/tools onboarding definitions", () => {
	test("onboarding start tools are idempotent non-destructive writes", () => {
		expect(
			PHASE_ONBOARDING_TOOL_DEFINITIONS.some(
				(def) => def.name === "dynamoi_start_meta_connection",
			),
		).toBe(true);
		for (const def of PHASE_ONBOARDING_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(false);
			expect(def.destructiveHint).toBe(false);
			expect(def.idempotentHint).toBe(true);
			expect(def.openWorldHint).toBe(true);
			expect(def.outputSchema).toBeDefined();
		}
	});

	test("platform onboarding definitions name platform-status completion fields", () => {
		const youtube = getToolDefinition(
			PHASE_ONBOARDING_TOOL_DEFINITIONS,
			"dynamoi_start_youtube_channel_link",
		);
		expect(youtube.description).toContain("platforms.youtube.connected");

		const meta = getToolDefinition(
			PHASE_ONBOARDING_TOOL_DEFINITIONS,
			"dynamoi_start_meta_connection",
		);
		expect(meta.description).toContain("platforms.meta.status");
		expect(meta.description).toContain("oauth_complete");
		expect(meta.description).toContain("billing_check_unavailable");
	});
});

describe("mcp/tools phase 2 definitions", () => {
	test("write tools include required annotations", () => {
		for (const def of PHASE_2_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(false);
			expect(def.destructiveHint).toBe(true);
			if (def.name === "dynamoi_update_campaign") {
				expect(def.idempotentHint).toBe(true);
				expect(def.openWorldHint).toBe(true);
			} else {
				expect(def.openWorldHint).toBe(false);
			}
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
	});

	test("update campaign schema accepts pause and resume actions", () => {
		const parsed = DynamoiUpdateCampaignInputSchema.parse({
			action: "pause",
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentStatus: "ACTIVE",
			userIntentSummary: "Pause because the artist asked to stop delivery.",
		});
		expect(parsed.campaignId).toBe("00000000-0000-0000-0000-000000000000");
		expect(parsed.clientRequestId).toBe("11111111-1111-4111-8111-111111111111");
		const resume = DynamoiUpdateCampaignInputSchema.parse({
			action: "resume",
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentStatus: "PAUSED",
			userIntentSummary: "Resume after confirming billing is ready.",
		});
		expect(resume.expectedCurrentStatus).toBe("PAUSED");
	});

	test("post-launch actions require scoped inputs and an idempotency key", () => {
		const base = {
			campaignId: "00000000-0000-4000-8000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			userIntentSummary: "Artist requested this change.",
		};
		const actions = [
			{ action: "change_strategy", strategy: "SUBSCRIBERS" },
			{
				action: "update_location",
				locationTargets: { countries: ["US"], mode: "COUNTRIES" },
			},
			{ action: "update_end_date", endDate: "2026-12-31" },
			{ action: "archive" },
			{ action: "update_goals", optimizeForOrganicViews: true },
		] as const;
		for (const input of actions) {
			expect(
				DynamoiUpdateCampaignInputSchema.safeParse({ ...base, ...input })
					.success,
			).toBe(true);
			expect(
				DynamoiUpdateCampaignInputSchema.safeParse({
					...base,
					...input,
					clientRequestId: undefined,
				}).success,
			).toBe(false);
		}
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				...base,
				action: "update_end_date",
				budgetAmount: 100,
				endDate: "2026-12-31",
			}).success,
		).toBe(false);
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				...base,
				action: "update_goals",
				optimizeForOrganicViews: false,
				optimizeForSubscribers: false,
			}).success,
		).toBe(true);
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				...base,
				action: "archive",
				strategy: "SUBSCRIBERS",
			}).success,
		).toBe(false);
	});

	test("update campaign output declares every new action field", () => {
		const schema = PHASE_2_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_update_campaign",
		)?.outputSchema;
		expect(schema).toBeDefined();
		for (const data of [
			{ campaignId: "c", locationTargets: [], mode: "GLOBAL" },
			{
				campaignId: "c",
				contentTitle: "Song",
				id: "c",
				inventoryConfig: "IN_FEED",
				strategy: "SUBSCRIBERS",
			},
			{ contentTitle: "Song", id: "c", newStatus: "ARCHIVED", warnings: [] },
			{
				campaignId: "c",
				monetizationQualificationMode: "STANDARD",
				optimizeForOrganicViews: true,
				optimizeForSubscribers: false,
			},
		]) {
			expect(schema?.safeParse({ data, status: "success" }).success).toBe(true);
			expect(
				schema?.safeParse({
					data: { ...data, undeclared: true },
					status: "success",
				}).success,
			).toBe(false);
		}
	});

	test("update campaign schema accepts campaign read status guards", () => {
		for (const expectedCurrentStatus of [
			"AWAITING_SMART_LINK",
			"CONTENT_VALIDATION",
			"DEPLOYING",
			"READY_FOR_REVIEW",
			"ACTIVE",
			"PAUSED",
			"SUBSCRIPTION_PAUSED",
			"ARCHIVED",
			"FAILED",
			"ENDED",
		] as const) {
			const parsed = DynamoiUpdateCampaignInputSchema.parse({
				action: "pause",
				campaignId: "00000000-0000-0000-0000-000000000000",
				expectedCurrentStatus,
			});
			expect(parsed.expectedCurrentStatus).toBe(expectedCurrentStatus);
		}
	});

	test("campaign mutation schema rejects malformed UUIDs", () => {
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "update_budget",
				budgetAmount: 100,
				campaignId: "not-a-uuid",
			}),
		).toThrow();
	});

	test("update budget schema requires positive budgetAmount", () => {
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "update_budget",
				budgetAmount: 0,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
	});

	test("update schema refuses the superseded v3 consent values", () => {
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				acceptedConsentCopyHash:
					"53647786746f962c91f5cad78d8bba531c478109041b2808a4a81efbe380abf1",
				acceptedConsentVersion: "managed-ads-prospective-daily-v3",
				action: "update_budget",
				authorizeAutomaticDailyFunding: true,
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				clientRequestId: "11111111-1111-4111-8111-111111111111",
				userIntentSummary: "Increase after checking campaign performance.",
			}).success,
		).toBe(false);
	});

	test("update schema refuses the superseded v4 consent values", () => {
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				acceptedConsentCopyHash:
					PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH,
				acceptedConsentVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION,
				action: "update_budget",
				authorizeAutomaticDailyFunding: true,
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				clientRequestId: "11111111-1111-4111-8111-111111111111",
				userIntentSummary: "Increase after checking campaign performance.",
			}).success,
		).toBe(false);
	});

	test("update schema refuses the superseded v5 consent values", () => {
		expect(
			DynamoiUpdateCampaignInputSchema.safeParse({
				acceptedConsentCopyHash:
					PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH,
				acceptedConsentVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_VERSION,
				action: "update_budget",
				authorizeAutomaticDailyFunding: true,
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				clientRequestId: "11111111-1111-4111-8111-111111111111",
				userIntentSummary: "Increase after checking campaign performance.",
			}).success,
		).toBe(false);
	});

	test("update budget schema accepts idempotency and expected-state guards", () => {
		const parsed = DynamoiUpdateCampaignInputSchema.parse({
			acceptedConsentCopyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
			acceptedConsentVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
			action: "update_budget",
			authorizeAutomaticDailyFunding: true,
			budgetAmount: 250,
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentBudgetAmount: 100,
			expectedCurrentEndDate: "2026-05-15",
			userIntentSummary: "Increase after checking campaign performance.",
		});

		expect(parsed.clientRequestId).toBe("11111111-1111-4111-8111-111111111111");
		expect(parsed.expectedCurrentEndDate).toBe("2026-05-15");
		expect(parsed.authorizeAutomaticDailyFunding).toBe(true);
	});

	test("automatic funding requires the displayed consent identity", () => {
		expect(() =>
			DynamoiUpdateBudgetInputSchema.parse({
				authorizeAutomaticDailyFunding: true,
				budgetAmount: 100,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow(
			"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId",
		);
		expect(() =>
			DynamoiUpdateBudgetInputSchema.parse({
				acceptedConsentCopyHash: "0".repeat(64),
				acceptedConsentVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
				authorizeAutomaticDailyFunding: true,
				budgetAmount: 100,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
		expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH).toHaveLength(64);
	});

	test("campaign budget schemas reject impossible calendar end dates", () => {
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "update_budget",
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				endDate: "2026-02-31",
			}),
		).toThrow();
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "update_budget",
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				expectedCurrentEndDate: "2026-02-31",
			}),
		).toThrow();
		expect(() =>
			DynamoiUpdateBudgetInputSchema.parse({
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
				endDate: "2026-02-31",
			}),
		).toThrow();
	});

	test("pause and resume reject budget-only fields", () => {
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "pause",
				budgetAmount: 250,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
		expect(() =>
			DynamoiUpdateCampaignInputSchema.parse({
				action: "resume",
				authorizeAutomaticDailyFunding: true,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
	});
});

describe("mcp/tools phase 3 definitions", () => {
	test("tools include required annotations", () => {
		for (const def of PHASE_3_TOOL_DEFINITIONS) {
			// Phase 3 includes both read and write tools; both must set all annotations.
			expect(typeof def.readOnlyHint).toBe("boolean");
			expect(typeof def.destructiveHint).toBe("boolean");
			expect(typeof def.openWorldHint).toBe("boolean");
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
		expect(
			getToolDefinition(PHASE_3_TOOL_DEFINITIONS, "dynamoi_list_media_assets")
				.destructiveHint,
		).toBe(false);
		expect(
			getToolDefinition(PHASE_3_TOOL_DEFINITIONS, "dynamoi_launch_campaign")
				.destructiveHint,
		).toBe(true);
	});

	test("launch campaign schema accepts review-style smart campaign inputs", () => {
		const parsed = DynamoiLaunchCampaignInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			budgetAmount: 100,
			budgetSplits: { GOOGLE: 0, META: 100 },
			budgetType: "TOTAL",
			campaignType: "SMART_CAMPAIGN",
			clientRequestId: "00000000-0000-0000-0000-000000000000",
			contentTitle: "Song",
			contentType: "TRACK",
			locationTargets: [
				{ code: "US", name: "United States" },
				{ code: "CA", name: "Canada" },
			],
			mediaAssetIds: ["00000000-0000-0000-0000-000000000000"],
			useAiGeneratedCopy: true,
		});

		expect(parsed.endDate).toBeUndefined();
		expect(parsed.spotifyUrl).toBeUndefined();
	});

	describe("new funding authorizations accept only the current consent pair", () => {
		const consentPairs = [
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION,
				name: "v2 pair",
			},
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION,
				name: "v3 pair",
			},
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION,
				name: "v4 pair",
			},
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_VERSION,
				name: "v5 pair",
			},
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_VERSION,
				name: "superseded v6 pair",
			},
			{
				accepted: false,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
				name: "current version with a wrong hash",
			},
			{
				accepted: true,
				copyHash: PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
				copyVersion: PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
				name: "current v7 pair",
			},
		];

		for (const pair of consentPairs) {
			test(`${pair.accepted ? "accepts" : "refuses"} the ${pair.name}`, () => {
				expect(
					isCurrentProspectiveBudgetFundingConsent({
						copyHash: pair.copyHash,
						copyVersion: pair.copyVersion,
					}),
				).toBe(pair.accepted);
				expect(
					DynamoiResumeCampaignInputSchema.safeParse({
						acceptedConsentCopyHash: pair.copyHash,
						acceptedConsentVersion: pair.copyVersion,
						authorizeAutomaticDailyFunding: true,
						campaignId: "00000000-0000-0000-0000-000000000000",
						clientRequestId: "11111111-1111-4111-8111-111111111111",
						userIntentSummary: "Resume the paused campaign.",
					}).success,
				).toBe(pair.accepted);
				expect(
					DynamoiLaunchCampaignInputSchema.safeParse({
						acceptedConsentCopyHash: pair.copyHash,
						acceptedConsentVersion: pair.copyVersion,
						artistId: "00000000-0000-0000-0000-000000000000",
						authorizeAutomaticDailyFunding: true,
						budgetAmount: 50,
						budgetSplits: { GOOGLE: 0, META: 100 },
						budgetType: "DAILY",
						campaignType: "SMART_CAMPAIGN",
						clientRequestId: "11111111-1111-4111-8111-111111111111",
						contentTitle: "Song",
						contentType: "TRACK",
						mediaAssetIds: ["00000000-0000-0000-0000-000000000000"],
					}).success,
				).toBe(pair.accepted);
			});
		}

		test("each consent hash is canonical and v7 names credit-first funding", () => {
			const hashOf = (copy: string) =>
				createHash("sha256").update(JSON.stringify({ copy })).digest("hex");
			expect(hashOf(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY)).toBe(
				PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
			);
			expect(hashOf(PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY)).toBe(
				PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY_HASH,
			);
			expect(hashOf(PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY)).toBe(
				PROSPECTIVE_BUDGET_FUNDING_CONSENT_V6_COPY_HASH,
			);
			expect(hashOf(PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY)).toBe(
				PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH,
			);
			expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION).toBe(
				"managed-ads-prospective-daily-v7",
			);
			expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY).toBe(
				"Charge my default payment method daily for this campaign's budget, after my available credits, until I pause or end it.",
			);
			expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH).toBe(
				"f49b33a4f7e8aa3cc814d5057d03e97eaa0c35a9f3f2bc0315dbd031efa0f356",
			);
			expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY).not.toMatch(
				/pacific|pst|pdt|time zone/i,
			);
			expect(PROSPECTIVE_BUDGET_FUNDING_CONSENT_V5_COPY).toBe(
				PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY.replace(
					" (Pacific time)",
					"",
				),
			);
		});

		test("superseded pairs stay renewable for campaigns that accepted them", () => {
			for (const pair of consentPairs) {
				expect(
					isRenewableProspectiveBudgetFundingConsent({
						copyHash: pair.copyHash,
						copyVersion: pair.copyVersion,
					}),
				).toBe(pair.name !== "current version with a wrong hash");
			}
		});
	});

	test("launch campaign schema rejects impossible calendar end dates", () => {
		expect(() =>
			DynamoiLaunchCampaignInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				budgetAmount: 100,
				budgetSplits: { GOOGLE: 0, META: 100 },
				budgetType: "TOTAL",
				campaignType: "SMART_CAMPAIGN",
				clientRequestId: "00000000-0000-0000-0000-000000000000",
				contentTitle: "Song",
				contentType: "TRACK",
				endDate: "2026-02-31",
				mediaAssetIds: ["00000000-0000-0000-0000-000000000000"],
			}),
		).toThrow();
	});

	test("launch campaign metadata documents funding consent and budget requirements", () => {
		const definition = getToolDefinition(
			PHASE_3_TOOL_DEFINITIONS,
			"dynamoi_launch_campaign",
		);
		expect(definition.description).toContain("authorizeAutomaticDailyFunding");
		expect(definition.description).toContain("acceptedConsentVersion");
		expect(definition.description).toContain("acceptedConsentCopyHash");
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY,
		);
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
		);
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
		);
		expect(definition.description).toContain(
			"TOTAL budgets use existing credit",
		);
		expect(definition.description).not.toContain("confirmation_required");
		expect(definition.description).not.toContain("confirmationToken");
	});

	test("update campaign metadata documents resume funding consent and retry idempotency", () => {
		const definition = getToolDefinition(
			PHASE_2_TOOL_DEFINITIONS,
			"dynamoi_update_campaign",
		);
		expect(definition.description).toContain("resume");
		expect(definition.description).toContain("authorizeAutomaticDailyFunding");
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY,
		);
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION,
		);
		expect(definition.description).toContain(
			PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH,
		);
		expect(definition.description).toContain(
			"Review and accept the daily funding authorization to resume this campaign.",
		);
		expect(definition.description).toContain("reuse the same clientRequestId");
		expect(definition.description).not.toContain("confirmation_required");
		expect(definition.description).not.toContain("confirmationToken");
	});

	test("current user metadata discourages generic advice context fishing", () => {
		const definition = getToolDefinition(
			PHASE_1_TOOL_DEFINITIONS,
			"dynamoi_get_account_overview",
		);
		expect(definition.description).toContain("explicitly asks");
		expect(definition.description).toContain("Pass intent");
		expect(definition.description).toContain("use dynamoi_get_platform_status");
		expect(definition.description).toContain("check context");
		expect(definition.description).toContain("generic Instagram");
		expect(definition.description).toContain("Never use");
	});

	test("launch campaign metadata tells the agent to stop after a successful launch", () => {
		const definition = getToolDefinition(
			PHASE_3_TOOL_DEFINITIONS,
			"dynamoi_launch_campaign",
		);
		expect(definition.description).toContain("After a successful launch");
		expect(definition.description).toContain(
			"answer from the returned campaign details directly",
		);
	});

	test("schemas reject unknown properties", () => {
		expect(() =>
			DynamoiGetCampaignInputSchema.parse({
				campaignId: "00000000-0000-0000-0000-000000000000",
				unexpected: true,
			}),
		).toThrow();
	});
});

describe("mcp/tools phase 4 smart link definitions", () => {
	test("smart link tools include required annotations and output schemas", () => {
		for (const def of PHASE_4_TOOL_DEFINITIONS) {
			expect(typeof def.readOnlyHint).toBe("boolean");
			expect(typeof def.destructiveHint).toBe("boolean");
			expect(typeof def.openWorldHint).toBe("boolean");
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
		// The single-link create can overwrite an existing link's public
		// description via customDescription, so it stays destructiveHint=true;
		// the artist-catalog create is additive only.
		expect(
			getToolDefinition(
				PHASE_4_TOOL_DEFINITIONS,
				"dynamoi_create_smart_link_from_spotify",
			).destructiveHint,
		).toBe(true);
		expect(
			getToolDefinition(
				PHASE_4_TOOL_DEFINITIONS,
				"dynamoi_create_smart_links_from_spotify_artist",
			).destructiveHint,
		).toBe(false);
	});

	test("smart link descriptions keep the free plan and paid campaign boundary clear", () => {
		const createDefinition = PHASE_4_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_create_smart_link_from_spotify",
		);
		expect(createDefinition).toBeDefined();
		expect(createDefinition?.description).toContain("Smart Links are free");
		expect(createDefinition?.description).toContain(
			"does not create a paid ad campaign",
		);
		expect(createDefinition?.description).toContain(
			"playlist URLs are not supported",
		);
		expect(createDefinition?.description).toContain("lead with the public URL");
		expect(
			getToolDefinition(
				PHASE_4_TOOL_DEFINITIONS,
				"dynamoi_create_smart_links_from_spotify_artist",
			).description,
		).toContain("artist hub");
	});

	test("list smart links description guides empty-state to the create tools", () => {
		const listSmartLinks = getToolDefinition(
			PHASE_4_TOOL_DEFINITIONS,
			"dynamoi_list_smart_links",
		);
		expect(listSmartLinks.description).toContain(
			"dynamoi_create_smart_links_from_spotify_artist",
		);
		expect(listSmartLinks.description).toContain(
			"dynamoi_create_smart_link_from_spotify",
		);
	});

	test("create smart link schema accepts Spotify entrypoint inputs", () => {
		const parsed = DynamoiCreateSmartLinkFromSpotifyInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			customDescription: "New release landing page",
			spotifyUrl: "https://open.spotify.com/track/123",
			userIntentSummary: "Create a free Smart Link for this track.",
		});

		expect(parsed.spotifyUrl).toContain("spotify.com");
	});

	test("artist catalog smart link schema accepts the Spotify artist entrypoint", () => {
		const parsed = DynamoiCreateSmartLinksFromSpotifyArtistInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			spotifyArtistUrl: "https://open.spotify.com/artist/123",
			userIntentSummary: "Create my free Smart Link artist hub.",
		});

		expect(parsed.spotifyArtistUrl).toContain("/artist/");
	});

	test("smart link update schema supports theme and validated pixel id fields only", () => {
		const parsed = DynamoiUpdateSmartLinkInputSchema.parse({
			action: "update_artist_settings",
			artistId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			metaPixelId: "1234567890",
			playLinkId: "22222222-2222-4222-8222-222222222222",
			theme: "aurora",
		});

		expect(parsed.theme).toBe("aurora");
		expect(() =>
			DynamoiUpdateSmartLinkInputSchema.parse({
				action: "update_artist_settings",
				artistId: "00000000-0000-0000-0000-000000000000",
				playLinkId: "22222222-2222-4222-8222-222222222222",
				script: "<script>alert(1)</script>",
			}),
		).toThrow();
	});

	test("full-only Studio recovery guidance names the real readback tool without touching the directory-shared reader", () => {
		const guidance = {
			dynamoi_update_smart_link_artist_hub_settings: "artistHub",
			dynamoi_update_smart_link_release_settings: "releaseSettings",
		} as const;
		for (const definition of FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS) {
			expect(definition.description).toContain("dynamoi_get_smart_link");
			expect(definition.description).toContain(guidance[definition.name]);
		}
		const reader = PHASE_4_TOOL_DEFINITIONS.find(
			(definition) => definition.name === "dynamoi_get_smart_link",
		);
		expect(reader?.description).not.toContain("artistHub");
		expect(reader?.description).not.toContain("releaseSettings");
	});

	test("full-only Studio tools accept sparse native release and Artist Hub settings", () => {
		const release = DynamoiUpdateSmartLinkReleaseSettingsInputSchema.parse({
			playLinkId: "22222222-2222-4222-8222-222222222222",
			serviceOverrides: [{ hidden: true, service: "spotify", url: null }],
			youtubeUrl: null,
		});
		expect(release.youtubeUrl).toBeNull();
		expect(Object.hasOwn(release, "customDescription")).toBe(false);
		expect(() =>
			DynamoiUpdateSmartLinkReleaseSettingsInputSchema.parse({
				playLinkId: release.playLinkId,
			}),
		).toThrow();
		const artist = DynamoiUpdateSmartLinkArtistHubSettingsInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			hubDescription: null,
			profileLinks: [
				{
					isHidden: false,
					service: "instagram",
					url: "https://instagram.com/artist",
				},
			],
			servicePriority: ["spotify"],
			servicePriorityMode: "fixed",
		});
		expect(artist.hubDescription).toBeNull();
		expect(Object.hasOwn(artist, "metaPixelId")).toBe(false);
		expect(() =>
			DynamoiUpdateSmartLinkArtistHubSettingsInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				theme: "classic",
			}),
		).toThrow();
		for (const input of [
			{
				action: "update_release_settings",
				playLinkId: release.playLinkId,
				youtubeUrl: null,
			},
			{
				action: "update_artist_settings",
				artistId: "00000000-0000-0000-0000-000000000000",
				hubDescription: null,
			},
			{
				action: "update_description",
				playLinkId: release.playLinkId,
				youtubeUrl: null,
			},
		]) {
			expect(() => DynamoiUpdateSmartLinkInputSchema.parse(input)).toThrow();
		}
	});

	test("smart link mutation schemas reject unknown properties", () => {
		expect(() =>
			DynamoiUpdateSmartLinkInputSchema.parse({
				action: "update_description",
				customDescription: "Hello",
				playLinkId: "00000000-0000-0000-0000-000000000000",
				theme: "classic",
			}),
		).toThrow();
		expect(() =>
			DynamoiUpdateSmartLinkInputSchema.parse({
				action: "update_description",
				expectedPublishState: "published",
				playLinkId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
		expect(() =>
			DynamoiUpdateSmartLinkInputSchema.parse({
				action: "publish",
				playLinkId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
	});
});
