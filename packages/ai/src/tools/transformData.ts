import type { Diagnostic } from "@gis-engine/engine";
import { DiagnosticCodes } from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const TransformDataToolInputSchema = {
  type: "object",
  properties: {
    geojson: {
      type: "object",
      description: "Inline GeoJSON FeatureCollection to transform.",
    },
    operations: {
      type: "array",
      description: "Ordered list of transform operations to apply.",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["filter", "aggregate", "select", "sort", "rename"],
            description: "Operation type.",
          },
          property: {
            type: "string",
            description: "Target property name (used by filter, aggregate, sort, rename).",
          },
          operator: {
            type: "string",
            enum: ["==", "!=", ">", "<", ">=", "<=", "contains", "exists"],
            description: "Comparison operator for filter operations.",
          },
          value: {
            description: "Comparison value for filter operations.",
          },
          groupBy: {
            type: "string",
            description: "Property to group by for aggregate operations.",
          },
          aggregation: {
            type: "string",
            enum: ["count", "sum", "avg", "min", "max"],
            description: "Aggregation function for aggregate operations.",
          },
          properties: {
            type: "array",
            items: { type: "string" },
            description: "List of property names for select operations.",
          },
          direction: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort direction.",
          },
          newName: {
            type: "string",
            description: "New property name for rename operations.",
          },
        },
        required: ["type"],
        additionalProperties: false,
      },
    },
  },
  required: ["geojson", "operations"],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransformDataToolInput {
  geojson: GeoJsonFeatureCollection;
  operations: TransformOperation[];
}

interface GeoJsonFeatureCollection {
  type: string;
  features?: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: "Feature";
  geometry?: Record<string, unknown>;
  properties?: Record<string, unknown> | null;
}

type TransformOperation = FilterOperation | AggregateOperation | SelectOperation | SortOperation | RenameOperation;

interface FilterOperation {
  type: "filter";
  property: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "exists";
  value?: unknown;
}

interface AggregateOperation {
  type: "aggregate";
  groupBy: string;
  property?: string;
  aggregation: "count" | "sum" | "avg" | "min" | "max";
}

interface SelectOperation {
  type: "select";
  properties: string[];
}

interface SortOperation {
  type: "sort";
  property: string;
  direction?: "asc" | "desc";
}

interface RenameOperation {
  type: "rename";
  property: string;
  newName: string;
}

export interface TransformDataResult {
  operationCount: number;
  inputFeatureCount: number;
  outputFeatureCount: number;
  output: GeoJsonFeatureCollection;
  aggregations?: AggregationResult[];
  diagnostics: Diagnostic[];
}

export interface AggregationResult {
  groupBy: string;
  aggregation: string;
  property?: string;
  groups: Array<{
    key: string;
    value: number;
    count: number;
  }>;
}

// ---------------------------------------------------------------------------
// Tool entry
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(TransformDataToolInputSchema);

export function transformDataTool(rawInput: unknown): {
  ok: boolean;
  result?: TransformDataResult;
  diagnostics?: Diagnostic[];
} {
  if (!validateInput(rawInput)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid transform_data tool input."),
    };
  }

  const input = rawInput as TransformDataToolInput;
  const result = applyTransforms(input);
  return { ok: true, result };
}

// ---------------------------------------------------------------------------
// Transform engine
// ---------------------------------------------------------------------------

function applyTransforms(input: TransformDataToolInput): TransformDataResult {
  const diagnostics: Diagnostic[] = [];
  const features = extractFeatures(input.geojson);
  const inputFeatureCount = features.length;
  const aggregations: AggregationResult[] = [];

  if (features.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.QueryEmptyResult,
      message: "No features found in the provided GeoJSON data.",
      path: "/geojson",
    });
  }

  let currentFeatures = [...features];

  for (let i = 0; i < input.operations.length; i++) {
    const operation = input.operations[i];
    if (!operation) continue;

    switch (operation.type) {
      case "filter":
        currentFeatures = applyFilter(currentFeatures, operation, diagnostics, i);
        break;
      case "aggregate": {
        const aggResult = applyAggregate(currentFeatures, operation, diagnostics, i);
        aggregations.push(aggResult);
        // Aggregate produces summary data, not features — features unchanged
        break;
      }
      case "select":
        currentFeatures = applySelect(currentFeatures, operation);
        break;
      case "sort":
        currentFeatures = applySort(currentFeatures, operation);
        break;
      case "rename":
        currentFeatures = applyRename(currentFeatures, operation, diagnostics, i);
        break;
    }
  }

  const output: GeoJsonFeatureCollection = {
    type: "FeatureCollection",
    features: currentFeatures,
  };

  return {
    operationCount: input.operations.length,
    inputFeatureCount,
    outputFeatureCount: currentFeatures.length,
    output,
    ...(aggregations.length > 0 ? { aggregations } : {}),
    diagnostics,
  };
}

