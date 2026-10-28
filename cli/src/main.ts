#!/usr/bin/env node
import pkg from "../package.json" with { type: "json" };
import { listTools } from "./mcp.ts";
import { accessToken, login, revoke, userInfo } from "./oauth.ts";
import { runTool, terminal } from "./run.ts";
import { clearCredentials, loadCredentials } from "./store.ts";
import {
	commandName,
	describeTool,
	flagName,
	missingRequired,
	parseArgs,
	pendingConsent,
} from "./tools.ts";

const VERSION = pkg.version;

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
	if (error.code === "EPIPE") {
		process.exit(0);
	}
	throw error;
});

const out = (line: string) => process.stdout.write(`${line}\n`);
const err = (line: string) => process.stderr.write(`${line}\n`);

const USAGE = `dynamoi ${VERSION}: Music promotion and distribution, built for AI agents.

Usage:
  dynamoi login | logout | whoami
  dynamoi tools                 List what your account can do
  dynamoi help <tool>           Show a tool's flags
  dynamoi <tool> [--flag value] Run a tool; add --json for machine output`;

async function main(argv: string[]): Promise<number> {
	const [command, ...rest] = argv;
	if (command === "help" && rest.length === 0) {
		out(USAGE);
		return 0;
	}
	switch (command) {
		case undefined:
		case "--help":
		case "-h":
			out(USAGE);
			return 0;
		case "--version":
		case "-v":
			out(VERSION);
			return 0;
		case "login": {
			await login(out);
			const token = await accessToken();
			out(`Signed in${token ? ` as ${(await userInfo(token)).email}` : ""}.`);
			return 0;
		}
		case "logout": {
			const stored = await loadCredentials();
			if (stored) {
				await revoke(stored);
			}
			await clearCredentials();
			out("Signed out.");
			return 0;
		}
		case "whoami": {
			const token = await accessToken();
			if (!token) {
				err("Not signed in. Run `dynamoi login`.");
				return 1;
			}
			const info = await userInfo(token);
			out(
				rest.includes("--json")
					? JSON.stringify(info)
					: `${info.name ?? ""} <${info.email ?? info.sub}>`.trim(),
			);
			return 0;
		}
		default:
			break;
	}

	const tools = await listTools();
	const find = (name: string | undefined) =>
		tools.find(
			(candidate) =>
				commandName(candidate) ===
				name?.replaceAll("_", "-").replace(/^dynamoi-/u, ""),
		);
	if (command === "tools") {
		if (rest.includes("--json")) {
			out(
				JSON.stringify(
					tools.map(({ name, description, inputSchema }) => ({
						description,
						inputSchema,
						name,
					})),
				),
			);
			return 0;
		}
		for (const tool of tools) {
			out(
				`${commandName(tool).padEnd(40)}${(tool.description ?? "").slice(0, 100)}`,
			);
		}
		if (!(await loadCredentials())) {
			err(
				"\nSign in with `dynamoi login` to see every tool your account can use.",
			);
		}
		return 0;
	}
	if (command === "help") {
		const tool = find(rest[0]);
		if (!tool) {
			out(USAGE);
			return rest[0] ? 1 : 0;
		}
		out(describeTool(tool));
		return 0;
	}
	const tool = find(command);
	if (!tool) {
		err(
			`Unknown command "${command}". Run \`dynamoi tools\` to list what is available.`,
		);
		return 1;
	}
	const parsed = parseArgs(tool, rest);
	if (parsed.global.help) {
		out(describeTool(tool));
		return 0;
	}
	const missing = missingRequired(tool, parsed.flags).filter(
		(p) => !pendingConsent(tool, parsed.flags).askable.includes(p),
	);
	if (missing.length > 0) {
		err(
			`Missing required flags: ${missing.map((p) => `--${flagName(p)}`).join(", ")}`,
		);
		return 2;
	}
	const result = await runTool(tool, parsed.flags, terminal);
	const text = (result.content ?? [])
		.map((part) => part.text ?? "")
		.filter(Boolean)
		.join("\n");
	if (parsed.global.json) {
		out(JSON.stringify(result.structuredContent ?? result, null, 2));
	} else {
		out(text || JSON.stringify(result.structuredContent ?? result, null, 2));
	}
	return result.isError ? 1 : 0;
}

main(process.argv.slice(2))
	.then((code) => process.exit(code))
	.catch((error: unknown) => {
		err(error instanceof Error ? error.message : String(error));
		process.exit(1);
	});
