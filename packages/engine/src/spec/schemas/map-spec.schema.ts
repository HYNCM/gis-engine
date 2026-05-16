import { Type, type Static } from "@sinclair/typebox";

const JsonValueSchema = Type.Unknown();

const CapabilityRequestSchema = Type.Object(
  {
    dimensions: Type.Optional(Type.Array(Type.Union([Type.Literal("2d"), Type.Literal("2_5d"), Type.Literal("3d")]))),
    renderer: Type.Optional(Type.Union([Type.Literal("maplibre"), Type.Literal("webgl2-lite"), Type.Literal("scene3d")])),
    experimental: Type.Optional(Type.Array(Type.String()))
  },
  { additionalProperties: false }
);

const ViewSpecSchema = Type.Object(
  {
    mode: Type.Optional(Type.Union([Type.Literal("map2d"), Type.Literal("map2_5d"), Type.Literal("scene3d")])),
    center: Type.Optional(Type.Tuple([Type.Number(), Type.Number()])),
    zoom: Type.Optional(Type.Number()),
    bearing: Type.Optional(Type.Number()),
    pitch: Type.Optional(Type.Number()),
    bounds: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()]))
  },
  { additionalProperties: false }
);

const GeoJsonSourceSchema = Type.Object(
  {
    type: Type.Literal("geojson"),
    data: Type.Union([JsonValueSchema, Type.String()])
  },
  { additionalProperties: false }
);

const RasterSourceSchema = Type.Object(
  {
    type: Type.Literal("raster"),
    tiles: Type.Array(Type.String()),
    tileSize: Type.Optional(Type.Number()),
    minzoom: Type.Optional(Type.Number()),
    maxzoom: Type.Optional(Type.Number()),
    attribution: Type.Optional(Type.String())
  },
  { additionalProperties: false }
);

const PmtilesSourceSchema = Type.Object(
  {
    type: Type.Literal("pmtiles"),
    url: Type.String(),
    minzoom: Type.Optional(Type.Number()),
    maxzoom: Type.Optional(Type.Number()),
    attribution: Type.Optional(Type.String())
  },
  { additionalProperties: false }
);

export const SourceSpecSchema = Type.Union([GeoJsonSourceSchema, RasterSourceSchema, PmtilesSourceSchema]);

export const LayerSpecSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Union([
      Type.Literal("background"),
      Type.Literal("raster"),
      Type.Literal("fill"),
      Type.Literal("line"),
      Type.Literal("circle"),
      Type.Literal("symbol-lite"),
      Type.Literal("fill-extrusion-lite")
    ]),
    source: Type.Optional(Type.String()),
    layout: Type.Optional(Type.Record(Type.String(), JsonValueSchema)),
    paint: Type.Optional(Type.Record(Type.String(), JsonValueSchema)),
    metadata: Type.Optional(Type.Record(Type.String(), JsonValueSchema))
  },
  { additionalProperties: false }
);

const InteractionSpecSchema = Type.Object(
  {
    pan: Type.Optional(Type.Boolean()),
    zoom: Type.Optional(Type.Boolean()),
    hover: Type.Optional(Type.Boolean()),
    click: Type.Optional(Type.Boolean()),
    select: Type.Optional(Type.Boolean()),
    popup: Type.Optional(Type.Boolean())
  },
  { additionalProperties: false }
);

export const MapSpecSchema = Type.Object(
  {
    version: Type.Literal("0.1"),
    id: Type.Optional(Type.String()),
    revision: Type.Optional(Type.String()),
    capabilities: Type.Optional(CapabilityRequestSchema),
    view: ViewSpecSchema,
    sources: Type.Record(Type.String(), SourceSpecSchema),
    layers: Type.Array(LayerSpecSchema),
    interactions: Type.Optional(InteractionSpecSchema),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    extensions: Type.Optional(Type.Record(Type.String(), Type.Unknown()))
  },
  {
    $id: "https://gis-engine.dev/schemas/mapspec.v0.1.schema.json",
    additionalProperties: false
  }
);

export type MapSpecFromSchema = Static<typeof MapSpecSchema>;
