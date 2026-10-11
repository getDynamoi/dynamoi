const {
	existsSync,
	mkdtempSync,
	renameSync,
	rmSync,
	watch: watchFiles,
} = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(packageRoot, "src");
const outputRoot = path.join(packageRoot, "dist");
const watch = process.argv.includes("--watch");
const { buildWorkspace } = require("./build-workspace.cjs");

async function loadBuildMetadata() {
	const typescriptPackagePath = Bun.resolveSync(
		"typescript/package.json",
		packageRoot,
	);
	const [packageMetadata, typescriptPackage] = await Promise.all([
		Bun.file(path.join(packageRoot, "package.json")).json(),
		Bun.file(typescriptPackagePath).json(),
	]);

	return {
		packageVersion: packageMetadata.version,
		typescriptCli: path.resolve(
			path.dirname(typescriptPackagePath),
			typescriptPackage.bin.tsc,
		),
	};
}

function emitDeclarations(typescriptCli, outdir) {
	const result = Bun.spawnSync({
		cmd: [
			process.execPath,
			typescriptCli,
			"--emitDeclarationOnly",
			"--outDir",
			outdir,
		],
		cwd: packageRoot,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	if (result.exitCode !== 0) {
		throw new Error("TypeScript declaration generation failed");
	}
}

function replaceOutput(stagingRoot, nextOutputRoot) {
	const previousOutputRoot = path.join(stagingRoot, "previous");
	if (existsSync(outputRoot)) {
		renameSync(outputRoot, previousOutputRoot);
	}
	try {
		renameSync(nextOutputRoot, outputRoot);
	} catch (error) {
		if (existsSync(previousOutputRoot)) {
			renameSync(previousOutputRoot, outputRoot);
		}
		throw error;
	}
}

async function build({ packageVersion, typescriptCli }) {
	await buildWorkspace();
	const stagingRoot = mkdtempSync(path.join(packageRoot, ".mcp-build-"));
	const nextOutputRoot = path.join(stagingRoot, "next");
	try {
		const result = await Bun.build({
			define: {
				__DYNAMOI_MCP_VERSION__: JSON.stringify(packageVersion),
			},
			entrypoints: [
				path.join(sourceRoot, "index.ts"),
				path.join(sourceRoot, "auth/protected-resource.ts"),
				path.join(sourceRoot, "consent.ts"),
				path.join(sourceRoot, "youtube-metrics.ts"),
			],
			external: [
				"@modelcontextprotocol/client",
				"@modelcontextprotocol/server",
				"zod",
			],
			format: "esm",
			minify: false,
			outdir: nextOutputRoot,
			root: sourceRoot,
			sourcemap: "linked",
			splitting: true,
			target: "node",
		});

		if (!result.success) {
			for (const log of result.logs) {
				console.error(log);
			}
			return false;
		}

		try {
			emitDeclarations(typescriptCli, nextOutputRoot);
		} catch (error) {
			console.error(error);
			return false;
		}

		replaceOutput(stagingRoot, nextOutputRoot);
		console.log(
			`Built ${result.outputs.length} JavaScript artifacts and declarations.`,
		);
		return true;
	} finally {
		rmSync(stagingRoot, { force: true, recursive: true });
	}
}

async function main() {
	const metadata = await loadBuildMetadata();
	if (!(await build(metadata)) && !watch) {
		process.exitCode = 1;
		return;
	}
	if (!watch) {
		return;
	}

	let activeBuild;
	let rebuildQueued = false;
	let rebuildTimer;

	const rebuild = async () => {
		if (activeBuild) {
			rebuildQueued = true;
			return;
		}
		activeBuild = (async () => {
			do {
				rebuildQueued = false;
				await build(metadata);
			} while (rebuildQueued);
		})();
		try {
			await activeBuild;
		} catch (error) {
			console.error(error);
		} finally {
			activeBuild = undefined;
		}
	};

	watchFiles(sourceRoot, { recursive: true }, () => {
		clearTimeout(rebuildTimer);
		rebuildTimer = setTimeout(rebuild, 50);
	});
	console.log("Watching packages/mcp/src for changes...");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
