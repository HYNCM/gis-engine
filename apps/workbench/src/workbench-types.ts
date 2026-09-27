export interface Diagnostic {
  code: string;
  severity: string;
  path?: string;
  message: string;
}

export interface WorkbenchProjectState {
  project: {
    id: string;
    name: string;
    currentRevision: string;
    telemetryConsent: boolean;
    provider: { kind: "mock" | "openai-compatible"; profileId?: string; model?: string };
  };
  spec: Record<string, unknown>;
  history: Array<{
    revision: string;
    previousRevision: string | null;
    kind: "create" | "apply" | "restore";
    createdAt: string;
  }>;
  exportReceipts?: ExportReceipt[];
}

export interface WorkbenchPlanResult {
  plan: {
    id: string;
    goal: string;
    baseRevision: string;
    promptHash: string;
    commands: Array<Record<string, unknown>>;
    affectedPaths: string[];
    resourceRequests: Array<{ kind: string; resource: string; confirmed: boolean }>;
    unsupportedIntents: string[];
    diagnostics: Diagnostic[];
  };
  planHash: string;
}

export interface WorkbenchPreviewResult {
  planHash: string;
  baseRevision: string;
  previewRevision: string;
  canApply: boolean;
  affectedPaths: string[];
  diff: { added: string[]; removed: string[]; modified: string[]; unchanged: string[] } | null;
  diagnostics: Diagnostic[];
  snapshot: { beforeHash: string; afterHash: string; reversible: boolean };
  spec: Record<string, unknown>;
}

export interface DataInspection {
  kind: string;
  bytes: number;
  featureCount?: number;
  geometryTypes?: string[];
  bounds?: [number, number, number, number];
  propertySchema?: Array<{ name: string; types: string[] }>;
}

export interface ExportPreview {
  previewHash: string;
  targetRelativePath: string;
  files: Array<{ path: string; role: string; bytes: number; sha256: string; collision: boolean }>;
  diagnostics: Diagnostic[];
}

export interface ExportReceipt {
  projectId?: string;
  baseRevision?: string;
  specHash?: string;
  previewHash: string;
  targetRelativePath: string;
  writtenFiles: Array<{ path: string; bytes: number; sha256: string }>;
  manifestHash: string;
}
