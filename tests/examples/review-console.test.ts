import { describe, expect, it } from "vitest";
import {
  computeReviewConsoleState,
  REVIEW_CONSOLE_VERSION,
  REVIEW_SECTION_IDS,
} from "../../examples/ai-map-workbench/review-console.mjs";
import blockedFixture from "../fixtures/review-console/blocked.fixture.json";
import followUpFixture from "../fixtures/review-console/follow-up-required.fixture.json";
import confirmFixture from "../fixtures/review-console/needs-confirmation.fixture.json";
import readyFixture from "../fixtures/review-console/ready.fixture.json";

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

  it("computes FlatGeobuf readiness-only source contract and promotion candidate evidence", () => {
    const evidence = structuredClone(followUpFixture);
    evidence.delivery.sourceReadiness = [
      {
        id: "coastal-fgb",
        format: "flatgeobuf",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
        sourceContract: {
          kind: "schema",
          state: "explicit",
          metadataFields: ["type", "url", "hasIndex", "featureCount", "bbox", "geometryType", "fileBytes"],
          policyFields: ["maxFileBytes", "maxFeatureCount", "allowRangeRequests", "indexRequired", "timeoutMs"],
        },
      },
    ];
    evidence.delivery.followUps = [];

    const result = computeReviewConsoleState(evidence);

    expect(result.acceptance).toBe("follow-up-required");
    expect(result.deliveryStatus).toBe("follow-up-required");
    expect(result.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "coastal-fgb",
        format: "flatgeobuf",
        state: "readiness-only",
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "hasIndex", "featureCount"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxFeatureCount", "indexRequired"]),
        }),
      }),
    );
    expect(result.sourcePromotionCandidates).toContainEqual(
      expect.objectContaining({
        candidateId: "source-promotion.flatgeobuf.coastal-fgb",
        format: "flatgeobuf",
        state: "readiness-only",
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
        }),
        target: "FlatGeobuf runtime/query promotion gate",
      }),
    );
    const dataSection = result.sections.find((s) => s.id === "data-and-sources");
    expect(dataSection?.state).toBe("follow-up-required");
    expect(dataSection?.sources?.[0]).toMatchObject({
      format: "flatgeobuf",
      state: "readiness-only",
      resourcePolicy: "passed",
    });
    expect(dataSection?.sources?.[0].sourceContract).toMatchObject({
      kind: "schema",
      state: "explicit",
      metadataFields: expect.arrayContaining(["type", "url", "hasIndex", "featureCount"]),
      policyFields: expect.arrayContaining(["maxFileBytes", "maxFeatureCount", "indexRequired"]),
    });
    expect(dataSection?.promotionCandidates).toContainEqual(
      expect.objectContaining({
        id: "source-promotion.flatgeobuf.coastal-fgb",
        format: "flatgeobuf",
        state: "readiness-only",
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
        }),
        target: "FlatGeobuf runtime/query promotion gate",
      }),
    );
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
    expect(result.followUps[0].targetArtifact).toBe("PMTiles archive metadata promotion gate");
    expect(result.sourcePromotionCandidates).toContainEqual(
      expect.objectContaining({
        candidateId: "source-promotion.pmtiles.local-pmtiles",
        format: "pmtiles",
        state: "readiness-only",
        resourcePolicy: "passed",
        archiveContract: expect.objectContaining({
          state: "explicit",
          metadataFields: expect.arrayContaining(["specVersion", "archiveBytes"]),
          policyFields: expect.arrayContaining(["maxArchiveBytes", "timeoutMs"]),
        }),
        target: "PMTiles archive metadata promotion gate",
      }),
    );
    const dataSection = result.sections.find((s) => s.id === "data-and-sources");
    expect(dataSection?.state).toBe("follow-up-required");
    expect(dataSection?.sources?.[0].state).toBe("readiness-only");
    expect(dataSection?.sources?.[0].resourcePolicy).toBe("passed");
    expect(dataSection?.sources?.[0].archiveContract).toMatchObject({
      state: "explicit",
    });
    expect(dataSection?.promotionCandidates).toContainEqual(
      expect.objectContaining({
        id: "source-promotion.pmtiles.local-pmtiles",
        format: "pmtiles",
        state: "readiness-only",
        resourcePolicy: "passed",
        archiveContract: expect.objectContaining({
          state: "explicit",
        }),
      }),
    );
  });

  it("handles invalid evidence gracefully", () => {
    expect(computeReviewConsoleState(null).acceptance).toBe("blocked");
    expect(computeReviewConsoleState({}).acceptance).toBe("blocked");
    expect(computeReviewConsoleState({ delivery: null }).acceptance).toBe("blocked");
  });

  it("returns all six review section IDs", () => {
    const result = computeReviewConsoleState(readyFixture);
    const sectionIds = result.sections.map((s) => s.id);
    expect(sectionIds).toEqual(REVIEW_SECTION_IDS);
  });

  it("reports diagnostic counts", () => {
    const result = computeReviewConsoleState(blockedFixture);
    expect(result.diagnosticCounts.errors).toBe(1);
    expect(result.diagnosticCounts.total).toBe(1);
  });

  it("scene-browsing section always reports stableRuntimeBlocked: true", () => {
    const result = computeReviewConsoleState(readyFixture);
    const scene = result.sections.find((s) => s.id === "scene-browsing");
    expect(scene?.evidence.stableRuntimeBlocked).toBe(true);
    expect(scene?.evidence.extensionOnly).toBe(true);
  });

  it("map-edits section reflects command evidence", () => {
    const ready = computeReviewConsoleState(readyFixture);
    const mapEdits = ready.sections.find((s) => s.id === "map-edits");
    expect(mapEdits?.state).toBe("ready");
    expect(mapEdits?.evidence.commandCount).toBe(3);
    expect(mapEdits?.evidence.committed).toBe(3);
  });

  it("files-and-export section is side-effect free", () => {
    const result = computeReviewConsoleState(readyFixture);
    const files = result.sections.find((s) => s.id === "files-and-export");
    expect(files?.evidence.sideEffectFree).toBe(true);
  });
});
