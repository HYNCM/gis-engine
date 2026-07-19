import {
  type Diagnostic,
  type PMTilesRuntimeSourcePlan,
  Scene3DStableRuntimeBlockerCodes,
  type SourcePMTilesQueryReadinessSummary,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { type GisEngineToolName, GisEngineToolNameSchema } from "../internal/mcpToolNames.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";
import { DiagnosticCountsSchema } from "./shared.js";

const exampleIds = [
  "basic-geojson",
  "ai-map-edit",
  "raster-basemap",
  "pmtiles-local",
  "vector-tile-url",
  "fill-extrusion-lite",
] as const;

export type ExampleId = (typeof exampleIds)[number];
type Scene3DStableRuntimeBlockerCode =
  (typeof Scene3DStableRuntimeBlockerCodes)[keyof typeof Scene3DStableRuntimeBlockerCodes];

const Scene3DStableRuntimeBlockerCodeSchema = {
  type: "string",
  enum: Object.values(Scene3DStableRuntimeBlockerCodes),
} as const;

const DeliveryStatusSchema = {
  type: "string",
  enum: ["ready", "blocked", "needs-confirmation", "follow-up-required"],
} as const;

const DeliverySectionIdSchema = {
  type: "string",
  enum: ["readiness", "files", "map-edits", "data-and-analysis", "scene-browsing"],
} as const;

const DeliveryConfirmationReasonSchema = {
  type: "string",
  enum: ["external-resource", "network-fetch", "archive-parsing", "worker-use", "file-write", "stable-scene3d-runtime"],
} as const;

const SourceReadinessStateSchema = {
  type: "string",
  enum: ["supported", "readiness-only", "blocked"],
} as const;

const SourceArchiveContractStateSchema = {
  type: "string",
  enum: ["explicit", "not-applicable", "not-checked"],
} as const;

const SourceArchiveContractSchema = {
  type: "object",
  properties: {
    state: SourceArchiveContractStateSchema,
    metadataFields: { type: "array", items: { type: "string" } },
    policyFields: { type: "array", items: { type: "string" } },
  },
  required: ["state", "metadataFields", "policyFields"],
  additionalProperties: false,
} as const;

const SourceContractKindSchema = {
  type: "string",
  enum: ["archive", "schema"],
} as const;

const SourceContractSchema = {
  type: "object",
  properties: {
    kind: SourceContractKindSchema,
    state: SourceArchiveContractStateSchema,
    metadataFields: { type: "array", items: { type: "string" } },
    policyFields: { type: "array", items: { type: "string" } },
  },
  required: ["kind", "state", "metadataFields", "policyFields"],
  additionalProperties: false,
} as const;

const SourceRuntimeLoadPlanSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ready", "metadata-required", "blocked"] },
    sourceLayerIds: { type: "array", items: { type: "string" } },
    diagnosticCounts: DiagnosticCountsSchema,
    requirements: {
      type: "object",
      properties: {
        mapLibreVectorSource: { type: "boolean", const: true },
        sourceLayerMetadata: { type: "boolean", const: true },
        rangeRequests: { type: "boolean", const: true },
        worker: { type: "boolean", const: true },
        archiveMetadata: { type: "boolean" },
        archiveParsing: { type: "boolean", const: false },
        featureQuery: { type: "boolean", const: false },
      },
      required: [
        "mapLibreVectorSource",
        "sourceLayerMetadata",
        "rangeRequests",
        "worker",
        "archiveMetadata",
        "archiveParsing",
        "featureQuery",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "sourceLayerIds", "diagnosticCounts", "requirements"],
  additionalProperties: false,
} as const;

const SourcePMTilesQueryEvidenceSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ready", "empty", "blocked"] },
    sourceLayerIds: { type: "array", items: { type: "string" } },
    layerIds: { type: "array", items: { type: "string" } },
    loaderContract: {
      type: "object",
      properties: {
        resourceAccess: { type: "string", const: "caller-owned" },
        cancellation: { type: "string", const: "caller-owned" },
        timeoutMs: { type: "number" },
        byteBudgetBytes: { type: "number" },
      },
      required: ["resourceAccess", "cancellation", "timeoutMs", "byteBudgetBytes"],
      additionalProperties: false,
    },
    diagnosticCounts: DiagnosticCountsSchema,
    requirements: {
      type: "object",
      properties: {
        callerSuppliedDecodedFeatures: { type: "boolean", const: true },
        archiveParsing: { type: "boolean", const: false },
        hiddenFetch: { type: "boolean", const: false },
        rangeRequests: { type: "boolean", const: false },
        worker: { type: "boolean", const: false },
        featurePayloadReturned: { type: "boolean", const: false },
      },
      required: [
        "callerSuppliedDecodedFeatures",
        "archiveParsing",
        "hiddenFetch",
        "rangeRequests",
        "worker",
        "featurePayloadReturned",
      ],
      additionalProperties: false,
    },
    summary: {
      type: "object",
      properties: {
        caseCount: { type: "number" },
        readyCaseCount: { type: "number" },
        emptyCaseCount: { type: "number" },
        blockedCaseCount: { type: "number" },
        matchedFeatureCount: { type: "number" },
        returnedFeatureCount: { type: "number" },
        resultTruncated: { type: "boolean" },
      },
      required: [
        "caseCount",
        "readyCaseCount",
        "emptyCaseCount",
        "blockedCaseCount",
        "matchedFeatureCount",
        "returnedFeatureCount",
        "resultTruncated",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "sourceLayerIds", "layerIds", "loaderContract", "diagnosticCounts", "requirements", "summary"],
  additionalProperties: false,
} as const;

const SourcePromotionCandidateFormatSchema = {
  type: "string",
  enum: ["pmtiles", "geoparquet", "flatgeobuf", "geotiff", "geozarr"],
} as const;

const SpatialQueryReadinessStateSchema = {
  type: "string",
  enum: ["not-requested", "ready", "blocked", "follow-up-required"],
} as const;

const SpatialQueryCaseReadinessStateSchema = {
  type: "string",
  enum: ["ready", "blocked"],
} as const;

const SpatialQueryCapabilityGateStatusSchema = {
  type: "string",
  enum: ["passed", "waived", "blocked"],
} as const;

const SpatialQueryEvidenceStatusSchema = {
  type: "string",
  enum: ["ready", "blocked", "not-requested"],
} as const;

const SpatialQueryOperationSchema = {
  type: "string",
  enum: ["point-query", "bbox-query"],
} as const;

export const ExampleAppDeliverySummarySchema = {
  type: "object",
  properties: {
    status: DeliveryStatusSchema,
    acceptance: {
      type: "object",
      properties: {
        state: DeliveryStatusSchema,
        ready: { type: "boolean" },
        blocked: { type: "boolean" },
        needsConfirmation: { type: "boolean" },
        followUpRequired: { type: "boolean" },
      },
      required: ["state", "ready", "blocked", "needsConfirmation", "followUpRequired"],
      additionalProperties: false,
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: DeliverySectionIdSchema,
          status: DeliveryStatusSchema,
          blockerCount: { type: "number" },
          confirmationRequired: { type: "boolean" },
          followUpCount: { type: "number" },
        },
        required: ["id", "status", "blockerCount", "confirmationRequired", "followUpCount"],
        additionalProperties: false,
      },
    },
    confirmations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          reason: DeliveryConfirmationReasonSchema,
          required: { type: "boolean" },
          target: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } },
        },
        required: ["reason", "required", "target"],
        additionalProperties: false,
      },
    },
    confirmationRequired: { type: "boolean" },
    followUps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          owner: { type: "string" },
          targetArtifact: { type: "string" },
          reason: { type: "string" },
          blockerCode: { type: "string" },
        },
        required: ["id", "owner", "targetArtifact", "reason"],
        additionalProperties: false,
      },
    },
    sourceReadiness: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          type: { type: "string" },
          state: SourceReadinessStateSchema,
          queryReady: { type: "boolean" },
          resourcePolicy: {
            type: "string",
            enum: ["passed", "blocked", "not-applicable", "not-checked"],
          },
          archiveContract: SourceArchiveContractSchema,
          sourceContract: SourceContractSchema,
          runtimeLoadPlan: SourceRuntimeLoadPlanSchema,
          queryEvidence: SourcePMTilesQueryEvidenceSchema,
          confirmationReasons: {
            type: "array",
            items: DeliveryConfirmationReasonSchema,
          },
          notes: { type: "array", items: { type: "string" } },
        },
        required: ["sourceId", "type", "state", "queryReady", "confirmationReasons", "notes"],
        additionalProperties: false,
      },
    },
    sourcePromotionCandidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
          format: SourcePromotionCandidateFormatSchema,
          state: SourceReadinessStateSchema,
          resourcePolicy: {
            type: "string",
            enum: ["passed", "blocked", "not-applicable", "not-checked"],
          },
          archiveContract: SourceArchiveContractSchema,
          sourceContract: SourceContractSchema,
          target: { type: "string" },
          exitCondition: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } },
          notes: { type: "array", items: { type: "string" } },
        },
        required: ["candidateId", "format", "state", "target", "exitCondition", "sourceIds", "notes"],
        additionalProperties: false,
      },
    },
    spatialQueryReadiness: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        state: SpatialQueryReadinessStateSchema,
        status: SpatialQueryEvidenceStatusSchema,
        capabilityGateStatus: SpatialQueryCapabilityGateStatusSchema,
        requiredQueries: { type: "array", items: { type: "string", enum: ["point", "bbox"] } },
        providedQueries: { type: "array", items: { type: "string" } },
        caseCount: { type: "number" },
        passedCaseCount: { type: "number" },
        failedCaseCount: { type: "number" },
        resultLimit: { type: "number" },
        resultTruncated: { type: "boolean" },
        blockerCount: { type: "number" },
        followUpCount: { type: "number" },
        followUpTaskIds: { type: "array", items: { type: "string" } },
        queryableLayerIds: { type: "array", items: { type: "string" } },
        queryableSourceIds: { type: "array", items: { type: "string" } },
        unsupportedSourceIds: { type: "array", items: { type: "string" } },
        missingSourceIds: { type: "array", items: { type: "string" } },
        hiddenLayerIds: { type: "array", items: { type: "string" } },
        blockedOperations: { type: "array", items: { type: "string" } },
        cases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              state: SpatialQueryCaseReadinessStateSchema,
              operation: SpatialQueryOperationSchema,
              layerIds: { type: "array", items: { type: "string" } },
              sourceIds: { type: "array", items: { type: "string" } },
              featureCount: { type: "number" },
              resultLimit: { type: "number" },
              resultTruncated: { type: "boolean" },
              fixtureHash: { type: "string" },
              diagnosticCounts: DiagnosticCountsSchema,
            },
            required: [
              "id",
              "state",
              "operation",
              "layerIds",
              "sourceIds",
              "featureCount",
              "resultLimit",
              "resultTruncated",
              "fixtureHash",
              "diagnosticCounts",
            ],
            additionalProperties: false,
          },
        },
      },
      required: [
        "requested",
        "state",
        "status",
        "capabilityGateStatus",
        "requiredQueries",
        "providedQueries",
        "caseCount",
        "passedCaseCount",
        "failedCaseCount",
        "resultLimit",
        "resultTruncated",
        "blockerCount",
        "followUpCount",
        "followUpTaskIds",
        "queryableLayerIds",
        "queryableSourceIds",
        "unsupportedSourceIds",
        "missingSourceIds",
        "hiddenLayerIds",
        "blockedOperations",
        "cases",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "status",
    "acceptance",
    "sections",
    "confirmations",
    "confirmationRequired",
    "followUps",
    "sourceReadiness",
    "spatialQueryReadiness",
  ],
  additionalProperties: false,
} as const;

