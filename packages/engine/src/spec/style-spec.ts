import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic } from "../types.js";
import { validateExpression } from "./expression-validator.js";

type StyleValueKind =
  | { kind: "number"; min?: number; max?: number }
  | { kind: "color" }
  | { kind: "boolean" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "string" }
  | { kind: "number-list"; minItems?: number; maxItems?: number }
  | { kind: "string-list" };

interface StylePropertySpec {
  value: StyleValueKind;
  deprecated?: boolean;
}

type LayerStyleSpec = {
  paint: Record<string, StylePropertySpec>;
  layout: Record<string, StylePropertySpec>;
};

const COLOR: StylePropertySpec = { value: { kind: "color" } };
const BOOLEAN: StylePropertySpec = { value: { kind: "boolean" } };
const STRING: StylePropertySpec = { value: { kind: "string" } };
const OPACITY: StylePropertySpec = { value: { kind: "number", min: 0, max: 1 } };
const NON_NEGATIVE: StylePropertySpec = { value: { kind: "number", min: 0 } };
function numberValue(min?: number, max?: number): StylePropertySpec {
  const kind: { kind: "number"; min?: number; max?: number } = { kind: "number" };
  if (min !== undefined) kind.min = min;
  if (max !== undefined) kind.max = max;
  return { value: kind };
}
const enumValue = (...values: string[]): StylePropertySpec => ({ value: { kind: "enum", values } });
function numberList(minItems?: number, maxItems?: number): StylePropertySpec {
  const kind: { kind: "number-list"; minItems?: number; maxItems?: number } = { kind: "number-list" };
  if (minItems !== undefined) kind.minItems = minItems;
  if (maxItems !== undefined) kind.maxItems = maxItems;
  return { value: kind };
}
const stringList: StylePropertySpec = { value: { kind: "string-list" } };

/**
 * Paint/layout property registry for the MapSpec layer types, aligned with the MapLibre
 * style specification the maplibre adapter targets. Unknown properties downgrade to a
 * warning because MapSpec intentionally allows renderer passthrough values.
 */
