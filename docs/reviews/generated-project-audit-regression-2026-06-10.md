---
agent: quality
period: 2026-06-10
generated_at: 2026-06-10T05:35:49Z
repo_revision: "0254a8576bfe54b764e68966235b4dc7f84b4aca"
inputs:
  - tests/cli/cli.test.ts
  - packages/cli/src/generate.ts
  - packages/cli/src/artifacts.ts
  - packages/cli/README.md
  - https://github.com/HYNCM/gis-engine/issues/11
owner: "@quality"
decision_level: advisory
---

# Generated Project Auditability Regression

Decision: #11 is covered by a generated-project regression, documentation
alignment, and artifact verification evidence.

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Required review files stay stable | `tests/cli/cli.test.ts` checks `map.json`, `preflight.json`, `delivery-summary.json`, and `REVIEW.md` in `artifact-manifest.json` | Reviewers and CI keep a stable handoff bundle | Keep this as the minimum generated-project review set | high |
| Delivery summary mirrors evidence | CLI regression compares `delivery-summary.json`, `preflight.json`, and `evidence.json` fields | Prevents drift between compact review metadata and full evidence | Extend this test when new delivery sections are added | high |
| Artifact manifest is tamper-evident | CLI regression verifies a clean project, then changes `map.json` and expects byte/hash mismatch diagnostics | CI can detect generated-file mutation after handoff | Keep `create-gis-map --verify-artifacts` in release/adoption checks | high |
| Prompt safety is asserted | CLI regression checks generated evidence, summary, preflight, manifest, and review markdown for raw prompt absence | Reduces accidental prompt retention in review artifacts | Preserve prompt hash only | high |
| Docs name the generated bundle | CLI README lists generated files and verification commands | Users have the same artifact contract as tests | Keep README aligned with new required artifacts | medium |

## Validation

Issue-specific gates:

```bash
pnpm test:cli
pnpm test:docs
pnpm smoke:cli-install
```

Full W25 closeout also runs provider smoke, agent-framework/docs link checks,
schema build, and `pnpm check`.
