import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { USD_BUDGET_MINIMUMS } from "./budget-minimums";
import type { Phase3Adapter } from "./create-server";
import { DYNAMOI_MCP_INSTRUCTIONS } from "./instructions";
import { registerDynamoiResources } from "./resources";

function buildStubAdapter(): Phase3Adapter {
	const stub = async () => ({
		message: "Adapter not used in resource registration tests.",
		status: "error" as const,
	});
	return new Proxy({} as Phase3Adapter, {
		get: () => stub,
	});
}

async function readResource(uri: string) {
	const server = new McpServer({ name: "test", version: "0.0.0" });
	registerDynamoiResources(server, buildStubAdapter());
	const [serverTransport, clientTransport] =
		InMemoryTransport.createLinkedPair();
	await server.connect(serverTransport);
	const client = new Client({ name: "test", version: "0.0.0" });
	await client.connect(clientTransport);
	const result = await client.readResource({ uri });
	await client.close();
	await server.close();
	return result;
}

function readResourceText(
	result: Awaited<ReturnType<typeof readResource>>,
): string {
	const content = result.contents[0];
	return content && "text" in content ? content.text : "";
}

describe("registerDynamoiResources persona playbooks", () => {
	test("dynamoi://playbooks/spotify-artist returns guidance for Spotify artists", async () => {
		const result = await readResource("dynamoi://playbooks/spotify-artist");
		const content = result.contents[0];
		expect(content?.mimeType).toBe("application/json");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.fastestPath).toContain(
			"dynamoi_create_smart_links_from_spotify_artist",
		);
		expect(parsed.persona).toContain("Spotify");
		expect(parsed.marginCopyGuard).toBeUndefined();
	});

	test("dynamoi://playbooks/youtube-creator explains goal-based campaign differentiator", async () => {
		const result = await readResource("dynamoi://playbooks/youtube-creator");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.differentiator).toContain("organic lift");
		expect(parsed.differentiator).not.toContain("revenue per country");
		expect(parsed.channelLinkingPath).toContain(
			"dynamoi_start_youtube_channel_link",
		);
		expect(parsed.talkingPoints.playlistWaterfall.trigger).toContain(
			"subscribers",
		);
	});

	test("dynamoi://playbooks/label-or-manager covers organization roles", async () => {
		const result = await readResource("dynamoi://playbooks/label-or-manager");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.rolesNote).toContain("admin, editor, and viewer");
		expect(parsed.persona).toContain("Label");
	});

	test("dynamoi://playbooks/onboarding-tree mirrors the get_account_overview state branches", async () => {
		const result = await readResource("dynamoi://playbooks/onboarding-tree");
		const parsed = JSON.parse(readResourceText(result));
		expect(Array.isArray(parsed.nodes)).toBe(true);
		expect(parsed.nodes[0].if).toContain("hasAnyArtist === false");
		const conditions = parsed.nodes.map(
			(node: { if: string }) => node.if,
		) as string[];
		expect(
			conditions.some((c) => c.includes("hasAnySmartLink === false")),
		).toBe(true);
		expect(
			conditions.some((c) => c.includes("hasAnyActiveCampaign === false")),
		).toBe(true);
		expect(
			conditions.some((c) => c.includes("hasAnyConnectedMeta === false")),
		).toBe(true);
	});

	test("dynamoi://mcp/tool-answering-rules now includes the empty-state rule", async () => {
		const result = await readResource("dynamoi://mcp/tool-answering-rules");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.emptyStateRule).toContain(
			"If the request identifies an artist, campaign, or Smart Link, use the targeted read directly.",
		);
		expect(parsed.emptyStateRule).toContain(
			"For missing or ambiguous identity, use the relevant roster or search tool first",
		);
		expect(parsed.emptyStateRule).toContain(
			"For a known empty account, use dynamoi_get_account_overview.recommendedNextActions or dynamoi://playbooks/onboarding-tree to explain supported onboarding",
		);
		expect(parsed.emptyStateRule).not.toContain(
			"Always call dynamoi_get_account_overview first for routing",
		);
		expect(parsed.emptyStateRule).toContain("dynamoi_get_account_overview");
		expect(parsed.emptyStateRule).toContain("playbooks/onboarding-tree");
	});
});

describe("registerDynamoiResources YouTube strategies", () => {
	test("dynamoi://youtube/campaign-strategies explains every strategy and the playlist waterfall", async () => {
		const result = await readResource("dynamoi://youtube/campaign-strategies");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.strategies).toHaveLength(5);
		expect(parsed.playlistWaterfall.measurementLimits).toContain(
			"does not follow individual viewers",
		);
		expect(parsed.resultTiming.learning).toContain("7-14 days");
	});
});

describe("registerDynamoiResources pricing", () => {
	test("dynamoi://platform/pricing publishes the enforced budget minimums", async () => {
		const result = await readResource("dynamoi://platform/pricing");
		const parsed = JSON.parse(readResourceText(result));
		expect(parsed.budgetMinimums.smartCampaign).toMatchObject({
			dailyUsd: 10,
			totalUsd: 50,
		});
		expect(parsed.budgetMinimums.youtube).toMatchObject({
			dailyUsd: 10,
			totalUsd: 75,
		});
		expect(parsed.budgetMinimums.smartCampaign.dailyUsd).toBe(
			USD_BUDGET_MINIMUMS.smartCampaign.dailyUsd,
		);
		expect(parsed.budgetMinimums.youtube.totalUsd).toBe(
			USD_BUDGET_MINIMUMS.youtube.totalUsd,
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"Read budget minimums and caps from the selected artist’s readiness or budget-policy response.",
		);
	});
});
