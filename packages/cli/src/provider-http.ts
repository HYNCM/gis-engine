/**
 * Provider HTTP client for CLI generate pipeline.
 *
 * Adapted from examples/ai-map-workbench/openai-compatible-provider.mjs.
 * Calls an OpenAI-compatible chat/completions endpoint, parses the JSON
 * response, validates intent safety, and sanitizes confidence.
 *
 * No raw prompts or credentials are ever retained in output.
 */

import { createHash, randomUUID } from "node:crypto";

// ── Constants ──────────────────────────────────────────────────────────

export const DEFAULT_PROVIDER_TIMEOUT_MS = 20_000;
export const DEFAULT_PROVIDER_BYTE_CAP = 64 * 1024;

const CAPABILITY_UNSUPPORTED = "CAPABILITY.UNSUPPORTED";

// ── Public types ───────────────────────────────────────────────────────

export interface ProviderProfile {
  id: string;
  baseUrl: string;
  model: string;
}

export interface ProviderCallInput {
  profile: ProviderProfile;
  apiKey: string;
  message: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  responseByteCap?: number;
}

export interface ProviderConfidence {
  level: "low" | "medium" | "high";
  reasons: string[];
}

export interface ProviderOutput {
  providerId: string;
  promptHash: string;
  traceId: string;
  intent: Record<string, unknown>;
  confidence?: ProviderConfidence;
}

export interface ProviderCallDiagnostic {
  severity: "error";
  code: string;
  message: string;
  path: string;
}

export type ProviderCallResult =
  | { ok: true; providerOutput: ProviderOutput }
  | { ok: false; diagnostics: ProviderCallDiagnostic[] };

// ── Core function ──────────────────────────────────────────────────────

/**
 * Call an OpenAI-compatible provider and extract structured intent.
 */
export async function callProvider(input: ProviderCallInput): Promise<ProviderCallResult> {
  const {
    profile,
    apiKey,
    message,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS,
    responseByteCap = DEFAULT_PROVIDER_BYTE_CAP,
  } = input;

  if (!apiKey) {
    return providerError(profile.id, "/providerProfile", "Provider credential is not configured.");
  }

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
            { role: "system", content: cliSystemPrompt() },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        }),
      })
    );

    if (!response.ok) {
      return providerError(
        profile.id,
        "/providerRequest",
        `Provider request failed with HTTP ${response.status}.`
      );
    }

    const responseText = await timeout.run(
      readResponseTextWithinCap(response, responseByteCap, timeout.signal)
    );
    if (!responseText.ok) {
      return providerError(
        profile.id,
        "/providerResponse/size",
        "Provider response exceeded the configured byte cap."
      );
    }

    const payload = parseJsonObject(responseText.value);
    if (!payload.ok) {
      return providerError(profile.id, "/providerRequest", "Provider response was not valid JSON.");
    }

    const content = (payload.value as Record<string, unknown>)?.choices;
    if (!Array.isArray(content) || !content[0]) {
      return providerError(profile.id, "/providerResponse", "Provider response did not include message content.");
    }
    const messageContent = (content[0] as Record<string, unknown>)?.message;
    if (!messageContent || typeof (messageContent as Record<string, unknown>).content !== "string") {
      return providerError(profile.id, "/providerResponse", "Provider response did not include message content.");
    }
    const textContent = (messageContent as Record<string, unknown>).content as string;

    const parsed = parseJsonObject(textContent);
    if (!parsed.ok) {
      return providerError(profile.id, "/providerResponse", "Provider response content must be a JSON object.");
    }

    const parsedValue = parsed.value as Record<string, unknown>;

    if (!isStructuredIntent(parsedValue.intent)) {
      return providerError(profile.id, "/providerResponse", "Provider response must include structured intent.");
    }

    if (hasUnsafeIntent(parsedValue.intent as Record<string, unknown>, { apiKey, message })) {
      return providerError(
        profile.id,
        "/providerResponse",
        "Provider response intent contains unsupported raw or sensitive content."
      );
    }

    const confidence = sanitizeConfidence(parsedValue.confidence, {
      apiKey,
      message,
      providerValue: parsedValue,
    });

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPromptFull(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsedValue.intent as Record<string, unknown>,
        ...(confidence ? { confidence } : {}),
      },
    };
  } catch (error) {
    if (timeout.didTimeout() || error instanceof ProviderTimeoutError) {
      return providerError(profile.id, "/providerRequest/timeout", "Provider request timed out.");
    }
    return providerError(
      profile.id,
      "/providerRequest",
      "Provider request failed before a valid JSON response was received."
    );
  } finally {
    timeout.clear();
  }
}

