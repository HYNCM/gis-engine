# AI Map Workbench Real-System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve AI Map Workbench from a local mock example into a provider-gated, evidence-first review system without adding production hosting or direct browser mutation.

**Architecture:** Add a provider normalization boundary that accepts structured intent, validates it through existing generation planner schemas, creates command skeletons, applies commands on the server, and returns generation evidence to the UI. The existing mock planner remains the default fallback and test oracle.

**Tech Stack:** TypeScript AI/engine packages, TypeBox/Ajv schemas already exported by `@gis-engine/engine`, Node ESM workbench server, plain browser UI, Vitest, `MapCommand`, `applyCommands`, `createGenerationEvidenceBundle`.

**2026-05-31 execution status:** Task 1 and AMW-002 are complete. Tasks 2-4
landed as the AMW-003 provider-gated workbench slice: injected provider mode,
compact generation evidence, visible provider/session evidence, and bounded
payload-free audit records. Task 5 documentation has been updated; final gates
passed with focused provider/workbench suites, browser smoke, `git diff
--check`, and `pnpm check`.

---

## File Structure

- Create `packages/ai/src/tools/workbenchProviderPlan.ts`: provider output normalization and diagnostics.
- Modify `packages/ai/src/index.ts`: export the normalizer and types.
- Create `tests/ai/workbench-provider-plan.test.ts`: provider boundary tests.
- Modify `examples/ai-map-workbench/server.mjs`: injectable planner provider, provider evidence, bounded session audit.
- Modify `examples/ai-map-workbench/public/app.js`: render provider/evidence/session fields.
- Modify `examples/ai-map-workbench/public/index.html`: add provider/session evidence slots.
- Modify `examples/ai-map-workbench/public/styles.css`: style provider/session evidence without changing the collapsible layout contract.
- Modify `tests/examples/ai-map-workbench.test.ts`: server provider-mode and audit tests.
- Modify `examples/ai-map-workbench/README.md`: real-system boundary and provider opt-in notes.
- Modify `docs/planning/task-burndown.md`: close or advance AMW tasks only after evidence exists.

## Task 1: Provider Normalization Boundary

**Files:**
- Create: `packages/ai/src/tools/workbenchProviderPlan.ts`
- Modify: `packages/ai/src/index.ts`
- Test: `tests/ai/workbench-provider-plan.test.ts`

- [ ] **Step 1: Write failing provider boundary tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeWorkbenchProviderPlan } from "@gis-engine/ai";

