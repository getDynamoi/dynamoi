// This identifier is replaced at build time by the package build script.
// The source fallback keeps dashboard runtime imports from leaking a placeholder.
declare const __DYNAMOI_MCP_VERSION__: string | undefined;

const BUNDLED_DYNAMOI_MCP_VERSION =
	typeof __DYNAMOI_MCP_VERSION__ === "string" ? __DYNAMOI_MCP_VERSION__ : "";

export const DYNAMOI_MCP_VERSION =
	BUNDLED_DYNAMOI_MCP_VERSION.length > 0 &&
	!BUNDLED_DYNAMOI_MCP_VERSION.includes("__")
		? BUNDLED_DYNAMOI_MCP_VERSION
		: "1.0.2";
