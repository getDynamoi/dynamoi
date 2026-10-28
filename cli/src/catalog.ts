import type { Tool } from "./mcp.ts";
import { commandName } from "./tools.ts";

const words = (value: string) => value.toLowerCase().match(/[a-z0-9]+/gu) ?? [];
const stopWords = new Set([
	"a",
	"an",
	"and",
	"for",
	"how",
	"i",
	"is",
	"me",
	"my",
	"of",
	"on",
	"the",
	"to",
	"what",
	"with",
]);

/** Search only the current server catalog; selection never grants call authority. */
export function searchCatalog(tools: Tool[], query: string, limit = 10) {
	if (!query.trim() || query.length > 256) {
		throw new Error("--query must contain 1 to 256 characters.");
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
		throw new Error("--limit must be an integer from 1 to 10.");
	}
	const terms = [
		...new Set(words(query).filter((term) => !stopWords.has(term))),
	];
	const matches = tools
		.map((tool) => {
			const name = new Set(words(tool.name));
			const title = new Set(words(tool.title ?? ""));
			const description = new Set(words(tool.description ?? ""));
			const score = terms.reduce(
				(sum, term) =>
					sum +
					(name.has(term) ? 8 : 0) +
					(title.has(term) ? 4 : 0) +
					(description.has(term) ? 1 : 0),
				0,
			);
			return { score, tool };
		})
		.filter((item) => item.score > 0)
		.sort(
			(left, right) =>
				right.score - left.score ||
				left.tool.name.localeCompare(right.tool.name),
		);
	return {
		query,
		tools: matches.slice(0, limit).map(({ tool }) => ({
			command: commandName(tool),
			description: (tool.description ?? "").slice(0, 240),
			name: tool.name,
			readOnly: tool.annotations?.readOnlyHint ?? null,
			schemaCommand: `dynamoi help ${commandName(tool)} --json`,
			title: tool.title ?? null,
		})),
		totalMatches: matches.length,
	};
}

export function parseCatalogArgs(args: string[]) {
	let query: string | undefined;
	let limit = 10;
	let json = false;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index] as string;
		if (arg === "--json") {
			json = true;
			continue;
		}
		const equals = arg.indexOf("=");
		const flag = equals < 0 ? arg : arg.slice(0, equals);
		if (flag !== "--query" && flag !== "--limit") {
			throw new Error(
				`Unknown tools flag ${flag}. Use --query, --limit or --json.`,
			);
		}
		if (equals < 0) {
			index += 1;
		}
		const value = equals < 0 ? args[index] : arg.slice(equals + 1);
		if (value === undefined || value.startsWith("--")) {
			throw new Error(`${flag} needs a value.`);
		}
		if (flag === "--query") {
			query = value;
		} else {
			limit = Number(value);
		}
	}
	if (
		query === undefined &&
		args.some((arg) => arg === "--limit" || arg.startsWith("--limit="))
	) {
		throw new Error("--limit requires --query.");
	}
	return { json, limit, query };
}

export function renderCatalogSearch(
	result: ReturnType<typeof searchCatalog>,
): string {
	return [
		`${result.tools.length} of ${result.totalMatches} keyword matches`,
		...result.tools.map(
			(tool) => `${tool.command.padEnd(40)}${tool.description}`,
		),
		"Use dynamoi help <tool> --json for its complete schema.",
	].join("\n");
}
