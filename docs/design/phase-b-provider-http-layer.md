## Phase B: Provider HTTP Layer — Module Design

### 1. Goal

Make `npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek --prompt '显示北京地铁站'` perform a real end-to-end AI generation pipeline: call an OpenAI-compatible provider over HTTP, receive structured intent, feed it through the engine's plan → skeleton → apply → validate → evidence pipeline, and write the resulting map artifacts.

Currently, `generate.ts` hardcodes `intent: { targetDomains: ["feature-display"] }` and never makes an HTTP call. The provider module (`provider.ts`) is diagnostics-only. This design adapts the production-grade `callOpenAiCompatibleProvider` pattern from `examples/ai-map-workbench/openai-compatible-provider.mjs` into the CLI package.

### 2. Scope

In scope: provider HTTP call, JSON response parsing, confidence sanitization, unsafe intent detection, API key reading from env, system prompt for CLI (no existing map), timeout (20s), byte cap (64KB), error diagnostics, integration with existing `generate.ts` pipeline, tests.

Out of scope: streaming responses, multi-turn conversation, session/stale detection (CLI is one-shot), provider profile persistence, base URL policy enforcement (HTTPS/private IP blocking — deferred to v0.4).

### 3. File Plan

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/cli/src/provider-http.ts` | **NEW** | HTTP client, JSON parsing, confidence sanitization, unsafe intent detection |
| `packages/cli/src/provider.ts` | MODIFY | Add `resolveProviderProfile()`, `readProviderApiKey()`, `CLI_API_KEY_ENVS` |
| `packages/cli/src/generate.ts` | MODIFY | Replace hardcoded intent with provider call; fix `hashPrompt` format |
| `packages/cli/src/config.ts` | MODIFY | Add `timeout` and `apiKey` optional fields |
| `packages/cli/src/bin.ts` | MODIFY | Pass `timeout`/`apiKey` through to `generate()` |
| `packages/cli/src/index.ts` | MODIFY | Export new public types |
| `tests/cli/provider-http.test.ts` | **NEW** | Provider HTTP unit tests (mock fetch) |
| `tests/cli/cli.test.ts` | MODIFY | Update existing tests for `hashPrompt` format change |

### 4. Module: `provider-http.ts`

#### 4.1 Public Interface

```typescript
export const DEFAULT_PROVIDER_TIMEOUT_MS = 20_000;
export const DEFAULT_PROVIDER_BYTE_CAP = 64 * 1024;

export interface ProviderCallInput {
  profile: ProviderProfile;
  apiKey: string;
  message: string;           // user prompt (raw text)
  fetchImpl?: typeof fetch;  // injectable for tests
  timeoutMs?: number;
  responseByteCap?: number;
}

export interface ProviderProfile {
  id: string;                // e.g. "deepseek", "openai", custom
  baseUrl: string;           // e.g. "https://api.deepseek.com/v1"
  model: string;             // e.g. "deepseek-chat"
}

// Discriminated union result
export type ProviderCallResult =
  | { ok: true;  providerOutput: ProviderOutput }
  | { ok: false; diagnostics: ProviderCallDiagnostic[] };

export interface ProviderOutput {
  providerId: string;
  promptHash: string;        // "sha256:<hex>" (full 64-char hex)
  traceId: string;           // "provider.<id>.<uuid>"
  intent: Record<string, unknown>;   // structured intent from AI
  confidence?: ProviderConfidence;
}

export interface ProviderConfidence {
  level: "low" | "medium" | "high";
  reasons: string[];         // max 3, each max 160 chars
}

export interface ProviderCallDiagnostic {
  severity: "error";
  code: string;              // e.g. "PROVIDER.TIMEOUT", "PROVIDER.HTTP_ERROR"
  message: string;
  path: string;              // e.g. "/providerRequest/timeout"
}
```

#### 4.2 Internal Functions (adapted from workbench)

```typescript
// Core HTTP call — adapted from callOpenAiCompatibleProvider
async function callProvider(input: ProviderCallInput): Promise<ProviderCallResult>

// Timeout via AbortController + Promise.race
function createProviderTimeout(timeoutMs: number): ProviderTimeout

