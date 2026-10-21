import { createInterface } from "node:readline/promises";
import { callTool, type Tool } from "./mcp.ts";
import { commandName, flagName, pendingConsent } from "./tools.ts";

const err = (line: string) => process.stderr.write(`${line}\n`);

export type Io = {
	ask: (question: string) => Promise<string>;
	isTty: boolean;
};

export const terminal: Io = {
	ask: async (question) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
		});
		try {
			return await rl.question(question);
		} finally {
			rl.close();
		}
	},
	isTty: Boolean(process.stdin.isTTY && process.stderr.isTTY),
};

/**
 * Runs one tool. Consent fields are never defaulted: the user passes them as
 * flags, or on a terminal approves the shown summary, which grants only the
 * required boolean confirmations. Anything else stops before the server call.
 */
export async function runTool(
	tool: Tool,
	args: Record<string, unknown>,
	io: Io,
	call: typeof callTool = callTool,
) {
	const { askable, explicit } = pendingConsent(tool, args);
	if (explicit.length > 0 || (askable.length > 0 && !io.isTty)) {
		const flags = [...explicit, ...askable].map((p) => `--${flagName(p)}`);
		throw new Error(
			`${commandName(tool)} needs your explicit consent. Pass ${flags.join(", ")} yourself after reading \`dynamoi help ${commandName(tool)}\`.`,
		);
	}
	if (askable.length > 0) {
		err(
			`${tool.description ?? commandName(tool)}\n\nArguments: ${JSON.stringify(args)}`,
		);
		const answer = await io.ask(
			`Confirm ${askable.join(", ")} and proceed? [y/N] `,
		);
		if (!/^y(es)?$/iu.test(answer.trim())) {
			throw new Error("Cancelled. Nothing was sent.");
		}
		for (const property of askable) {
			args[property] = true;
		}
	}
	return call(tool.name, args);
}
