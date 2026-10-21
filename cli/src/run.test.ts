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
