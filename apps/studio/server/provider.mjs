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
    if (!parsed.value.intent || typeof parsed.value.intent !== "string") return providerError(profile, "Response must include a string intent.");

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsed.value.intent,
        confidence: sanitizeConfidence(parsed.value.confidence),
      },
    };
  } catch {
    return providerError(profile, "Provider request failed.");
  }
}

function systemPrompt(summary) {
  return [
    "You are a map-editing assistant. Return ONLY valid JSON.",
    "Your response must have an 'intent' field describing the map edit.",
    "Valid intents: make points {color}, make points {larger|smaller}, zoom to {place}, reset.",
    "Optionally include 'confidence': { score: 0.0-1.0, level: 'high'|'medium'|'low' }.",
    `Current map: ${JSON.stringify(summary)}`,
    "Example: {\"intent\":\"make points red\",\"confidence\":{\"score\":0.95,\"level\":\"high\"}}",
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
