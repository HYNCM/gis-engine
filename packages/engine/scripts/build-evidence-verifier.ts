import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Dependency order: callees first. Append new closure members in this order.
// One-argument lambda rather than a bare `.map(resolve)`: `resolve`'s rest parameters make `Array.map`'s
// index argument a type error under strict mode.
// This list and `BUNDLE_MODULES` in tests/evidence/standalone-verifier.test.ts are the same set in the
// same order, and each names the other. The "verbatim embedding" lock only covers what the test lists:
// append a member here without appending it there and the guard silently narrows to a smaller closure
// instead of failing.
const BUNDLE = ["dist/src/evidence/canonical-stringify.js", "dist/src/evidence/record.js"].map((source) =>
  resolve(source),
);
const target = resolve("dist/evidence-verifier.mjs");
// Every syntax that can pull in another module at runtime. Task 3's reachability guard learned the
// hard way that a `from "…"`-only scan is bypassed by `await import("…")`; a scanner that misses one
// here emits a bundle that breaks on the auditor's machine instead of failing the build.
const MODULE_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g;

function specifiersIn(code: string): string[] {
  return [...code.matchAll(MODULE_SPECIFIER)].map((match) => match[1] as string);
}

const sources = BUNDLE.map((source) => {
  const compiled = readFileSync(source, "utf-8");
  const offenders = [...new Set(specifiersIn(compiled))]
    .filter((specifier) => !specifier.startsWith("node:"))
    .map((specifier) => resolve(dirname(source), specifier))
    .filter((dependency) => !BUNDLE.includes(dependency));

  if (offenders.length > 0) {
    console.error(
      `evidence-verifier must stay dependency-free. Offending imports in ${source}:\n${offenders
        .map((offender) => `  ${offender}`)
        .join("\n")}`,
    );
    process.exitCode = 1;
    return "";
  }

  // Strip only lines carrying an intra-bundle specifier; node: builtins stay and the guard test
  // asserts nothing else survives. tsc/Biome emit single-line import statements, so a line filter
  // cannot leave a fragment behind — and if that invariant ever breaks, the standalone CLI test
  // *executes* this file, so a parse error fails the gate instead of shipping.
  return compiled
    .split("\n")
    .filter((line) => !specifiersIn(line).some((specifier) => BUNDLE.includes(resolve(dirname(source), specifier))))
    .join("\n");
});

if (process.exitCode !== 1) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `#!/usr/bin/env node
${sources.join("\n")}
import { readFile } from "node:fs/promises";

process.exitCode = await runEvidenceVerifierCli(process.argv.slice(2), {
  // No encoding option on purpose: readFile returns a Buffer, i.e. the raw bytes
  // the record's sha256 values were computed over.
  readFile: (path) => readFile(path),
  log: (line) => {
    process.stdout.write(line + "\\n");
  },
});
`,
    { mode: 0o755 },
  );
  console.log(`built ${target}`);
}
