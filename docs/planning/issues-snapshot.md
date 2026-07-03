---
agent: orchestrator
period: issue-snapshot
generated_at: 2026-07-03T12:40:15.101Z
repo_revision: "e5c68f6"
inputs:
  - GitHub Issues API
owner: "@orchestrator"
decision_level: info
---

# GitHub Issues Planning Snapshot

> This file is generated from GitHub Issues when `gh issue list` is available. Markdown planning files remain snapshots; GitHub Issues are the canonical task state once enabled.

## Status

- GitHub Issues snapshot unavailable in this environment.
- Reason: gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable. Example:
  env:
    GH_TOKEN: ${{ github.token }}
