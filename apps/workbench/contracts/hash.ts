import { createHash } from "node:crypto";
import type { WorkbenchPlan } from "./schemas.js";

const PLAN_HASH_FIELDS = [
  "schemaVersion",
  "id",
  "goal",
  "baseRevision",
  "promptHash",
  "commands",
  "affectedPaths",
  "resourceRequests",
  "unsupportedIntents",
  "diagnostics",
  "createdAt",
] as const;

export function createWorkbenchCanonicalHash(value: unknown): string {
  return sha256(stableStringify(value));
}

export function createWorkbenchPromptHash(prompt: string): string {
  return sha256(prompt);
}

export function createWorkbenchPlanHash(plan: WorkbenchPlan | Readonly<Record<string, unknown>>): string {
  const record = plan as Readonly<Record<string, unknown>>;
  const canonicalPlan = Object.fromEntries(PLAN_HASH_FIELDS.map((field) => [field, record[field]]));
  return createWorkbenchCanonicalHash(canonicalPlan);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