// Streaming byte-cap reader
async function readResponseTextWithinCap(
  response: Response, byteCap: number, signal: AbortSignal
): Promise<{ ok: true; value: string } | { ok: false }>

// JSON parsing with ```json``` fence stripping
function parseJsonObject(content: string): { ok: true; value: unknown } | { ok: false }
function stripJsonFence(content: string): string

// Security: unsafe intent key detection
function isStructuredIntent(intent: unknown): boolean
function hasUnsafeIntent(intent: object, ctx: { apiKey: string; message: string }): boolean
function hasUnsafeIntentKey(value: unknown): boolean
function isUnsafeProviderKey(key: string): boolean  // blocks: raw, prompt, secret, apikey, credential, password, token, etc.

// Security: confidence sanitization
function sanitizeConfidence(value: unknown, ctx: LeakContext): ProviderConfidence | undefined
function collectForbiddenMarkers(ctx: LeakContext): ForbiddenMarker[]
function isSafeReason(reason: string, markers: ForbiddenMarker[]): boolean

// System prompt — CLI variant (no existing map summary)
function cliSystemPrompt(): string

// Error factory
function providerError(providerId: string, path: string, message: string): ProviderCallResult & { ok: false }

// Hash — full sha256 with prefix (matches workbench format)
function hashPromptFull(message: string): string  // "sha256:<64-hex-chars>"
```

#### 4.3 System Prompt

The workbench's system prompt includes "Current map summary: ..." because it edits an existing map. The CLI generates from scratch, so the prompt is simpler:

```
You are a GIS map generation assistant.
Convert the user's map description into a structured JSON intent object.
The intent object may contain these fields:
  targetDomains: array of "feature-display" | "spatial-analysis" | "scene-browsing"
  view: { center: [lng, lat], zoom: number, bearing?: number, pitch?: number }
  sources: object mapping source-id to source spec (GeoJSON, raster, vector, pmtiles)
  layers: array of layer specs { id, source, "source-layer"?, type, paint?, layout?, filter? }
  styleEdits: array of { layerId, paint?, layout? }
  interactions: { popup?, tooltip?, highlight? }
  analysis: { operations: [...] }
Return only a JSON object with an "intent" key. Optionally include "confidence" with { level, reasons }.
Do not return JavaScript, commands, MapSpec patches, raw prompts, markdown, or prose.
```

This prompt tells the AI the exact schema of `MapGenerationPlannerIntentSchema` without exposing internal type names. It constrains output to the fields the engine's planner accepts.

#### 4.4 Key Differences from Workbench

| Aspect | Workbench | CLI |
|--------|-----------|-----|
| Execution | Long-lived server, multi-turn | One-shot, single call |
| Map context | Has existing `baseSpec` summary | No existing map (first generation) |
| Stale detection | `fromRevision`/`fromEpoch` checks | Not needed |
| HTTPS enforcement | `validateProviderBaseUrl` blocks private IPs | Deferred (v0.4), trust user-provided `--base-url` |
| promptHash format | `sha256:<64-hex>` | Same (fix current 16-char truncated format) |
| Error handling | Returns HTTP 400 to client | Prints diagnostics, `process.exit(1)` |
| Confidence | Forwarded to UI | Stored in `delivery-summary.json` |

### 5. Module: `provider.ts` Changes

Add two new functions and a constant:

```typescript
// Maps known provider IDs to their API key environment variable
export const CLI_API_KEY_ENVS: Record<string, string> = {
  deepseek: "DEEPSEEK_API_KEY",
  openai: "OPENAI_API_KEY",
};

/**
 * Build a ProviderProfile from CLI config values.
 * Uses DEFAULT_MODELS / DEFAULT_BASE_URLS when not explicitly provided.
 */
export function resolveProviderProfile(
  providerId: string,
  options?: { model?: string; baseUrl?: string }
): ProviderProfile {
  const id = providerId.toLowerCase();
  return {
    id,
    model: options?.model ?? DEFAULT_MODELS[id] ?? "",
    baseUrl: options?.baseUrl ?? DEFAULT_BASE_URLS[id] ?? "",
  };
}

