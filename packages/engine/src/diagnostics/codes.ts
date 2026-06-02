export const DiagnosticCodes = {
  SpecUnknownField: "SPEC.UNKNOWN_FIELD",
  SpecInvalidVersion: "SPEC.INVALID_VERSION",
  SpecInvalidType: "SPEC.INVALID_TYPE",
  SpecMissingField: "SPEC.MISSING_FIELD",
  SourceNotFound: "SRC.NOT_FOUND",
  LayerDuplicateId: "LAYER.DUPLICATE_ID",
  LayerNotFound: "LAYER.NOT_FOUND",
  LayerSourceMissing: "LAYER.SOURCE_MISSING",
  LayerSourceIncompatible: "LAYER.SOURCE_INCOMPATIBLE",
  LayerZoomRangeInvalid: "LAYER.ZOOM_RANGE_INVALID",
  ExpressionTypeMismatch: "EXPR.TYPE_MISMATCH",
  ExpressionUnknownOperator: "EXPR.UNKNOWN_OPERATOR",
  ExpressionInvalidArity: "EXPR.INVALID_ARITY",
  ExpressionInvalidColor: "EXPR.INVALID_COLOR",
  ExpressionPropertyUnknown: "EXPR.PROPERTY_UNKNOWN",
  ViewOutOfDataBounds: "VIEW.OUT_OF_DATA_BOUNDS",
  RenderAdapterError: "RENDER.ADAPTER_ERROR",
  RenderDestroyed: "RENDER.DESTROYED",
  SnapshotBlankCanvas: "SNAPSHOT.BLANK_CANVAS",
  SnapshotResourcePending: "SNAPSHOT.RESOURCE_PENDING",
  CapabilityUnsupported: "CAPABILITY.UNSUPPORTED",
  CommandInvalidPatch: "COMMAND.INVALID_PATCH",
  CommandUnsupported: "COMMAND.UNSUPPORTED",
  ConflictBaseRevision: "CONFLICT.BASE_REVISION",
  MigrationUnsupportedVersion: "MIGRATION.UNSUPPORTED_VERSION",
  SecurityUrlBlocked: "SECURITY.URL_BLOCKED",
  SecurityResourceTimeout: "SECURITY.RESOURCE_TIMEOUT",
  SecurityResourceTooLarge: "SECURITY.RESOURCE_TOO_LARGE",
  SecurityUnsupportedAssetType: "SECURITY.UNSUPPORTED_ASSET_TYPE",
  GeoInvalidCoordinates: "GEO.INVALID_COORDINATES",
  GeoEmptyBbox: "GEO.EMPTY_BBOX"
} as const;

export const Scene3DStableRuntimeBlockerCodes = {
  ViewMode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
  Renderer: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
  Dimensions: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"
} as const;

export type DiagnosticCode = (typeof DiagnosticCodes)[keyof typeof DiagnosticCodes];
export type Scene3DStableRuntimeBlockerCode =
  (typeof Scene3DStableRuntimeBlockerCodes)[keyof typeof Scene3DStableRuntimeBlockerCodes];