function extractFeatures(geojson: GeoJsonFeatureCollection): GeoJsonFeature[] {
  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
    return geojson.features.filter((f) => f?.type === "Feature");
  }
  return [];
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

function applyFilter(
  features: GeoJsonFeature[],
  op: FilterOperation,
  diagnostics: Diagnostic[],
  index: number,
): GeoJsonFeature[] {
  if (!op.property) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: `Operation[${index}]: filter requires a "property" field.`,
      path: `/operations/${index}`,
    });
    return features;
  }

  return features.filter((feature) => {
    const props = feature.properties ?? {};
    const value = props[op.property];

    switch (op.operator) {
      case "==":
        return value === op.value;
      case "!=":
        return value !== op.value;
      case ">":
        return typeof value === "number" && typeof op.value === "number" && value > op.value;
      case "<":
        return typeof value === "number" && typeof op.value === "number" && value < op.value;
      case ">=":
        return typeof value === "number" && typeof op.value === "number" && value >= op.value;
      case "<=":
        return typeof value === "number" && typeof op.value === "number" && value <= op.value;
      case "contains":
        return typeof value === "string" && typeof op.value === "string" && value.includes(op.value);
      case "exists":
        return value !== undefined && value !== null;
      default:
        return true;
    }
  });
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

function applyAggregate(
  features: GeoJsonFeature[],
  op: AggregateOperation,
  diagnostics: Diagnostic[],
  index: number,
): AggregationResult {
  if (!op.groupBy) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: `Operation[${index}]: aggregate requires a "groupBy" field.`,
      path: `/operations/${index}`,
    });
    return { groupBy: "", aggregation: op.aggregation ?? "count", groups: [] };
  }

  const groups = new Map<string, { values: number[]; count: number }>();

  for (const feature of features) {
    const props = feature.properties ?? {};
    const key = String(props[op.groupBy] ?? "null");
    let group = groups.get(key);
    if (!group) {
      group = { values: [], count: 0 };
      groups.set(key, group);
    }
    group.count++;

    if (op.property && op.aggregation !== "count") {
      const numValue = props[op.property];
      if (typeof numValue === "number" && Number.isFinite(numValue)) {
        group.values.push(numValue);
      }
    }
  }

  const groupEntries: Array<{ key: string; value: number; count: number }> = [];

  for (const [key, group] of groups) {
    let value = group.count;

    if (op.aggregation === "sum") {
      value = group.values.reduce((sum, v) => sum + v, 0);
    } else if (op.aggregation === "avg") {
      value = group.values.length > 0 ? group.values.reduce((sum, v) => sum + v, 0) / group.values.length : 0;
    } else if (op.aggregation === "min") {
      value = group.values.length > 0 ? Math.min(...group.values) : 0;
    } else if (op.aggregation === "max") {
      value = group.values.length > 0 ? Math.max(...group.values) : 0;
    }

    groupEntries.push({ key, value, count: group.count });
  }

  return {
    groupBy: op.groupBy,
    aggregation: op.aggregation ?? "count",
    ...(op.property ? { property: op.property } : {}),
    groups: groupEntries.sort((a, b) => a.key.localeCompare(b.key)),
  };
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

function applySelect(features: GeoJsonFeature[], op: SelectOperation): GeoJsonFeature[] {
  if (!op.properties || op.properties.length === 0) return features;

  const propertySet = new Set(op.properties);

  return features.map((feature) => {
    const props = feature.properties ?? {};
    const filteredProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (propertySet.has(key)) {
        filteredProps[key] = value;
      }
    }
    return {
      type: "Feature",
      ...(feature.geometry !== undefined ? { geometry: feature.geometry } : {}),
      properties: filteredProps,
    };
  });
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

function applySort(features: GeoJsonFeature[], op: SortOperation): GeoJsonFeature[] {
  if (!op.property) return features;

  const direction = op.direction === "desc" ? -1 : 1;
  const sorted = [...features];

  sorted.sort((a, b) => {
    const aVal = (a.properties ?? {})[op.property];
    const bVal = (b.properties ?? {})[op.property];

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * direction;
    }

    return String(aVal).localeCompare(String(bVal)) * direction;
  });

  return sorted;
}

// ---------------------------------------------------------------------------
// Rename
// ---------------------------------------------------------------------------

function applyRename(
  features: GeoJsonFeature[],
  op: RenameOperation,
  diagnostics: Diagnostic[],
  index: number,
): GeoJsonFeature[] {
  if (!op.property || !op.newName) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: `Operation[${index}]: rename requires "property" and "newName" fields.`,
      path: `/operations/${index}`,
    });
    return features;
  }

  return features.map((feature) => {
    const props = feature.properties ?? {};
    if (!(op.property in props)) return feature;

    const newProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      newProps[key === op.property ? op.newName : key] = value;
    }

    return {
      type: "Feature",
      ...(feature.geometry !== undefined ? { geometry: feature.geometry } : {}),
      properties: newProps,
    };
  });
}
