import type { McpServer } from "@modelcontextprotocol/server";
import { SMART_LINK_THEME_PREVIEW_CONTRACT } from "./theme-preview.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

export const SMART_LINK_THEME_PREVIEW_RESOURCE_URI =
	"ui://dynamoi/smart-link-theme-preview-v1.html";

export const DynamoiPreviewSmartLinkThemesInputSchema =
	SMART_LINK_THEME_PREVIEW_CONTRACT.mcp.definition.schema;
export const SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION = {
	...SMART_LINK_THEME_PREVIEW_CONTRACT.mcp.definition,
	outputSchema: AnyOutputEnvelopeSchema,
};

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

export function registerSmartLinkThemePreviewResource(
	server: McpServer,
	uiDomain = "https://dynamoi.com",
) {
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
							domain: uiDomain,
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
