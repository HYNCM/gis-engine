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

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsed.value.intent,
        ...(parsed.value.confidence ? { confidence: parsed.value.confidence } : {})
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
