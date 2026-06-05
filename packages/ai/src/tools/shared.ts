import { type Diagnostic } from "@gis-engine/engine";

export const DiagnosticCountsSchema = {
  type: "object",
  properties: {
    error: { type: "number" },
    warning: { type: "number" },
    info: { type: "number" }
  },
  required: ["error", "warning", "info"],
  additionalProperties: false
} as const;

export function countDiagnostics(diagnostics: Diagnostic[]): Record<Diagnostic["severity"], number> {
  return diagnostics.reduce<Record<Diagnostic["severity"], number>>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    zeroDiagnosticCounts()
  );
}

export function zeroDiagnosticCounts(): Record<Diagnostic["severity"], number> {
  return { error: 0, warning: 0, info: 0 };
}

export function stripNestedIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNestedIds) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "$id")
      .map(([key, entry]) => [key, stripNestedIds(entry)])
  ) as T;
}

export function createHeadlessContainer(): HTMLElement {
  return {} as HTMLElement;
}
