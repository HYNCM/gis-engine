import { describe, expect, it } from "vitest";
import { computeReviewConsoleState, REVIEW_SECTION_IDS } from "../../examples/ai-map-workbench/review-console.mjs";
import blockedFixture from "../fixtures/review-console/blocked.fixture.json";
import followUpFixture from "../fixtures/review-console/follow-up-required.fixture.json";
import confirmFixture from "../fixtures/review-console/needs-confirmation.fixture.json";
import readyFixture from "../fixtures/review-console/ready.fixture.json";

describe("QA Matrix: Prompt-to-Delivery scenarios", () => {
  describe("Card 1: Ready — simple GeoJSON display request", () => {
    it("produces ready delivery for inline GeoJSON with point query", () => {
      const result = computeReviewConsoleState(readyFixture);

      expect(result.acceptance).toBe("ready");
      expect(result.deliveryStatus).toBe("ready");

      for (const section of result.sections) {
        expect(["ready", "not-requested"]).toContain(section.state);
      }

      expect(result.sourceReadiness.every((s: { state: string }) => s.state === "supported")).toBe(true);
      expect(result.confirmations).toEqual([]);
      expect(result.followUps).toEqual([]);

      const mapEdits = result.sections.find((s: { id: string }) => s.id === "map-edits");
      expect(mapEdits?.evidence.commandCount).toBeGreaterThan(0);
      expect(mapEdits?.evidence.committed).toBe(mapEdits?.evidence.commandCount);
    });
  });

  describe("Card 2: Blocked — unsupported GeoZarr source request", () => {
    it("produces blocked delivery for blocked source format", () => {
      const result = computeReviewConsoleState(blockedFixture);

      expect(result.acceptance).toBe("blocked");
      expect(result.deliveryStatus).toBe("blocked");
      expect(result.sourceReadiness[0].format).toBe("geozarr");
      expect(result.sourceReadiness[0].state).toBe("blocked");
      expect(result.sourceReadiness[0].sourceContract).toBeUndefined();
      expect(
        result.sourcePromotionCandidates.some(
          (candidate: { format: string; target?: string; sourceContract?: { kind: string } }) =>
            candidate.format === "geozarr" &&
            candidate.target === "GeoZarr array source gate" &&
            candidate.sourceContract === undefined,
        ),
      ).toBe(true);

      const dataSection = result.sections.find((s: { id: string }) => s.id === "data-and-sources");
      expect(dataSection?.state).toBe("blocked");
      expect(dataSection?.sources?.some((s: { state: string }) => s.state === "blocked")).toBe(true);
      expect(
        dataSection?.sources?.some(
          (s: { format: string; sourceContract?: { kind: string } }) =>
            s.format === "geozarr" && s.sourceContract === undefined,
        ),
      ).toBe(true);
      expect(
        dataSection?.promotionCandidates?.some(
          (candidate: { format: string; target?: string; sourceContract?: { kind: string } }) =>
            candidate.format === "geozarr" &&
            candidate.target === "GeoZarr array source gate" &&
            candidate.sourceContract === undefined,
        ),
      ).toBe(true);
      expect(result.diagnosticCounts.errors).toBeGreaterThan(0);
    });
  });

  describe("Card 2b: Follow-up — GeoTIFF public contract with runtime blocked", () => {
    it("produces follow-up delivery with explicit source contract evidence", () => {
      const evidence = structuredClone(followUpFixture);
      evidence.delivery.sourceReadiness = [
        {
          id: "orthophoto",
          format: "geotiff",
          state: "readiness-only",
          queryReady: false,
          resourcePolicy: "passed",
        },
      ];
      evidence.delivery.followUps = [];

      const result = computeReviewConsoleState(evidence);

      expect(result.acceptance).toBe("follow-up-required");
      expect(result.sourceReadiness[0]).toMatchObject({
        sourceId: "orthophoto",
        format: "geotiff",
        state: "readiness-only",
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "crs", "bandCount", "bands"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxPixels", "maxBandCount", "workerBudget"]),
        }),
      });
      expect(result.sourcePromotionCandidates).toContainEqual(
        expect.objectContaining({
          candidateId: "source-promotion.geotiff.orthophoto",
          format: "geotiff",
          state: "readiness-only",
          target: "GeoTIFF runtime/query promotion gate",
          sourceContract: expect.objectContaining({ kind: "schema", state: "explicit" }),
        }),
      );
    });
  });

  describe("Card 3: Needs-Confirmation — remote URL fetch required", () => {
    it("produces needs-confirmation for external resource access", () => {
      const result = computeReviewConsoleState(confirmFixture);

      expect(result.acceptance).toBe("needs-confirmation");
      expect(result.confirmations.length).toBeGreaterThan(0);
      expect(result.confirmations[0].reason).toBe("network-fetch");

      const mapEdits = result.sections.find((s: { id: string }) => s.id === "map-edits");
      expect(mapEdits?.state).toBe("ready");
    });
  });

  describe("Card 4: Follow-Up Required — PMTiles archive readiness", () => {
    it("produces follow-up-required for readiness-only sources", () => {
      const result = computeReviewConsoleState(followUpFixture);

      expect(result.acceptance).toBe("follow-up-required");
      expect(result.followUps.length).toBeGreaterThan(0);
      expect(result.followUps[0].id).toMatch(/^TASK-/);
      expect(result.sourcePromotionCandidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            candidateId: "source-promotion.pmtiles.local-pmtiles",
            format: "pmtiles",
            state: "readiness-only",
            resourcePolicy: "passed",
            archiveContract: expect.objectContaining({
              state: "explicit",
            }),
          }),
        ]),
      );

      const dataSection = result.sections.find((s: { id: string }) => s.id === "data-and-sources");
      expect(dataSection?.state).toBe("follow-up-required");
      expect(dataSection?.sources?.some((s: { state: string }) => s.state === "readiness-only")).toBe(true);
      expect(
        dataSection?.promotionCandidates?.some(
          (candidate: { format: string; resourcePolicy?: string; archiveContract?: { state: string } }) =>
            candidate.format === "pmtiles" &&
            candidate.resourcePolicy === "passed" &&
            candidate.archiveContract?.state === "explicit",
        ),
      ).toBe(true);

      const scene = result.sections.find((s: { id: string }) => s.id === "scene-browsing");
      expect(scene?.evidence.stableRuntimeBlocked).toBe(true);
    });
  });

  describe("Card 5: Cross-state invariant checks", () => {
    const allFixtures = [
      { name: "ready", fixture: readyFixture, expected: "ready" },
      { name: "blocked", fixture: blockedFixture, expected: "blocked" },
      { name: "needs-confirmation", fixture: confirmFixture, expected: "needs-confirmation" },
      { name: "follow-up-required", fixture: followUpFixture, expected: "follow-up-required" },
    ];

    for (const { name, fixture, expected } of allFixtures) {
      it(`${name}: produces exactly 6 review sections`, () => {
        const result = computeReviewConsoleState(fixture);
        expect(result.sections).toHaveLength(6);
      });

      it(`${name}: section IDs match expected set`, () => {
        const result = computeReviewConsoleState(fixture);
        const ids = result.sections.map((s: { id: string }) => s.id).sort();
        expect(ids).toEqual([...REVIEW_SECTION_IDS].sort());
      });

      it(`${name}: acceptance matches expected delivery state`, () => {
        const result = computeReviewConsoleState(fixture);
        expect(result.acceptance).toBe(expected);
      });

      it(`${name}: scene-browsing always reports stableRuntimeBlocked`, () => {
        const result = computeReviewConsoleState(fixture);
        const scene = result.sections.find((s: { id: string }) => s.id === "scene-browsing");
        expect(scene?.evidence.stableRuntimeBlocked).toBe(true);
      });

      it(`${name}: files-and-export is always side-effect free`, () => {
        const result = computeReviewConsoleState(fixture);
        const files = result.sections.find((s: { id: string }) => s.id === "files-and-export");
        expect(files?.evidence.sideEffectFree).toBe(true);
      });
    }
  });
});
