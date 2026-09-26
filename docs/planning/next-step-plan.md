---
agent: orchestrator
period: 2026-09-26
generated_at: 2026-09-26T11:05:00Z
repo_revision: "ca106daef645eb52c684c9ad619b9ada91d9a8ad"
inputs:
  - docs/research/competitor-updates-2026-W39.md
  - docs/research/capability-scorecard.md
  - docs/planning/project-review-2026-09-24.md
  - .github/workflows/agent-review.yml
owner: "@orchestrator"
decision_level: advisory
---

# Current Scope: Verifiable Map Changes and Delivery

The user approved a bounded simplification on 2026-09-26: keep the map core and
delivery loop, shrink governance, duplicate entry points and default execution.
The [W39 competitor analysis](../research/competitor-updates-2026-W39.md) and
[scorecard](../research/capability-scorecard.md) are consumed as advisory HOC-N1
inputs. This is not a quality PASS, release decision or market exclusivity claim.

## Keep, Simplify, Defer

| Surface | Decision and evidence | Impact / owner / confidence |
| --- | --- | --- |
| MapSpec, MapCommand, diagnostics, resource policy, MCP 14 tools | Keep; these implement verifiable changes, unlike adding another generic AI entry point | Public compatibility and safety; @builder / @quality; high |
| MapLibre adapter, CLI export, AI tools | Keep one development-to-export path over shared contracts | Developer delivery; @builder; high |
| Studio and reference workbench | Keep distinct current purposes; no new application entry. Evaluate candidate PR67 before any migration/deletion | Avoid breaking references or conflicting with the pending Workbench candidate; @orchestrator; high |
| Daily/weekly/monthly/recovery workflows | Replace four report pipelines with one manual, read-only Agent Review; upload logs rather than write planning or open repeated incidents | Lower maintenance/noise; @orchestrator + @quality; high |
| AGENTS and root scripts | Compact rules; remove ten role/cadence aliases, retain generic runner and standard gate/check commands | Less navigation and duplicated execution; @builder; high |
| Vitest discovery | Only current checkout `tests/**/*.test.ts`; Playwright retains its own specs | Remove cross-branch/cache test contamination; @builder QA; high |
| SLA/HOC/dashboard/evolution helpers | Keep as optional direct tools, outside default CI review orchestration; do not call stale state healthy | Preserve auditability without a mandatory management platform; @orchestrator; high |
| Scene3D, cloud-native runtimes, hosted/enterprise features | Freeze expansion; keep existing extension contracts and promotion requirements | Lower scope risk; @product / @orchestrator; medium |

No existing runtime package, public API, example or historical report is deleted.
Removing scheduled governance does not remove schema, deterministic, resource,
MCP or visual gates. CI, PR Quality, release/publish and snapshot behavior stay
in place. Existing incidents and September code findings remain unresolved.

## Execution Entry Points

- Normal change: Issue → implementation → `pnpm gate:plan` / `pnpm gate:run` → PR review.
- Main deterministic verification: `pnpm build:schema` and `pnpm check`.
- Extra CI evidence: manually dispatch Agent Review, selecting `checks` or `docs`.
- Research/planning: invoke only for a concrete priority decision; use Issues as state.
- Optional audit/scaffold: direct scripts listed in AGENTS, never a stand-in for review.

The previous four scheduled workflow definitions are removed locally. Remote
schedules will stop only after these changes reach the default branch; this run
does not disable remote workflows, close incidents or publish packages.

## Next Product Work

1. Fix the Studio stale-provider-result and reset-evidence findings in the
   [September review](project-review-2026-09-24.md); verify candidate-branch overlap first.
2. Complete final-head engineering evidence for #66/PR67, including cancelled
   checks and a fresh dependency audit. Do not restart the candidate from scratch.
3. Run five target WebGIS engineers through the local 2D path: at least four finish
   within 30 minutes, all exported projects install/build, no sensitive-data leakage.
4. Expand only after real user failures and usage justify it. Reserve 20%–30% for
   verified reliability/debt; #44/#45/#48 remain separate bounded maintenance work.

This plan replaces the historical W32-W34 closeout as the active entry point.
Older weekly/monthly/health files remain dated evidence, not another task database.

## Validation of This Simplification

- `pnpm build:schema` and full `pnpm check` passed locally (1,170 runtime/test
  assertions reported across the check suites; type checks and workspace builds also passed).
- After adding the discovery regression and updating handoff wording,
  `pnpm test:agent-framework` passed 73 tests and `pnpm test:docs` passed 45.
- Vitest file discovery matches all 90 tracked `.test.ts` files, without nested
  worktree/store copies or the separate Playwright `.spec.ts` files.
- Bash fixture tests verify selected scope, invalid-input rejection, schema/check
  failures propagating through `tee`, retained failure logs and revision evidence.
- Workflow YAML parses; changed TypeScript/config passes Biome; link audit and
  `git diff --check` pass. Independent @quality diff review found no code blocker;
  its comparable-score-delta documentation finding is resolved in HOC-N1.
- Local runtime was Node 26.0.0 / pnpm 11.9.0. Remote Node 22/24 CI and manual
  Actions execution have not run for this working-tree change.
- Non-rendering scope: only governance workflows, instructions, package-script
  aliases, test discovery/regressions and documentation changed. Renderer,
  transformations, styles, resources, examples and visual fixtures are unchanged;
  no separate visual run is needed for this diff. Standard smoke gates passed;
  this is not a SceneView3D or release promotion decision.
