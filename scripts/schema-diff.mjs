#!/usr/bin/env node

/**
 * Schema Diff Report — detect Breaking vs Non-Breaking changes in TypeBox schemas.
 *
 * Usage:
 *   node scripts/schema-diff.mjs                          # auto-detect base/head
 *   node scripts/schema-diff.mjs --base <sha> --head <sha>
 *   node scripts/schema-diff.mjs --json                   # JSON output
 *   node scripts/schema-diff.mjs --output report.md       # write to file
 *
 * Exit codes:
 *   0 — only non-breaking / info changes
 *   1 — breaking changes detected
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = "packages/engine/src/spec/schemas/";

const args = process.argv.slice(2);

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

const options = {
  base: readOption("--base") ?? "main",
  head: readOption("--head") ?? "HEAD",
  json: args.includes("--json"),
  output: readOption("--output"),
};

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(gitArgs) {
  try {
    return execFileSync("git", gitArgs, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const _stderr = error?.stderr ? String(error.stderr).trim() : "";
    return "";
  }
}

function detectChangedSchemaFiles() {
  const allFiles = new Set();

  // Committed changes between base and head
  const committed = git(["diff", "--name-only", `${options.base}...${options.head}`]);
  for (const line of committed.split("\n")) {
    const f = line.trim();
    if (f) allFiles.add(f);
  }

  // Also include uncommitted working-tree changes
  const unstaged = git(["diff", "--name-only"]);
  for (const line of unstaged.split("\n")) {
    const f = line.trim();
    if (f) allFiles.add(f);
  }

  // Fallback: HEAD~1..HEAD when no base comparison available
  if (allFiles.size === 0) {
    const fallback = git(["diff", "--name-only", "HEAD~1..HEAD"]);
    for (const line of fallback.split("\n")) {
      const f = line.trim();
      if (f) allFiles.add(f);
    }
  }

  return [...allFiles].filter((f) => f.startsWith(SCHEMA_DIR) && f.endsWith(".ts") && !f.endsWith("index.ts"));
}

function getFileAt(ref, filePath) {
  // For HEAD, prefer the working-tree file (handles uncommitted changes)
  if (ref === "HEAD") {
    try {
      return readFileSync(resolve(root, filePath), "utf-8");
    } catch {
      // File may not exist on disk; fall through to git show
    }
  }
  const content = git(["show", `${ref}:${filePath}`]);
  return content || null;
}

// ---------------------------------------------------------------------------
// TypeBox schema parser — extracts structural information from TypeScript source
// ---------------------------------------------------------------------------

/**
 * Extract named schema exports and their structural properties from TypeBox source.
 * Returns a map of { exportName -> SchemaInfo }.
 */
function parseSchemaSource(source) {
  const schemas = new Map();

  // Match exported const declarations that use Type.*
  const exportRegex = /export\s+const\s+(\w+)\s*=\s*/g;
  let match;

  while ((match = exportRegex.exec(source)) !== null) {
    const name = match[1];
    const startIdx = match.index + match[0].length;
    const info = extractSchemaInfo(source, startIdx, name);
    if (info) {
      schemas.set(name, info);
    }
  }

  // Also parse non-exported const schemas (used inside exported unions/objects)
  const localRegex = /(?:const|let)\s+(\w+Schema\w*)\s*=\s*/g;
  while ((match = localRegex.exec(source)) !== null) {
    const name = match[1];
    if (schemas.has(name)) continue;
    const startIdx = match.index + match[0].length;
    const info = extractSchemaInfo(source, startIdx, name);
    if (info) {
      schemas.set(name, info);
    }
  }

  return schemas;
}

/**
 * Extract schema info starting from a position after the `=` sign.
 */