// ── System prompt ──────────────────────────────────────────────────────

function cliSystemPrompt(): string {
  return [
    "You are a GIS map generation assistant.",
    "Convert the user's map description into a structured JSON intent object.",
    "",
    "## App Type",
    "Determine the application type based on the user's description:",
    '  "explorer" — browsing/displaying geographic features (layer panel, legend, feature popup)',
    '  "dashboard" — statistical/comparison views (map + chart panel + filters)',
    '  "locator" — search/find/nearby use cases (search box, result list, navigation)',
    "Include appType in the intent output.",
    "",
    "## Intent Fields",
    "The intent object may contain these fields:",
    '  appType: "explorer" | "dashboard" | "locator"',
    '  targetDomains: array of "feature-display" | "spatial-analysis" | "scene-browsing"',
    "  view: { center: [lng, lat], zoom: number, bearing?: number, pitch?: number }",
    "  sources: object mapping source-id to source spec (GeoJSON, raster, vector, pmtiles)",
    '  layers: array of layer specs { id, source, "source-layer"?, type, paint?, layout?, filter? }',
    "  styleEdits: array of { layerId, paint?, layout? }",
    "  interactions: { popup?, tooltip?, highlight? }",
    "  appConfig: { title, description, components: string[] }",
    "  analysis: { operations: [...] }",
    "",
    "## Rules",
    'Return only a JSON object with an "intent" key.',
    'Optionally include "confidence" with { level: "low"|"medium"|"high", reasons: [...] }.',
    "Do not return JavaScript, commands, MapSpec patches, raw prompts, markdown, or prose.",
  ].join("\n");
}

// ── Timeout ────────────────────────────────────────────────────────────

class ProviderTimeoutError extends Error {
  constructor() {
    super("provider-timeout");
    this.name = "ProviderTimeoutError";
  }
}

interface ProviderTimeout {
  signal: AbortSignal;
  didTimeout: () => boolean;
  run: <T>(promise: Promise<T>) => Promise<T>;
  clear: () => void;
}

function createProviderTimeout(timeoutMs: number): ProviderTimeout {
  const abortController = new AbortController();
  let timedOut = false;
  let rejectTimeout: (err: Error) => void = () => {};
  const timeoutPromise = new Promise<never>((_, reject) => {
    rejectTimeout = reject;
  });
  const timer = setTimeout(() => {
    timedOut = true;
    abortController.abort();
    rejectTimeout(new ProviderTimeoutError());
  }, timeoutMs);

  return {
    signal: abortController.signal,
    didTimeout: () => timedOut,
    run: <T>(promise: Promise<T>): Promise<T> => Promise.race([promise, timeoutPromise]) as Promise<T>,
    clear: () => clearTimeout(timer),
  };
}

// ── Response reading with byte cap ─────────────────────────────────────

async function readResponseTextWithinCap(
  response: Response,
  byteCap: number,
  signal: AbortSignal
): Promise<{ ok: true; value: string } | { ok: false }> {
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
  const chunks: Uint8Array[] = [];
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

function throwIfProviderTimedOut(signal: AbortSignal): void {
  if (signal?.aborted) throw new ProviderTimeoutError();
}

function concatUint8Arrays(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

// ── JSON parsing ───────────────────────────────────────────────────────

function parseJsonObject(content: string): { ok: true; value: unknown } | { ok: false } {
  try {
    const value = JSON.parse(stripJsonFence(content));
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ok: true, value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ?? trimmed;
}

// ── Hash ───────────────────────────────────────────────────────────────

function hashPromptFull(message: string): string {
  return `sha256:${createHash("sha256").update(message).digest("hex")}`;
}

// ── Security: unsafe intent detection ──────────────────────────────────

function isStructuredIntent(intent: unknown): boolean {
  return !!intent && typeof intent === "object" && !Array.isArray(intent);
}

function hasUnsafeIntent(
  intent: Record<string, unknown>,
  leakContext: { apiKey: string; message: string }
): boolean {
  const serializedIntent = JSON.stringify(intent);
  if (
    containsMarker(serializedIntent, unsafePromptMarker(leakContext.message)) ||
    containsMarker(serializedIntent, leakContext.apiKey)
  ) {
    return true;
  }
  return hasUnsafeIntentKey(intent);
}

function unsafePromptMarker(message: string): string | undefined {
  if (typeof message !== "string") return undefined;
  const trimmed = message.trim();
  if (trimmed.length === 0) return undefined;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2) return trimmed;
  return trimmed.length >= 24 || /[.!?]/.test(trimmed) ? trimmed : undefined;
}

function hasUnsafeIntentKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeIntentKey(item));
  return Object.entries(value).some(([key, child]) => isUnsafeIntentKey(key) || hasUnsafeIntentKey(child));
}

