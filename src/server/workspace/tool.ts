import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { ResultEnvelope } from "../../types";
import {
	addRecoverySafetyIssues,
	ResultErrorRecoverySchema,
} from "../output-schemas";
import { artists, cursor, object, type WorkspaceData } from "./data";
import { WORKSPACE_STYLE } from "./style";
import { WORKSPACE_SCRIPT } from "./workspace-script.generated";

const WORKSPACE_RESOURCE_URI = "ui://dynamoi/artist-workspace-v1.html";
export const WORKSPACE_METADATA = {
	"openai/ui": { entrypoints: [{ type: "global" }, { type: "thread" }] },
	ui: { resourceUri: WORKSPACE_RESOURCE_URI },
} as const;
const WorkspaceOutputSchema = z
	.object({
		data: z
			.object({
				artistCount: z.number().int().nonnegative(),
				artists: z
					.array(
						z
							.object({
								id: z.uuid(),
								name: z.string().min(1).max(160),
								organizationName: z.string().min(1).max(160).optional(),
							})
							.strict(),
					)
					.max(50),
				nextCursor: z.string().min(1).max(2048).optional(),
			})
			.strict()
			.optional(),
		kind: z.enum(["validation", "business", "platform", "unknown"]).optional(),
		message: z.string().max(200).optional(),
		...ResultErrorRecoverySchema.shape,
		status: z.enum(["success", "error"]),
	})
	.strict()
	.superRefine((result, ctx) => {
		if (result.status === "error") {
			addRecoverySafetyIssues(result, ctx);
		} else {
			for (const field of Object.keys(ResultErrorRecoverySchema.shape)) {
				if ((result as Record<string, unknown>)[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: "Recovery metadata is only valid on error results.",
						path: [field],
					});
				}
			}
		}
		if (result.status === "success" && !result.data) {
			ctx.addIssue({
				code: "custom",
				message: "Success requires workspace data",
				path: ["data"],
			});
		}
		if (result.status === "error" && (!result.message || result.data)) {
			ctx.addIssue({
				code: "custom",
				message: "Error requires a message and no account data",
			});
		}
	});
export const WORKSPACE_TOOL_DEFINITION = {
	description:
		"Open the read-only Dynamoi workspace when the user wants to browse their existing artists, campaigns, Smart Links and observed results in ChatGPT. Returns an authorized artist roster or an honest empty account state. Does not create links, change campaigns, start purchases or connect accounts. Use individual read tools for follow-up details.",
	destructiveHint: false,
	name: "dynamoi_open_workspace",
	openWorldHint: false,
	outputSchema: WorkspaceOutputSchema,
	readOnlyHint: true,
	schema: z.object({}).strict(),
	title: "Open Artist Workspace",
} as const;
export type WorkspaceReaders = {
	getCurrentUser(input: unknown): Promise<ResultEnvelope<object>>;
	listArtists(input: unknown): Promise<ResultEnvelope<object>>;
};
export async function openWorkspace(
	adapter: WorkspaceReaders,
): Promise<ResultEnvelope<WorkspaceData>> {
	const overview = await adapter.getCurrentUser({ format: "json" });
	if (overview.status === "error") {
		return overview;
	}
	if (overview.status !== "success") {
		return {
			message:
				"Your workspace overview returned incomplete data. Retry this read.",
			status: "error",
		};
	}
	const artistCount = object(overview.data)["artistCount"];
	if (
		typeof artistCount !== "number" ||
		!Number.isFinite(artistCount) ||
		!Number.isInteger(artistCount) ||
		artistCount < 0
	) {
		return {
			message:
				"Your workspace overview returned incomplete data. Retry this read.",
			status: "error",
		};
	}

	const roster = await adapter.listArtists({ format: "json", limit: 50 });
	if (roster.status === "error") {
		return roster;
	}
	if (roster.status !== "success") {
		return {
			message: "Your artist roster returned incomplete data. Retry this read.",
			status: "error",
		};
	}
	const raw = object(roster.data);
	if (
		!Array.isArray(raw["artists"]) ||
		raw["artists"].length > 50 ||
		artists(raw["artists"]).length !== raw["artists"].length
	) {
		return {
			message:
				"Your artist roster returned incomplete data. Retry before treating this account as empty.",
			status: "error",
		};
	}
	const nextCursor = cursor(raw["nextCursor"]);
	const data: WorkspaceData = {
		artistCount,
		artists: artists(raw["artists"]),
		...(nextCursor ? { nextCursor } : {}),
	};
	return { data, status: "success" };
}
function workspaceHtml(): string {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dynamoi workspace</title><style>${WORKSPACE_STYLE}</style></head><body><main id="workspace"><header><h1>Dynamoi workspace</h1><p>Artists, campaigns and Smart Links</p></header><p role="status" id="connection">Connecting to your host…</p><section id="content" aria-label="Artist workspace"></section><noscript>This workspace needs JavaScript. Use Dynamoi’s individual read tools to inspect your account.</noscript></main><script>${WORKSPACE_SCRIPT.replaceAll("</script", "<\\/script")}</script></body></html>`;
}
export function registerWorkspaceResource(server: McpServer): void {
	server.registerResource(
		"artist-workspace",
		WORKSPACE_RESOURCE_URI,
		{
			description: "Read-only artist, campaign and Smart Link workspace.",
			mimeType: "text/html;profile=mcp-app",
			title: "Dynamoi Artist Workspace",
		},
		async () => ({
			contents: [
				{
					_meta: {
						ui: {
							csp: { connectDomains: [], resourceDomains: [] },
							domain: "https://dynamoi.com",
							prefersBorder: true,
						},
					},
					mimeType: "text/html;profile=mcp-app",
					text: workspaceHtml(),
					uri: WORKSPACE_RESOURCE_URI,
				},
			],
		}),
	);
}
