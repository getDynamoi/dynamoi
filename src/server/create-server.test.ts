import { describe, expect, mock, test } from "bun:test";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import * as z from "zod/v4";
import { DYNAMOI_BETTER_AUTH_MCP_SCOPES } from "../auth/protected-resource";
import {
	TOTAL_BUDGET_FUNDING_CONSENT_COPY,
	TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH,
	TOTAL_BUDGET_FUNDING_CONSENT_VERSION,
} from "../consent";
import type { GetCampaignReadinessData } from "../readiness-types";
import { handleMcpHttpRequest } from "../transport/http";
import { DYNAMOI_MCP_VERSION } from "../version";
import {
	DYNAMOI_ABOUT_DIRECTORY_MARKDOWN,
	DYNAMOI_ABOUT_MARKDOWN,
	DYNAMOI_ABOUT_TOOL_DEFINITION,
	getDynamoiAbout,
} from "./about";
import {
	asTextResult,
	asValidatedTextResult,
	createDynamoiMcpServer,
	getDynamoiToolCompatibilityDefinitions,
	getDynamoiToolDefinitions,
	type Phase3Adapter,
} from "./create-server";
import { DISTRIBUTION_TOOL_DEFINITIONS } from "./distribution-tools";
import { ListMediaAssetsOutputEnvelopeSchema } from "./output-schemas";
import { SHOP_TOOL_DEFINITIONS } from "./shop-tools";
import {
	SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
} from "./smart-link-theme-preview";
import {
	FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS,
	PHASE_4_TOOL_DEFINITIONS,
} from "./smart-link-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";

import { WORKSPACE_TOOL_DEFINITION } from "./workspace/tool";

const REGISTERED_TOOL_DEFINITIONS = [
	WORKSPACE_TOOL_DEFINITION,
	DYNAMOI_ABOUT_TOOL_DEFINITION,
	...PHASE_1_TOOL_DEFINITIONS,
	...PHASE_ONBOARDING_TOOL_DEFINITIONS,
	...PHASE_2_TOOL_DEFINITIONS,
	...PHASE_3_TOOL_DEFINITIONS,
	...DISTRIBUTION_TOOL_DEFINITIONS,
	...SHOP_TOOL_DEFINITIONS,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
	...PHASE_4_TOOL_DEFINITIONS,
	...FULL_SMART_LINK_STUDIO_TOOL_DEFINITIONS,
];

function buildStubAdapter(
	overrides: Partial<Phase3Adapter> = {},
): Phase3Adapter {
	const unusedAdapterMethod = async () => ({
		message: "Adapter method not used in create-server tests.",
		status: "error" as const,
	});
	return new Proxy(overrides, {
		get: (target, property) =>
			typeof property === "string" && property in target
				? target[property as keyof Phase3Adapter]
				: unusedAdapterMethod,
	}) as Phase3Adapter;
}

describe("asTextResult", () => {
	test("marks tool execution error envelopes as MCP tool errors", () => {
		const result = asTextResult({
			kind: "business",
			message: "Invalid budget",
			status: "error",
		});

		expect(result.isError).toBe(true);
		expect(result.content).toEqual([{ text: "Invalid budget", type: "text" }]);
		expect(result.structuredContent).toEqual({
			kind: "business",
			message: "Invalid budget",
			status: "error",
		});
	});

	test("returns a tool error when a tool result violates its output schema", () => {
		const result = asValidatedTextResult({
			envelope: { data: { id: 123 }, status: "success" },
			outputSchema: z
				.object({
					data: z.object({ id: z.string() }),
					status: z.literal("success"),
				})
				.strict(),
			toolName: "dynamoi_test_tool",
		});

		expect(result.isError).toBe(true);
		expect(result.content).toEqual([
			{
				text: "Tool dynamoi_test_tool returned an invalid result shape.",
				type: "text",
			},
		]);
		expect(result.structuredContent).toEqual({
			code: "OUTPUT_INVALID",
			kind: "validation",
			message: "Tool dynamoi_test_tool returned an invalid result shape.",
			nextAction: {
				kind: "read_status",
				reason: "Inspect the existing operation identity before retrying.",
			},
			prerequisite:
				"The existing operation or resource identity must be inspected before replaying.",
			retryable: false,
			status: "error",
		});
	});

	test("accepts media asset summary output", () => {
		const result = asValidatedTextResult({
			envelope: {
				data: {
					nextCursor: "cursor-2",
					summary: "2 media assets are available.",
					totalCount: 2,
				},
				status: "success",
			},
			outputSchema: ListMediaAssetsOutputEnvelopeSchema,
			toolName: "dynamoi_list_media_assets",
		});

		expect(result.isError).toBeUndefined();
		expect(result.structuredContent).toEqual({
			data: {
				nextCursor: "cursor-2",
				summary: "2 media assets are available.",
				totalCount: 2,
			},
			status: "success",
		});
	});
});

