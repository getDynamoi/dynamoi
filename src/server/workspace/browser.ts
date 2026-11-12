import { App, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import { createWorkspaceView } from "./view";

const app = new App({ name: "Dynamoi Artist Workspace", version: "1.0.0" }, {});
const root = document.getElementById("content");
if (!root) {
	throw new Error("Workspace content is missing.");
}
const view = createWorkspaceView(root, app);
app.addEventListener("toolresult", (result) => view.initial(result));
app.addEventListener("toolcancelled", () => view.unsupported());
function hostContext(context: Record<string, unknown>, hydration = false) {
	const styles = context.styles as
		{ variables?: Parameters<typeof applyHostStyleVariables>[0] } | undefined;
	if (styles?.variables) {
		applyHostStyleVariables(styles.variables);
	}
	view.hostContext(context, hydration);
}
app.addEventListener("hostcontextchanged", (context) => hostContext(context));
app.onteardown = () => {
	view.dispose();
	return {};
};
window.addEventListener(
	"pagehide",
	() => {
		view.dispose();
		void app.close();
	},
	{ once: true },
);
if (window.parent === window) {
	view.unsupported();
} else {
	void app
		.connect(undefined, { timeout: 3000 })
		.then(() => {
			const caps = app.getHostCapabilities();
			hostContext(app.getHostContext() ?? {}, true);
			view.setConnected(
				Boolean(caps?.serverTools),
				Boolean(caps?.updateModelContext?.text),
				Boolean(caps?.openLinks),
			);
			return null;
		})
		.catch(() => {
			view.unsupported();
			void app.close();
		});
}
