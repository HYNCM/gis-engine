import { createHash, randomUUID } from "node:crypto";

export async function callOpenAiCompatibleProvider(input) {
  const {
    profile,
    apiKey,
    message,
    summary,
    capabilityPrompt,
    fetchImpl = fetch,
  } = input;
  if (!apiKey) return providerError(profile, "Provider credential is not configured.");

  try {
    const response = await fetchImpl(
      `${trimTrailingSlash(profile.baseUrl)}/chat/completions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: profile.model,
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt(summary, capabilityPrompt) },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      return providerError(profile, `Provider returned HTTP ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return providerError(profile, "No message content in response.");
    }

    const parsed = parseJsonObject(content);
    if (!parsed.ok) return providerError(profile, "Response must be a JSON object.");

    const action = parsed.value.action || parsed.value.intent;
    if (!action || typeof action !== "string") {
      return providerError(profile, "Response must include an 'action' field.");
    }

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        action,
        layerId: parsed.value.layerId || null,
        paint: parsed.value.paint || null,
        layout: parsed.value.layout || null,
        filter: Object.hasOwn(parsed.value, "filter")
          ? parsed.value.filter
          : undefined,
        view: parsed.value.view || null,
        bounds: isBoundsArray(parsed.value.bounds)
          ? parsed.value.bounds
          : undefined,
        layer: parsed.value.layer || null,
        minzoom:
          typeof parsed.value.minzoom === "number"
            ? parsed.value.minzoom
            : undefined,
        maxzoom:
          typeof parsed.value.maxzoom === "number"
            ? parsed.value.maxzoom
            : undefined,
        beforeLayerId:
          typeof parsed.value.beforeLayerId === "string"
            ? parsed.value.beforeLayerId
            : undefined,
        message:
          typeof parsed.value.message === "string"
            ? parsed.value.message
            : null,
        confidence: sanitizeConfidence(parsed.value.confidence),
      },
    };
  } catch {
    return providerError(profile, "Provider request failed.");
  }
}

function systemPrompt(summary, capabilityPrompt = "") {
  const layerInfo =
    summary.layers > 0
      ? `There ${summary.layers === 1 ? "is" : "are"} ${summary.layers} layer(s). Layer IDs: ${(summary.layerIds || []).join(", ") || "points-layer"}.`
      : "No layers exist yet.";

  return [
    "You are a map-editing assistant for GIS Engine. You MUST return ONLY valid JSON.",
    "",
    "## Available Actions",
    "- Change point/line/fill color: set 'circle-color', 'line-color', or 'fill-color'",
    "- Change point size: set 'circle-radius' (range 3-30)",
    "- Change line width: set 'line-width' (range 0.5-10)",
    "- Change opacity: set 'circle-opacity', 'line-opacity', or 'fill-opacity'",
    "- Change layout state: action=setLayout, layerId=target layer, layout={...}; use visibility none/visible to hide or show a layer",
    "- Filter a layer: action=setFilter, layerId=target layer, filter=MapLibre boolean expression array; use null to clear",
    "- Set layer zoom visibility: action=setLayerZoomRange, layerId=target layer, minzoom/maxzoom numbers in 0-24",
    "- Reorder layers: action=reorderLayer, layerId=target layer, optional beforeLayerId=anchor layer; omit beforeLayerId to move the layer to the top",
    "- Fit the map to bounds: action=fitBounds, bounds=[west, south, east, north]",
    "- Change basemap: action=setBasemap, layerId=none|osm|arcgis-imagery|bing-aerial",
    "- Move camera: set view center [lng, lat] and zoom level (0-22)",
    "- Add a layer: provide layer type, source id, and paint properties",
    "- Remove a layer: provide layer id",
    "- Reset map: restore to default state",
    "",
    "## MapLibre Capability Context",
    capabilityPrompt ||
      "No expanded MapLibre capability registry was provided. Use only the listed Available Actions.",
    "",
    `## Current Map State\n${JSON.stringify(summary, null, 2)}`,
    "",
    layerInfo,
    "",
    "## Response Format (STRICT)",
    "{",
    '  "action": "setPaint" | "setLayout" | "setFilter" | "setLayerZoomRange" | "reorderLayer" | "fitBounds" | "setView" | "addLayer" | "removeLayer" | "setBasemap" | "reset" | "unsupported",',
    '  "layerId": "target-layer-id",          // for layer edits/removeLayer/setBasemap (basemap id for setBasemap)',
    '  "paint": { "circle-color": "#ef4444" }, // for setPaint',
    '  "layout": { "visibility": "none" },    // for setLayout',
    '  "filter": ["==", ["get", "category"], "landmark"], // for setFilter; null clears it',
    '  "minzoom": 10, "maxzoom": 18,          // for setLayerZoomRange',
    '  "beforeLayerId": "labels-layer",       // optional for reorderLayer; omit to move layer to the top',
    '  "bounds": [120.145, 30.245, 120.172, 30.274], // for fitBounds',
    '  "view": { "center": [120.15, 30.28], "zoom": 13 }, // for setView',
    '  "layer": { "id": "new-layer", "type": "circle", "source": "points", "paint": { "circle-radius": 8 } }, // for addLayer',
    '  "message": "short reason when action is unsupported",',
    '  "confidence": { "score": 0.95, "level": "high" }',
    "}",
    "",
    "## Rules",
    "- ALWAYS use exact layer IDs from the current map state",
    "- Layer IDs in the current map state are ordered from bottom to top",
    "- Use the MapLibre capability context to understand what the renderer can do and whether GIS Engine has a safe command contract for it",
    "- If the requested MapLibre ability is listed as not-yet-commanded, do not invent DOM/browser mutations; return the closest safe command only when it preserves user intent",
    "- For color changes, use hex colors like #ef4444, #3b82f6, #22c55e",
    "- For setView, always include both center [lng, lat] and zoom",
    '- For setLayout visibility changes, use layout {"visibility": "none"} to hide and {"visibility": "visible"} to show',
    '- For filters, prefer expression form such as ["==", ["get", "category"], "museum"]',
    "- For zoom ranges, use minzoom <= maxzoom and keep values between 0 and 24",
    "- For reorderLayer, use beforeLayerId only when the anchor layer exists; omit it to move the layer to the end of the layer list",
    "- For fitBounds, bounds must use [west, south, east, north] in lng/lat coordinates",
    "- Return ONLY the JSON object, no markdown, no explanation",
    "- If unsure about any field, set confidence to 'low'",
  ].join("\n");
}

function parseJsonObject(content) {
  try {
    const stripped = content
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const value = JSON.parse(stripped);
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ok: true, value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function trimTrailingSlash(value) {
  return value?.replace(/\/+$/, "") ?? "";
}

function hashPrompt(message) {
  return `sha256:${createHash("sha256").update(message).digest("hex").slice(0, 16)}`;
}

function isBoundsArray(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

function sanitizeConfidence(value) {
  if (!value || typeof value !== "object") return undefined;
  const score =
    typeof value.score === "number"
      ? Math.max(0, Math.min(1, value.score))
      : undefined;
  return score != null
    ? {
        score,
        level: score > 0.7 ? "high" : score > 0.4 ? "medium" : "low",
      }
    : undefined;
}

function providerError(profile, message) {
  return { ok: false, error: `${profile.id}: ${message}` };
}