describe("workbench provider plan normalization", () => {
  it("accepts structured provider intent and produces a planner plan", () => {
    const response = normalizeWorkbenchProviderPlan({
      providerId: "fixture-provider",
      promptHash: "sha256:provider-feature-display",
      traceId: "trace-provider-feature-display",
      intent: {
        mapId: "provider-feature-display",
        targetDomains: ["feature-display"],
        styleEdits: [
          {
            layerId: "poi-circles",
            paint: { "circle-color": "#ef4444" }
          }
        ]
      },
      confidence: {
        level: "medium",
        reasons: ["Provider returned structured feature-display intent."]
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider plan to normalize.");
    expect(response.result.plan.status).toBe("ready");
    expect(response.result.plan.request.promptHash).toBe("sha256:provider-feature-display");
    expect(response.result.provider.providerId).toBe("fixture-provider");
    expect(response.result.provider.retainedRawPrompt).toBe(false);
  });

  it("blocks raw prompt retention and free-form mutation output", () => {
    const response = normalizeWorkbenchProviderPlan({
      providerId: "unsafe-provider",
      promptHash: "sha256:unsafe-provider",
      rawPrompt: "make points red",
      javascript: "map.setPaintProperty('poi-circles', 'circle-color', 'red')"
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics.map((diagnostic) => diagnostic.code)).toContain("CAPABILITY.UNSUPPORTED");
    expect(response.diagnostics.map((diagnostic) => diagnostic.path)).toContain("/providerOutput");
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
pnpm vitest run tests/ai/workbench-provider-plan.test.ts
```

Expected: fail because `normalizeWorkbenchProviderPlan` is not exported.

- [ ] **Step 3: Implement the normalizer**

Create `packages/ai/src/tools/workbenchProviderPlan.ts` with a minimal
implementation that imports `DiagnosticCodes`, `planMapGenerationRequest`, and
engine types from `@gis-engine/engine`. Use the existing
`CAPABILITY.UNSUPPORTED` diagnostic code for unsafe provider output and keep the
diagnostic path stable at `/providerOutput`.

```ts
import { DiagnosticCodes, planMapGenerationRequest, type Diagnostic, type MapGenerationPromptPlan } from "@gis-engine/engine";

export interface WorkbenchProviderPlanInput {
  providerId?: string;
  promptHash?: string;
  traceId?: string;
  intent?: unknown;
  confidence?: { level: "low" | "medium" | "high"; reasons: string[] };
  rawPrompt?: unknown;
  javascript?: unknown;
  commands?: unknown;
}

export interface WorkbenchProviderPlan {
  plan: MapGenerationPromptPlan;
  provider: {
    providerId: string;
    retainedRawPrompt: false;
    confidence?: { level: "low" | "medium" | "high"; reasons: string[] };
  };
}

export type WorkbenchProviderPlanResponse =
  | { ok: true; result: WorkbenchProviderPlan; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

export function normalizeWorkbenchProviderPlan(input: WorkbenchProviderPlanInput): WorkbenchProviderPlanResponse {
  const forbidden = ["rawPrompt", "javascript", "commands"].filter((key) => input[key as keyof WorkbenchProviderPlanInput] !== undefined);
  if (forbidden.length > 0 || !input.promptHash || !input.intent) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message: "Provider output must use promptHash and structured intent, not raw prompts, JavaScript, or direct commands.",
          path: "/providerOutput",
          fix: {
            kind: "manual",
            confidence: "high",
            message: "Normalize model output into structured intent before command creation."
          }
        }
      ]
    };
  }

  const plan = planMapGenerationRequest({
    promptHash: input.promptHash,
    traceId: input.traceId,
    plannerId: input.providerId ?? "workbench-provider",
    intent: input.intent
  });

  if (plan.status === "blocked") {
    return { ok: false, diagnostics: plan.diagnostics };
  }

  return {
    ok: true,
    result: {
      plan,
      provider: {
        providerId: input.providerId ?? "workbench-provider",
        retainedRawPrompt: false,
        ...(input.confidence ? { confidence: input.confidence } : {})
      }
    },
    diagnostics: []
  };
}
```

Update `packages/ai/src/index.ts`:

```ts
export {
  normalizeWorkbenchProviderPlan,
  type WorkbenchProviderPlan,
  type WorkbenchProviderPlanInput,
  type WorkbenchProviderPlanResponse
} from "./tools/workbenchProviderPlan.js";
```

- [ ] **Step 4: Run tests and verify green**

Run:

```bash
pnpm vitest run tests/ai/workbench-provider-plan.test.ts
```

Expected: provider boundary tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ai/src/tools/workbenchProviderPlan.ts packages/ai/src/index.ts tests/ai/workbench-provider-plan.test.ts
git commit -m "feat: add workbench provider plan boundary"
```

## Task 2: Inject Provider Mode Into Workbench Server

**Files:**
- Modify: `examples/ai-map-workbench/server.mjs`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing server provider tests**

Add tests that pass an injected `plannerProvider` to `createWorkbenchServer`.

```ts
it("applies injected provider output through the command path", async () => {
  const server = await createWorkbenchServer({
    port: 0,
    plannerProvider: async () => ({
      providerId: "fixture-provider",
      promptHash: "sha256:server-provider",
      traceId: "trace-server-provider",
      intent: {
        mapId: "server-provider",
        targetDomains: ["feature-display"],
        styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
      }
    })
  });

  try {
    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make the point layer red with provider mode" })
    });
    const payload = await response.json();

    expect(payload.status).toBe("applied");
    expect(payload.provider.providerId).toBe("fixture-provider");
    expect(payload.commandEvidence.committed).toBe(true);
    expect(payload.summary.revision).toBe("2");
  } finally {
    await server.close();
  }
});

it("blocks unsafe provider output without mutating the active spec", async () => {
  const server = await createWorkbenchServer({
    port: 0,
    plannerProvider: async () => ({
      providerId: "unsafe-provider",
      promptHash: "sha256:unsafe-server-provider",
      rawPrompt: "make points red",
      javascript: "map.setPaintProperty('poi-circles', 'circle-color', 'red')"
    })
  });

  try {
    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "unsafe provider output" })
    });
    const payload = await response.json();

    expect(payload.status).toBe("blocked");
    expect(payload.summary.revision).toBe("1");
    expect(payload.diagnostics.map((diagnostic) => diagnostic.code)).toContain("CAPABILITY.UNSUPPORTED");
  } finally {
    await server.close();
  }
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: fail because `createWorkbenchServer` does not accept
`plannerProvider`.

- [ ] **Step 3: Implement provider mode**

Modify `server.mjs` so `createWorkbenchServer(options)` accepts
`options.plannerProvider`. In `/api/chat`, use the injected provider when
present, normalize the provider result, create a command skeleton, apply its
commands through `applyCommands`, and return provider evidence. Keep the current
mock planner path as the default.

- [ ] **Step 4: Run tests and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: all workbench API tests pass.

- [ ] **Step 5: Commit**

```bash
git add examples/ai-map-workbench/server.mjs tests/examples/ai-map-workbench.test.ts
git commit -m "feat: support provider-gated workbench planning"
```

## Task 3: Surface Provider And Delivery Evidence In The UI

**Files:**
- Modify: `examples/ai-map-workbench/public/index.html`
- Modify: `examples/ai-map-workbench/public/app.js`
- Modify: `examples/ai-map-workbench/public/styles.css`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Add failing API assertions for evidence fields**

Extend provider-mode API tests to assert:

```ts
expect(payload.provider).toMatchObject({
  providerId: "fixture-provider",
  retainedRawPrompt: false
});
expect(payload.generationEvidence.delivery.status).toBe("ready");
expect(payload.generationEvidence.planner.provided).toBe(true);
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: fail because `generationEvidence` and provider UI fields are not
returned yet.

- [ ] **Step 3: Implement evidence response and UI rendering**

Use `createGenerationEvidenceBundle` in `server.mjs` after provider skeleton
creation. Return a compact `generationEvidence` object with planner, delivery,
diagnostic counts, and prompt hash. In the browser, add a `Provider` evidence
section showing provider id, retained raw prompt state, planner confidence, and
delivery status.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: provider/evidence tests pass.

- [ ] **Step 5: Browser smoke**

Run:

```bash
pnpm example:ai-map-workbench
```

Expected: local page loads, mock mode still works, provider evidence section is
empty or marked `mock` in default mode, collapsible sidebars still resize the
map.

- [ ] **Step 6: Commit**

```bash
git add examples/ai-map-workbench/public/index.html examples/ai-map-workbench/public/app.js examples/ai-map-workbench/public/styles.css examples/ai-map-workbench/server.mjs tests/examples/ai-map-workbench.test.ts
git commit -m "feat: show provider evidence in workbench"
```

## Task 4: Bounded Session Audit

**Files:**
- Modify: `examples/ai-map-workbench/server.mjs`
- Modify: `examples/ai-map-workbench/public/app.js`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing audit tests**

Add a test for `GET /api/audit`:

```ts
it("keeps bounded payload-free audit records", async () => {
  const server = await createWorkbenchServer({ port: 0 });
  try {
    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const response = await fetch(`${server.url}/api/audit`);
    const payload = await response.json();

    expect(payload.records).toHaveLength(1);
    expect(payload.records[0]).toMatchObject({
      status: "applied",
      commandCount: 1,
      fromRevision: "1",
      toRevision: "2"
    });
    expect(JSON.stringify(payload.records[0])).not.toContain("West Lake");
    expect(JSON.stringify(payload.records[0])).not.toContain("make points red");
  } finally {
    await server.close();
  }
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: fail because `/api/audit` is not implemented.

- [ ] **Step 3: Implement bounded audit**

Add an in-memory audit array capped at 50 records. Store only session id, trace
id, prompt hash when available, provider id, status, command count, diagnostic
counts, from/to revision, and timestamp. Do not store raw prompt text, raw
features, screenshots, or provider credentials.

- [ ] **Step 4: Run tests and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: audit tests pass.

- [ ] **Step 5: Commit**

```bash
git add examples/ai-map-workbench/server.mjs examples/ai-map-workbench/public/app.js tests/examples/ai-map-workbench.test.ts
git commit -m "feat: add workbench session audit"
```

## Task 5: Docs, Planning Closure, And Gates

**Files:**
- Modify: `examples/ai-map-workbench/README.md`
- Modify: `docs/planning/task-burndown.md`
- Create: `docs/reviews/amw-002-provider-boundary-2026-05-31.md`

- [ ] **Step 1: Update README and review report**

Document mock mode, injected provider mode, supported evidence fields,
credential policy, and non-goals. Write an AMW-002 review report with evidence,
impact, action, and confidence rows.

- [ ] **Step 2: Update burndown**

Mark `TASK-2026W22-AMW-002` done only after provider boundary tests, the product
architecture document, and docs gates pass. Leave server provider mode, UI
provider evidence, and audit work queued under `AMW-003` and `AMW-004` unless
their evidence has landed.

- [ ] **Step 3: Run focused gates**

Run:

```bash
pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts
pnpm test:ai
pnpm test:examples
pnpm test:docs
git diff --check
```

Expected: all commands pass.

- [ ] **Step 4: Run full gate**

Run:

```bash
pnpm check
```

Expected: full build and deterministic test suite pass.

- [ ] **Step 5: Commit**

```bash
git add examples/ai-map-workbench/README.md docs/planning/task-burndown.md docs/reviews/amw-002-provider-boundary-2026-05-31.md
git commit -m "docs: close workbench provider boundary plan"
```

## Self-Review

- Spec coverage: this plan covers the provider boundary, command-only mutation,
  generation evidence, UI review state, session audit, docs, and promotion
  gates from `ai-map-workbench-real-system-evolution.md`.
- Placeholder scan: no TODO/TBD/date placeholders are used.
- Type consistency: provider input, normalized plan, generation evidence, and
  audit terms stay aligned across tasks.