export const ExampleAppGenerationEvidenceSummarySchema = {
  type: "object",
  properties: {
    promptHash: { type: "string" },
    status: { type: "string", enum: ["ready", "blocked"] },
    delivery: ExampleAppDeliverySummarySchema,
    targetDomains: {
      type: "array",
      items: { type: "string", enum: ["feature-display", "spatial-analysis", "scene-browsing"] },
    },
    toolSequence: {
      type: "array",
      items: GisEngineToolNameSchema,
    },
    diagnosticCounts: DiagnosticCountsSchema,
    command: {
      type: "object",
      properties: {
        usedApplyCommands: { type: "boolean" },
        commandCount: { type: "number" },
        committed: { type: "boolean" },
        rolledBack: { type: "boolean" },
      },
      required: ["usedApplyCommands", "commandCount", "committed", "rolledBack"],
      additionalProperties: false,
    },
    planner: {
      type: "object",
      properties: {
        provided: { type: "boolean" },
        confidenceLevel: { type: "string", enum: ["high", "medium", "low", "unknown"] },
        unsupportedIntentCount: { type: "number" },
      },
      required: ["provided", "confidenceLevel", "unsupportedIntentCount"],
      additionalProperties: false,
    },
    spatialQuery: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        ready: { type: "boolean" },
        status: { type: "string", enum: ["ready", "blocked", "not-requested"] },
        caseCount: { type: "number" },
        blockedOperations: { type: "array", items: { type: "string" } },
      },
      required: ["requested", "ready", "status", "caseCount", "blockedOperations"],
      additionalProperties: false,
    },
    sceneBrowsing: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        status: { type: "string", enum: ["experimental", "blocked", "not-requested"] },
        extensionPresent: { type: "boolean" },
        stableViewMode: { type: "boolean", const: false },
        runtimeSupported: { type: "boolean", const: false },
        stableRuntimeBlocked: { type: "boolean", const: true },
        state: { type: "string", enum: ["extension-only", "blocked", "not-requested"] },
        sourceCount: { type: "number" },
        layerCount: { type: "number" },
        sourceIds: { type: "array", items: { type: "string" } },
        layerIds: { type: "array", items: { type: "string" } },
        pickableLayerCount: { type: "number" },
        mockSnapshotPassed: { type: "boolean" },
        mockQueryPickCount: { type: "number" },
        stableRuntimeBlockerCodes: {
          type: "array",
          items: Scene3DStableRuntimeBlockerCodeSchema,
        },
      },
      required: [
        "requested",
        "status",
        "extensionPresent",
        "stableViewMode",
        "runtimeSupported",
        "stableRuntimeBlocked",
        "state",
        "sourceCount",
        "layerCount",
        "sourceIds",
        "layerIds",
        "pickableLayerCount",
        "mockSnapshotPassed",
        "mockQueryPickCount",
        "stableRuntimeBlockerCodes",
      ],
      additionalProperties: false,
    },
    snapshot: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        renderer: { type: "string", enum: ["maplibre", "mock"] },
        passed: { type: "boolean" },
      },
      required: ["requested", "renderer", "passed"],
      additionalProperties: false,
    },
    export: {
      type: "object",
      properties: {
        ready: { type: "boolean" },
        sourceCount: { type: "number" },
        layerCount: { type: "number" },
      },
      required: ["ready", "sourceCount", "layerCount"],
      additionalProperties: false,
    },
  },
  required: [
    "status",
    "delivery",
    "targetDomains",
    "toolSequence",
    "diagnosticCounts",
    "command",
    "planner",
    "spatialQuery",
    "sceneBrowsing",
    "snapshot",
    "export",
  ],
  additionalProperties: false,
} as const;