function extractSchemaInfo(source, startIdx, _name) {
  const slice = source.slice(startIdx, startIdx + 4000);

  // Detect $id
  const idMatch = slice.match(/\$id:\s*"([^"]+)"/);
  const $id = idMatch ? idMatch[1] : null;

  // Detect Type.Object({ ... })
  const objMatch = slice.match(/^Type\.Object\(\s*\{/);
  if (objMatch) {
    const props = extractObjectProperties(slice);
    const required = extractRequiredFields(slice);
    return { kind: "object", $id, properties: props, required };
  }

  // Detect Type.Union([ ... ])
  const unionMatch = slice.match(/^Type\.Union\(\[/);
  if (unionMatch) {
    const literals = extractUnionLiterals(slice);
    return { kind: "union", $id, literals };
  }

  // Detect Type.Array(...)
  const arrayMatch = slice.match(/^Type\.Array\(/);
  if (arrayMatch) {
    return { kind: "array", $id };
  }

  // Detect Type.Literal(...)
  const litMatch = slice.match(/^Type\.Literal\("([^"]+)"\)/);
  if (litMatch) {
    return { kind: "literal", $id, value: litMatch[1] };
  }

  // Detect Type.String / Type.Number / Type.Boolean
  for (const primitive of ["String", "Number", "Boolean"]) {
    if (slice.startsWith(`Type.${primitive}(`)) {
      return { kind: "primitive", $id, type: primitive.toLowerCase() };
    }
  }

  // Detect Type.Record(...)
  if (slice.startsWith("Type.Record(")) {
    return { kind: "record", $id };
  }

  // Detect Type.Unsafe(...)
  const unsafeMatch = slice.match(/^Type\.Unsafe<[^>]*>\(\s*(\{[^}]+\})/);
  if (unsafeMatch) {
    return { kind: "unsafe", $id, raw: unsafeMatch[1] };
  }

  return null;
}

/**
 * Extract properties from a Type.Object({ ... }) call.
 * Returns Map<propName, { type: string, optional: boolean }>.
 */
function extractObjectProperties(slice) {
  const props = new Map();

  // Find the opening brace of the first argument
  const braceStart = slice.indexOf("{");
  if (braceStart === -1) return props;

  // Walk to find matching brace
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < slice.length; i++) {
    if (slice[i] === "{") depth++;
    else if (slice[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) return props;
  const body = slice.slice(braceStart + 1, end);

  // Match property patterns: `propName: Type.Optional(...)` or `propName: Type.String(...)`
  const propRegex = /(\w+)\s*:\s*(Type\.\w+(?:<[^>]*>)?\([^)]*(?:\([^)]*\)[^)]*)*\))/g;
  let propMatch;

  while ((propMatch = propRegex.exec(body)) !== null) {
    const propName = propMatch[1];
    const typeExpr = propMatch[2];
    const optional = typeExpr.includes("Type.Optional(");
    const typeStr = extractTypeName(typeExpr);
    props.set(propName, { type: typeStr, optional });
  }

  // Simpler fallback for properties the complex regex missed
  const simpleRegex = /^\s*(\w+)\s*:\s*(Type\.\w+)/gm;
  while ((propMatch = simpleRegex.exec(body)) !== null) {
    const propName = propMatch[1];
    if (!props.has(propName) && propName !== "additionalProperties") {
      const typeExpr = propMatch[2];
      props.set(propName, { type: extractTypeName(typeExpr), optional: false });
    }
  }

  return props;
}

/**
 * Extract required field names from the second argument of Type.Object.
 * Looks for explicit `required` arrays if present.
 */
function extractRequiredFields(slice) {
  const required = [];
  // Check for required: [...] in the options object (second arg)
  const reqMatch = slice.match(/required\s*:\s*\[([^\]]*)\]/);
  if (reqMatch) {
    const items = reqMatch[1].match(/"([^"]+)"/g);
    if (items) {
      for (const item of items) {
        required.push(item.replace(/"/g, ""));
      }
    }
  }
  return required;
}

/**
 * Extract a simplified type name from a TypeBox expression.
 */
function extractTypeName(expr) {
  if (expr.includes("Type.Optional(")) {
    const inner = expr.replace(/Type\.Optional\(/, "").replace(/\)$/, "");
    return `optional<${extractTypeName(inner)}>`;
  }
  if (expr.includes("Type.Union(")) return "union";
  if (expr.includes("Type.Array(")) return "array";
  if (expr.includes("Type.Object(")) return "object";
  if (expr.includes("Type.Record(")) return "record";
  if (expr.includes("Type.Literal(")) {
    const litMatch = expr.match(/Type\.Literal\("([^"]+)"\)/);
    return litMatch ? `literal<${litMatch[1]}>` : "literal";
  }
  if (expr.includes("Type.Tuple(")) return "tuple";
  if (expr.includes("Type.String(")) return "string";
  if (expr.includes("Type.Number(")) return "number";
  if (expr.includes("Type.Boolean(")) return "boolean";
  if (expr.includes("Type.Unknown(")) return "unknown";
  if (expr.includes("Type.Unsafe(")) return "unsafe";

  // Reference to another schema
  const refMatch = expr.match(/^(\w+Schema\w*)$/);
  if (refMatch) return `ref<${refMatch[1]}>`;

  return "unknown";
}

/**
 * Extract literal values from a Type.Union([Type.Literal("a"), ...]).
 */
function extractUnionLiterals(slice) {
  const literals = [];
  const bracketStart = slice.indexOf("[");
  if (bracketStart === -1) return literals;

  let depth = 0;
  let end = -1;
  for (let i = bracketStart; i < slice.length; i++) {
    if (slice[i] === "[") depth++;
    else if (slice[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) return literals;
  const body = slice.slice(bracketStart + 1, end);

  const litRegex = /Type\.Literal\("([^"]+)"\)/g;
  let m;
  while ((m = litRegex.exec(body)) !== null) {
    literals.push(m[1]);
  }

  return literals;
}

// ---------------------------------------------------------------------------
// Diff engine
// ---------------------------------------------------------------------------

/**
 * Compare two parsed schema sources and produce a list of changes.
 * @returns {{ level: 'breaking'|'non-breaking'|'info', message: string }[]}
 */
function diffSchemas(baseSchemas, headSchemas, fileName) {
  const changes = [];
  const prefix = `\`${fileName}\``;

  // Check for removed exports
  for (const [name] of baseSchemas) {
    if (!headSchemas.has(name)) {
      changes.push({
        level: "breaking",
        message: `${prefix}: removed exported schema \`${name}\``,
      });
    }
  }

  // Check for new exports
  for (const [name] of headSchemas) {
    if (!baseSchemas.has(name)) {
      changes.push({
        level: "non-breaking",
        message: `${prefix}: added new exported schema \`${name}\``,
      });
    }
  }

  // Compare shared schemas
  for (const [name, baseInfo] of baseSchemas) {
    const headInfo = headSchemas.get(name);
    if (!headInfo) continue;

    // $id version change
    if (baseInfo.$id && headInfo.$id && baseInfo.$id !== headInfo.$id) {
      changes.push({
        level: "breaking",
        message: `${prefix}: \`${name}\` $id changed from \`${baseInfo.$id}\` to \`${headInfo.$id}\``,
      });
    }

    // Kind change
    if (baseInfo.kind !== headInfo.kind) {
      changes.push({
        level: "breaking",
        message: `${prefix}: \`${name}\` kind changed from \`${baseInfo.kind}\` to \`${headInfo.kind}\``,
      });
      continue;
    }

    // Object property diff
    if (baseInfo.kind === "object" && headInfo.kind === "object") {
      const baseProps = baseInfo.properties ?? new Map();
      const headProps = headInfo.properties ?? new Map();

      // Removed properties
      for (const [propName, propInfo] of baseProps) {
        if (!headProps.has(propName)) {
          changes.push({
            level: "breaking",
            message: `${prefix}: \`${name}.${propName}\` property removed (was \`${propInfo.type}\`)`,
          });
        }
      }

      // Added properties
      for (const [propName, propInfo] of headProps) {
        if (!baseProps.has(propName)) {
          const level = propInfo.optional ? "non-breaking" : "breaking";
          changes.push({
            level,
            message: `${prefix}: \`${name}.${propName}\` property added (\`${propInfo.type}\`${propInfo.optional ? ", optional" : ", required"})`,
          });
        }
      }

      // Changed properties
      for (const [propName, baseProp] of baseProps) {
        const headProp = headProps.get(propName);
        if (!headProp) continue;

        if (baseProp.type !== headProp.type) {
          changes.push({
            level: "breaking",
            message: `${prefix}: \`${name}.${propName}\` type changed from \`${baseProp.type}\` to \`${headProp.type}\``,
          });
        }

        // Optional -> Required is breaking
        if (baseProp.optional && !headProp.optional) {
          changes.push({
            level: "breaking",
            message: `${prefix}: \`${name}.${propName}\` changed from optional to required`,
          });
        }

        // Required -> Optional is non-breaking
        if (!baseProp.optional && headProp.optional) {
          changes.push({
            level: "non-breaking",
            message: `${prefix}: \`${name}.${propName}\` changed from required to optional`,
          });
        }
      }
    }

    // Union literal diff
    if (baseInfo.kind === "union" && headInfo.kind === "union") {
      const baseLits = new Set(baseInfo.literals ?? []);
      const headLits = new Set(headInfo.literals ?? []);

      for (const lit of baseLits) {
        if (!headLits.has(lit)) {
          changes.push({
            level: "breaking",
            message: `${prefix}: \`${name}\` union literal removed: \`${lit}\``,
          });
        }
      }

      for (const lit of headLits) {
        if (!baseLits.has(lit)) {
          changes.push({
            level: "non-breaking",
            message: `${prefix}: \`${name}\` union literal added: \`${lit}\``,
          });
        }
      }
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Line-level diff for info-level changes (comments, formatting)
// ---------------------------------------------------------------------------

function detectInfoChanges(baseContent, headContent, fileName) {
  const changes = [];
  const baseLines = baseContent.split("\n");
  const headLines = headContent.split("\n");

  // Simple comment-only detection: lines starting with // or /* */
  const commentRegex = /^\s*(\/\/|\/\*|\*)/;
  let commentOnlyDiff = true;

  const maxLen = Math.max(baseLines.length, headLines.length);
  let addedLines = 0;
  let removedLines = 0;

  for (let i = 0; i < maxLen; i++) {
    const baseLine = baseLines[i] ?? "";
    const headLine = headLines[i] ?? "";

    if (baseLine !== headLine) {
      // Check if both changed lines are comments
      const baseIsComment = commentRegex.test(baseLine) || baseLine.trim() === "";
      const headIsComment = commentRegex.test(headLine) || headLine.trim() === "";

      if (!baseIsComment || !headIsComment) {
        commentOnlyDiff = false;
      }

      if (baseLine && !headLine) removedLines++;
      else if (!baseLine && headLine) addedLines++;
    }
  }

  if (addedLines > 0 || removedLines > 0) {
    if (commentOnlyDiff && addedLines > 0) {
      changes.push({
        level: "info",
        message: `\`${fileName}\`: comment or formatting changes (+${addedLines} lines)`,
      });
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function generateMarkdownReport(fileResults) {
  const lines = [];
  lines.push("## Schema Change Report");
  lines.push("");
  lines.push(`> Base: \`${options.base}\` → Head: \`${options.head}\``);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push("");

  let totalBreaking = 0;
  let totalNonBreaking = 0;
  let totalInfo = 0;

  if (fileResults.length === 0) {
    lines.push("_No schema file changes detected._");
    lines.push("");
    return lines.join("\n");
  }

  for (const result of fileResults) {
    const { file, changes } = result;
    if (changes.length === 0) continue;

    lines.push(`### \`${file}\``);
    lines.push("");

    const breaking = changes.filter((c) => c.level === "breaking");
    const nonBreaking = changes.filter((c) => c.level === "non-breaking");
    const info = changes.filter((c) => c.level === "info");

    if (breaking.length > 0) {
      lines.push("#### 🚨 Breaking Changes");
      lines.push("");
      for (const c of breaking) {
        lines.push(`- ${c.message}`);
      }
      lines.push("");
    }

    if (nonBreaking.length > 0) {
      lines.push("#### ✅ Non-Breaking Changes");
      lines.push("");
      for (const c of nonBreaking) {
        lines.push(`- ${c.message}`);
      }
      lines.push("");
    }

    if (info.length > 0) {
      lines.push("#### ℹ️ Info");
      lines.push("");
      for (const c of info) {
        lines.push(`- ${c.message}`);
      }
      lines.push("");
    }

    totalBreaking += breaking.length;
    totalNonBreaking += nonBreaking.length;
    totalInfo += info.length;
  }

  lines.push("---");
  lines.push("");
  lines.push(
    `**Summary**: 🚨 Breaking **${totalBreaking}** / ✅ Non-Breaking **${totalNonBreaking}** / ℹ️ Info **${totalInfo}**`,
  );
  lines.push("");

  if (totalBreaking > 0) {
    lines.push(
      "> ⚠️ **Breaking changes detected** — please include a migration note and changelog entry per the [Contract Freeze Checklist](docs/engineering/contract-freeze.md).",
    );
  } else if (totalNonBreaking > 0 || totalInfo > 0) {
    lines.push("> ✅ All changes are non-breaking or informational.");
  }

  lines.push("");
  return lines.join("\n");
}

function generateJsonReport(fileResults) {
  let totalBreaking = 0;
  let totalNonBreaking = 0;
  let totalInfo = 0;

  const files = fileResults.map(({ file, changes }) => {
    const breaking = changes.filter((c) => c.level === "breaking").length;
    const nonBreaking = changes.filter((c) => c.level === "non-breaking").length;
    const info = changes.filter((c) => c.level === "info").length;
    totalBreaking += breaking;
    totalNonBreaking += nonBreaking;
    totalInfo += info;
    return { file, breaking, non_breaking: nonBreaking, info, changes };
  });

  return {
    generated_at: new Date().toISOString(),
    base: options.base,
    head: options.head,
    summary: { breaking: totalBreaking, non_breaking: totalNonBreaking, info: totalInfo },
    files,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const changedFiles = detectChangedSchemaFiles();

  if (changedFiles.length === 0) {
    const emptyResults = [];
    if (options.json) {
      console.log(JSON.stringify(generateJsonReport(emptyResults), null, 2));
    } else {
      console.log(generateMarkdownReport(emptyResults));
    }
    process.exit(0);
  }

  const fileResults = [];

  for (const file of changedFiles) {
    const baseContent = getFileAt(options.base, file);
    const headContent = getFileAt(options.head, file);

    if (!baseContent && !headContent) continue;

    const changes = [];

    if (!baseContent) {
      // New file — all additions are non-breaking
      changes.push({
        level: "non-breaking",
        message: `\`${file}\`: new schema file added`,
      });
    } else if (!headContent) {
      // Deleted file — breaking
      changes.push({
        level: "breaking",
        message: `\`${file}\`: schema file removed`,
      });
    } else {
      // Parse and diff
      const baseSchemas = parseSchemaSource(baseContent);
      const headSchemas = parseSchemaSource(headContent);

      const structuralChanges = diffSchemas(baseSchemas, headSchemas, file);
      changes.push(...structuralChanges);

      // If no structural changes, check for info-level changes
      if (structuralChanges.length === 0) {
        const infoChanges = detectInfoChanges(baseContent, headContent, file);
        changes.push(...infoChanges);
      }
    }

    fileResults.push({ file, changes });
  }

  // Output
  const hasBreaking = fileResults.some((r) => r.changes.some((c) => c.level === "breaking"));

  if (options.json) {
    const report = generateJsonReport(fileResults);
    console.log(JSON.stringify(report, null, 2));
  } else {
    const report = generateMarkdownReport(fileResults);
    console.log(report);

    if (options.output) {
      writeFileSync(options.output, report, "utf-8");
    }
  }

  process.exit(hasBreaking ? 1 : 0);
}

main();
