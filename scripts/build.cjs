const {
	existsSync,
	mkdtempSync,
	realpathSync,
	renameSync,
	rmSync,
	watch: watchFiles,
} = require("node:fs");
const path = require("node:path");

const packageRoot = realpathSync(path.resolve(__dirname, ".."));
const sourceRoot = path.join(packageRoot, "src");
const outputRoot = path.join(packageRoot, "dist");
const watch = process.argv.includes("--watch");
const { metadata, publicRoots, policy, declarations, inventory, packageInventory, fail } = require("./inputs.cjs");
const { buildWorkspace } = require("./build-workspace.cjs");

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

async function build() {
	await buildWorkspace();
	const stagingRoot = mkdtempSync(path.join(packageRoot, ".mcp-build-"));
	const nextOutputRoot = path.join(stagingRoot, "next");
	try {
		const result = await Bun.build({
			define: {
				__DYNAMOI_MCP_VERSION__: JSON.stringify(metadata.version),
			},
			entrypoints: publicRoots,
			plugins: [policy().plugin],
			format: "esm",
			minify: false,
			outdir: nextOutputRoot,
			root: sourceRoot,
			sourcemap: "none",
			splitting: false,
			target: "node",
		});

		if (!result.success) {
			for (const log of result.logs) {
				console.error(log);
			}
			return false;
		}

		try {
			const types = declarations(nextOutputRoot);
			const expected = [...publicRoots.map(file => path.relative(sourceRoot, file).replace(/\.ts$/, ".js")), ...types];
			inventory(nextOutputRoot, expected);
			const docs = ["CAPABILITY_PARITY.md", "server.json", "README.md", "CHANGELOG.md", "LICENSE"];
			if ([...metadata.files].sort().join() !== [...docs, ...expected.map(file => `dist/${file}`)].sort().join()) fail();
			packageInventory(nextOutputRoot, expected);

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
	if (!(await build()) && !watch) {
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
				await build();
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
