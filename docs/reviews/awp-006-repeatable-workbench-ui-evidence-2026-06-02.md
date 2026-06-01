---
agent: qa-agent
period: 2026-W23
generated_at: 2026-06-01T17:57:18Z
repo_revision: "156484d7f30163df8c77dbf677b8f651c76cef03"
inputs:
  - docs/reviews/awp-005-command-safe-review-decisions-2026-06-02.md
  - examples/ai-map-workbench/public/app.js
  - examples/ai-map-workbench/public/index.html
  - tests/examples/ai-map-workbench.test.ts
owner: "@qa-agent @docs-agent"
decision_level: advisory
---

# AWP-006 Repeatable Workbench UI Evidence

## Decision

`TASK-2026W23-AWP-006` is implemented as repeatable local workbench UI smoke
evidence. The evidence covers provider selection, evidence rails, diagnostics,
session audit, and accept/block/follow-up review decision states without moving
the workbench out of `examples/`, adding durable storage, writing browser files,
or adding MCP tool names.

This is local example smoke evidence only. It is not release-grade visual
snapshot evidence and does not change the AMW-010 hosted/product promotion
No-go.

The next queued task is `TASK-2026W23-AWP-007` product implementation Go-No-go
gate.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Repeatable UI smoke test | implemented | `tests/examples/ai-map-workbench.test.ts` now drives the browser workflow and asserts map/canvas sizing, provider options, evidence sections, summary/provider rows, audit text, review decisions, command JSON, and empty console/page errors. | UI evidence can be rerun in CI-style deterministic tests instead of relying only on ad-hoc manual smoke. | Keep product claims behind AWP-007. | high |
| Provider selector state | passed | The test asserts enabled `mock-ai`, disabled credential-missing `deepseek`, and browser-safe provider metadata. | Reviewers can see provider readiness without leaking server credentials or URLs. | Add product auth only in a future product task. | high |
| Evidence rails | passed | The test asserts `Summary`, `Provider`, `Diagnostics`, `Feature query`, `Session audit`, `Review decisions`, and `Last command` sections. | The review surface exposes the evidence required by the product boundary. | Preserve these rails when moving to a future app shell. | high |
| Audit and command state | passed | After `make points red`, the UI shows revision `2`, command count `1`, `applied / 1 command(s)`, and `1 -> 2 / mock-ai`. | Browser-visible evidence matches command-only mutation and append-only audit state. | Keep audit records compact and payload-free. | high |
| Review decision states | passed | The UI shows `accepted / review-accepted`, `blocked / manual-review-blocked`, and `follow-up-required / visual-evidence-required`. | Reviewers can record all AMW-009 outcome states through local controls. | Durable review storage remains out of scope. | high |
| Manual browser smoke | passed | In-app browser smoke at `http://127.0.0.1:4324/` showed title `AI Map Workbench`, one MapLibre canvas, map/canvas dimensions `454 x 689`, review status `Reviewed`, three review decisions, and no console errors. | The local example renders and remains usable outside the stubbed test browser. | Convert to visual snapshots only if product promotion opens that requirement. | medium |

## Browser Smoke Notes

Run:

```txt
PORT=4324 pnpm example:ai-map-workbench
```

Observed through the in-app browser:

- Page title: `AI Map Workbench`.
- Map container and MapLibre canvas: `454 x 689` CSS pixels after evidence rail
  layout.
- Provider options: enabled `mock-ai`; disabled `deepseek` with missing
  credential state.
- Evidence sections: `Summary`, `Provider`, `Diagnostics`, `Feature query`,
  `Session audit`, `Review decisions`, and `Last command`.
- Prompt smoke: clicking `Red` applied revision `2`, showed one command, and
  recorded `applied / 1 command(s)` with revision movement `1 -> 2 / mock-ai`.
- Review smoke: clicking `Accept`, `Block`, and `Follow up` produced three
  compact in-memory review decisions linked to the same audit record.
- Browser console errors: none.

## Boundaries Preserved

- No product app movement, hosted deployment, auth system, database, export
  endpoint, or browser file write.
- No raw prompt, provider raw body, credential, feature payload, screenshot,
  full `MapSpec`, command body, or patch retention.
- No new MCP tool names.
- No release-grade visual snapshot claim.

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - passed, 76 tests.
- Browser smoke at `http://127.0.0.1:4324/` - passed for map/canvas framing,
  provider selector, evidence rails, audit, review decisions, and no console
  errors.
- `pnpm test:examples` - passed, 86 tests.
- `pnpm test:docs` - passed, 2 tests.
- `pnpm check` - passed.
- `git diff --check` - passed.