function isUnsafeIntentKey(key: string): boolean {
  return isUnsafeProviderKey(key);
}

function isUnsafeProviderKey(key: string): boolean {
  const normalizedKey = normalizeProviderKey(key);
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

function normalizeProviderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function containsMarker(value: string, marker: string | undefined): boolean {
  return typeof marker === "string" && marker.length > 0 && value.toLowerCase().includes(marker.toLowerCase());
}

// ── Security: confidence sanitization ──────────────────────────────────

interface LeakContext {
  apiKey: string;
  message: string;
  providerValue: Record<string, unknown>;
}

interface ForbiddenMarker {
  value: string;
  allowReverse: boolean;
}

function sanitizeConfidence(value: unknown, leakContext: LeakContext): ProviderConfidence | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  if (!["low", "medium", "high"].includes(obj.level as string)) return undefined;
  if (!Array.isArray(obj.reasons) || !obj.reasons.every((r: unknown) => typeof r === "string")) return undefined;

  const forbiddenMarkers = collectForbiddenMarkers(leakContext);
  const reasons = (obj.reasons as string[])
    .filter((reason) => isSafeReason(reason, forbiddenMarkers))
    .slice(0, 3)
    .map((reason) => reason.slice(0, 160));
  if (reasons.length === 0) return undefined;

  return {
    level: obj.level as "low" | "medium" | "high",
    reasons,
  };
}

function collectForbiddenMarkers(ctx: LeakContext): ForbiddenMarker[] {
  const markers: ForbiddenMarker[] = [];
  for (const marker of [ctx.apiKey, unsafePromptMarker(ctx.message)]) {
    if (typeof marker === "string" && marker.length > 0) {
      markers.push({ value: marker, allowReverse: true });
    }
  }
  collectUnsafeProviderMarkers(ctx.providerValue, markers);
  return markers;
}

function collectUnsafeProviderMarkers(
  value: unknown,
  markers: ForbiddenMarker[],
  insideUnsafeProviderKey = false
): void {
  if (typeof value === "string") {
    if (insideUnsafeProviderKey) markers.push({ value, allowReverse: true });
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectUnsafeProviderMarkers(item, markers, insideUnsafeProviderKey);
    return;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    collectUnsafeProviderMarkers(item, markers, insideUnsafeProviderKey || isUnsafeProviderKey(key));
  }
}

function isSafeReason(reason: string, forbiddenMarkers: ForbiddenMarker[]): boolean {
  const normalizedReason = reason.toLowerCase();
  return !forbiddenMarkers.some((marker) => {
    const normalizedMarker = marker.value.toLowerCase();
    return (
      normalizedReason.includes(normalizedMarker) ||
      (marker.allowReverse && normalizedReason.length >= 4 && normalizedMarker.includes(normalizedReason))
    );
  });
}

// ── Error factory ──────────────────────────────────────────────────────

function providerError(
  providerId: string,
  path: string,
  message: string
): { ok: false; diagnostics: ProviderCallDiagnostic[] } {
  return {
    ok: false,
    diagnostics: [
      {
        severity: "error",
        code: CAPABILITY_UNSUPPORTED,
        message,
        path,
      },
    ],
  };
}

// ── Utilities ──────────────────────────────────────────────────────────

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
