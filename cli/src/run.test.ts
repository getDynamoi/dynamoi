import { expect, test } from "bun:test";
import type { Tool } from "./mcp.ts";
import { type Io, runTool } from "./run.ts";
import { parseArgs } from "./tools.ts";

const tool = (
	required: string[],
	properties: Tool["inputSchema"]["properties"],
): Tool => ({
	description: "Submit the application.",
	inputSchema: { properties, required, type: "object" },
	name: "dynamoi_apply_for_distribution",
});

const apply = tool(["artistId", "confirmApplicationSubmission"], {
	artistId: { type: "string" },
	confirmApplicationSubmission: { const: true, type: "boolean" },
});

function harness(answer: string, isTty: boolean) {
	const sent: Record<string, unknown>[] = [];
	const io: Io = { ask: async () => answer, isTty };
	const call = async (_name: string, args: Record<string, unknown>) => {
		sent.push({ ...args });
		return {};
	};
	return { call, io, sent };
}

test("never sends a required confirmation the user did not grant", async () => {
	const noTty = harness("y", false);
	await expect(
		runTool(apply, { artistId: "a" }, noTty.io, noTty.call),
	).rejects.toThrow("--confirm-application-submission");
	const declined = harness("n", true);
	await expect(
		runTool(apply, { artistId: "a" }, declined.io, declined.call),
	).rejects.toThrow("Nothing was sent");
	expect(noTty.sent).toEqual([]);
	expect(declined.sent).toEqual([]);
});

test("grants a confirmation only after an interactive yes or an explicit flag", async () => {
	const yes = harness("y", true);
	await runTool(apply, { artistId: "a" }, yes.io, yes.call);
	expect(yes.sent).toEqual([
		{ artistId: "a", confirmApplicationSubmission: true },
	]);

	const explicit = harness("n", false);
	const { flags } = parseArgs(apply, [
		"--artist-id",
		"a",
		"--confirm-application-submission",
	]);
	await runTool(apply, flags, explicit.io, explicit.call);
	expect(explicit.sent).toEqual([
		{ artistId: "a", confirmApplicationSubmission: true },
	]);
});

test("never fills optional or non-boolean consent fields, even after a yes", async () => {
	const launch = tool(["artistId", "acceptedConsentVersion"], {
		acceptedConsentVersion: { type: "string" },
		artistId: { type: "string" },
		authorizeAutomaticDailyFunding: { const: true, type: "boolean" },
	});
	const yes = harness("y", true);
	await expect(
		runTool(launch, { artistId: "a" }, yes.io, yes.call),
	).rejects.toThrow("--accepted-consent-version");
	const optional = tool(["artistId"], launch.inputSchema.properties);
	await runTool(optional, { artistId: "a" }, yes.io, yes.call);
	expect(yes.sent).toEqual([{ artistId: "a" }]);
});

test("local CLI rejects stale, foreign, production and non-loopback preview targets", async () => {
	const { previewEndpoint, readLocalTarget } = await import(
		"./local-target.ts"
	);
	const manifest = {
		state: "ready",
		data: "synthetic",
		database: "dynamoi_agent_preview_test",
		surface: "dashboard",
		pid: 123,
		identity: "456",
		ports: [4321],
		links: ["http://127.0.0.1:4321"],
	};
	const metadata = {
		clones: { dynamoi_agent_preview_test: { source: "empty" } },
	};
	expect(previewEndpoint(manifest, metadata, "456")).toBe(
		"http://127.0.0.1:4321/mcp",
	);
	for (const changed of [
		{ state: "stopped" },
		{ data: "production" },
		{ database: "production" },
		{ identity: "reused-pid" },
		{ surface: "public" },
		{ links: ["https://dynamoi.com"] },
		{ links: ["http://127.0.0.1:4322"] },
		{ links: ["http://user:pass@127.0.0.1:4321"] },
		{ links: ["http://127.0.0.1:4321/path"] },
	])
		expect(() =>
			previewEndpoint({ ...manifest, ...changed }, metadata, "456"),
		).toThrow();
	expect(() =>
		previewEndpoint(
			manifest,
			{ clones: { dynamoi_agent_preview_test: { source: "prod" } } },
			"456",
		),
	).toThrow();
	expect(() =>
		readLocalTarget(["tools", "--preview-manifest", "x", "--bearer-file", "y"]),
	).toThrow("before the command");
	for (const command of ["login", "logout", "whoami"])
		expect(() =>
			readLocalTarget([
				"--preview-manifest",
				"x",
				"--bearer-file",
				"y",
				command,
			]),
		).toThrow("isolated");
});

test("local CLI never refreshes a rejected bearer and disables redirects", async () => {
	const { createRpc } = await import("./mcp.ts");
	const received: RequestInit[] = [];
	let reject = true;
	const request = (async (url, init) => {
		expect(String(url)).toBe("http://127.0.0.1:4321/mcp");
		received.push(init!);
		return reject
			? new Response(null, { status: 401 })
			: Response.json({ result: { tools: [] } });
	}) as typeof fetch;
	const rpc = createRpc(
		{ endpoint: "http://127.0.0.1:4321/mcp", token: "synthetic-only" },
		request,
	);
	await expect(rpc("tools/list")).rejects.toThrow("no OAuth refresh");
	expect(received).toHaveLength(1);
	reject = false;
	expect(await rpc("tools/list")).toEqual({ tools: [] });
	for (const init of received) {
		expect(new Headers(init.headers).get("authorization")).toBe(
			"Bearer synthetic-only",
		);
		expect(init.redirect).toBe("error");
	}
});
