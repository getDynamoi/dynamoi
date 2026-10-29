import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

export const SMART_LINK_THEME_PREVIEW_RESOURCE_URI =
	"ui://dynamoi/smart-link-theme-preview-v1.html";

const SampleTextSchema = z.string().trim().min(1).max(80);

export const DynamoiPreviewSmartLinkThemesInputSchema = z
	.object({
		artistName: SampleTextSchema.optional(),
		releaseTitle: SampleTextSchema.optional(),
	})
	.strict();

export const SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION = {
	description:
		"Use this when the user asks what Dynamoi Smart Link pages can look like, wants to compare Smart Link themes, or asks to preview the available themes before creating or updating a free Smart Link. This is a read-only visual preview and does not create, publish, update, or promote a Smart Link.",
	destructiveHint: false,
	name: "dynamoi_preview_smart_link_themes",
	openWorldHint: false,
	outputSchema: AnyOutputEnvelopeSchema,
	readOnlyHint: true,
	schema: DynamoiPreviewSmartLinkThemesInputSchema,
	title: "Preview Smart Link Themes",
} as const;

const SMART_LINK_THEME_PREVIEW_HTML = `
<div id="themes"></div>
<script>
function render(output) {
 const data = output?.data ?? output?.structuredContent?.data ?? output?.structuredContent ?? output;
 document.getElementById("themes").replaceChildren(...(data?.themes ?? []).map(theme => {
  const frame = document.createElement("iframe");
  frame.title = theme.name;
  frame.setAttribute("sandbox", "");
  frame.srcdoc = theme.html;
  frame.style.cssText = "width:100%;height:720px;border:0";
  return frame;
 }));
}
render(window.openai?.toolOutput);
window.addEventListener("openai:set_globals", event => render(event.detail?.globals?.toolOutput));
</script>
`.trim();

export function registerSmartLinkThemePreviewResource(server: McpServer) {
	server.registerResource(
		"smart-link-theme-preview",
		SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
		{
			description:
				"Visual preview for the four Dynamoi Smart Link page themes.",
			mimeType: "text/html;profile=mcp-app",
			title: "Smart Link Theme Preview",
		},
		async () => ({
			contents: [
				{
					_meta: {
						ui: {
							csp: {
								connectDomains: [],
								resourceDomains: [
									"https://i.scdn.co",
									"https://image-cdn-ak.spotifycdn.com",
									"https://fonts.googleapis.com",
									"https://fonts.gstatic.com",
								],
							},
							domain: "https://dynamoi.com",
							prefersBorder: true,
						},
					},
					mimeType: "text/html;profile=mcp-app",
					text: SMART_LINK_THEME_PREVIEW_HTML,
					uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
				},
			],
		}),
	);
}
