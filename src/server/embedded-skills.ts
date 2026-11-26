import {
	type CacheHint,
	type McpServer,
	ProtocolError,
	ProtocolErrorCode,
} from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
	DYNAMOI_EMBEDDED_SKILLS,
	type EmbeddedSkill,
} from "./embedded-skills.generated";

/** MCP Skills Extension (SEP-2640) identifier. */
const DYNAMOI_SKILLS_EXTENSION = "io.modelcontextprotocol/skills";

const SKILLS_CACHE_HINT: CacheHint = {
	cacheScope: "public",
	ttlMs: 60 * 60 * 1000,
};

const skillUri = (skill: EmbeddedSkill) => `skill://${skill.name}/SKILL.md`;

/** Exact public allowlist for unauthenticated `resources/read`. */
export const DYNAMOI_PUBLIC_SKILL_URIS: ReadonlySet<string> = new Set(
	DYNAMOI_EMBEDDED_SKILLS.map(skillUri),
);

const SkillsListParams = z.object({ cursor: z.string().optional() }).optional();
const SkillsGetParams = z.object({ uri: z.string() });

function invalidParams(message: string): ProtocolError {
	return new ProtocolError(ProtocolErrorCode.InvalidParams, message);
}

/** Advertised in `initialize` capabilities on every profile. */
export const DYNAMOI_SKILLS_CAPABILITY = {
	[DYNAMOI_SKILLS_EXTENSION]: { directoryRead: false },
};

/** Serves the canonical skills over `skills/list`, `skills/get` and `resources/read`. */
export function registerDynamoiEmbeddedSkills(
	server: McpServer,
	toolProfile: "directory" | "full",
) {
	const entry = (skill: EmbeddedSkill) => {
		const { digest, size } = skill[toolProfile];
		const uri = skillUri(skill);
		return {
			frontmatter: { description: skill.description, name: skill.name },
			resources: [{ digest, size, uri }],
			uri,
		};
	};
	const cache = { cacheScope: "public", ttlMs: SKILLS_CACHE_HINT.ttlMs };

	server.server.setRequestHandler(
		"skills/list",
		{ params: SkillsListParams },
		(params) => {
			// The catalog is a single page, so no cursor is ever issued.
			if (params?.cursor !== undefined)
				throw invalidParams("Invalid skills/list cursor");
			return {
				...cache,
				resultType: "complete",
				skills: DYNAMOI_EMBEDDED_SKILLS.map(entry),
			};
		},
	);
	server.server.setRequestHandler(
		"skills/get",
		{ params: SkillsGetParams },
		({ uri }) => {
			const skill = DYNAMOI_EMBEDDED_SKILLS.find(
				(item) => skillUri(item) === uri,
			);
			if (!skill) throw invalidParams(`Unknown skill: ${uri}`);
			return { ...cache, skill: entry(skill) };
		},
	);

	for (const skill of DYNAMOI_EMBEDDED_SKILLS) {
		const uri = skillUri(skill);
		server.registerResource(
			`skill-${skill.name}`,
			uri,
			{
				cacheHint: SKILLS_CACHE_HINT,
				description: skill.description,
				mimeType: "text/markdown",
				title: skill.name,
			},
			async () => ({
				contents: [
					{ mimeType: "text/markdown", text: skill[toolProfile].text, uri },
				],
			}),
		);
	}
}
