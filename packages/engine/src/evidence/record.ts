import { createHash } from "node:crypto";
import { canonicalStringify } from "./canonical-stringify.js";

/**
 * Node-only hashing entry. Reachable through `@gis-engine/engine/evidence`, never from the
 * browser-facing root barrel, because `node:crypto` must stay out of bundleable engine code.
 */
export function canonicalHash(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalStringify(value)).digest("hex")}`;
}
