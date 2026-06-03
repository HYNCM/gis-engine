---
agent: qa-agent
period: 2026-06-03
generated_at: 2026-06-03T00:46:51Z
repo_revision: "11d56fab4e866a242663b9c249b26934289628e1"
inputs:
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/EvidencePanel.tsx
  - apps/studio/README.md
  - tests/studio/studio-server.test.ts
  - tests/studio/studio-bundle.test.ts
owner: "@qa-agent @docs-agent"
decision_level: advisory
---

# SER-001 Studio Review Evidence Runtime

## Decision

`SER-001` local Studio review-evidence runtime is verified on the current
`apps/studio` surface. The bounded product slice now closes the local loop from
natural-language map mutation to compact audit evidence to append-only review
decisions, and the right-side evidence rail renders the same state through the
Studio app instead of only through tests.

This is local runtime evidence only. It does not promote Studio to hosted
deployment, durable review storage, auth-backed project access, or release-grade
visual certification.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| API command-to-audit chain | pass | `POST /api/chat` at `http://127.0.0.1:4325/api/chat` with `show only landmarks` returned `status: "applied"`, `commandEvidence.commandCount: 1`, and a `points-layer` filter of `["==", ["get", "category"], "landmark"]`; `GET /api/audit` then showed compact record `studio...2` with `fromRevision: "1"` and `toRevision: "2"`. | Studio review state is backed by command-only mutation and payload-free audit evidence instead of browser-only UI state. | Keep future Studio edits on the same `/api/chat` -> `applyCommands` -> `/api/audit` path. | high |
| Review-decision runtime | pass | `POST /api/review-decision` and `GET /api/review-decisions` at `http://127.0.0.1:4325` produced append-only `accepted`, `blocked`, and `follow-up-required` decisions; the latest decision is `review-4` with `reasonCodes: ["delivery-needs-confirmation"]` and `followUpTaskIds: ["TASK-2026W23-SER-001"]`. | Review actions are live product evidence over compact audit records rather than a second map-mutation path. | Preserve append-only review behavior and keep follow-up tasks explicit. | high |
| Browser-visible evidence rail | pass | Browser smoke on `http://127.0.0.1:4325/` showed `Review Decision`, `Replay Context`, `Session Audit`, `Review History`, and `Diagnostics`, plus visible assistant confirmations for `accepted`, `blocked`, and `follow-up-required`. | The Studio product surface now exposes the review loop as a first-class visible workflow. | Reuse these sections as the baseline for future Studio promotion work. | high |
| Provider metadata safety | pass | `GET /api/providers` returned browser-safe profiles only: enabled `mock-ai`, disabled `deepseek`, model name, and no server credential or base URL material. | Provider readiness remains visible without leaking secret or server-only configuration. | Keep all future provider metadata browser-safe and credential-free. | high |
| Browser runtime hygiene | pass | Browser console warning/error logs were empty during the local smoke run; `tab.dev.logs({ levels: ['error', 'warn'] })` returned `[]`. | The evidence workflow does not currently introduce visible runtime regressions during the local product path. | Re-run browser smoke after any Studio panel, provider, or review-surface changes. | medium |

## Browser Smoke Notes

Run:

```txt
PORT=4325 pnpm studio:server
```

Observed through the in-app browser:

- Page title: `AI Map Studio | GIS Engine`.
- Prompt smoke: clicking `Landmarks` produced `Done. 2 path(s) changed.` and
  moved revision from `1` to `2` in the visible evidence rail.
- Review smoke: clicking `Accept`, `Block`, and `Follow` produced visible
  assistant confirmations and appended review history entries for
  `review-accepted`, `manual-review-blocked`, and
  `delivery-needs-confirmation`.
- Evidence rail showed compact audit entries `0 to 1` and `1 to 2`, plus a
  `follow-up-required` decision carrying `TASK-2026W23-SER-001`.
- Browser console warnings/errors: none.

## Boundaries Preserved

- No hosted deployment, auth flow, durable database, export endpoint, or secret
  management UI.
- No raw prompt, provider raw body, credential, screenshot payload, full
  `MapSpec`, command body, or patch retention in audit or review records.
- No new MCP tool names or browser-side mutation path around `applyCommands`.
- No release-grade visual snapshot or product/hosted promotion claim.

## Verification

- `pnpm test:studio` - passed, 27 tests.
- `pnpm studio:build` - passed.
- `git diff --check` - passed before the review document was added.
- API chain at `http://127.0.0.1:4325` - passed for `/api/state`,
  `/api/providers`, `/api/basemaps`, `/api/chat`, `/api/audit`,
  `/api/review-decision`, and `/api/review-decisions`.
- Browser smoke at `http://127.0.0.1:4325/` - passed for map prompt flow,
  evidence rail visibility, append-only review decisions, review history, and
  empty console warning/error logs.
