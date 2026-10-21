import type { JsonSchema, Tool } from "./mcp.ts";

/** `dynamoi_get_campaign` is `dynamoi get-campaign`. */
export const commandName = (tool: Tool): string =>
	tool.name.replace(/^dynamoi_/u, "").replaceAll("_", "-");

export const flagName = (property: string): string =>
	property.replace(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase();

const properties = (tool: Tool) =>
	Object.entries(tool.inputSchema.properties ?? {});

const kind = (schema: JsonSchema): string => {
	if (schema.const === true) {
		return "boolean";
	}
	const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
	return type ?? "json";
};

/** Fields a user must grant: confirmations, authorizations and accepted terms. */
const isConsentField = (property: string): boolean =>
	/^(confirm|authorize|accepted?)/u.test(property);

function convert(property: string, schema: JsonSchema, raw: string): unknown {
	switch (kind(schema)) {
		case "string":
			return raw;
		case "integer":
		case "number": {
			const value = Number(raw);
			if (raw.trim() === "" || Number.isNaN(value)) {
				throw new Error(`--${flagName(property)} must be a number.`);
			}
			return value;
		}
		case "boolean":
			if (raw !== "true" && raw !== "false") {
				throw new Error(`--${flagName(property)} must be true or false.`);
			}
			return raw === "true";
		default:
			try {
				return JSON.parse(raw);
			} catch {
				return raw;
			}
	}
}

export type ParsedArgs = {
	flags: Record<string, unknown>;
	global: { help: boolean; json: boolean };
};

/** Builds a tool's arguments from `--flag value` pairs using only its input schema. */
export function parseArgs(tool: Tool, argv: string[]): ParsedArgs {
	const byFlag = new Map(
		properties(tool).map(([p, s]) => [flagName(p), [p, s] as const]),
	);
	const parsed: ParsedArgs = {
		flags: {},
		global: { help: false, json: false },
	};
	let i = 0;
	const next = () => {
		i += 1;
		return argv[i];
	};
	for (; i < argv.length; i += 1) {
		const arg = argv[i] as string;
		if (!arg.startsWith("--")) {
			throw new Error(`Unexpected argument "${arg}". Flags start with --.`);
		}
		const eq = arg.indexOf("=");
		let name = arg.slice(2, eq === -1 ? undefined : eq);
		let inline = eq === -1 ? undefined : arg.slice(eq + 1);
		if (name === "json" || name === "help") {
			parsed.global[name] = true;
			continue;
		}
		if (name === "input") {
			const value = inline ?? next() ?? "";
			Object.assign(parsed.flags, JSON.parse(value));
			continue;
		}
		let negated = false;
		if (
			!byFlag.has(name) &&
			name.startsWith("no-") &&
			byFlag.has(name.slice(3))
		) {
			name = name.slice(3);
			negated = true;
		}
		const entry = byFlag.get(name);
		if (!entry) {
			throw new Error(
				`Unknown flag --${name}. Try \`dynamoi help ${commandName(tool)}\`.`,
			);
		}
		const [property, schema] = entry;
		if (kind(schema) === "boolean") {
			inline ??= negated ? "false" : "true";
			parsed.flags[property] = convert(property, schema, inline);
			continue;
		}
		const raw = inline ?? next();
		if (raw === undefined) {
			throw new Error(`--${name} needs a value.`);
		}
		if (kind(schema) === "array") {
			const itemKind = schema.items ? kind(schema.items) : "string";
			const items =
				itemKind === "json" || itemKind === "object" ? [raw] : raw.split(",");
			const list = (parsed.flags[property] as unknown[] | undefined) ?? [];
			parsed.flags[property] = [
				...list,
				...items.map((item) =>
					schema.items ? convert(property, schema.items, item) : item,
				),
			];
			continue;
		}
		parsed.flags[property] = convert(property, schema, raw);
	}
	return parsed;
}

export function missingRequired(
	tool: Tool,
	args: Record<string, unknown>,
): string[] {
	return (tool.inputSchema.required ?? []).filter((p) => args[p] === undefined);
}

/**
 * Required consent fields the user left unset. Boolean ones can be granted at an
 * interactive prompt; any other (consent version or hash) must be passed explicitly.
 */
export function pendingConsent(tool: Tool, args: Record<string, unknown>) {
	const pending = missingRequired(tool, args).filter(isConsentField);
	const schemas = tool.inputSchema.properties ?? {};
	return {
		askable: pending.filter((p) => kind(schemas[p] ?? {}) === "boolean"),
		explicit: pending.filter((p) => kind(schemas[p] ?? {}) !== "boolean"),
	};
}

export function describeTool(tool: Tool): string {
	const required = new Set(tool.inputSchema.required ?? []);
	const lines = [
		`dynamoi ${commandName(tool)}`,
		"",
		tool.description ?? tool.title ?? "",
		"",
	];
	const rows = properties(tool);
	if (rows.length > 0) {
		lines.push("Flags:");
	}
	for (const [property, schema] of rows) {
		const type = schema.enum ? schema.enum.join("|") : kind(schema);
		const note = [
			required.has(property) ? "required" : "",
			schema.description ?? "",
		]
			.filter(Boolean)
			.join(". ");
		lines.push(`  --${flagName(property)} <${type}>${note ? `  ${note}` : ""}`);
	}
	lines.push(
		"",
		"Also: --json for machine output, --input '<json>' for the whole argument object.",
	);
	return lines.join("\n");
}