const LAYER_STYLE_SPECS: Record<string, LayerStyleSpec> = {
  background: {
    paint: {
      "background-pattern": STRING,
      "background-color": COLOR,
      "background-opacity": OPACITY,
      "background-emissive-strength": numberValue(0, 1),
    },
    layout: {},
  },
  raster: {
    paint: {
      "raster-opacity": OPACITY,
      "raster-hue-rotate": numberValue(),
      "raster-brightness-min": OPACITY,
      "raster-brightness-max": OPACITY,
      "raster-saturation": numberValue(-1, 1),
      "raster-contrast": numberValue(-1, 1),
      "raster-resampling": enumValue("linear", "nearest"),
      "raster-fade-duration": NON_NEGATIVE,
      "raster-rotation-theta": numberValue(),
    },
    layout: {},
  },
  fill: {
    paint: {
      "fill-antialias": BOOLEAN,
      "fill-opacity": OPACITY,
      "fill-color": COLOR,
      "fill-outline-color": COLOR,
      "fill-translate": numberList(2, 2),
      "fill-translate-anchor": enumValue("map", "viewport"),
      "fill-pattern": STRING,
    },
    layout: {},
  },
  line: {
    paint: {
      "line-opacity": OPACITY,
      "line-color": COLOR,
      "line-translate": numberList(2, 2),
      "line-translate-anchor": enumValue("map", "viewport"),
      "line-width": NON_NEGATIVE,
      "line-gap-width": NON_NEGATIVE,
      "line-offset": numberValue(),
      "line-blur": NON_NEGATIVE,
      "line-dasharray": numberList(2),
      "line-pattern": STRING,
      "line-gradient": COLOR,
      // Deprecated in the MapLibre target but still widely authored.
      "line-trim-offset": { value: { kind: "number-list", minItems: 2, maxItems: 2 }, deprecated: true },
    },
    layout: {
      "line-cap": enumValue("butt", "round", "square"),
      "line-join": enumValue("miter", "bevel", "round"),
      "line-miter-limit": numberValue(),
      "line-round-limit": numberValue(),
    },
  },
  "fill-extrusion-lite": {
    paint: {
      "fill-extrusion-opacity": OPACITY,
      "fill-extrusion-color": COLOR,
      "fill-extrusion-height": NON_NEGATIVE,
      "fill-extrusion-base": NON_NEGATIVE,
    },
    layout: {},
  },
  circle: {
    paint: {
      "circle-radius": NON_NEGATIVE,
      "circle-color": COLOR,
      "circle-blur": numberValue(),
      "circle-opacity": OPACITY,
      "circle-translate": numberList(2, 2),
      "circle-translate-anchor": enumValue("map", "viewport"),
      "circle-pitch-scale": enumValue("map", "viewport"),
      "circle-pitch-alignment": enumValue("map", "viewport"),
      "circle-stroke-width": NON_NEGATIVE,
      "circle-stroke-color": COLOR,
      "circle-stroke-opacity": OPACITY,
    },
    layout: {},
  },
  heatmap: {
    paint: {
      "heatmap-radius": NON_NEGATIVE,
      "heatmap-weight": numberValue(0, 10),
      "heatmap-intensity": NON_NEGATIVE,
      "heatmap-color": COLOR,
      "heatmap-opacity": OPACITY,
    },
    layout: {},
  },
  symbol: {
    paint: {
      "icon-opacity": OPACITY,
      "icon-color": COLOR,
      "icon-halo-color": COLOR,
      "icon-halo-width": NON_NEGATIVE,
      "icon-translate": numberList(2, 2),
      "icon-translate-anchor": enumValue("map", "viewport"),
      "text-opacity": OPACITY,
      "text-color": COLOR,
      "text-halo-color": COLOR,
      "text-halo-width": NON_NEGATIVE,
      "text-translate": numberList(2, 2),
      "text-translate-anchor": enumValue("map", "viewport"),
    },
    layout: {
      "symbol-placement": enumValue("point", "line", "line-center"),
      "symbol-spacing": NON_NEGATIVE,
      "symbol-avoid-edges": BOOLEAN,
      "symbol-sort-key": numberValue(),
      "symbol-z-order": enumValue("auto", "viewport-y", "source"),
      "icon-allow-overlap": BOOLEAN,
      "icon-ignore-placement": BOOLEAN,
      "icon-optional": BOOLEAN,
      "icon-rotation-alignment": enumValue("map", "viewport", "auto"),
      "icon-size": NON_NEGATIVE,
      "icon-text-fit": enumValue("none", "width", "height", "both"),
      "icon-text-fit-padding": numberList(4, 4),
      "icon-image": STRING,
      "icon-rotate": numberValue(),
      "icon-padding": NON_NEGATIVE,
      "icon-keep-upright": BOOLEAN,
      "icon-offset": numberList(2, 2),
      "icon-anchor": enumValue(
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ),
      "icon-pitch-alignment": enumValue("map", "viewport", "auto"),
      "text-priority": numberValue(),
      "text-allow-overlap": BOOLEAN,
      "text-ignore-placement": BOOLEAN,
      "text-optional": BOOLEAN,
      "text-rotation-alignment": enumValue("map", "viewport", "auto"),
      "text-field": STRING,
      "text-font": stringList,
      "text-size": NON_NEGATIVE,
      "text-max-width": NON_NEGATIVE,
      "text-line-height": numberValue(),
      "text-letter-spacing": numberValue(0),
      "text-justify": enumValue("auto", "left", "center", "right"),
      "text-radial-offset": numberValue(),
      "text-variable-anchor": stringList,
      "text-anchor": enumValue(
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ),
      "text-max-angle": numberValue(),
      "text-rotate": numberValue(),
      "text-padding": NON_NEGATIVE,
      "text-keep-upright": BOOLEAN,
      "text-transform": enumValue("none", "uppercase", "lowercase"),
      "text-offset": numberList(2, 2),
    },
  },
  "symbol-lite": {
    paint: {
      "icon-opacity": OPACITY,
      "icon-color": COLOR,
      "text-opacity": OPACITY,
      "text-color": COLOR,
      "text-halo-color": COLOR,
      "text-halo-width": NON_NEGATIVE,
    },
    layout: {
      "icon-image": STRING,
      "icon-size": NON_NEGATIVE,
      "text-field": STRING,
      "text-size": NON_NEGATIVE,
      "text-font": stringList,
      "text-max-width": NON_NEGATIVE,
      "text-anchor": enumValue(
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ),
      "text-justify": enumValue("auto", "left", "center", "right"),
      "text-rotate": numberValue(),
      "text-transform": enumValue("none", "uppercase", "lowercase"),
      "text-letter-spacing": numberValue(0),
      "text-line-height": numberValue(),
      "text-padding": NON_NEGATIVE,
      "text-offset": numberList(2, 2),
      "text-optional": BOOLEAN,
      "text-allow-overlap": BOOLEAN,
    },
  },
};

