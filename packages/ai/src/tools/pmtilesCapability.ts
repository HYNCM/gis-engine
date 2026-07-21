export const PMTilesCapabilityDecisionSchema = {
  type: "object",
  properties: {
    display: {
      type: "object",
      properties: {
        status: { type: "string", const: "go" },
        scope: { type: "string", const: "url-compatible-maplibre-vector-display" },
      },
      required: ["status", "scope"],
      additionalProperties: false,
    },
    load: {
      type: "object",
      properties: {
        status: { type: "string", const: "no-go" },
        scope: { type: "string", const: "runtime-archive-load" },
        blockerCode: { type: "string", const: "PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED" },
      },
      required: ["status", "scope", "blockerCode"],
      additionalProperties: false,
    },
    featureQuery: {
      type: "object",
      properties: {
        status: { type: "string", const: "no-go" },
        scope: { type: "string", const: "runtime-archive-feature-query" },
        blockerCode: { type: "string", const: "PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED" },
      },
      required: ["status", "scope", "blockerCode"],
      additionalProperties: false,
    },
    loadPlan: {
      type: "object",
      properties: {
        status: { type: "string", const: "go" },
        scope: { type: "string", const: "io-free-caller-metadata-preflight" },
      },
      required: ["status", "scope"],
      additionalProperties: false,
    },
    loadGates: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "archive-metadata",
          "columnar-directory-lookup",
          "offset-continuation",
          "internal-compression",
          "leaf-directory-traversal",
          "cancellation",
          "byte-budget",
          "range-budget",
          "cache-behavior",
          "resource-policy-before-io",
        ],
      },
    },
    featureQueryGates: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "query-semantics",
          "query-diagnostics",
          "adapter-boundary",
          "payload-free-evidence",
          "query-tests",
          "docs",
        ],
      },
    },
  },
  required: ["display", "load", "featureQuery", "loadPlan", "loadGates", "featureQueryGates"],
  additionalProperties: false,
} as const;