export const ExportExampleAppToolInputSchema = {
  type: "object",
  properties: {
    exampleId: { type: "string", enum: exampleIds },
    generationEvidence: ExampleAppGenerationEvidenceSummarySchema,
  },
  required: ["exampleId"],
  additionalProperties: false,
} as const;

export interface ExportExampleAppToolInput {
  exampleId: ExampleId;
  generationEvidence?: ExampleAppGenerationEvidenceSummary;
}

export interface ExampleAppGenerationEvidenceSummary {
  promptHash?: string;
  status: "ready" | "blocked";
  delivery: ExampleAppDeliverySummary;
  targetDomains: Array<"feature-display" | "spatial-analysis" | "scene-browsing">;
  toolSequence: GisEngineToolName[];
  diagnosticCounts: Record<Diagnostic["severity"], number>;
  command: {
    usedApplyCommands: boolean;
    commandCount: number;
    committed: boolean;
    rolledBack: boolean;
  };
  planner: {
    provided: boolean;
    confidenceLevel: "high" | "medium" | "low" | "unknown";
    unsupportedIntentCount: number;
  };
  spatialQuery: {
    requested: boolean;
    ready: boolean;
    status: "ready" | "blocked" | "not-requested";
    caseCount: number;
    blockedOperations: string[];
  };
  sceneBrowsing: {
    requested: boolean;
    status: "experimental" | "blocked" | "not-requested";
    extensionPresent: boolean;
    stableViewMode: false;
    runtimeSupported: false;
    stableRuntimeBlocked: true;
    state: "extension-only" | "blocked" | "not-requested";
    sourceCount: number;
    layerCount: number;
    sourceIds: string[];
    layerIds: string[];
    pickableLayerCount: number;
    mockSnapshotPassed: boolean;
    mockQueryPickCount: number;
    stableRuntimeBlockerCodes: Scene3DStableRuntimeBlockerCode[];
  };
  snapshot: {
    requested: boolean;
    renderer: "maplibre" | "mock";
    passed: boolean;
  };
  export: {
    ready: boolean;
    sourceCount: number;
    layerCount: number;
  };
}