export function validateStyleProperties(
  layerType: string,
  style: Record<string, unknown>,
  bucket: "paint" | "layout",
  path: string,
): Diagnostic[] {
  const spec = LAYER_STYLE_SPECS[layerType]?.[bucket] ?? {};
  const diagnostics: Diagnostic[] = [];

  for (const [property, value] of Object.entries(style)) {
    const propertyPath = `${path}/${property}`;
    // visibility is a layout property of every layer type, so it needs no registry entry.
    if (property === "visibility" && bucket === "layout") {
      if (typeof value !== "string" || (value !== "visible" && value !== "none")) {
        diagnostics.push(invalid(layerType, property, propertyPath, 'visibility must be "visible" or "none"', value));
      }
      continue;
    }

    const declared = spec[property];
    // Array values are data expressions; their grammar is layer-type independent, so an
    // undocumented property still gets its expression validated.
    if (Array.isArray(value)) {
      if (!declared) {
        diagnostics.push(unknownProperty(bucket, layerType, property, propertyPath));
      }
      diagnostics.push(...validateExpression(value, propertyPath));
      continue;
    }
    if (!declared) {
      diagnostics.push(unknownProperty(bucket, layerType, property, propertyPath));
      continue;
    }
    if (declared.deprecated) {
      diagnostics.push({
        severity: "warning",
        code: DiagnosticCodes.SpecUnknownField,
        message: `"${property}" is deprecated in the ${layerType} style target.`,
        path: propertyPath,
      });
    }

    const problem = checkStyleValue(value, declared.value);
    if (problem) {
      diagnostics.push(invalid(layerType, property, propertyPath, problem, value));
    }
  }

  return diagnostics;
}

function unknownProperty(bucket: "paint" | "layout", layerType: string, property: string, path: string): Diagnostic {
  return {
    severity: "warning",
    code: DiagnosticCodes.SpecUnknownField,
    message: `"${property}" is not a documented ${bucket} property for layer type "${layerType}"; it is passed through to the renderer unvalidated.`,
    path,
  };
}

function invalid(layerType: string, property: string, path: string, expectation: string, value: unknown): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.SpecInvalidType,
    message: `Invalid value ${JSON.stringify(value) ?? String(value)} for "${property}" on ${layerType} layer: ${expectation}.`,
    path,
    fix: {
      kind: "manual",
      confidence: "high",
      message: `Use a literal that satisfies the MapLibre ${layerType} style specification for "${property}", or an expression array.`,
    },
  };
}

function checkStyleValue(value: unknown, kind: StyleValueKind): string | null {
  switch (kind.kind) {
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return `expected a finite number`;
      if (kind.min !== undefined && value < kind.min) return `expected a number >= ${kind.min}`;
      if (kind.max !== undefined && value > kind.max) return `expected a number <= ${kind.max}`;
      return null;
    }
    case "color":
      return isCssColor(value)
        ? null
        : "expected a CSS color string (hex, rgb()/rgba(), hsl()/hsla(), or a CSS color keyword)";
    case "boolean":
      return typeof value === "boolean" ? null : "expected a boolean";
    case "enum":
      return typeof value === "string" && kind.values.includes(value)
        ? null
        : `expected one of: ${kind.values.join(", ")}`;
    case "string":
      return typeof value === "string" ? null : "expected a string";
    case "number-list": {
      if (!Array.isArray(value) || value.length === 0) return "expected a non-empty array of numbers";
      if (kind.minItems !== undefined && value.length < kind.minItems)
        return `expected at least ${kind.minItems} numbers`;
      if (kind.maxItems !== undefined && value.length > kind.maxItems)
        return `expected at most ${kind.maxItems} numbers`;
      return value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
        ? null
        : "expected every entry to be a finite number";
    }
    case "string-list":
      return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string")
        ? null
        : "expected a non-empty array of strings";
  }
}

const CSS_COLOR_KEYWORDS = new Set([
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "transparent",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
]);

function isCssColor(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim().toLowerCase();
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(trimmed)) return true;
  if (CSS_COLOR_KEYWORDS.has(trimmed)) return true;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(trimmed)) {
    return parseRgbChannels(trimmed).every((channel, index) => index === 3 || inRange(channel, 0, 255));
  }
  if (/^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:\d+(?:\.\d+)?%?|0?\.\d+)\s*\)$/.test(trimmed)) {
    return parseRgbaChannels(trimmed);
  }
  if (
    /^hsla?\(\s*-?\d+(?:\.\d+)?(?:deg)?\s*,\s*-?\d+(?:\.\d+)?%\s*,\s*-?\d+(?:\.\d+)?%(?:\s*,\s*(?:\d+(?:\.\d+)?%?|0?\.\d+)\s*)?\)$/.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

function parseRgbChannels(value: string): number[] {
  return value
    .slice(value.indexOf("(") + 1, -1)
    .split(",")
    .map((channel) => Number(channel.trim()));
}

function parseRgbaChannels(value: string): boolean {
  const channels = parseRgbChannels(value);
  const alpha = channels[3];
  return (
    channels.slice(0, 3).every((channel) => inRange(channel, 0, 255)) &&
    typeof alpha === "number" &&
    inRange(alpha, 0, 1)
  );
}

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}
