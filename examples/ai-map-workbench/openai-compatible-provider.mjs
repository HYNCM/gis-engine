import { createHash, randomUUID } from "node:crypto";

const CAPABILITY_UNSUPPORTED = "CAPABILITY.UNSUPPORTED";
export const DEFAULT_PROVIDER_REQUEST_TIMEOUT_MS = 20_000;
export const DEFAULT_PROVIDER_RESPONSE_BYTE_CAP = 64 * 1024;

class ProviderTimeoutError extends Error {
  constructor() {
    super("provider-timeout");
    this.name = "ProviderTimeoutError";
  }
}

export async function callOpenAiCompatibleProvider(input) {
  const {
    profile,
    apiKey,
    message,
    summary,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_PROVIDER_REQUEST_TIMEOUT_MS,
    responseByteCap = DEFAULT_PROVIDER_RESPONSE_BYTE_CAP,
  } = input;
  if (!apiKey) return providerError(profile, "/providerProfile", "Provider credential is not configured.");

  const timeout = createProviderTimeout(timeoutMs);

  try {
    const response = await timeout.run(
      fetchImpl(`${trimTrailingSlash(profile.baseUrl)}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        signal: timeout.signal,
        body: JSON.stringify({
          model: profile.model,
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt(summary) },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        }),
      }),
    );

    if (!response.ok) {
      return providerError(profile, "/providerRequest", `Provider request failed with HTTP ${response.status}.`);
    }

    const responseText = await timeout.run(readResponseTextWithinCap(response, responseByteCap, timeout.signal));
    if (!responseText.ok) {
      return providerError(profile, "/providerResponse/size", "Provider response exceeded the configured byte cap.");
    }

    const payload = parseJsonObject(responseText.value);
    if (!payload.ok) return providerError(profile, "/providerRequest", "Provider response was not valid JSON.");
    const content = payload.value?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return providerError(profile, "/providerResponse", "Provider response did not include message content.");
    }

    const parsed = parseJsonObject(content);
    if (!parsed.ok)
      return providerError(profile, "/providerResponse", "Provider response content must be a JSON object.");
    if (!isStructuredIntent(parsed.value.intent)) {
      return providerError(profile, "/providerResponse", "Provider response must include structured intent.");
    }
    if (hasUnsafeIntent(parsed.value.intent, { apiKey, message })) {
      return providerError(
        profile,
        "/providerResponse",
        "Provider response intent contains unsupported raw or sensitive content.",
      );
    }

    const confidence = sanitizeConfidence(parsed.value.confidence, {
      apiKey,
      message,
      providerValue: parsed.value,
    });
    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsed.value.intent,
        ...(confidence ? { confidence } : {}),
      },
    };
  } catch (error) {
    if (timeout.didTimeout() || error instanceof ProviderTimeoutError) {
      return providerError(profile, "/providerRequest/timeout", "Provider request timed out.");
    }
    return providerError(
      profile,
      "/providerRequest",
      "Provider request failed before a valid JSON response was received.",
    );
  } finally {
    timeout.clear();
  }
}

function createProviderTimeout(timeoutMs) {
  const abortController = new AbortController();
  let timedOut = false;
  let rejectTimeout = () => {};
  const timeoutPromise = new Promise((_, reject) => {
    rejectTimeout = reject;
  });
  const timeout = setTimeout(() => {
    timedOut = true;
    abortController.abort();
    rejectTimeout(new ProviderTimeoutError());
  }, timeoutMs);

  return {
    signal: abortController.signal,
    didTimeout: () => timedOut,
    run: (promise) => Promise.race([promise, timeoutPromise]),
    clear: () => clearTimeout(timeout),
  };
}

async function readResponseTextWithinCap(response, byteCap, signal) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > byteCap) {
    return { ok: false };
  }

  if (!response.body?.getReader) {
    const value = await response.text();
    return byteLength(value) <= byteCap ? { ok: true, value } : { ok: false };
  }

  const reader = response.body.getReader();
  const cancelReader = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancelReader, { once: true });
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      throwIfProviderTimedOut(signal);
      const { value, done } = await reader.read();
      throwIfProviderTimedOut(signal);
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > byteCap) {
        reader.cancel().catch(() => {});
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    signal?.removeEventListener("abort", cancelReader);
  }

  return { ok: true, value: new TextDecoder().decode(concatUint8Arrays(chunks, totalBytes)) };
}

function throwIfProviderTimedOut(signal) {
  if (signal?.aborted) throw new ProviderTimeoutError();
}

function concatUint8Arrays(chunks, totalBytes) {
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

function systemPrompt(summary) {
  return [
    "You convert map-edit requests into JSON only.",
    "Return an object with intent and optional confidence.",
    "Do not return JavaScript, commands, MapSpec, patches, raw prompts, markdown, or prose.",
    `Current map summary: ${JSON.stringify(summary)}`,
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

  const forbiddenMarkers = collectForbiddenMarkers(leakContext);
  const reasons = value.reasons
    .filter((reason) => isSafeReason(reason, forbiddenMarkers))
    .slice(0, 3)
    .map((reason) => reason.slice(0, 160));
  if (reasons.length === 0) return undefined;

  return {
    level: value.level,
    reasons,
  };
}

function collectForbiddenMarkers({ apiKey, message, providerValue }) {
  const markers = [];
  for (const marker of [apiKey, unsafePromptMarker(message)]) {
    if (typeof marker === "string" && marker.length > 0) markers.push({ value: marker, allowReverse: true });
  }
  collectUnsafeProviderMarkers(providerValue, markers);
  return markers;
}

function collectUnsafeProviderMarkers(value, markers, insideUnsafeProviderKey = false) {
  if (typeof value === "string") {
    if (insideUnsafeProviderKey) markers.push({ value, allowReverse: true });
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectUnsafeProviderMarkers(item, markers, insideUnsafeProviderKey);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    collectUnsafeProviderMarkers(item, markers, insideUnsafeProviderKey || isUnsafeProviderKey(key));
  }
}

function isSafeReason(reason, forbiddenMarkers) {
  const normalizedReason = reason.toLowerCase();
  return !forbiddenMarkers.some((marker) => {
    const normalizedMarker = marker.value.toLowerCase();
    return (
      normalizedReason.includes(normalizedMarker) ||
      // Reverse matching removes short summaries such as "secret" when they are substrings of credentials or raw markers.
      (marker.allowReverse && normalizedReason.length >= 4 && normalizedMarker.includes(normalizedReason))
    );
  });
}

function isStructuredIntent(intent) {
  return !!intent && typeof intent === "object" && !Array.isArray(intent);
}

function hasUnsafeIntent(intent, leakContext) {
  const serializedIntent = JSON.stringify(intent);
  if (
    containsMarker(serializedIntent, unsafePromptMarker(leakContext.message)) ||
    containsMarker(serializedIntent, leakContext.apiKey)
  ) {
    return true;
  }
  return hasUnsafeIntentKey(intent);
}

function unsafePromptMarker(message) {
  if (typeof message !== "string") return undefined;
  const trimmed = message.trim();
  if (trimmed.length === 0) return undefined;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2) return trimmed;
  return trimmed.length >= 24 || /[.!?]/.test(trimmed) ? trimmed : undefined;
}

function hasUnsafeIntentKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeIntentKey(item));

  return Object.entries(value).some(([key, child]) => isUnsafeIntentKey(key) || hasUnsafeIntentKey(child));
}

function isUnsafeIntentKey(key) {
  return isUnsafeProviderKey(key);
}

function isUnsafeProviderKey(key) {
  const normalizedKey = normalizeProviderKey(key);
  // Keys are normalized before matching so separator and camel-case sensitive aliases share one policy.
  return [
    "raw",
    "prompt",
    "secret",
    "apikey",
    "providertrace",
    "providerresponse",
    "responsebody",
    "response",
    "authorization",
    "accesstoken",
    "bearertoken",
    "credential",
    "credentials",
    "password",
    "token",
  ].some((marker) => normalizedKey.includes(marker));
}

function normalizeProviderKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function containsMarker(value, marker) {
  return typeof marker === "string" && marker.length > 0 && value.toLowerCase().includes(marker.toLowerCase());
}

function providerError(profile, path, message) {
  return {
    ok: false,
    provider: {
      providerId: profile?.id ?? "unknown-provider",
      retainedRawPrompt: false,
    },
    diagnostics: [
      {
        severity: "error",
        code: CAPABILITY_UNSUPPORTED,
        message,
        path,
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Check provider configuration or return structured intent JSON.",
        },
      },
    ],
  };
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
