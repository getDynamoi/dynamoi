// Public SDK input policy. Approved SDK source and installed dependencies are trusted;
// filenames/content heuristics are not a substitute for reviewing that public source.
const fs = require("node:fs");
const path = require("node:path");
const core = new Set(JSON.parse(require("node:child_process").execFileSync("node", ["-p", "JSON.stringify(require('node:module').builtinModules)"], { stdio: ["ignore", "pipe", "pipe"] })));
const isBuiltin = name => core.has(name) || (name.startsWith("node:") && core.has(name.slice(5)));
const root = fs.realpathSync(path.resolve(__dirname, ".."));
const src = path.join(root, "src");
const metadata = require(path.join(root, "package.json"));
// Reuse the repository’s pinned compatibility compiler: TS7 has no host-controlled emit API.
const ts = require("typescript-6-compat");
const inside = (base, file) => file.startsWith(`${base}${path.sep}`);
const fail = () => { throw new Error("Unapproved SDK input or package inventory"); };
if (!metadata.devDependencies?.["typescript-6-compat"]) fail();
function packageRoot(name, from) {
 let file;
 try { file = require.resolve(`${name}/package.json`, { paths: [from] }); }
 catch { file = Bun.resolveSync(name, from); }
 for (let dir = path.dirname(fs.realpathSync(file)); ; dir = path.dirname(dir)) {
  const manifest = path.join(dir, "package.json");
  if (fs.existsSync(manifest) && JSON.parse(fs.readFileSync(manifest, "utf8")).name === name) return dir;
  if (path.dirname(dir) === dir) fail();
 }
}
function dependencies(names) {
 const roots = new Set();
 function add(name, from) {
  const dir = packageRoot(name, from);
  if (roots.has(dir)) return;
  if (!dir.split(path.sep).includes("node_modules")) fail();
  roots.add(dir);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  for (const dependency of Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })) {
   if (pkg.peerDependenciesMeta?.[dependency]?.optional && !pkg.dependencies?.[dependency]) continue;
   add(dependency, dir);
  }
  for (const dependency of Object.keys(pkg.optionalDependencies || {})) {
   try { packageRoot(dependency, dir); } catch { continue; }
   add(dependency, dir);
  }
 }
 for (const name of names) {
  if (!metadata.dependencies?.[name] && !metadata.devDependencies?.[name]) fail();
  add(name, root);
 }
 return roots;
}
const runtime = Object.keys(metadata.dependencies || {});
const publicDependency = (specifier, names = runtime) => !/[\\%?#]/.test(specifier) && !specifier.split("/").some(part => !part || part === "." || part === "..") && names.some(name => specifier === name || specifier.startsWith(`${name}/`));
const publicRoots = Object.values(metadata.exports).map(target => {
 if (Object.keys(target).sort().join() !== "default,import,types" || target.default !== target.import ||
  !/^\.\/dist\/[\w/-]+\.js$/.test(target.import) || target.types !== target.import.replace(/\.js$/, ".d.ts")) fail();
 return path.join(src, target.import.slice(7).replace(/\.js$/, ".ts"));
});
if (metadata.main !== metadata.exports["."].import || metadata.types !== metadata.exports["."].types || metadata.bundledDependencies || metadata.bundleDependencies) fail();
function policy(browser = false, typeInputs = false) {
 const allowed = dependencies(browser ? ["@modelcontextprotocol/ext-apps", ...(typeInputs ? [...runtime, "@types/node"] : [])] : [...runtime, "@types/node"]);
 const compiler = path.dirname(fs.realpathSync(require.resolve("typescript-6-compat/package.json", { paths: [root] })));
 const cache = new Map();
 function owner(file) { return [...allowed].find(dir => inside(dir, file) && !path.relative(dir, file).split(path.sep).includes("node_modules")); }
 function identity(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return;
  const canonical = fs.realpathSync(file);
  if ((inside(src, file) && !inside(src, canonical)) || [file, canonical].some(name => inside(src, name) && path.relative(src, name).split(path.sep).includes("node_modules"))) return;
  const publicSource = inside(src, canonical) && /\.ts$/.test(canonical) && !/(?:__tests__|\.(?:test|spec|test-support)\.)/.test(canonical);
  if (!/\.(?:[cm]?[jt]s|json)$/.test(canonical) || (!publicSource && !owner(canonical) && !(inside(path.join(compiler, "lib"), canonical) && /\/lib[^/]*\.d\.ts$/.test(canonical)) && canonical !== path.join(root, "package.json"))) return;
  return { canonical, publicSource };
 }
 function read(file) {
  const input = identity(file);
  if (!input) { if (path.basename(file) === "package.json" || !fs.existsSync(file)) return undefined; fail(); }
  const { canonical, publicSource } = input;
  if (!cache.has(canonical)) {
   const text = fs.readFileSync(canonical, "utf8");
   if (publicSource) {
    const ast = ts.createSourceFile(canonical, text, ts.ScriptTarget.Latest, true);
    if (ast.referencedFiles.length || ast.typeReferenceDirectives.length || ast.libReferenceDirectives.length) fail();
    function visit(node) {
     if (node.attributes || node.assertClause || ts.isImportEqualsDeclaration(node) || (ts.isIdentifier(node) && node.text === "require")) fail();
     for (const comment of [...(ts.getLeadingCommentRanges(text, node.pos) || []), ...(ts.getTrailingCommentRanges(text, node.end) || [])]) {
      if (/[#@]\s*sourceMappingURL\s*=/.test(text.slice(comment.pos, comment.end))) fail();
     }
     const literal = node.moduleSpecifier || (ts.isImportTypeNode(node) ? node.argument.literal : undefined);
     if (literal) edge(literal.text, canonical);
     if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) fail();
      edge(node.arguments[0].text, canonical);
     }
     ts.forEachChild(node, visit);
    }
    visit(ast);
   }
   cache.set(canonical, text);
  }
  return cache.get(canonical);
 }
 function edge(specifier, importer) {
  if (specifier.startsWith(".")) {
   const target = path.resolve(path.dirname(importer), specifier);
   if (inside(src, importer) ? !inside(src, target) : !inside(owner(importer) || "!", target)) fail();
  } else if (!isBuiltin(specifier) && !publicDependency(specifier) &&
   !(browser && publicDependency(specifier, ["@modelcontextprotocol/ext-apps"]))) fail();
 }
 const plugin = { name: "public-sdk-inputs", setup(build) {
  build.onResolve({ filter: /.*/ }, args => {
   if (!args.importer || args.importer === "runtime") return;
   if (inside(src, fs.realpathSync(args.importer))) edge(args.path, args.importer);
   if (!browser && (isBuiltin(args.path) || publicDependency(args.path))) return { path: args.path, external: true };
   if (isBuiltin(args.path)) fail();
   if (args.path.startsWith(".")) {
    const resolved = fs.realpathSync(Bun.resolveSync(args.path, path.dirname(args.importer)));
    if (inside(src, args.importer) ? !inside(src, resolved) : !inside(owner(fs.realpathSync(args.importer)) || "!", resolved)) fail();
   } else {
    const name = args.path.startsWith("@") ? args.path.split("/").slice(0, 2).join("/") : args.path.split("/")[0];
    if (!allowed.has(packageRoot(name, path.dirname(args.importer)))) fail();
   }
  });
  build.onLoad({ filter: /.*/ }, args => ({ contents: read(args.path), loader: args.path.endsWith(".json") ? "json" : /\.[cm]?ts$/.test(args.path) ? "ts" : "js" }));
 } };
 return { read, plugin, exists: file => !!identity(file) };
}
function compile(roots, browser = false, outdir) {
 const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
 if (config.error || config.config.extends) fail();
 const parsed = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
 if (parsed.errors.length) fail();
 const options = { ...parsed.options, declaration: true, emitDeclarationOnly: true, sourceMap: false, declarationMap: false,
  rootDir: src, outDir: outdir, noEmit: false, incremental: false, noEmitOnError: true };
 const host = ts.createCompilerHost(options);
 const inputs = policy(browser, true);
 host.readFile = inputs.read;
 host.fileExists = inputs.exists;
 host.getSourceFile = (file, languageVersion) => { const text = inputs.read(file); return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true); };
 host.resolveModuleNames = (names, containing) => names.map(name => {
  const resolved = ts.resolveModuleName(name, containing, options, host).resolvedModule;
  if (!resolved && !isBuiltin(name) && !(name.startsWith("node:") && inside(packageRoot("@types/node", root), containing))) fail();
  return resolved;
 });
 host.resolveTypeReferenceDirectives = (names, containing) => names.map(name => {
  const resolved = ts.resolveTypeReferenceDirective(typeof name === "string" ? name : name.fileName, containing, options, host).resolvedTypeReferenceDirective;
  if (!resolved) fail();
  return resolved;
 });
 return ts.createProgram(roots, options, host);
}
function checkWorkspace() {
 if (ts.getPreEmitDiagnostics(compile([path.join(src, "server/workspace/browser.ts")], true)).length) fail();
}
function declarations(outdir) {
 const program = compile(publicRoots, false, outdir);
 const expected = new Set(program.getSourceFiles().filter(file => inside(src, file.fileName)).map(file => path.relative(src, file.fileName).replace(/\.ts$/, ".d.ts")));
 if (ts.getPreEmitDiagnostics(program).length) fail();
 if (program.emit().emitSkipped) fail();
 const retained = new Set();
 function keep(file) {
  if (!expected.has(file)) fail();
  if (retained.has(file)) return;
  retained.add(file);
  const text = fs.readFileSync(path.join(outdir, file), "utf8");
  const info = ts.preProcessFile(text, true, true);
  if (info.referencedFiles.length || info.typeReferenceDirectives.length) fail();
  for (const imported of info.importedFiles) {
   if (imported.fileName.startsWith(".")) {
    let target = path.posix.normalize(path.posix.join(path.posix.dirname(file), imported.fileName)).replace(/\.js$/, "");
    target = expected.has(`${target}.d.ts`) ? `${target}.d.ts` : `${target}/index.d.ts`;
    keep(target);
   } else if (!publicDependency(imported.fileName) && !isBuiltin(imported.fileName)) fail();
  }
 }
 for (const entry of publicRoots) keep(path.relative(src, entry).replace(/\.ts$/, ".d.ts"));
 for (const file of expected) if (!retained.has(file)) fs.rmSync(path.join(outdir, file));
 return [...retained];
}
function packageInventory(outdir, expected) {
 const temporary = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "sdk-pack-"));
 try {
  const copy = path.join(temporary, "package");
  fs.cpSync(root, copy, { recursive: true, filter: file => !["node_modules", ".git"].includes(path.basename(file)) && !path.basename(file).startsWith(".mcp-build-") });
  fs.rmSync(path.join(copy, "dist"), { recursive: true, force: true });
  fs.cpSync(outdir, path.join(copy, "dist"), { recursive: true });
  const pack = Bun.spawnSync(["npm", "pack", "--dry-run", "--json", "--ignore-scripts", "--cache", path.join(temporary, "cache")], { cwd: copy, stdin: "ignore" });
  if (pack.exitCode !== 0) fail();
  const result = JSON.parse(pack.stdout.toString());
  const wanted = ["package.json", ...metadata.files];
  if (result.length !== 1 || result[0].files.map(file => file.path).sort().join() !== wanted.sort().join()) fail();
  for (const file of wanted.filter(file => !file.startsWith("dist/"))) {
   if (!fs.lstatSync(path.join(root, file)).isFile() || /sourcesContent|sourceMappingURL\s*=/.test(fs.readFileSync(path.join(root, file), "utf8"))) fail();
  }
  inventory(path.join(copy, "dist"), expected);
 } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
function inventory(dir, expected) {
 if (!fs.lstatSync(dir).isDirectory()) fail();
 const found = [];
 function walk(base) {
  for (const item of fs.readdirSync(base, { withFileTypes: true })) {
   const file = path.join(base, item.name);
   if (item.isDirectory()) walk(file);
   else {
    const name = path.relative(dir, file);
    if (!item.isFile() || !expected.includes(name) || /sourcesContent|sourceMappingURL\s*=/.test(fs.readFileSync(file, "utf8"))) fail();
    found.push(name);
   }
  }
 }
 walk(dir);
 if (found.sort().join() !== [...expected].sort().join()) fail();
}
module.exports = { metadata, publicRoots, policy, checkWorkspace, declarations, inventory, packageInventory, fail };
