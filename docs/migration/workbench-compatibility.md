---
agent: orchestrator
period: 2026-09-05
generated_at: 2026-09-05T00:00:00Z
repo_revision: "031129e3"
inputs:
  - docs/intent/project-definition.md
  - apps/workbench
owner: "@orchestrator"
decision_level: advisory
---

# Workbench Naming Compatibility

Workbench is the only visible product name. The identifiers below are retained
only so existing local projects, scripts, and clients can migrate without
data loss.

| Compatibility identifier | Scope | Policy | Retirement signal |
| --- | --- | --- | --- |
| `apps/studio` path aliases | source checkout and package scripts | resolve to Workbench; no new files may use the path | remove after one major Workbench format migration |
| `studio:dev`, `studio:build`, `studio:server` | root CLI aliases | supported aliases with Workbench help text | deprecation notice in the next major CLI release |
| `STUDIO_DB_PATH` | legacy SQLite import | read-only fallback only; never canonical state | remove after the documented migration window |
| `studio.local-handoff.v1` and `studio.review-ledger.v1` | stored historical evidence ids | parse and display as compatibility metadata | keep parsers indefinitely; do not emit for new records |
| `GIS Engine Studio` user-agent/diagnostic text | old clients and logs | accept on input where required; new UI/docs emit Workbench | remove when old client support is dropped |
| review-console compatibility route | old bookmarks | redirect/read-only compatibility surface | remove after a versioned redirect notice |

New public schemas, routes, UI labels, README headings, and generated project
metadata must say `GIS Engine Workbench` or `@gis-engine/workbench`. A
compatibility test must assert that aliases remain functional while visible
product text does not regress to Studio. Compatibility identifiers must never
be used to imply a second product or a second source of truth.