export interface ExampleAppDeliverySummary {
  status: "ready" | "blocked" | "needs-confirmation" | "follow-up-required";
  acceptance: {
    state: "ready" | "blocked" | "needs-confirmation" | "follow-up-required";
    ready: boolean;
    blocked: boolean;
    needsConfirmation: boolean;
    followUpRequired: boolean;
  };
  sections: Array<{
    id: "readiness" | "files" | "map-edits" | "data-and-analysis" | "scene-browsing";
    status: "ready" | "blocked" | "needs-confirmation" | "follow-up-required";
    blockerCount: number;
    confirmationRequired: boolean;
    followUpCount: number;
  }>;
  confirmations: Array<{
    reason:
      | "external-resource"
      | "network-fetch"
      | "archive-parsing"
      | "worker-use"
      | "file-write"
      | "stable-scene3d-runtime";
    required: boolean;
    target: string;
    sourceIds?: string[];
  }>;
  confirmationRequired: boolean;
  followUps: Array<{
    id: string;
    owner: string;
    targetArtifact: string;
    reason: string;
    blockerCode?: string;
  }>;
  sourceReadiness: Array<{
    sourceId: string;
    type: string;
    state: "supported" | "readiness-only" | "blocked";
    queryReady: boolean;
    resourcePolicy?: "passed" | "blocked" | "not-applicable" | "not-checked";
    archiveContract?: {
      state: "explicit" | "not-applicable" | "not-checked";
      metadataFields: string[];
      policyFields: string[];
    };
    sourceContract?: {
      kind: "archive" | "schema";
      state: "explicit" | "not-applicable" | "not-checked";
      metadataFields: string[];
      policyFields: string[];
    };
    runtimeLoadPlan?: {
      status: "ready" | "metadata-required" | "blocked";
      sourceLayerIds: string[];
      diagnosticCounts: Record<Diagnostic["severity"], number>;
      requirements: PMTilesRuntimeSourcePlan["requirements"];
    };
    queryEvidence?: SourcePMTilesQueryReadinessSummary;
    confirmationReasons: Array<
      "external-resource" | "network-fetch" | "archive-parsing" | "worker-use" | "file-write" | "stable-scene3d-runtime"
    >;
    notes: string[];
  }>;
  sourcePromotionCandidates?: Array<{
    candidateId: string;
    format: "pmtiles" | "geoparquet" | "flatgeobuf" | "geotiff" | "geozarr";
    state: "supported" | "readiness-only" | "blocked";
    resourcePolicy?: "passed" | "blocked" | "not-applicable" | "not-checked";
    archiveContract?: {
      state: "explicit" | "not-applicable" | "not-checked";
      metadataFields: string[];
      policyFields: string[];
    };
    sourceContract?: {
      kind: "archive" | "schema";
      state: "explicit" | "not-applicable" | "not-checked";
      metadataFields: string[];
      policyFields: string[];
    };
    target: string;
    exitCondition: string;
    sourceIds: string[];
    notes: string[];
  }>;
  spatialQueryReadiness: {
    requested: boolean;
    state: "not-requested" | "ready" | "blocked" | "follow-up-required";
    status: "ready" | "blocked" | "not-requested";
    capabilityGateStatus: "passed" | "waived" | "blocked";
    requiredQueries: Array<"point" | "bbox">;
    providedQueries: string[];
    caseCount: number;
    passedCaseCount: number;
    failedCaseCount: number;
    resultLimit: number;
    resultTruncated: boolean;
    blockerCount: number;
    followUpCount: number;
    followUpTaskIds: string[];
    queryableLayerIds: string[];
    queryableSourceIds: string[];
    unsupportedSourceIds: string[];
    missingSourceIds: string[];
    hiddenLayerIds: string[];
    blockedOperations: string[];
    cases: Array<{
      id: string;
      state: "ready" | "blocked";
      operation: "point-query" | "bbox-query";
      layerIds: string[];
      sourceIds: string[];
      featureCount: number;
      resultLimit: number;
      resultTruncated: boolean;
      fixtureHash: string;
      diagnosticCounts: Record<Diagnostic["severity"], number>;
    }>;
  };
}

