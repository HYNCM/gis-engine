---
agent: product
period: 2026-W40
generated_at: 2026-10-01T08:01:00Z
repo_revision: "0ac2546"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases (API releases/latest, checked 2026-10-01)
  - https://blog.modelcontextprotocol.io/posts/2026-07-28/ (checked 2026-10-01)
  - https://github.com/CesiumGS/cesium/releases (API releases/latest, checked 2026-10-01)
  - https://github.com/visgl/deck.gl/releases (API releases/latest, checked 2026-10-01)
  - https://www.npmjs.com/package/3d-tiles-renderer (npm view, checked 2026-10-01)
  - docs/research/capability-scorecard.md
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# Competitor Updates — 2026-W40

All external facts below were checked in this run on **2026-10-01** via the
GitHub releases API, npm registry, or official project pages, with the source
recorded per item. No unverified claims.

## Signals

### 1. MapLibre GL JS is on v6.x; GIS Engine still pins v5.24.0 — high threat

- Evidence: `maplibre/maplibre-gl-js` releases/latest = **v6.11.2, published
  2026-09-24** (GitHub API). The engine's browser tests and E2E harness load
  UMD **5.24.0** (`tests/e2e/render-pipeline.spec.ts`, compat matrix).
- Impact: the 2D adapter is validated against a superseded major line. Style-spec
  and camera-semantics drift between v5 and v6 is unmeasured; the P1-4 camera
  sync fix was just proven against v5 behavior only.
- Action: @builder (adapter) + @quality — extend `scripts/maplibre-compat-matrix.mjs`
  exact-version set with the current v6 line before the next rendering contract
  change; record results in the compat evidence.
- Confidence: high (API-confirmed versions and dates).

### 2. MCP specification 2026-07-28 is released and breaks session assumptions — high threat to AI operability

- Evidence: official post *The 2026-07-28 Specification*
  (blog.modelcontextprotocol.io, checked 2026-10-01): handshake exchanges and
  session-id headers removed; per-call version/capability metadata; elicitation
  moves to Multi Round-Trip Requests; legacy transports and Dynamic Client
  Registration formally deprecated with a 12-month migration window. The repo
  AGENTS.md pins the MCP server to **2025-11-25**.
- Impact: 14-tool MCP surface stays functional on the pinned revision, but the
  migration clock is running and clients adopting 2026-07-28 transports will
  require stateless routing on our side.
- Action: @orchestrator to scope a spec-migration assessment issue for @builder
  (ai focus); the snake_case tool inventory and input/output schema discipline
  should survive unchanged.
- Confidence: high for what the post states; medium for ecosystem adoption pace.

### 3. 3D ecosystem drift — informational

- Evidence: CesiumJS **1.145** (2026-09-01), deck.gl **v9.4.0** (2026-09-05),
  `3d-tiles-renderer` npm **0.5.3** (~2026-09-18; the project publishes npm tags
  rather than GitHub releases for the checked org).
- Impact: none for the 2D-first roadmap; scene3d remains adapter-gated and the
  stable `view.mode: "scene3d"` promotion stays blocked per AGENTS.md.
- Action: none this week; keep in scorecard.
- Confidence: high (registry/API confirmed).

## Scorecard deltas (one evidence note each)

| Dimension | Δ | Note |
| --- | --- | --- |
| 2D performance / ecosystem | −1 | Core renderer line (v5) now two majors behind upstream validation surface |
| AI operability | −1 | Public MCP servers trending to 2026-07-28 stateless routing; we pin 2025-11-25 |
| 3D readiness | 0 | No change to adapter boundary; external releases informational |
| Developer experience | +1 | This week's remediation made hostile project names and destroy lifecycles safe (see builder evidence) |

## Priority recommendation for @orchestrator

Per the priority formula, MapLibre v6 compatibility evidence scores highest
(competitor_threat 8, technical_debt_reduction 6, delivery_risk 3); MCP
2026-07-28 migration assessment is next (competitor_threat 7, ai_operability
exposure is contractual). Both are planning inputs, not emergency items.
