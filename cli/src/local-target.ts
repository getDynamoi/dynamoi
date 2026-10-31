import { lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type LocalTarget = { endpoint: string; token: string };
type Preview = {
	data: string;
	database: string;
	identity: string;
	links: string[];
	pid: number;
	ports: number[];
	state: string;
	surface: string;
};
type Metadata = { clones?: Record<string, { source?: string }> };

export function previewEndpoint(
	manifest: Preview,
	metadata: Metadata,
	identity: string,
): string {
	if (
		manifest.state !== "ready" ||
		manifest.data !== "synthetic" ||
		manifest.surface === "public" ||
		!/^dynamoi_agent_[a-z0-9_]+$/.test(manifest.database) ||
		metadata.clones?.[manifest.database]?.source !== "empty" ||
		!identity ||
		manifest.identity !== identity
	)
		throw new Error(
			"A live, ready, empty-clone synthetic preview is required.",
		);
	const link = manifest.links.find((value) => {
		const u = new URL(value);
		return (
			u.protocol === "http:" &&
			["127.0.0.1", "localhost"].includes(u.hostname) &&
			!u.username &&
			!u.password &&
			!u.search &&
			!u.hash &&
			u.pathname === "/" &&
			u.port === String(manifest.ports[0])
		);
	});
	if (!link)
		throw new Error(
			"Synthetic CLI requests require a loopback preview endpoint.",
		);
	return new URL("/mcp", link).href;
}

/** Explicit process-local targeting; never opens or changes the OAuth credential store. */
export function readLocalTarget(args: string[]): {
	argv: string[];
	target?: LocalTarget;
} {
	const flags = ["--preview-manifest", "--bearer-file"];
	if (!args.some((arg) => flags.includes(arg))) return { argv: args };
	if (
		args[0] !== flags[0] ||
		args[2] !== flags[1] ||
		!args[1] ||
		!args[3] ||
		args.slice(4).some((arg) => flags.includes(arg))
	)
		throw new Error(
			"Put --preview-manifest <run.json> --bearer-file <private-file> before the command.",
		);
	const argv = args.slice(4);
	if (["login", "logout", "whoami"].includes(argv[0] ?? ""))
		throw new Error(
			"Synthetic preview mode supports tool commands only; OAuth credentials are isolated.",
		);
	const { endpoint } = readLocalPreview(args[1]);
	const stat = lstatSync(args[3]);
	if (
		!stat.isFile() ||
		(stat.mode & 0o077) !== 0 ||
		stat.uid !== process.getuid?.() ||
		stat.size > 16384
	)
		throw new Error(
			"Bearer file must be a private, owned regular file (0600).",
		);
	const token = readFileSync(args[3], "utf8").trim();
	if (!token || /\s/.test(token))
		throw new Error("Bearer file is empty or invalid.");
	return { argv, target: { endpoint, token } };
}

function readLocalPreview(manifestPath: string) {
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Preview;
	if (!Number.isSafeInteger(manifest.pid) || manifest.pid <= 0)
		throw new Error("Invalid preview owner.");
	const identity =
		readFileSync(`/proc/${manifest.pid}/stat`, "utf8")
			.split(") ")[1]
			?.split(" ")[19] ?? "";
	const metadata = JSON.parse(
		readFileSync(
			join(homedir(), ".cache/dynamoi/agent-db/metadata.json"),
			"utf8",
		),
	) as Metadata;
	const endpoint = previewEndpoint(manifest, metadata, identity);
	return { manifest, endpoint };
}
