import { createHash, randomUUID } from "node:crypto";
import { DiagnosticCodes } from "@gis-engine/engine";

export async function callOpenAiCompatibleProvider(input) {
  const { profile, apiKey, message, summary, fetchImpl = fetch } = input;
  if (!apiKey) return providerError(profile, "/providerProfile", "Provider credential is not configured.");

  try {
    const response = await fetchImpl(`${trimTrailingSlash(profile.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: profile.model,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt(summary) },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      return providerError(profile, "/providerRequest", `Provider request failed with HTTP ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return providerError(profile, "/providerResponse", "Provider response did not include message content.");
    }

    const parsed = parseJsonObject(content);
    if (!parsed.ok) return providerError(profile, "/providerResponse", "Provider response content must be a JSON object.");
    if (hasUnsafeIntent(parsed.value.intent, { apiKey, message })) {
      return providerError(profile, "/providerResponse", "Provider response intent contains unsupported raw or sensitive content.");
    }

    const confidence = sanitizeConfidence(parsed.value.confidence, {
      apiKey,
      message,
      providerContent: content,
      providerValue: parsed.value
    });
    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsed.value.intent,
        ...(confidence ? { confidence } : {})
      }
    };
  } catch (error) {
    return providerError(profile, "/providerRequest", "Provider request failed before a valid JSON response was received.");
  }
}

function systemPrompt(summary) {
  return [
    "You convert map-edit requests into JSON only.",
    "Return an object with intent and optional confidence.",
    "Do not return JavaScript, commands, MapSpec, patches, raw prompts, markdown, or prose.",
    `Current map summary: ${JSON.stringify(summary)}`
  ].join("\n");
}

function parseJsonObject(content) {
  try {
    const value = JSON.parse(stripJsonFence(content));
    return value && typeof value === "object" && !Array.isArray(value) ? { ok: true, value } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function stripJsonFence(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function hashPrompt(message) {
  return `sha256:${createHash("sha256").update(message).digest("hex")}`;
}

function sanitizeConfidence(value, leakContext) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  if (!["low", "medium", "high"].includes(value.level)) return undefined;
  if (!Array.isArray(value.reasons) || !value.reasons.every((reason) => typeof reason === "string")) return undefined;

  const forbiddenMarkers = collectForbiddenMarkers(leakContext, value.reasons);
  const reasons = value.reasons
    .filter((reason) => isSafeReason(reason, forbiddenMarkers))
    .slice(0, 3)
    .map((reason) => reason.slice(0, 160));
  if (reasons.length === 0) return undefined;

  return {
    level: value.level,
    reasons
  };
}

function collectForbiddenMarkers({ apiKey, message, providerContent, providerValue }, confidenceReasons) {
  const markers = [];
  for (const marker of [apiKey, message]) {
    if (typeof marker === "string" && marker.length > 0) markers.push({ value: marker, allowReverse: true });
  }
  if (typeof providerContent === "string" && providerContent.length > 0) {
    markers.push({ value: providerContent, allowReverse: false });
  }
  collectProviderStrings(providerValue, markers, confidenceReasons);
  return markers;
}

function collectProviderStrings(value, markers, confidenceReasons) {
  if (typeof value === "string") {
    markers.push({ value, allowReverse: true });
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    if (value === confidenceReasons) return;
    for (const item of value) collectProviderStrings(item, markers, confidenceReasons);
    return;
  }
  for (const item of Object.values(value)) collectProviderStrings(item, markers, confidenceReasons);
}

function isSafeReason(reason, forbiddenMarkers) {
  const normalizedReason = reason.toLowerCase();
  return !forbiddenMarkers.some((marker) => {
    const normalizedMarker = marker.value.toLowerCase();
    return (
      normalizedReason.includes(normalizedMarker) ||
      (marker.allowReverse && normalizedReason.length >= 4 && normalizedMarker.includes(normalizedReason))
    );
  });
}

function hasUnsafeIntent(intent, leakContext) {
  if (intent === undefined) return false;
  const serializedIntent = JSON.stringify(intent);
  if (containsMarker(serializedIntent, leakContext.message) || containsMarker(serializedIntent, leakContext.apiKey)) return true;
  return hasUnsafeIntentKey(intent);
}

function hasUnsafeIntentKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeIntentKey(item));

  return Object.entries(value).some(([key, child]) => isUnsafeIntentKey(key) || hasUnsafeIntentKey(child));
}

function isUnsafeIntentKey(key) {
  const normalizedKey = key.toLowerCase();
  return ["raw", "prompt", "secret", "apikey", "providertrace", "providerresponse"].some((marker) =>
    normalizedKey.includes(marker)
  );
}

function containsMarker(value, marker) {
  return typeof marker === "string" && marker.length > 0 && value.toLowerCase().includes(marker.toLowerCase());
}

function providerError(profile, path, message) {
  return {
    ok: false,
    provider: {
      providerId: profile?.id ?? "unknown-provider",
      retainedRawPrompt: false
    },
    diagnostics: [
      {
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message,
        path,
        fix: { kind: "manual", confidence: "high", message: "Check provider configuration or return structured intent JSON." }
      }
    ]
  };
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