export interface ExampleAppFile {
  path: string;
  role: "spec" | "data" | "commands" | "script";
  mediaType: string;
  required: boolean;
  description: string;
}

export interface ExampleAppManifest {
  exampleId: ExampleId;
  title: string;
  description: string;
  writesFiles: false;
  files: ExampleAppFile[];
  notes: string[];
  generationEvidence?: ExampleAppGenerationEvidenceSummary;
}

export type ExportExampleAppToolResponse =
  | { ok: true; result: ExampleAppManifest; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const manifests: Record<ExampleId, ExampleAppManifest> = {
  "basic-geojson": {
    exampleId: "basic-geojson",
    title: "Basic GeoJSON",
    description: "A minimal point layer backed by a local GeoJSON file.",
    writesFiles: false,
    files: [
      {
        path: "examples/basic-geojson/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec for the point layer example.",
      },
      {
        path: "examples/basic-geojson/data/points.geojson",
        role: "data",
        mediaType: "application/geo+json",
        required: true,
        description: "Local point features used by the GeoJSON source.",
      },
      {
        path: "examples/basic-geojson/validate.ts",
        role: "script",
        mediaType: "text/typescript",
        required: false,
        description: "Validation helper for the example MapSpec.",
      },
    ],
    notes: ["The manifest is descriptive only; export_example_app does not create or modify files."],
  },
  "ai-map-edit": {
    exampleId: "ai-map-edit",
    title: "AI Map Edit",
    description: "A command replay example that mutates a base MapSpec.",
    writesFiles: false,
    files: [
      {
        path: "examples/ai-map-edit/before.map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "Initial MapSpec before command replay.",
      },
      {
        path: "examples/ai-map-edit/commands.json",
        role: "commands",
        mediaType: "application/json",
        required: true,
        description: "MapCommands applied to the initial spec.",
      },
      {
        path: "examples/ai-map-edit/audit.commands.json",
        role: "commands",
        mediaType: "application/json",
        required: false,
        description: "Optional command replay example with author, reason, timestamp, and prompt-hash provenance.",
      },
    ],
    notes: ["The manifest is descriptive only; export_example_app does not create or modify files."],
  },
  "raster-basemap": {
    exampleId: "raster-basemap",
    title: "Raster Basemap",
    description: "A local raster tile template rendered below a GeoJSON overlay.",
    writesFiles: false,
    files: [
      {
        path: "examples/raster-basemap/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a raster basemap source and overlay layer.",
      },
    ],
    notes: ["The raster URL is a tile template path; tests validate and transform it without fetching tiles."],
  },
  "pmtiles-local": {
    exampleId: "pmtiles-local",
    title: "PMTiles Local",
    description: "A PMTiles URL-path example for transformer and validation coverage.",
    writesFiles: false,
    files: [
      {
        path: "examples/pmtiles-local/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a local PMTiles URL path.",
      },
    ],
    notes: [
      "PMTiles coverage is URL-compatible display and readiness evidence only; it does not parse archives, perform hidden fetches, start workers, or promote runtime feature-query support.",
    ],
  },
  "vector-tile-url": {
    exampleId: "vector-tile-url",
    title: "Vector Tile URL",
    description: "A generic vector tile URL-template example with source-layer metadata and v0.2 expressions.",
    writesFiles: false,
    files: [
      {
        path: "examples/vector-tile-url/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a local vector tile URL template.",
      },
    ],
    notes: [
      "Vector tile coverage validates URL templates, source-layer metadata, expressions, and snapshot contracts without requiring network tile fetches.",
    ],
  },
  "fill-extrusion-lite": {
    exampleId: "fill-extrusion-lite",
    title: "Fill Extrusion Lite",
    description: "An experimental 2.5D MapSpec that maps to MapLibre fill-extrusion when explicitly gated.",
    writesFiles: false,
    files: [
      {
        path: "examples/fill-extrusion-lite/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with 2.5D capability gates and a fill-extrusion-lite layer.",
      },
    ],
    notes: ["fill-extrusion-lite is experimental and requires capabilities.experimental plus a 2.5D view request."],
  },
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(ExportExampleAppToolInputSchema);

export function exportExampleAppTool(input: unknown): ExportExampleAppToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid export_example_app tool input."),
    };
  }

  const typedInput = input as ExportExampleAppToolInput;
  const result = structuredClone(manifests[typedInput.exampleId]);
  if (typedInput.generationEvidence) {
    result.generationEvidence = structuredClone(typedInput.generationEvidence);
    result.notes.push(
      "Generation evidence summary is caller-provided metadata; export_example_app still writes no files.",
    );
  }

  return {
    ok: true,
    result,
    diagnostics: [],
  };
}