describe("createDynamoiMcpServer", () => {
	test("registers every public tool definition once", async () => {
		const expectedToolNames = REGISTERED_TOOL_DEFINITIONS.map(
			(definition) => definition.name,
		);
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "full",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();

			expect(new Set(expectedToolNames).size).toBe(expectedToolNames.length);
			expect(result.tools.map((tool) => tool.name).sort()).toEqual(
				[...expectedToolNames].sort(),
			);
		} finally {
			await client.close();
		}
	});

	test("validates registered campaign readiness output with proposal fields", async () => {
		const readiness: GetCampaignReadinessData = {
			artistId: "11111111-1111-4111-8111-111111111111",
			artistName: "A",
			blockingCodes: ["funding_unavailable"],
			blockingIssues: ["Campaign funding is unavailable in this currency."],
			budgetConstraints: {
				budgetType: "DAILY",
				currency: "usd",
				currencyExponent: 2,
				effectiveDailyBudgetMinor: 5000,
				maximumBudgetMinor: 100_000,
				maximumDailyBudgetMinor: 100_000,
				maximumTotalBudgetMinor: 999_999_999,
				minimumBudgetMinor: 1000,
				minimumCampaignDays: 5,
				minimumDailyBudgetMinor: 1000,
				minimumEndDate: "2026-10-12",
				minimumTotalBudgetMinor: 10_000,
			},
			campaignType: "SMART_CAMPAIGN",
			isReady: false,
			missingInputs: [],
			normalizedTargeting: { mode: "GLOBAL" },
			recommendedNextAction: "Resolve blocking issues before launching.",
			warnings: [],
		};
		const readinessWithFundingPreview = {
			...readiness,
			fundingPreview: {
				asOf: "2026-10-07T18:00:00.000Z",
				availableBalanceMinor: null,
				consentCopy: TOTAL_BUDGET_FUNDING_CONSENT_COPY,
				consentCopyHash: TOTAL_BUDGET_FUNDING_CONSENT_COPY_HASH,
				consentVersion: TOTAL_BUDGET_FUNDING_CONSENT_VERSION,
				currency: "USD",
				currencyExponent: 2,
				firstWindowCardMinor: null,
				firstWindowCardUpperBoundMinor: 0,
				firstWindowCreditCoverageMinor: null,
				firstWindowMinor: 0,
				fullFlightCardMinor: null,
				fullFlightCardUpperBoundMinor: null,
				fullFlightCreditCoverageMinor: null,
				fullFlightMinor: null,
				fundingDays: 5,
				initialWindowCount: 1,
				nextExpiryAt: null,
				status: "unavailable",
				windows: [],
			},
		};
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				getCampaignReadiness: async () => ({
					data: readinessWithFundingPreview,
					status: "success",
				}),
			}),
			toolProfile: "full",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
		try {
			const result = await client.callTool({
				arguments: {
					artistId: readiness.artistId,
					campaignType: "SMART_CAMPAIGN",
					format: "json",
				},
				name: "dynamoi_get_campaign_readiness",
			});
			expect(result.isError).toBeUndefined();
			expect(result.structuredContent).toMatchObject({
				data: {
					blockingCodes: ["funding_unavailable"],
					budgetConstraints: readiness.budgetConstraints,
					fundingPreview: readinessWithFundingPreview.fundingPreview,
				},
				status: "success",
			});
		} finally {
			await client.close();
		}
	});

	test("advertises one final tool shape to both eras and response modes", async () => {
		const createServer = () =>
			createDynamoiMcpServer({
				adapter: buildStubAdapter(),
				toolProfile: "directory",
			});
		const modernMeta = {
			"io.modelcontextprotocol/clientCapabilities": {},
			"io.modelcontextprotocol/protocolVersion": "2026-07-28",
		};
		const variants = [
			{ accept: "application/json", modern: false },
			{ accept: "application/json, text/event-stream", modern: false },
			{ accept: "application/json", modern: true },
		];
		const lists: unknown[] = [];
		for (const variant of variants) {
			const body = {
				id: 1,
				jsonrpc: "2.0",
				method: "tools/list",
				...(variant.modern ? { params: { _meta: modernMeta } } : {}),
			};
			const response = await handleMcpHttpRequest({
				createServer,
				parsedBody: body,
				request: new Request("http://example.com/mcp", {
					body: JSON.stringify(body),
					headers: {
						accept: variant.accept,
						"content-type": "application/json",
						...(variant.modern
							? {
									"mcp-method": "tools/list",
									"mcp-protocol-version": "2026-07-28",
								}
							: {}),
					},
					method: "POST",
				}),
			});
			const text = await response.text();
			const payload = text.startsWith("event:")
				? text
						.split("\n")
						.find((line) => line.startsWith("data: "))
						?.slice(6)
				: text;
			const result = (
				JSON.parse(payload ?? "null") as {
					result: {
						cacheScope?: string;
						tools: Record<string, unknown>[];
						ttlMs?: number;
					};
				}
			).result;
			expect(response.status).toBe(200);
			expect(JSON.stringify(result.tools)).not.toContain('"$schema"');
			for (const tool of result.tools) {
				expect(tool["securitySchemes"]).toEqual(
					(tool["_meta"] as Record<string, unknown>)["securitySchemes"],
				);
			}
			if (variant.modern) {
				expect(result.cacheScope).toBe("private");
				expect(result.ttlMs).toBeGreaterThan(0);
			}
			lists.push(result.tools);
		}
		expect(lists[1]).toEqual(lists[0]);
		expect(lists[2]).toEqual(lists[0]);
	});

	test("does not advertise list changes from a per-request server", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "full",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
		try {
			const capabilities = client.getServerCapabilities();
			expect(capabilities?.tools?.listChanged).toBe(false);
			expect(capabilities?.resources?.listChanged).toBe(false);
			expect(capabilities?.prompts?.listChanged).toBe(false);
		} finally {
			await client.close();
		}
	});

	test("answers a denied tool call with the host's step-up result through the SDK", async () => {
		const listArtists = mock(async (_input?: unknown) => ({
			data: { summary: "Should not run.", totalCount: 0 },
			status: "success" as const,
		}));
		const challenge =
			'Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource/mcp", scope="dynamoi:read", error="insufficient_scope"';
		const body = {
			id: 9,
			jsonrpc: "2.0",
			method: "tools/call",
			params: {
				_meta: {
					"io.modelcontextprotocol/clientCapabilities": {},
					"io.modelcontextprotocol/protocolVersion": "2026-07-28",
				},
				arguments: {},
				name: "dynamoi_list_artists",
			},
		};
		const response = await handleMcpHttpRequest({
			createServer: () =>
				createDynamoiMcpServer({
					adapter: buildStubAdapter({ listArtists }),
					authorizeToolCall: () => ({
						_meta: { "mcp/www_authenticate": [challenge] },
						content: [{ text: "Permission required.", type: "text" }],
						isError: true,
					}),
				}),
			parsedBody: body,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(body),
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"mcp-method": "tools/call",
					"mcp-name": "dynamoi_list_artists",
					"mcp-protocol-version": "2026-07-28",
				},
				method: "POST",
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			id: 9,
			result: {
				_meta: {
					"io.modelcontextprotocol/serverInfo": { name: "dynamoi" },
					"mcp/www_authenticate": [challenge],
				},
				isError: true,
				resultType: "complete",
			},
		});
		expect(listArtists).not.toHaveBeenCalled();
	});

	test.each(["full", "directory"] as const)(
		"serves About Dynamoi publicly in the %s profile",
		async (toolProfile) => {
			const expectedMarkdown =
				toolProfile === "directory"
					? DYNAMOI_ABOUT_DIRECTORY_MARKDOWN
					: DYNAMOI_ABOUT_MARKDOWN;
			const server = createDynamoiMcpServer({
				adapter: buildStubAdapter(),
				toolProfile,
			});
			const client = new Client({ name: "test-client", version: "1.0.0" });
			const [clientTransport, serverTransport] =
				InMemoryTransport.createLinkedPair();
			await Promise.all([
				client.connect(clientTransport),
				server.connect(serverTransport),
			]);
			try {
				const about = (await client.listTools()).tools.find(
					(tool) => tool.name === "dynamoi_about",
				);
				expect(about?._meta?.["securitySchemes"]).toEqual([{ type: "noauth" }]);
				expect(about?.annotations).toMatchObject({
					destructiveHint: false,
					readOnlyHint: true,
				});
				const result = await client.callTool({
					arguments: {},
					name: "dynamoi_about",
				});
				expect(result.isError).toBeUndefined();
				expect(result.structuredContent).toMatchObject({
					data: { markdown: expectedMarkdown },
					status: "success",
				});
				const resource = await client.readResource({
					uri: "dynamoi://about",
				});
				expect(resource.contents[0]).toMatchObject({
					mimeType: "text/markdown",
					text: expectedMarkdown,
				});
			} finally {
				await client.close();
			}
		},
	);

	test("directory About variant omits pricing, plans, and Shop purchase surfaces", () => {
		const directory = getDynamoiAbout({ toolProfile: "directory" });
		if (directory.status !== "success") {
			throw new Error("Expected directory status to be success");
		}
		expect(directory.data.markdown).not.toContain("pricing");
		expect(directory.data.markdown).not.toContain("Shop");
		expect(directory.data.markdown).not.toContain("$10/day");
		expect(directory.data.markdown).not.toContain("Net Receipts");
		for (const text of [directory.data.markdown, directory.data.summary]) {
			expect(text).not.toMatch(/\$\d/);
			expect(text).not.toMatch(/Starter|\/month|launch campaign credit/i);
			expect(text).not.toMatch(/pricing|Shop|checkout|subscription/i);
		}
		expect(directory.data.links.pricing).toBeUndefined();
		expect(directory.data.links.signIn).toBe("https://dynamoi.com");
		const full = getDynamoiAbout({ toolProfile: "full" });
		if (full.status !== "success") {
			throw new Error("Expected full status to be success");
		}
		expect(full.data.markdown).toContain("pricing");
		expect(full.data.markdown).toContain("Shop");
		expect(full.data.markdown).toContain(
			"Starter is $25/month with a $50 launch campaign credit, and campaign budgets start at $10/day.",
		);
		expect(full.data.links.pricing).toBe("https://dynamoi.com/pricing");
		// Missing profile fails closed to the directory variant.
		const fallback = getDynamoiAbout();
		if (fallback.status !== "success") {
			throw new Error("Expected fallback status to be success");
		}
		expect(fallback.data.markdown).toBe(DYNAMOI_ABOUT_DIRECTORY_MARKDOWN);
	});

	test("About copy uses the approved company framing", () => {
		for (const markdown of [
			DYNAMOI_ABOUT_MARKDOWN,
			DYNAMOI_ABOUT_DIRECTORY_MARKDOWN,
		]) {
			expect(markdown).toContain("operated by humans, assisted by AI");
			expect(markdown).not.toMatch(/operated by AI|run by AI|AI-operated/i);
		}
	});

	test("About copy carries the canonical /about company facts in both variants", () => {
		for (const toolProfile of ["full", "directory"] as const) {
			const about = getDynamoiAbout({ toolProfile });
			if (about.status !== "success") {
				throw new Error("Expected about status to be success");
			}
			const { data } = about;
			for (const fact of [
				"music marketing platform founded in 2021 by Trevor Loucks",
				"Sioux Falls, South Dakota",
				"People make the decisions and are accountable for every campaign and support reply; AI assists with ad creative, campaign monitoring, reporting, and routine tasks.",
				"support@dynamoi.com",
				"replies within 24 hours",
				"(distribution, campaigns, and royalties)",
			]) {
				expect(data.markdown).toContain(fact);
			}
			expect(data.summary).toContain("founded in 2021 by Trevor Loucks");
			expect(data.summary).toContain("support@dynamoi.com");
			expect(data.links.support).toBe("mailto:support@dynamoi.com");
			expect(`${data.markdown}\n${data.summary}`).not.toMatch(
				/\bmargins?\b|media[-\s]spend|pass[-\s]?through|mark[-\s]?ups?/i,
			);
		}
	});

	test("fails closed to the directory catalog when no profile is given", async () => {
		expect(getDynamoiToolDefinitions().map((tool) => tool.name)).toEqual(
			getDynamoiToolDefinitions({ toolProfile: "directory" }).map(
				(tool) => tool.name,
			),
		);
		const server = createDynamoiMcpServer({ adapter: buildStubAdapter() });
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
		try {
			const toolNames = (await client.listTools()).tools.map(
				(tool) => tool.name,
			);
			expect(toolNames).not.toContain("dynamoi_launch_campaign");
			expect(toolNames).not.toContain("dynamoi_shop_create_checkout");
			expect(client.getServerCapabilities()?.prompts).toBeUndefined();
		} finally {
			await client.close();
		}
	});

	test("uses a concrete MCP server version in source and bundled builds", () => {
		expect(DYNAMOI_MCP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
		expect(DYNAMOI_MCP_VERSION).not.toContain("__");
	});

	test("advertises each tool's least-privilege OAuth scopes", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			oauthScopes: DYNAMOI_BETTER_AUTH_MCP_SCOPES,
			toolProfile: "full",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();
			const scopesFor = (toolName: string) =>
				result.tools.find((tool) => tool.name === toolName)?._meta?.[
					"securitySchemes"
				];
			expect(scopesFor("search")).toEqual([
				{ scopes: ["dynamoi:read"], type: "oauth2" },
			]);
			expect(scopesFor("dynamoi_shop_get_quote")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:mcp.full"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_shop_create_checkout")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:mcp.full"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_get_billing")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:billing.read"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_launch_campaign")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:campaign.launch"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_get_distribution_application")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:distribution.read"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_apply_for_distribution")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:distribution.apply"],
					type: "oauth2",
				},
			]);
		} finally {
			await client.close();
		}
	});

	test("directory profile omits paid launch, billing, and connection-start tools", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "directory",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();
			const toolNames = result.tools.map((tool) => tool.name);

			// Directory-safe tools including the read-only workspace.
			expect(toolNames).toHaveLength(24);
			expect(toolNames).toContain("dynamoi_get_youtube_channel_data");
			expect(toolNames).toContain("dynamoi_get_growth_audit");
			expect(toolNames).toContain("dynamoi_get_playlist_analytics");
			expect(toolNames).toContain("dynamoi_get_audience_analytics");
			expect(toolNames).toContain("dynamoi_about");
			expect(toolNames).toContain("dynamoi_create_smart_link_from_spotify");
			expect(toolNames).toContain(
				"dynamoi_create_smart_links_from_spotify_artist",
			);
			expect(toolNames).toContain("dynamoi_get_campaign");
			expect(toolNames).toContain("dynamoi_get_distribution_application");
			expect(toolNames).toContain("dynamoi_apply_for_distribution");
			expect(toolNames).toContain("dynamoi_preview_smart_link_themes");
			expect(toolNames).not.toContain("dynamoi_shop_get_quote");
			expect(toolNames).not.toContain("dynamoi_shop_create_checkout");
			expect(toolNames).not.toContain("dynamoi_get_billing");
			expect(toolNames).not.toContain("dynamoi_get_campaign_readiness");
			expect(toolNames).not.toContain("dynamoi_launch_campaign");
			expect(toolNames).not.toContain("dynamoi_start_meta_connection");
			expect(toolNames).not.toContain("dynamoi_start_youtube_channel_link");
			expect(toolNames).not.toContain("dynamoi_update_campaign");
			const directoryDescriptions = result.tools
				.map((tool) => tool.description ?? "")
				.join("\n");
			expect(directoryDescriptions).not.toContain("dynamoi_get_billing");
			expect(directoryDescriptions).not.toContain(
				"dynamoi_get_campaign_readiness",
			);
			expect(directoryDescriptions).not.toContain(
				"dynamoi_start_meta_connection",
			);
			expect(directoryDescriptions).not.toContain(
				"dynamoi_start_youtube_channel_link",
			);
			expect(directoryDescriptions).not.toContain("dynamoi://");
			for (const tool of result.tools) {
				const outputProperties = tool.outputSchema?.properties as
					| Record<string, { anyOf?: unknown[]; properties?: unknown }>
					| undefined;
				const dataSchema = outputProperties?.data;
				expect(
					Boolean(dataSchema?.properties) ||
						(dataSchema?.anyOf?.length ?? 0) > 0,
				).toBe(true);
			}

			const getSmartLink = result.tools.find(
				(tool) => tool.name === "dynamoi_get_smart_link",
			);
			const getSmartLinkProperties = getSmartLink?.inputSchema?.properties as
				| Record<string, unknown>
				| undefined;
			expect(getSmartLinkProperties?.playLinkId).toMatchObject({
				type: "string",
			});
			expect(getSmartLinkProperties?.includeAnalytics).toEqual({
				type: "boolean",
			});
			expect(getSmartLinkProperties?.includeArtistSettings).toEqual({
				type: "boolean",
			});
			expect(getSmartLinkProperties?.include).toBeUndefined();
		} finally {
			await client.close();
		}
	});

	test("directory profile advertises the Smart Link theme preview widget", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "directory",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const tools = await client.listTools();
			const previewTool = tools.tools.find(
				(tool) => tool.name === "dynamoi_preview_smart_link_themes",
			) as
				| ((typeof tools.tools)[number] & { _meta?: Record<string, unknown> })
				| undefined;
			expect(previewTool?._meta?.["openai/outputTemplate"]).toBe(
				SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			);
			expect(previewTool?._meta?.ui).toEqual({
				resourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});

			const resource = await client.readResource({
				uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});
			expect(resource.contents).toHaveLength(1);
			expect(resource.contents[0]).toMatchObject({
				_meta: {
					ui: {
						csp: {
							connectDomains: [],
							resourceDomains: [],
						},
						domain: "https://dynamoi.com",
						prefersBorder: true,
					},
				},
				mimeType: "text/html;profile=mcp-app",
				uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});
			const firstContent = resource.contents[0];
			const widgetHtml =
				firstContent && "text" in firstContent ? firstContent.text : undefined;
			expect(widgetHtml).toContain("Smart Link themes");
			expect(widgetHtml).not.toContain(".innerHTML");

			const result = await client.callTool({
				arguments: {
					artistName: "92 Keys",
					releaseTitle: "Demo Review Single",
				},
				name: "dynamoi_preview_smart_link_themes",
			});
			expect(result.structuredContent).toMatchObject({
				data: {
					artistName: "92 Keys",
					releaseTitle: "Demo Review Single",
					themes: [
						{ id: "classic", name: "Classic" },
						{ id: "brutalist", name: "Brutalist" },
						{ id: "aurora", name: "Aurora" },
						{ id: "cinematic", name: "Cinematic" },
					],
					widgetResourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
				},
				status: "success",
			});
		} finally {
			await client.close();
		}
	});

	test("rejects the retired Smart Link include array before dispatch", async () => {
		let receivedInput: unknown;
		const requestBody = {
			id: 1,
			jsonrpc: "2.0",
			method: "tools/call",
			params: {
				arguments: {
					include: ["analytics"],
					playLinkId: "22222222-2222-4222-8222-222222222222",
				},
				name: "dynamoi_get_smart_link",
			},
		};

		const response = await handleMcpHttpRequest({
			createServer: () =>
				createDynamoiMcpServer({
					adapter: buildStubAdapter({
						getSmartLink: async (input) => {
							receivedInput = input;
							return {
								data: { summary: "Smart Link details loaded." },
								status: "success",
							};
						},
					}),
					toolProfile: "directory",
				}),
			parsedBody: requestBody,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(requestBody),
				headers: {
					accept: "application/json, text/event-stream",
					"content-type": "application/json",
				},
				method: "POST",
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toContain('Unrecognized key: \\"include\\"');
		expect(receivedInput).toBeUndefined();
	});

	test("calls tools whose canonical output schemas are success/error unions", async () => {
		const adapter = buildStubAdapter({
			search: async () => ({
				data: {
					results: [],
					summary: "No matching records found.",
					totalCount: 0,
				},
				status: "success",
			}),
		});
		const server = createDynamoiMcpServer({ adapter });
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {
					format: "summary",
					limit: 10,
					query: "92 Keys",
					type: "artist",
				},
				name: "dynamoi_search",
			});

			expect(result.isError).toBeUndefined();
			expect(result.content).toEqual([
				{ text: "No matching records found.", type: "text" },
			]);
			expect(result.structuredContent).toEqual({
				data: {
					results: [],
					summary: "No matching records found.",
					totalCount: 0,
				},
				status: "success",
			});
		} finally {
			await client.close();
		}
	});

	test("observes each registered tool call once with its canonical name", async () => {
		const onToolCall = mock(async () => undefined);
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				search: async () => ({
					data: { results: [], summary: "No results.", totalCount: 0 },
					status: "success",
				}),
			}),
			onToolCall,
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			await client.callTool({
				arguments: { query: "92 Keys", type: "artist" },
				name: "dynamoi_search",
			});

			expect(onToolCall).toHaveBeenCalledTimes(1);
			expect(onToolCall).toHaveBeenCalledWith(
				expect.objectContaining({
					result: expect.objectContaining({ status: "success" }),
					toolName: "dynamoi_search",
				}),
			);
		} finally {
			await client.close();
		}
	});

	test("isolates nested structured result from observer mutation", async () => {
		const original = {
			data: { artists: [], summary: "No fixture artists.", totalCount: 0 },
			status: "success" as const,
		};
		let callbackCount = 0;
		let observedResult: Record<string, unknown> | undefined;
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				listArtists: async () => structuredClone(original),
			}),
			onToolCall(observation) {
				callbackCount += 1;
				const snapshot = observation.result as Record<string, unknown>;
				observedResult = snapshot;
				const data = snapshot.data as Record<string, unknown>;
				data.summary = "Observer changed this valid summary.";
				throw new Error("Observer failure after nested mutation");
			},
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {},
				name: "dynamoi_list_artists",
			});

			expect(result.isError).toBeUndefined();
			expect(result.content).toEqual([
				{ text: "No fixture artists.", type: "text" },
			]);
			expect(result.structuredContent).toEqual(original);
			expect(observedResult).toMatchObject({
				data: { summary: "Observer changed this valid summary." },
			});
			expect(callbackCount).toBe(1);
		} finally {
			await client.close();
			await server.close();
		}
	});

	test("isolates top-level structured result deletion from observer mutation", async () => {
		const original = {
			data: { artists: [], summary: "No fixture artists.", totalCount: 0 },
			status: "success" as const,
		};
		let callbackCount = 0;
		let observedResult: Record<string, unknown> | undefined;
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				listArtists: async () => structuredClone(original),
			}),
			onToolCall(observation) {
				callbackCount += 1;
				const snapshot = observation.result as Record<string, unknown>;
				observedResult = snapshot;
				snapshot.status = "observer-mutated";
				Reflect.deleteProperty(snapshot, "data");
				throw new Error("Observer failure after top-level mutation");
			},
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {},
				name: "dynamoi_list_artists",
			});

			expect(result.isError).toBeUndefined();
			expect(result.content).toEqual([
				{ text: "No fixture artists.", type: "text" },
			]);
			expect(result.structuredContent).toEqual(original);
			expect(observedResult).toEqual({ status: "observer-mutated" });
			expect(callbackCount).toBe(1);
		} finally {
			await client.close();
			await server.close();
		}
	});

	test("preserves the original dispatcher Error when the observer mutates it", async () => {
		const originalError = new Error("Original dispatcher failure");
		let callbackCount = 0;
		let observedError: Error | undefined;
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				listArtists: async () => {
					throw originalError;
				},
			}),
			onToolCall(observation) {
				callbackCount += 1;
				observedError = observation.error as Error;
				observedError.message = "Observer-mutated dispatcher message";
				throw new Error("Observer failure after error mutation");
			},
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {},
				name: "dynamoi_list_artists",
			});

			expect(result.isError).toBe(true);
			expect(result.content).toEqual([
				{
					text: "Original dispatcher failure",
					type: "text",
				},
			]);
			expect(observedError?.message).toBe(
				"Observer-mutated dispatcher message",
			);
			expect(originalError.message).toBe("Original dispatcher failure");
			expect(callbackCount).toBe(1);
		} finally {
			await client.close();
			await server.close();
		}
	});

	type CircularFailure = {
		marker: string;
		self?: unknown;
		callback?: () => undefined;
	};

	test("preserves an unknown dispatcher failure when its snapshot is uncloneable", async () => {
		const circularFailure: CircularFailure = { marker: "original" };
		circularFailure.self = circularFailure;
		circularFailure.callback = () => undefined;
		let callbackCount = 0;
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				listArtists: async () => {
					throw circularFailure;
				},
			}),
			onToolCall(observation) {
				callbackCount += 1;
				const snapshot = observation.error as Record<string, unknown>;
				snapshot.marker = "observer-mutated";
				throw new Error("Observer failure after unknown error mutation");
			},
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {},
				name: "dynamoi_list_artists",
			});

			expect(result.isError).toBe(true);
			expect(result.content).toEqual([
				{
					text: String(circularFailure),
					type: "text",
				},
			]);
			expect(circularFailure.marker).toBe("original");
			expect(circularFailure.self).toBe(circularFailure);
			expect(callbackCount).toBe(1);
		} finally {
			await client.close();
			await server.close();
		}
	});

	test("uses Smart Link summaries as URL-first text while keeping IDs structured", () => {
		const envelope = {
			data: {
				actionRequired: [],
				artistHubUrl: "https://play.dynamoi.com/92-keys",
				artistId: "00000000-0000-0000-0000-000000000000",
				artistName: "92 Keys",
				claimStatus: "auto_approved",
				createdAt: "2026-05-01T00:00:00.000Z",
				customDescription: null,
				id: "11111111-1111-4111-8111-111111111111",
				isPublic: true,
				localizedPublicUrls: [],
				nextActions: [],
				originalSpotifyUrl: "https://open.spotify.com/track/abc",
				publicUrl: "https://play.dynamoi.com/92-keys/song",
				publishState: "published",
				releaseSlug: "song",
				releaseTitle: "Song",
				releaseType: "track",
				renderState: "rendered",
				spotifyUrl: "https://open.spotify.com/track/abc",
				summary: [
					"# Song",
					"Artist: 92 Keys",
					"Public URL: https://play.dynamoi.com/92-keys/song",
					"Status: public",
				].join("\n"),
				takedownStatus: "none",
				theme: "classic",
				updatedAt: "2026-05-01T00:00:00.000Z",
			},
			status: "success",
		};

		const result = asTextResult(envelope);

		expect(result.content[0]?.text).toContain(
			"Public URL: https://play.dynamoi.com/92-keys/song",
		);
		expect(result.content[0]?.text).not.toContain(
			"11111111-1111-4111-8111-111111111111",
		);
		expect(result.structuredContent).toEqual(envelope);
	});
});

