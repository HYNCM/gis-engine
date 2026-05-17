import { validateSpec, type CapabilityReport, type Diagnostic, type MapSpec } from "@gis-engine/engine";

export interface ContextSummaryInput {
  spec: MapSpec;
  capabilities?: CapabilityReport;
}

export interface ContextSummary {
  id?: string;
  revision?: string;
  view: MapSpec["view"];
  sources: Array<{
    id: string;
    type: string;
  }>;
  layers: Array<{
    id: string;
    type: string;
    source?: string;
    visibility: "visible" | "none";
  }>;
  validation: {
    valid: boolean;
    diagnosticCounts: Record<Diagnostic["severity"], number>;
  };
  capabilities?: CapabilityReport;
}

export function getContextSummary(input: ContextSummaryInput): ContextSummary {
  const report = validateSpec(input.spec);
  return {
    ...(input.spec.id ? { id: input.spec.id } : {}),
    ...(input.spec.revision ? { revision: input.spec.revision } : {}),
    view: input.spec.view,
    sources: Object.entries(input.spec.sources).map(([id, source]) => ({
      id,
      type: source.type
    })),
    layers: input.spec.layers.map((layer) => ({
      id: layer.id,
      type: layer.type,
      ...(layer.source ? { source: layer.source } : {}),
      visibility: layer.layout?.visibility === "none" ? "none" : "visible"
    })),
    validation: {
      valid: report.valid,
      diagnosticCounts: countDiagnostics(report.diagnostics)
    },
    ...(input.capabilities ? { capabilities: input.capabilities } : {})
  };
}

function countDiagnostics(diagnostics: Diagnostic[]): Record<Diagnostic["severity"], number> {
  return diagnostics.reduce<Record<Diagnostic["severity"], number>>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 }
  );
}
