import { createHash, randomUUID } from "node:crypto";

export async function callOpenAiCompatibleProvider(input) {
  const { profile, apiKey, message, summary, fetchImpl = fetch } = input;
  if (!apiKey) return providerError(profile, "Provider credential is not configured.");

  try {
    const response = await fetchImpl(`${trimTrailingSlash(profile.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: profile.model,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt(summary) },
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return providerError(profile, `Provider returned HTTP ${response.status}.`);

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return providerError(profile, "No message content in response.");

    const parsed = parseJsonObject(content);
    if (!parsed.ok) return providerError(profile, "Response must be a JSON object.");

    // Support both old "intent" and new "action" format
    const action = parsed.value.action || parsed.value.intent;
    if (!action || typeof action !== "string") return providerError(profile, "Response must include an 'action' field.");

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        action: parsed.value.action || parsed.value.intent,
        layerId: parsed.value.layerId || null,
        paint: parsed.value.paint || null,
        view: parsed.value.view || null,
        layer: parsed.value.layer || null,
        confidence: sanitizeConfidence(parsed.value.confidence),
      },
    };
  } catch {
    return providerError(profile, "Provider request failed.");
  }
}

function systemPrompt(summary) {
  const layerInfo = summary.layers > 0
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
    "- Move camera: set view center [lng, lat] and zoom level (0-22)",
    "- Add a layer: provide layer type, source id, and paint properties",
    "- Remove a layer: provide layer id",
    "- Reset map: restore to default state",
    "",
    `## Current Map State\n${JSON.stringify(summary, null, 2)}`,
    "",
    layerInfo,
    "",
    "## Response Format (STRICT)",
    "{",
    '  "action": "setPaint" | "setLayout" | "setView" | "addLayer" | "removeLayer" | "reset",',
    '  "layerId": "target-layer-id",          // for setPaint/setLayout/removeLayer',
    '  "paint": { "circle-color": "#ef4444" }, // for setPaint',
    '  "view": { "center": [120.15, 30.28], "zoom": 13 }, // for setView',
    '  "layer": { "id": "new-layer", "type": "circle", "source": "points", "paint": { "circle-radius": 8 } }, // for addLayer',
    '  "confidence": { "score": 0.95, "level": "high" }',
    "}",
    "",
    "## Rules",
    "- ALWAYS use exact layer IDs from the current map state",
    "- For color changes, use hex colors like #ef4444, #3b82f6, #22c55e",
    "- For setView, always include both center [lng, lat] and zoom",
    "- Return ONLY the JSON object, no markdown, no explanation",
    "- If unsure about any field, set confidence to 'low'",
  ].join("\n");
}

function parseJsonObject(content) {
  try {
    const stripped = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    const value = JSON.parse(stripped);
    return value && typeof value === "object" && !Array.isArray(value) ? { ok: true, value } : { ok: false };
  } catch { return { ok: false }; }
}

function trimTrailingSlash(s) { return s?.replace(/\/+$/, "") ?? ""; }
function hashPrompt(msg) { return `sha256:${createHash("sha256").update(msg).digest("hex").slice(0, 16)}`; }
function sanitizeConfidence(c) {
  if (!c || typeof c !== "object") return undefined;
  const score = typeof c.score === "number" ? Math.max(0, Math.min(1, c.score)) : undefined;
  return score != null ? { score, level: score > 0.7 ? "high" : score > 0.4 ? "medium" : "low" } : undefined;
}
function providerError(profile, msg) { return { ok: false, error: `${profile.id}: ${msg}` }; }
