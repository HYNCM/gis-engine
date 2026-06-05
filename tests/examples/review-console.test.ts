import { describe, expect, it } from "vitest";
import readyFixture from "../fixtures/review-console/ready.fixture.json";
import blockedFixture from "../fixtures/review-console/blocked.fixture.json";
import confirmFixture from "../fixtures/review-console/needs-confirmation.fixture.json";
import followUpFixture from "../fixtures/review-console/follow-up-required.fixture.json";
import { computeReviewConsoleState, REVIEW_SECTION_IDS, REVIEW_CONSOLE_VERSION } from "../../examples/ai-map-workbench/review-console.mjs";

describe("review-console contract", () => {
  it("computes ready state from valid evidence", () => {
    const result = computeReviewConsoleState(readyFixture);
    expect(result.version).toBe(REVIEW_CONSOLE_VERSION);
    expect(result.acceptance).toBe("ready");
    expect(result.deliveryStatus).toBe("ready");
    expect(result.sections).toHaveLength(REVIEW_SECTION_IDS.length);
    expect(result.sourceReadiness).toHaveLength(1);
    expect(result.sourceReadiness[0].state).toBe("supported");
  });

  it("computes blocked state when source is blocked", () => {
    const result = computeReviewConsoleState(blockedFixture);
    expect(result.acceptance).toBe("blocked");
    expect(result.deliveryStatus).toBe("blocked");
    const dataSection = result.sections.find(s => s.id === "data-and-sources");
    expect(dataSection?.state).toBe("blocked");
    expect(dataSection?.sources?.[0].format).toBe("geoparquet");
  });

  it("computes needs-confirmation when confirmations exist", () => {
    const result = computeReviewConsoleState(confirmFixture);
    expect(result.acceptance).toBe("needs-confirmation");
    expect(result.confirmations).toHaveLength(1);
    expect(result.confirmations[0].reason).toBe("network-fetch");
  });

  it("computes follow-up-required when sources are readiness-only", () => {
    const result = computeReviewConsoleState(followUpFixture);
    expect(result.acceptance).toBe("follow-up-required");
    expect(result.followUps).toHaveLength(1);
    expect(result.followUps[0].id).toBe("TASK-2026W24-CNS-001");
    const dataSection = result.sections.find(s => s.id === "data-and-sources");
    expect(dataSection?.state).toBe("follow-up-required");
    expect(dataSection?.sources?.[0].state).toBe("readiness-only");
  });

  it("handles invalid evidence gracefully", () => {
    expect(computeReviewConsoleState(null).acceptance).toBe("blocked");
    expect(computeReviewConsoleState({}).acceptance).toBe("blocked");
    expect(computeReviewConsoleState({ delivery: null }).acceptance).toBe("blocked");
  });

  it("returns all six review section IDs", () => {
    const result = computeReviewConsoleState(readyFixture);
    const sectionIds = result.sections.map(s => s.id);
    expect(sectionIds).toEqual(REVIEW_SECTION_IDS);
  });

  it("reports diagnostic counts", () => {
    const result = computeReviewConsoleState(blockedFixture);
    expect(result.diagnosticCounts.errors).toBe(1);
    expect(result.diagnosticCounts.total).toBe(1);
  });

  it("scene-browsing section always reports stableRuntimeBlocked: true", () => {
    const result = computeReviewConsoleState(readyFixture);
    const scene = result.sections.find(s => s.id === "scene-browsing");
    expect(scene?.evidence.stableRuntimeBlocked).toBe(true);
    expect(scene?.evidence.extensionOnly).toBe(true);
  });

  it("map-edits section reflects command evidence", () => {
    const ready = computeReviewConsoleState(readyFixture);
    const mapEdits = ready.sections.find(s => s.id === "map-edits");
    expect(mapEdits?.state).toBe("ready");
    expect(mapEdits?.evidence.commandCount).toBe(3);
    expect(mapEdits?.evidence.committed).toBe(3);
  });

  it("files-and-export section is side-effect free", () => {
    const result = computeReviewConsoleState(readyFixture);
    const files = result.sections.find(s => s.id === "files-and-export");
    expect(files?.evidence.sideEffectFree).toBe(true);
  });
});
