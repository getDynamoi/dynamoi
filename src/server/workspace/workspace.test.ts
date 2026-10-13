import { describe, expect, spyOn, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { DYNAMOI_MCP_TOOL_SCOPES } from "../../auth/protected-resource";
import { ChannelResultsSchema } from "../channel-results-schema";
import { createDynamoiMcpServer, type Phase3Adapter } from "../create-server";
import { channelFixture } from "./channel-fixture.test-support";
import {
	initialArtist,
	parseDeepLink,
	projectRecord,
	publicLink,
	selectedContext,
} from "./data";
import {
	openWorkspace,
	WORKSPACE_METADATA,
	WORKSPACE_RESOURCE_URI,
	WORKSPACE_TOOL_DEFINITION,
	WorkspaceOutputSchema,
} from "./tool";
import attackVectors from "./workspace-attack-vectors.test-support.json" with {
	type: "json",
};
import { WORKSPACE_SCRIPT } from "./workspace-script.generated";

const artistId = "11111111-1111-4111-8111-111111111111";
function adapter(overrides = {}): Phase3Adapter {
	return new Proxy(overrides, {
		get(target, key) {
			return (
				Reflect.get(target, key) ??
				(() => {
					throw new Error(`Unexpected adapter call ${String(key)}`);
				})
			);
		},
	}) as Phase3Adapter;
}
function readerAdapter() {
	return adapter({
		getCurrentUser: async () => ({
			data: {
				artistCount: 1,
				spend: 99,
				user: { email: "private@example.test" },
			},
			status: "success",
		}),
		listArtists: async () => ({
			data: {
				artists: [
					{
						billingStatus: "PAID",
						id: artistId,
						name: "<script>Artist</script>",
						stripeCustomerId: "private",
					},
				],
			},
			status: "success",
		}),
		openWorkspace: async () => openWorkspace(readerAdapter()),
	});
}
describe("artist workspace contract", () => {
	test("defers initial selection while another roster page can contain a duplicate", () => {
		const firstPage = [
			{ id: artistId, name: "Artist", organizationName: "One" },
		];
		expect(initialArtist(firstPage, "next-page")).toBeUndefined();
		expect(initialArtist(firstPage)).toEqual(firstPage[0]);
		expect(
			initialArtist([
				...firstPage,
				{ id: "other", name: "Artist", organizationName: "Two" },
			]),
		).toBeUndefined();
	});
	test("entry accepts only an empty object and requires just the read scope", () => {
		expect(WORKSPACE_TOOL_DEFINITION.schema.parse({})).toEqual({});
		expect(
			WORKSPACE_TOOL_DEFINITION.schema.safeParse({ artistId }).success,
		).toBe(false);
		expect(DYNAMOI_MCP_TOOL_SCOPES.dynamoi_open_workspace).toEqual([
			"dynamoi:read",
		]);
		expect(WorkspaceOutputSchema.safeParse({ status: "success" }).success).toBe(
			false,
		);
		expect(
			WorkspaceOutputSchema.safeParse({
				data: { artistCount: 0, artists: [] },
				message: "Denied",
				status: "error",
			}).success,
		).toBe(false);
	});
	test("projects shared readers to a strict roster without private or commercial fields", async () => {
		const result = await openWorkspace(readerAdapter());
		expect(result).toEqual({
			data: {
				artistCount: 1,
				artists: [{ id: artistId, name: "<script>Artist</script>" }],
			},
			status: "success",
		});
		expect(WorkspaceOutputSchema.safeParse(result).success).toBe(true);
		expect(
			WorkspaceOutputSchema.safeParse({ ...result, private: true }).success,
		).toBe(false);
	});
	test("empty and failed readers preserve honest outcomes without leaking error payloads", async () => {
		expect(
			await openWorkspace(
				adapter({
					getCurrentUser: async () => ({
						data: { artistCount: 0 },
						status: "success",
					}),
					listArtists: async () => ({
						data: { artists: [] },
						status: "success",
					}),
				}),
			),
		).toEqual({ data: { artistCount: 0, artists: [] }, status: "success" });
		const result = await openWorkspace(
			adapter({
				getCurrentUser: async () => ({
					message: "Something went wrong. Please try again.",
					status: "error",
				}),
			}),
		);
		expect(result.status).toBe("error");
		expect(JSON.stringify(result)).not.toContain("private");
	});
	for (const profile of ["directory", "full"] as const) {
		test(`${profile}: real registration, tools/list, resource and execution agree`, async () => {
			const registrations: unknown[] = [];
			const original = McpServer.prototype.registerTool;
			const spy = spyOn(McpServer.prototype, "registerTool").mockImplementation(
				function (this: McpServer, ...args: Parameters<typeof original>) {
					if (args[0] === "dynamoi_open_workspace") {
						registrations.push(args[1]);
					}
					return original.apply(this, args);
				},
			);
			const server = createDynamoiMcpServer({
				adapter: readerAdapter(),
				toolProfile: profile,
			});
			spy.mockRestore();
			const client = new Client({ name: "workspace-fixture", version: "1" });
			const [a, b] = InMemoryTransport.createLinkedPair();
			await server.connect(b);
			await client.connect(a);
			try {
				const tools = await client.listTools();
				const tool = tools.tools.find(
					(row) => row.name === "dynamoi_open_workspace",
				)!;
				expect(tool._meta).toMatchObject(WORKSPACE_METADATA);
				expect((registrations[0] as { _meta: unknown })._meta).toEqual(
					tool._meta,
				);
				expect(tool.annotations).toEqual({
					destructiveHint: false,
					openWorldHint: false,
					readOnlyHint: true,
				});
				expect(tool.inputSchema).toMatchObject({
					additionalProperties: false,
					type: "object",
				});
				expect(tool.outputSchema).toMatchObject({
					additionalProperties: false,
					type: "object",
				});
				const result = await client.callTool({
					arguments: {},
					name: tool.name,
				});
				expect(result.isError).not.toBe(true);
				expect(result.structuredContent).toEqual(
					await openWorkspace(readerAdapter()),
				);
				const resources = await client.listResources();
				expect(
					resources.resources.some((row) => row.uri === WORKSPACE_RESOURCE_URI),
				).toBe(true);
				const resource = await client.readResource({
					uri: WORKSPACE_RESOURCE_URI,
				});
				expect(resource.contents[0]?._meta).toEqual({
					ui: {
						csp: { connectDomains: [], resourceDomains: [] },
						domain: "https://dynamoi.com",
						prefersBorder: true,
					},
				});
				expect(resource.contents[0]?.mimeType).toBe(
					"text/html;profile=mcp-app",
				);
				expect(
					"text" in resource.contents[0]! && resource.contents[0].text,
				).toContain("Dynamoi workspace");
			} finally {
				await client.close();
				await server.close();
			}
		});
	}
	test("scope denial never dispatches entry readers", async () => {
		const server = createDynamoiMcpServer({
			adapter: adapter(),
			authorizeToolCall: () => ({
				_meta: { "mcp/www_authenticate": ["Bearer scope=dynamoi:read"] },
				content: [{ text: "Denied", type: "text" }],
				isError: true,
			}),
		});
		const client = new Client({ name: "denied", version: "1" });
		const [a, b] = InMemoryTransport.createLinkedPair();
		await server.connect(b);
		await client.connect(a);
		try {
			expect(
				(
					await client.callTool({
						arguments: {},
						name: "dynamoi_open_workspace",
					})
				).isError,
			).toBe(true);
		} finally {
			await client.close();
			await server.close();
		}
	});
	test("links reject hostile or noncanonical paths and context includes only selected IDs and excludes spend/private fields", () => {
		expect(
			parseDeepLink({ url: `/artists/${artistId}/campaigns/${artistId}` }),
		).toEqual({ artistId, id: artistId, kind: "campaign" });
		for (const path of [
			"//evil.test",
			"https://evil.test",
			`/artists/${artistId}?token=x`,
			`/artists/${artistId}#x`,
			`/artists/%31${artistId.slice(1)}`,
			"/../../",
			"/artists/not-an-id",
		]) {
			expect(() => parseDeepLink({ url: path })).toThrow();
		}
		for (const url of attackVectors.unsafePublicUrls) {
			expect(publicLink(url)).toBeUndefined();
		}
		const record = projectRecord("campaign", {
			analytics: {
				countsAvailability: "available",
				dateRange: { end: "2026-10-05", start: "2026-10-01" },
				totals: { clicks: 14, impressions: 200, spend: 123 },
			},
			artistId,
			budget: 100,
			contentTitle: "Named",
			id: artistId,
			providerId: "secret",
			status: "ACTIVE",
		});
		const context = JSON.parse(selectedContext(record));
		expect(context).toEqual({
			artistId,
			id: artistId,
			metrics: [
				{ label: "Ad impressions", value: 200 },
				{ label: "Ad clicks", value: 14 },
			],
			name: "Named",
			period: "2026-10-01 to 2026-10-05",
			source: "Ad-network delivery",
			status: "ACTIVE",
			type: "campaign",
		});
		for (const token of ["spend", "budget", "secret", "providerId"]) {
			expect(JSON.stringify(context)).not.toContain(token);
		}
	});
	test("channel results retain their own dates, provenance and bounded coverage", () => {
		const record = projectRecord("campaign", {
			analytics: {
				countsAvailability: "available",
				dateRange: { end: "2026-10-05", start: "2026-10-01" },
				totals: { clicks: 57, impressions: 4321 },
			},
			artistId,
			channelResults: channelFixture,
			contentTitle: "Observed campaign",
			id: artistId,
		});
		expect(record.period).toBe("2026-10-01 to 2026-10-05");
		expect(record.metrics).toHaveLength(2);
		expect(record.channel).toEqual({
			asOf: "2026-09-30",
			attribution: "Observed on the channel; not attributed to the campaign.",
			metrics: [
				{ label: "Channel views", value: 200 },
				{ label: "Subscribers gained", value: 4 },
			],
			missingDays: 1,
			observedThrough: "2026-09-28",
			period: "2026-09-20 to 2026-09-29",
			placeholderDays: 1,
			source: "YouTube Analytics BigQuery warehouse",
		});
		const context = selectedContext(record);
		expect(context).not.toContain("estimatedRevenueUsd");
		expect(JSON.parse(context).channel.period).not.toBe(
			JSON.parse(context).period,
		);
		expect(
			projectRecord("campaign", {
				channelResults: { channelMetrics: { views: 200 }, status: "available" },
				id: artistId,
			}).channel,
		).toBeUndefined();
	});
	test("checked-in browser bundle is reproducible", async () => {
		const result = Bun.spawn(
			[
				process.execPath,
				fileURLToPath(
					new URL("../../../scripts/build-workspace.cjs", import.meta.url),
				),
				"--check",
			],
			{ stderr: "pipe", stdout: "pipe" },
		);
		const error = await new Response(result.stderr).text();
		expect({ error, exit: await result.exited }).toEqual({
			error: "",
			exit: 0,
		});
	});
});

test("provider fallback zeros and raw warnings are never presented as observations", () => {
	const record = projectRecord("campaign", {
		analytics: {
			countsAvailability: "incomplete",
			dateRange: { end: "2026-10-05", start: "2026-10-01" },
			totals: { clicks: 0, impressions: 0 },
			warnings: ["provider secret-token customer-id failed"],
		},
		id: artistId,
		warnings: ["Campaign analytics unavailable: private"],
	});
	expect(record.metrics).toBeUndefined();
	expect(selectedContext(record)).toContain("unavailable");
	expect(selectedContext(record)).not.toContain("secret-token");
	expect(selectedContext(record)).not.toContain('"value":0');
});
test("workspace preserves typed rate-limit recovery from readers", async () => {
	const failure = {
		code: "RATE_LIMITED" as const,
		kind: "platform" as const,
		message: "Please try again later.",
		retryAfterSeconds: 30,
		retryable: true,
		status: "error" as const,
	};
	expect(
		await openWorkspace(adapter({ getCurrentUser: async () => failure })),
	).toEqual(failure);
});

test("actual pending and unavailable channel contracts retain bounded availability without provider reasons", () => {
	if (channelFixture.status !== "available") {
		throw new Error("Expected channelFixture to be available");
	}
	const provenance = channelFixture.channelMetrics.provenance;
	const pending = ChannelResultsSchema.parse({
		coverage: {
			latestCompleteDay: "2026-09-29",
			observedThroughDay: "2026-09-28",
			provenance,
			videoMetricsThroughDay: null,
		},
		dateRange: { end: "2026-09-29", start: "2026-09-20" },
		provenance,
		reason: "private-provider-token",
		status: "pending",
	});
	const unavailable = ChannelResultsSchema.parse({
		provenance,
		reason: "private-provider-token",
		status: "unavailable",
	});
	if (pending.status !== "pending" || unavailable.status !== "unavailable") {
		throw new Error("Unexpected parsed channel status");
	}
	for (const channelResults of [pending, unavailable]) {
		const record = projectRecord("campaign", { channelResults, id: artistId });
		expect(record.channel).toBeUndefined();
		expect(record.channelAvailability?.status).toBe(channelResults.status);
		const selected = selectedContext(record);
		expect(selected).toContain(channelResults.status);
		expect(selected).not.toContain("private-provider-token");
		expect(selected).not.toContain('"value":0');
		if (channelResults.status === "pending") {
			expect(record.channelAvailability?.period).toBe(
				"2026-09-20 to 2026-09-29",
			);
			expect(record.channelAvailability?.observedThrough).toBe("2026-09-28");
		}
	}
});

test("healthy Smart and paused/completed campaign counts survive unrelated real reader warnings", () => {
	for (const status of ["ACTIVE", "PAUSED", "COMPLETED"]) {
		const record = projectRecord("campaign", {
			analytics: {
				countsAvailability: "available",
				dateRange: { end: "2026-10-05", start: "2026-10-01" },
				totals: { clicks: 2, impressions: 12 },
				warnings: ["Spend is not reported for this campaign."],
			},
			artistId,
			campaignType: "SMART_CAMPAIGN",
			contentTitle: "Smart campaign",
			id: artistId,
			status,
			warnings: [
				`Campaign status is ${status}.`,
				"Channel results are available only for YouTube campaigns.",
			],
		});
		expect(record.metrics).toEqual([
			{ label: "Ad impressions", value: 12 },
			{ label: "Ad clicks", value: 2 },
		]);
		expect(selectedContext(record)).not.toContain("unavailable");
	}
});
test("only server-confirmed public Smart Links expose public URLs", () => {
	for (const isPublic of [true, false, undefined]) {
		const record = projectRecord("smartlink", {
			artistId,
			id: artistId,
			isPublic,
			publicUrl: "https://play.dynamoi.com/artist/release",
			publishState: "published",
			releaseTitle: "Link",
		});
		expect(Boolean(record.url)).toBe(isPublic === true);
		expect(selectedContext(record).includes("https://play.dynamoi.com/")).toBe(
			isPublic === true,
		);
		expect(selectedContext(record)).toContain(artistId);
	}
});

test("generated template literal contains the exact browser build runtime bytes", async () => {
	const built = await Bun.build({
		entrypoints: [`${import.meta.dir}/browser.ts`],
		format: "iife",
		minify: true,
		splitting: false,
		target: "browser",
	});
	expect(built.success).toBe(true);
	expect(built.outputs).toHaveLength(1);
	expect(WORKSPACE_SCRIPT).toBe(await built.outputs[0]!.text());
});

test("count projection requires verified availability and detail failures are explicit", () => {
	for (const countsAvailability of [undefined, "not_linked", "incomplete"]) {
		const record = projectRecord(
			"campaign",
			{
				analytics: {
					countsAvailability,
					totals: { clicks: 0, impressions: 0 },
				},
				id: artistId,
			},
			artistId,
			"detail",
		);
		expect(record.metrics).toBeUndefined();
		expect(record.warnings?.length).toBeGreaterThan(0);
	}
	for (const countsAvailability of ["available", "sample"]) {
		expect(
			projectRecord(
				"campaign",
				{
					analytics: {
						countsAvailability,
						totals: { clicks: 0, impressions: 0 },
					},
					id: artistId,
				},
				artistId,
				"detail",
			).metrics,
		).toHaveLength(2);
	}
	for (const kind of ["campaign", "smartlink"] as const) {
		const summary = projectRecord(kind, { id: artistId }, artistId, "summary");
		const detail = projectRecord(
			kind,
			{ id: artistId, warnings: ["private-provider-token"] },
			artistId,
			"detail",
		);
		expect(summary.warnings).toBeUndefined();
		expect(detail.warnings).toEqual([
			"Results could not be read for this record.",
		]);
		expect(selectedContext(detail)).toContain("Results could not be read");
		expect(selectedContext(detail)).not.toContain("private-provider-token");
	}
});

test("workspace roster retains only bounded display organization labels", async () => {
	const result = await openWorkspace({
		getCurrentUser: async () => ({
			data: { artistCount: 1 },
			status: "success",
		}),
		listArtists: async () => ({
			data: {
				artists: [
					{
						email: "private@test",
						id: artistId,
						name: "Same Artist",
						organizationId: "private",
						organizationName: "Org".repeat(100),
					},
				],
			},
			status: "success",
		}),
	});
	expect(WorkspaceOutputSchema.safeParse(result).success).toBe(true);
	if (result.status !== "success") {
		throw new Error("Expected roster");
	}
	expect(result.data.artists[0]?.organizationName).toHaveLength(160);
	expect(JSON.stringify(result)).not.toContain("private");
	const selected = projectRecord("artist", result.data.artists[0]);
	expect(selectedContext(selected)).not.toContain("organizationName");
});

test("workspace overview rejects unknown artist counts without inferring from roster", async () => {
	for (const artistCount of [
		undefined,
		null,
		"1",
		-1,
		1.5,
		Number.NaN,
		Number.POSITIVE_INFINITY,
	]) {
		const result = await openWorkspace({
			...readerAdapter(),
			getCurrentUser: async () => ({
				data: { artistCount },
				status: "success",
			}),
		});
		expect(result).toMatchObject({
			message:
				"Your workspace overview returned incomplete data. Retry this read.",
			status: "error",
		});
	}
	for (const artistCount of [0, 7]) {
		const result = await openWorkspace({
			...readerAdapter(),
			getCurrentUser: async () => ({
				data: { artistCount },
				status: "success",
			}),
		});
		expect(result).toMatchObject({ data: { artistCount }, status: "success" });
	}
});

test("unlinked campaign warning distinguishes absent observations from incomplete reads", () => {
	const record = projectRecord(
		"campaign",
		{
			analytics: { countsAvailability: "not_linked", totals: { clicks: 0 } },
			id: artistId,
		},
		artistId,
		"detail",
	);
	expect(record.metrics).toBeUndefined();
	expect(record.warnings).toContain(
		"No ad platform is linked; no ad observations are available.",
	);
	expect(JSON.stringify(record.warnings)).not.toContain("incomplete");
});

test("unknown Smart Link counts preserve details and public URLs without certified metrics", () => {
	const record = projectRecord(
		"smartlink",
		{
			analytics: {
				countsAvailability: "incomplete",
				totals: { anonymousVisits: 7, streamingServiceClicks: 0 },
			},
			id: artistId,
			isPublic: true,
			publicUrl: "https://play.dynamoi.com/artist/release",
			releaseTitle: "Release",
		},
		artistId,
		"detail",
	);
	expect(record.name).toBe("Release");
	expect(record.url).toBe("https://play.dynamoi.com/artist/release");
	expect(record.isPublic).toBe(true);
	expect(record.metrics).toBeUndefined();
	expect(record.warnings?.length).toBeGreaterThan(0);
});