describe("approved directory Smart Link contracts", () => {
	const artistId = "11111111-1111-4111-8111-111111111111";
	const playLinkId = "22222222-2222-4222-8222-222222222222";
	const compatibility = getDynamoiToolCompatibilityDefinitions({
		toolProfile: "directory",
	}).find((tool) => tool.name === "dynamoi_update_smart_link")!;
	const artist = getDynamoiToolDefinitions({ toolProfile: "directory" }).find(
		(tool) => tool.name === "dynamoi_update_smart_link_artist_settings",
	)!;
	test("keeps exact approved descriptions and legacy refinements", () => {
		expect(compatibility.description).toBe(
			"Use this when the user wants to change one Smart Link's public description or update artist-level Smart Link theme/pixel settings. Set action to update_description or update_artist_settings. Public availability is artist-wide in the dashboard; this tool does not publish or unpublish individual links. Theme-only updates switch instantly; description or pixel changes may queue background rendering.",
		);
		expect(artist.description).toBe(
			"Use this when the user wants to change artist-level Smart Link theme or validated pixel settings. This tool only changes artist settings; it cannot change a link description or publish or unpublish links. Confirm the requested settings before calling. Theme-only changes switch instantly; pixel changes may queue background rendering.",
		);
		for (const input of [
			{ action: "update_description", customDescription: null, playLinkId },
			{ action: "update_artist_settings", artistId, theme: "classic" },
			{ action: "update_artist_settings", artistId, metaPixelId: null },
		]) {
			expect(compatibility.schema.safeParse(input).success).toBe(true);
		}
		for (const input of [
			{ action: "update_description", playLinkId },
			{ action: "update_description", customDescription: "test" },
			{ action: "update_artist_settings", artistId },
			{ action: "update_artist_settings", theme: "classic" },
			{
				action: "update_artist_settings",
				artistId,
				metaPixelId: "x".repeat(33),
			},
		]) {
			expect(compatibility.schema.safeParse(input).success).toBe(false);
		}
		expect(
			artist.schema.safeParse({ artistId, theme: "classic" }).success,
		).toBe(true);
		expect(artist.schema.safeParse({ artistId }).success).toBe(false);
		expect(
			getDynamoiToolDefinitions().find((tool) => tool.name === artist.name)
				?.schema,
		).toBe(artist.schema);
	});
	const extras = [
		{ hubDescription: "bio" },
		{ profileLinks: [] },
		{ servicePriority: [] },
		{ servicePriorityMode: "fixed" },
		{ youtubeUrl: null },
		{ serviceOverrides: [] },
	];
	test.each(extras)("rejects directory extensions %j", (extra) => {
		expect(
			compatibility.schema.safeParse({
				action: "update_artist_settings",
				artistId,
				theme: "classic",
				...extra,
			}).success,
		).toBe(false);
		expect(
			artist.schema.safeParse({ artistId, theme: "classic", ...extra }).success,
		).toBe(false);
	});
	test("full profile keeps the approved schema and moves Studio extensions to full-only tools", () => {
		const fullTools = getDynamoiToolDefinitions({ toolProfile: "full" });
		const directoryTools = getDynamoiToolDefinitions({
			toolProfile: "directory",
		});
		const full = fullTools.find((tool) => tool.name === compatibility.name)!;
		expect(full.schema).toBe(compatibility.schema);
		for (const input of [
			{ action: "update_release_settings", playLinkId, youtubeUrl: null },
			{ action: "update_artist_settings", artistId, hubDescription: "bio" },
			{ action: "update_artist_settings", artistId, profileLinks: [] },
		]) {
			expect(full.schema.safeParse(input).success).toBe(false);
		}
		const release = fullTools.find(
			(tool) => tool.name === "dynamoi_update_smart_link_release_settings",
		)!;
		const hub = fullTools.find(
			(tool) => tool.name === "dynamoi_update_smart_link_artist_hub_settings",
		)!;
		expect(
			release.schema.safeParse({ playLinkId, youtubeUrl: null }).success,
		).toBe(true);
		expect(release.schema.safeParse({ playLinkId }).success).toBe(false);
		expect(
			hub.schema.safeParse({
				artistId,
				hubDescription: "bio",
				profileLinks: [],
				servicePriority: [],
				servicePriorityMode: "fixed",
			}).success,
		).toBe(true);
		expect(hub.schema.safeParse({ artistId, theme: "classic" }).success).toBe(
			false,
		);
		for (const tool of [release, hub]) {
			expect(tool).toMatchObject({
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: true,
				readOnlyHint: false,
			});
			expect(directoryTools.some((entry) => entry.name === tool.name)).toBe(
				false,
			);
			expect(
				getDynamoiToolCompatibilityDefinitions({
					toolProfile: "directory",
				}).some((entry) => entry.name === tool.name),
			).toBe(false);
		}
	});
	test("registered hidden compatibility rejects extensions before adapter dispatch", async () => {
		let calls = 0;
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				updateSmartLink: async () => {
					calls += 1;
					return {
						kind: "business",
						message: "Reached adapter",
						status: "error",
					};
				},
			}),
			toolProfile: "directory",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
		try {
			const tools = (await client.listTools()).tools;
			expect(tools.some((tool) => tool.name === compatibility.name)).toBe(
				false,
			);
			expect(tools.some((tool) => tool.name === artist.name)).toBe(true);
			for (const name of [compatibility.name, artist.name]) {
				for (const extra of extras) {
					const result = await client.callTool({
						arguments: {
							artistId,
							theme: "classic",
							...(name === compatibility.name
								? { action: "update_artist_settings" }
								: {}),
							...extra,
						},
						name,
					});
					expect(result.isError).toBe(true);
				}
			}
			expect(
				(
					await client.callTool({
						arguments: {
							action: "update_release_settings",
							playLinkId,
							youtubeUrl: null,
						},
						name: compatibility.name,
					})
				).isError,
			).toBe(true);
			expect(calls).toBe(0);
			await client.callTool({
				arguments: {
					action: "update_description",
					customDescription: "hello",
					playLinkId,
				},
				name: compatibility.name,
			});
			await client.callTool({
				arguments: { artistId, theme: "classic" },
				name: artist.name,
			});
			expect(calls).toBe(2);
		} finally {
			await client.close();
		}
	});
});