/**
 * Read the API key for a provider from environment variables.
 * Returns undefined if no key is configured.
 */
export function readProviderApiKey(providerId: string): string | undefined {
  const envKey = CLI_API_KEY_ENVS[providerId.toLowerCase()];
  if (!envKey) return undefined;
  const value = process.env[envKey];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
```

The existing `createProviderDiagnostics()` function is kept unchanged. Its `status: "unconfigured"` diagnostic remains correct for the case where no API key is set.

### 6. Module: `generate.ts` Changes

#### 6.1 `hashPrompt` Fix

The current `hashPrompt` produces a 16-char truncated hex without the `sha256:` prefix. The `normalizeWorkbenchProviderPlan` expects promptHash matching `/^sha256:[A-Za-z0-9._:-]{1,96}$/`.

```typescript
// BEFORE (broken for normalizeWorkbenchProviderPlan):
export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

// AFTER (compatible format — must match /^sha256:[A-Za-z0-9._:-]{1,96}$/):
export function hashPrompt(prompt: string): string {
  return `sha256:${createHash("sha256").update(prompt).digest("hex").slice(0, 32)}`;
}
```

Using 32 hex chars (128 bits) after the prefix — enough uniqueness while staying compact. Total string length: 39 chars, well within the 96-char schema limit.

**Critical**: `normalizeWorkbenchProviderPlan` validates promptHash against the regex `/^sha256:[A-Za-z0-9._:-]{1,96}$/` (in `workbenchProviderPlan.ts:100`). The current CLI format (bare 16-char hex, no prefix) would be **rejected**, causing the entire pipeline to fail with `ok: false`. This fix is a hard requirement for Phase B.

**Backward compatibility**: This changes the output format of `hashPrompt`, which is a public export. This is a breaking change for any code that depends on the 16-char format. Since the CLI is pre-1.0 (v0.2.0 → v0.3.0), this is acceptable as a minor-version bump.

The 4 existing `hashPrompt` tests need updating to expect the new format.

#### 6.2 Provider Dispatch

```typescript
export interface GenerateOptions {
  projectName: string;
  provider: string;
  model?: string;
  baseUrl?: string;
  prompt?: string;
  apiKey?: string;        // NEW: explicit API key (overrides env)
  timeout?: number;       // NEW: provider timeout in ms
  dryRun: boolean;
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const promptText = opts.prompt ?? "Create a map with GeoJSON points";
  const promptHash = hashPrompt(promptText);
  const traceId = `cli-${Date.now().toString(36)}`;

  // ... console banner ...

  // ── Step 1: Resolve intent ──────────────────────────────────────
  console.log(`\n  [1/5] Resolving provider intent...`);

  let intent: Record<string, unknown>;
  let providerConfidence: ProviderConfidence | undefined;

  if (opts.provider === "mock") {
    // Mock: deterministic, no HTTP call
    intent = { targetDomains: ["feature-display"] };
    console.log(`  ✓ Mock provider: deterministic intent`);
  } else {
    // Real provider: HTTP call
    const profile = resolveProviderProfile(opts.provider, {
      model: opts.model,
      baseUrl: opts.baseUrl,
    });
    const apiKey = opts.apiKey ?? readProviderApiKey(opts.provider);
    if (!apiKey) {
      console.error(`  ❌ No API key found. Set ${CLI_API_KEY_ENVS[opts.provider] ?? `<PROVIDER>_API_KEY`} environment variable or pass --api-key.`);
      process.exit(1);
    }

    const providerResult = await callProvider({
      profile,
      apiKey,
      message: promptText,
      timeoutMs: opts.timeout,
    });

    if (!providerResult.ok) {
      console.error(`  ❌ Provider call failed:`);
      for (const d of providerResult.diagnostics) {
        console.error(`    [${d.code}] ${d.message}`);
      }
      process.exit(1);
    }

    intent = providerResult.providerOutput.intent;
    providerConfidence = providerResult.providerOutput.confidence;
    console.log(`  ✓ Provider: ${profile.id} (${profile.model})`);
    if (providerConfidence) {
      console.log(`  ✓ Confidence: ${providerConfidence.level} (${providerConfidence.reasons.length} reasons)`);
    }
  }

  // ── Step 2: Provider plan normalization ──────────────────────────
  console.log(`  [2/5] Provider plan normalization...`);
  const providerInput = {
    providerId: opts.provider,
    promptHash,
    traceId,
    intent,
    ...(providerConfidence ? { confidence: providerConfidence } : {}),
  };
  const providerResult = normalizeWorkbenchProviderPlan(providerInput);
  if (!providerResult.ok) {
    console.error(`  ❌ Provider plan failed:`, providerResult.diagnostics);
    process.exit(1);
  }
  console.log(`  ✓ Plan: ${providerResult.result.plan.status}`);

  // ── Step 3: Create command skeleton (from plan, not hardcoded) ───
  console.log(`  [3/5] Creating command skeleton...`);
  const plan = providerResult.result.plan;
  // plan.request conforms to MapGenerationRequestSchema.
  // If baseSpec is absent, createMapGenerationCommandSkeleton synthesizes
  // a minimal spec via createBaseSpec(request.mapId).
  const skeleton = createMapGenerationCommandSkeleton(plan.request);
  console.log(`  ✓ Skeleton: ${skeleton.status}, ${skeleton.commands.length} commands`);

  // ── Step 4: Apply commands and validate ───────────────────────────
  // ... (same as current) ...

  // ── Step 5: Create evidence bundle ────────────────────────────────
  const evidenceInput = {
    promptHash,
    skeleton,
    planner: {
      plan,
      ...(providerConfidence ? { confidence: providerConfidence } : {}),
    },
  };
  // ... (same as current) ...

  // Write output files (same as current, plus confidence in delivery-summary)
}
```

#### 6.3 Pipeline Step Count Change

The current 5-step pipeline becomes:

| Step | Current | New |
|------|---------|-----|
| 1/5 | Provider plan normalization | **Resolve provider intent** (HTTP call or mock) |
| 2/5 | Plan map generation request | Provider plan normalization (via `normalizeWorkbenchProviderPlan`) |
| 3/5 | Create command skeleton | Create command skeleton (now from plan.request, not hardcoded) |
| 4/5 | Apply commands and validate | Apply commands and validate (unchanged) |
| 5/5 | Create evidence bundle | Create evidence bundle (unchanged) |

### 7. Module: `config.ts` Changes

Two new optional fields:

```typescript
export interface CliConfig {
  // ... existing fields ...
  apiKey?: string;     // NEW: explicit API key (overrides env var)
  timeout?: number;    // NEW: provider timeout in ms
}
```

New arg parsing:

```typescript
// --api-key <value> or --api-key=<value>
// --timeout <ms> or --timeout=<ms>

// Env var: GIS_ENGINE_API_KEY (fallback for any provider)
// Env var: GIS_ENGINE_TIMEOUT
```

The `--api-key` flag is optional and intended for development/testing. In production use, env vars (`DEEPSEEK_API_KEY`, `OPENAI_API_KEY`) are preferred.

### 8. Module: `bin.ts` Changes

Minimal — pass the two new fields through:

```typescript
const result = await generate({
  projectName: config.projectName,
  provider: config.provider,
  model: config.model,
  baseUrl: config.baseUrl,
  prompt: config.prompt,
  apiKey: config.apiKey,      // NEW
  timeout: config.timeout,    // NEW
  dryRun: config.dryRun,
});
```

Update `printHelp()` to document `--api-key` and `--timeout`.

### 9. Error Handling Strategy

All errors produce typed diagnostics and exit with code 1. No exceptions leak to the user.

| Error | Code | Path | User-Facing Message |
|-------|------|------|---------------------|
| No API key configured | — | — | "No API key found. Set DEEPSEEK_API_KEY or pass --api-key." |
| HTTP timeout (>20s) | `PROVIDER.TIMEOUT` | `/providerRequest/timeout` | "Provider request timed out. Try again or increase --timeout." |
| HTTP non-2xx | `PROVIDER.HTTP_ERROR` | `/providerRequest` | "Provider request failed with HTTP {status}." |
| Response > byte cap | `PROVIDER.RESPONSE_TOO_LARGE` | `/providerResponse/size` | "Provider response exceeded the byte cap." |
| Invalid JSON response | `PROVIDER.INVALID_JSON` | `/providerRequest` | "Provider response was not valid JSON." |
| Missing content | `PROVIDER.NO_CONTENT` | `/providerResponse` | "Provider response did not include message content." |
| Content not JSON object | `PROVIDER.INVALID_CONTENT` | `/providerResponse` | "Provider response content must be a JSON object." |
| No structured intent | `PROVIDER.NO_INTENT` | `/providerResponse` | "Provider response must include structured intent." |
| Unsafe intent (leak) | `PROVIDER.UNSAFE_INTENT` | `/providerResponse` | "Provider response contains unsupported raw or sensitive content." |
| Network error | `PROVIDER.NETWORK_ERROR` | `/providerRequest` | "Provider request failed before a valid response." |
| Plan blocked | (from engine) | — | "Provider plan failed: {diagnostics}" |

### 10. Security Model

**API key handling:**
- API keys are read from environment variables at call time, never stored on disk.
- The `--api-key` flag exists for development convenience but is not recommended for production.
- API keys are never included in output files, logs, or diagnostics.
- The `providerError()` factory never includes the API key in any field.

**Prompt safety:**
- The raw prompt text is sent to the provider in the HTTP body, then immediately discarded.
- `hashPrompt()` produces a `sha256:<hex>` digest; the raw prompt is never written to output files.
- `normalizeWorkbenchProviderPlan()` enforces two gates:
  1. **Forbidden fields gate**: If the provider output object contains any of `rawPrompt`, `prompt`, `promptText`, `javascript`, `commands`, `mapSpec`, or `patch` as own properties, normalization returns `ok: false` immediately.
  2. **promptHash regex gate**: The `promptHash` must match `/^sha256:[A-Za-z0-9._:-]{1,96}$/` — bare hashes are rejected.
  3. **Intent required gate**: Both `promptHash` and `intent` must be present and truthy.

**Intent safety (adapted from workbench):**
- `hasUnsafeIntent()` checks that the AI-returned intent does not echo back the raw prompt or API key.
- `hasUnsafeIntentKey()` blocks intent keys containing: raw, prompt, secret, apikey, credential, password, token, authorization, bearertoken, accesstoken, providertrace, providerresponse, responsebody, response.
- `sanitizeConfidence()` filters forbidden markers from confidence reasons and limits to 3 reasons x 160 chars.

**No HTTPS enforcement (deferred):**
- The workbench's `validateProviderBaseUrl()` blocks non-HTTPS and private IPs in product mode.
- For CLI v0.3, we trust the user's `--base-url` input. HTTPS enforcement is deferred to v0.4 when the CLI ships with a curated provider registry.

### 11. Test Matrix

New file: `tests/cli/provider-http.test.ts` with mock `fetch` injection.

| Group | Test Cases | Count |
|-------|-----------|-------|
| **Happy path** | Valid JSON response → ok result with intent | 1 |
| **Happy path** | Response with confidence → sanitized confidence | 1 |
| **Happy path** | Response with ```json``` fence → parsed correctly | 1 |
| **Timeout** | Fetch exceeds timeout → PROVIDER.TIMEOUT | 1 |
| **Timeout** | Custom timeoutMs respected | 1 |
| **Byte cap** | Response exceeds byte cap → PROVIDER.RESPONSE_TOO_LARGE | 1 |
| **HTTP error** | Non-2xx response → PROVIDER.HTTP_ERROR with status | 1 |
| **JSON errors** | Invalid JSON body → PROVIDER.INVALID_JSON | 1 |
| **JSON errors** | No message content → PROVIDER.NO_CONTENT | 1 |
| **JSON errors** | Content not object → PROVIDER.INVALID_CONTENT | 1 |
| **Intent** | No intent field → PROVIDER.NO_INTENT | 1 |
| **Intent** | Intent echoes API key → PROVIDER.UNSAFE_INTENT | 1 |
| **Intent** | Intent echoes raw prompt → PROVIDER.UNSAFE_INTENT | 1 |
| **Intent** | Intent has unsafe key ("rawPrompt") → PROVIDER.UNSAFE_INTENT | 1 |
| **Confidence** | Confidence with API key in reason → filtered out | 1 |
| **Confidence** | Confidence with >3 reasons → truncated to 3 | 1 |
| **Confidence** | Invalid confidence level → undefined | 1 |
| **Confidence** | Non-array reasons → undefined | 1 |
| **No API key** | Missing apiKey → immediate error, no fetch | 1 |
| **Network error** | Fetch throws → PROVIDER.NETWORK_ERROR | 1 |
| **System prompt** | CLI system prompt does not include map summary | 1 |
| | **Total** | **21** |

Existing tests to update:
- `hashPrompt` group (4 tests): update expected format from 16-char hex to `sha256:<32-hex>`.

Total tests after Phase B: 52 + 21 - 4 (updated, not removed) = **73 tests**.

### 12. Version and Changelog

Bump: `0.2.0` → `0.3.0` (new feature: real provider HTTP call).

`CHANGELOG.md` entry under `[0.3.0]`:

```
### Added
- Provider HTTP layer: real OpenAI-compatible API calls from CLI generate pipeline
- `--api-key` flag and `DEEPSEEK_API_KEY`/`OPENAI_API_KEY` env var support
- `--timeout` flag for provider request timeout (default: 20s)
- Confidence sanitization and unsafe intent detection (from workbench)
- CLI-specific system prompt for first-generation (no existing map)

### Changed
- `hashPrompt()` now produces `sha256:<32-hex>` format (was 16-char truncated hex)
- Generate pipeline resolves intent from provider instead of hardcoded `targetDomains`
- Pipeline step 1 is now "Resolve provider intent" (HTTP call for real providers, deterministic for mock)
```

### 13. Implementation Order

| Step | Task | Files | Est. |
|------|------|-------|------|
| B-1 | Create `provider-http.ts` with `callProvider`, timeout, byte cap, JSON parsing | `provider-http.ts` | 1d |
| B-2 | Add security functions: unsafe intent detection, confidence sanitization | `provider-http.ts` | 0.5d |
| B-3 | Extend `provider.ts` with `resolveProviderProfile`, `readProviderApiKey`, `CLI_API_KEY_ENVS` | `provider.ts` | 0.5d |
| B-4 | Refactor `generate.ts`: fix `hashPrompt`, wire provider call, 5-step pipeline | `generate.ts` | 1d |
| B-5 | Update `config.ts` + `bin.ts` for `--api-key` and `--timeout` | `config.ts`, `bin.ts` | 0.5d |
| B-6 | Write 21 provider HTTP tests + update 4 hashPrompt tests | `provider-http.test.ts`, `cli.test.ts` | 1d |
| B-7 | Update docs: CLI README, CHANGELOG, feature-spec | `README.md`, `CHANGELOG.md`, feature-spec | 0.5d |
| B-8 | Final verification: `vitest run`, `pnpm build`, `publish:dry`, bundle size check | — | 0.5d |
| | **Total** | | **5.5d** |

### 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI model returns non-JSON or unexpected schema | Medium | Low | Comprehensive error diagnostics; fence stripping; strict validation before pipeline entry |
| `hashPrompt` format change breaks downstream | Low | Low | CLI is pre-1.0; only internal consumers (delivery-summary.json); update tests |
| API key accidentally logged | Low | High | `hasUnsafeIntent` + `sanitizeConfidence` gates; never included in output files; `providerError()` factory excludes secrets |
| Bundle size growth from HTTP utilities | Low | Medium | Current CLI dist is ~5.9 KB gzipped (30 KB budget). Adding ~100 lines of HTTP utilities adds ~1-2 KB gzipped, reaching ~7-8 KB total. Well within budget. |
| System prompt produces low-quality intent for complex prompts | Medium | Medium | Confidence signal surfaces quality; users can iterate with `--prompt`; future: few-shot examples in prompt |
