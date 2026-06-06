#!/usr/bin/env node
/**
 * CDN Bundle Builder
 *
 * 用法：
 *   node scripts/build-cdn.mjs [options]
 *
 * 选项：
 *   --dry-run    仅检查不写入
 *
 * 功能：
 *   - 将 @gis-engine/engine、@gis-engine/ai、@gis-engine/scene3d 打包为独立 ESM bundle
 *   - 按每个 package 的 exports["."].import 生成 root ESM entry
 *   - 输出到 dist/cdn/ 目录
 *   - 支持 unpkg / jsDelivr / esm.sh 部署
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CDN_OUT = join(ROOT, "dist/cdn");

/**
 * Read the package's exports["."].import to find the actual ESM entry path.
 */
function getExportEntry(pkgName) {
  const pkgPath = join(ROOT, "packages", pkgName, "package.json");
  if (!existsSync(pkgPath)) return null;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const exports = pkg.exports;
  if (exports?.["."]?.import) {
    return exports["."].import;
  }
  if (exports?.["."]) {
    return exports["."];
  }
  return pkg.main || null;
}

/**
 * Resolve the dist source path from the package's export entry.
 */
function resolveDistSrc(pkgName) {
  const entry = getExportEntry(pkgName);
  if (!entry) return null;
  // Entry is relative to the package root, e.g. "./dist/src/index.js"
  return join("packages", pkgName, entry.replace(/^\.\//, ""));
}

const packages = [
  {
    name: "engine",
    src: resolveDistSrc("engine") || "packages/engine/dist/src/index.js",
    global: "GisEngine",
    defaultExport: "createMap",
  },
  {
    name: "ai",
    src: resolveDistSrc("ai") || "packages/ai/dist/index.js",
    global: "GisEngineAi",
    defaultExport: null, // AI tools have no single default export
  },
  {
    name: "scene3d",
    src: resolveDistSrc("scene3d") || "packages/scene3d/dist/index.js",
    global: "GisEngineScene3D",
    defaultExport: null,
  },
];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function getVersion(pkgName) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, "packages", pkgName, "package.json"), "utf-8"));
    return pkg.version;
  } catch {
    return "0.1.0";
  }
}

function getDescription(pkgName) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, "packages", pkgName, "package.json"), "utf-8"));
    return pkg.description || `@gis-engine/${pkgName}`;
  } catch {
    return `@gis-engine/${pkgName}`;
  }
}

function buildHeader(pkgName, version) {
  return [
    `/*!`,
    ` * @gis-engine/${pkgName} v${version}`,
    ` * AI-native, schema-first map engine`,
    ` * License: Apache-2.0`,
    ` * https://github.com/HYNCM/gis-engine`,
    ` */`,
    "",
  ].join("\n");
}

function bundleEsm(pkg, version) {
  const srcPath = join(ROOT, pkg.src);
  if (!existsSync(srcPath)) {
    console.warn(`  ⚠️ ${pkg.src} 不存在，跳过`);
    return null;
  }

  const content = readFileSync(srcPath, "utf-8");
  const header = buildHeader(pkg.name, version);

  // Generate ESM wrapper: re-export all from index.js
  const lines = [
    header,
    `// ESM entry — import from CDN:`,
    `//   import { ... } from "https://unpkg.com/@gis-engine/${pkg.name}";`,
    `//   import { ... } from "https://cdn.jsdelivr.net/npm/@gis-engine/${pkg.name}";`,
    "",
    `export * from "./index.js";`,
  ];

  // Only add default export if the package has a known default
  if (pkg.defaultExport) {
    lines.push(`export { ${pkg.defaultExport} as default } from "./index.js";`);
  }
  lines.push("");

  return { esm: lines.join("\n"), raw: content };
}

function generatePackageJson(pkgName, version) {
  return JSON.stringify(
    {
      name: `@gis-engine/${pkgName}`,
      version,
      description: getDescription(pkgName),
      license: "Apache-2.0",
      type: "module",
      main: `./index.js`,
      module: `./index.js`,
      unpkg: `./index.js`,
      jsdelivr: `./index.js`,
      exports: {
        ".": {
          import: "./index.js",
          default: "./index.js",
        },
      },
      files: ["**/*"],
      repository: {
        type: "git",
        url: "https://github.com/HYNCM/gis-engine.git",
        directory: `packages/${pkgName}`,
      },
    },
    null,
    2,
  );
}

function buildReadme(pkgName) {
  return [
    `# @gis-engine/${pkgName}`,
    "",
    `CDN-ready ESM bundle. See [GIS Engine](https://github.com/HYNCM/gis-engine) for full documentation.`,
    "",
    "```html",
    `<script type="module">`,
    `import { ... } from "https://unpkg.com/@gis-engine/${pkgName}";`,
    `</script>`,
    "```",
    "",
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log(`📦 CDN Bundle Builder`);
  console.log(`   输出: ${CDN_OUT}`);
  console.log("");

  if (!dryRun) {
    ensureDir(CDN_OUT);
  }

  for (const pkg of packages) {
    const version = getVersion(pkg.name);
    const outDir = join(CDN_OUT, pkg.name);

    console.log(`📋 @gis-engine/${pkg.name} v${version}`);

    const bundled = bundleEsm(pkg, version);
    if (!bundled) continue;

    if (!dryRun) {
      ensureDir(outDir);

      // 复制 dist 文件
      const srcDist = join(ROOT, "packages", pkg.name, "dist");
      if (existsSync(srcDist)) {
        cpSync(srcDist, outDir, { recursive: true });
      }

      // ESM entry
      writeFileSync(join(outDir, "index.mjs"), bundled.esm);

      // Package metadata
      writeFileSync(join(outDir, "package.json"), generatePackageJson(pkg.name, version));
      writeFileSync(join(outDir, "README.md"), buildReadme(pkg.name));
    }

    const sizeKB = (Buffer.byteLength(bundled.raw, "utf-8") / 1024).toFixed(1);
    console.log(`   📄 体积: ${sizeKB} KB (raw)`);
  }

  // 生成根 manifest
  if (!dryRun) {
    const manifest = {
      generated: new Date().toISOString(),
      packages: Object.fromEntries(
        packages.map((p) => [
          p.name,
          {
            version: getVersion(p.name),
            global: p.global,
            files: {
              esm: `./${p.name}/index.mjs`,
              unpkg: `https://unpkg.com/@gis-engine/${p.name}`,
              jsdelivr: `https://cdn.jsdelivr.net/npm/@gis-engine/${p.name}`,
            },
          },
        ]),
      ),
    };
    writeFileSync(join(CDN_OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`\n📄 CDN manifest: ${join(CDN_OUT, "manifest.json")}`);
  }

  console.log(`\n✅ CDN Bundle Builder 完成`);
  if (dryRun) console.log(`   (dry-run, 未写入文件)`);

  process.exit(0);
}

main();
