import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("AI Map Studio bundle", () => {
  it("keeps MapLibre out of the initial HTML preload chain", () => {
    const html = readRepoFile("apps/studio/dist/index.html");
    expect(html).not.toMatch(/modulepreload[^>]+maplibre/i);
    expect(html).not.toMatch(/stylesheet[^>]+maplibre/i);

    const entryMatch = html.match(/src="\/assets\/([^"]+\.js)"/);
    expect(entryMatch?.[1]).toBeTruthy();

    const entrySource = readRepoFile(`apps/studio/dist/assets/${entryMatch?.[1]}`);
    expect(entrySource).not.toMatch(/import\s*["']\.\/maplibre/i);
    expect(entrySource).toMatch(/import\("\.\/maplibre-gl-/);
  });

  it("keeps the MapStage renderer import runtime-only", () => {
    const mapStageSource = readRepoFile("apps/studio/src/components/MapStage.tsx");
    expect(mapStageSource).not.toMatch(/^import\s+(?!type\b).*from "maplibre-gl";$/m);
    expect(mapStageSource).not.toMatch(/^import\s+"maplibre-gl\/dist\/maplibre-gl\.css";$/m);
    expect(mapStageSource).toContain('import("maplibre-gl")');
  });

  it("keeps audit and review controls in the Studio evidence rail", () => {
    const evidenceSource = readRepoFile("apps/studio/src/components/EvidencePanel.tsx");
    const appSource = readRepoFile("apps/studio/src/App.tsx");
    const chatSource = readRepoFile("apps/studio/src/components/ChatPanel.tsx");

    expect(evidenceSource).toContain("Session Audit");
    expect(evidenceSource).toContain("Review Decision");
    expect(evidenceSource).toContain("Review History");
    expect(chatSource).toContain("Saved Maps");
    expect(chatSource).toContain("Workspace Handoff");
    expect(chatSource).toContain("Review Ledger");
    expect(chatSource).toContain("Review Export");
    expect(chatSource).toContain("onInspectMap(map.id)");
    expect(chatSource).toContain("onInspectLedger(map.id)");
    expect(chatSource).toContain("onInspectExport(map.id)");
    expect(chatSource).toContain("onLoadMap(map.id)");
    expect(chatSource).toContain("onDeleteMap(map.id)");
    expect(evidenceSource).toContain('onReviewDecision("accepted")');
    expect(evidenceSource).toContain('onReviewDecision("blocked")');
    expect(evidenceSource).toContain('onReviewDecision("follow-up-required")');
    expect(appSource).toContain('fetch("/api/audit")');
    expect(appSource).toContain('fetch("/api/review-decisions")');
    expect(appSource).toContain('fetch("/api/review-decision"');
    expect(appSource).toContain('fetch("/api/maps")');
    expect(appSource).toContain("buildLoadedWorkspaceEvidence(");
    expect(appSource).toContain("loadedEvidence");
    expect(appSource).toContain('/api/maps/${mapId}/handoff');
    expect(appSource).toContain('/api/maps/${mapId}/review-ledger');
    expect(appSource).toContain('audit_status: auditStatus');
    expect(appSource).toContain('review_outcome: reviewOutcome');
    expect(appSource).toContain('/api/maps/${mapId}/review-export');
    expect(appSource).toContain('const kind = query.kind ?? "all"');
    expect(appSource).toContain('const statusFilter = query.status ?? "all"');
    expect(appSource).toContain('const limit = query.limit ?? 10');
    expect(appSource).toContain("new URLSearchParams({");
    expect(appSource).toContain('/api/maps/${mapId}/load');
    expect(chatSource).toContain("Audit Records");
    expect(chatSource).toContain("Review Decisions");
    expect(chatSource).toContain("Raw Ledger");
    expect(chatSource).toContain("No audit records match.");
    expect(chatSource).toContain("No review decisions match.");
    expect(chatSource).toContain("All statuses");
    expect(chatSource).toContain("Follow-up");
    expect(chatSource).toContain("Page size");
    expect(chatSource).toContain("Returned Events");
    expect(chatSource).toContain("Raw Envelope");
    expect(chatSource).toContain("Newer");
    expect(chatSource).toContain("Older");
  });
});
