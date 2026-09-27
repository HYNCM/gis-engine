import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import {
  createWorkbenchPlanHash,
  createWorkbenchPromptHash,
  validateWorkbenchApplyRequest,
  validateWorkbenchPlan,
  validateWorkbenchSchema,
  validateWorkbenchTelemetryEvent,
  WorkbenchApplyRequestSchema,
  WorkbenchApplyResultSchema,
  WorkbenchDataAttachmentRequestSchema,
  WorkbenchDataAttachmentResultSchema,
  WorkbenchDiagnosticCodes,
  WorkbenchExportPreviewSchema,
  WorkbenchExportReceiptSchema,
  WorkbenchPlanSchema,
  WorkbenchProjectSchema,
  WorkbenchTelemetryEventSchema,
} from "../../apps/workbench/contracts/index.js";

const timestamp = "2026-08-10T00:00:00.000Z";
const digest = `sha256:${"a".repeat(64)}`;

const projectFixture = {
  schemaVersion: "gis-engine.workbench.project.v1",
  id: "project-1",
  name: "Earthquake review",
  currentRevision: "0",
  paths: {
    mapSpec: "mapspec.json",
    dataDirectory: "data",
    revisionsDirectory: ".gis-engine/revisions",
    exportsDirectory: "exports",
  },
  provider: { kind: "mock" },
  telemetryConsent: false,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const planFixture = {
  schemaVersion: "gis-engine.workbench.plan.v1",
  id: "plan-1",
  goal: "Show earthquake points",
  baseRevision: "0",
  promptHash: digest,
  commands: [],
  affectedPaths: ["mapspec.json"],
  resourceRequests: [],
  unsupportedIntents: [],
  diagnostics: [],
  createdAt: timestamp,
};

const applyRequestFixture = {
  schemaVersion: "gis-engine.workbench.apply-request.v1",
  projectId: "project-1",
  planHash: digest,
  baseRevision: "0",
};

const applyResultFixture = {
  schemaVersion: "gis-engine.workbench.apply-result.v1",
  projectId: "project-1",
  planHash: digest,
  previousRevision: "0",
  revision: "1",
  appliedCommandIds: [],
  receiptHash: digest,
  diagnostics: [],
  appliedAt: timestamp,
};

const exportPreviewFixture = {
  schemaVersion: "gis-engine.workbench.export-preview.v1",
  projectId: "project-1",
  baseRevision: "0",
  specHash: digest,
  targetRelativePath: "exports/earthquake-map",
  files: [
    {
      path: "package.json",
      role: "application",
      bytes: 100,
      sha256: digest,
      collision: false,
    },
  ],
  preflightCommands: ["pnpm install", "pnpm build"],
  diagnostics: [],
  previewHash: digest,
  createdAt: timestamp,
};

const exportReceiptFixture = {
  schemaVersion: "gis-engine.workbench.export-receipt.v1",
  projectId: "project-1",
  previewHash: digest,
  targetRelativePath: "exports/earthquake-map",
  writtenFiles: [{ path: "package.json", bytes: 100, sha256: digest }],
  manifestHash: digest,
  diagnostics: [],
  committedAt: timestamp,
};

const telemetryFixture = {
  schemaVersion: "gis-engine.workbench.telemetry.v1",
  event: "plan_previewed",
  occurredAt: timestamp,
  projectId: "project-1",
  consent: true,
  properties: { durationMs: 1200, commandCount: 2, outcome: "success" },
};

const dataAttachmentRequestFixture = {
  schemaVersion: "gis-engine.workbench.data-attachment-request.v1",
  projectId: "project-1",
  kind: "geojson",
  sourceId: "cities",
  fileName: "cities.geojson",
  baseRevision: "0",
  value: { type: "FeatureCollection", features: [] },
};

const dataAttachmentResultFixture = {
  schemaVersion: "gis-engine.workbench.data-attachment.v1",
  projectId: "project-1",
  kind: "geojson",
  sourceId: "cities",
  path: "data/cities.geojson",
  bytes: 42,
  sha256: digest,
  previousRevision: "0",
  revision: "1",
  attachedAt: timestamp,
  diagnostics: [],
};

describe("Workbench public contracts", () => {
  it("compiles every public schema with strict Ajv settings", () => {
    for (const schema of [
      WorkbenchProjectSchema,
      WorkbenchPlanSchema,
      WorkbenchApplyRequestSchema,
      WorkbenchApplyResultSchema,
      WorkbenchDataAttachmentRequestSchema,
      WorkbenchDataAttachmentResultSchema,
      WorkbenchExportPreviewSchema,
      WorkbenchExportReceiptSchema,
      WorkbenchTelemetryEventSchema,
    ]) {
      expect(() => new Ajv({ allErrors: true, strict: true }).compile(schema)).not.toThrow();
    }
  });

  it.each([
    ["project", WorkbenchProjectSchema, projectFixture],
    ["plan", WorkbenchPlanSchema, planFixture],
    ["apply request", WorkbenchApplyRequestSchema, applyRequestFixture],
    ["apply result", WorkbenchApplyResultSchema, applyResultFixture],
    ["data attachment request", WorkbenchDataAttachmentRequestSchema, dataAttachmentRequestFixture],
    ["data attachment result", WorkbenchDataAttachmentResultSchema, dataAttachmentResultFixture],
    ["export preview", WorkbenchExportPreviewSchema, exportPreviewFixture],
    ["export receipt", WorkbenchExportReceiptSchema, exportReceiptFixture],
    ["telemetry event", WorkbenchTelemetryEventSchema, telemetryFixture],
  ])("accepts the canonical %s fixture", (_name, schema, fixture) => {
    expect(validateWorkbenchSchema(schema, fixture).valid).toBe(true);
  });

  it("keeps project paths relative and provider configuration secret-free", () => {
    expect(
      validateWorkbenchSchema(WorkbenchProjectSchema, {
        ...projectFixture,
        paths: { ...projectFixture.paths, dataDirectory: "/private/data" },
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchProjectSchema, {
        ...projectFixture,
        provider: { kind: "openai-compatible", apiKey: "sk-test" },
      }).valid,
    ).toBe(false);
  });

  it("requires apply requests to bind both the plan hash and base revision", () => {
    const { planHash: _planHash, ...withoutPlanHash } = applyRequestFixture;
    const { baseRevision: _baseRevision, ...withoutBaseRevision } = applyRequestFixture;

    expect(validateWorkbenchApplyRequest(withoutPlanHash).valid).toBe(false);
    expect(validateWorkbenchApplyRequest(withoutBaseRevision).valid).toBe(false);
    expect(validateWorkbenchApplyRequest(applyRequestFixture).valid).toBe(true);
  });

  it("keeps data attachment identities inside the project data directory", () => {
    expect(
      validateWorkbenchSchema(WorkbenchDataAttachmentRequestSchema, {
        ...dataAttachmentRequestFixture,
        fileName: "../cities.geojson",
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchDataAttachmentRequestSchema, {
        ...dataAttachmentRequestFixture,
        sourceId: "../cities",
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchDataAttachmentRequestSchema, {
        ...dataAttachmentRequestFixture,
        sourceId: "_leading_underscore",
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchDataAttachmentRequestSchema, {
        ...dataAttachmentRequestFixture,
        sourceType: "shapefile",
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchDataAttachmentRequestSchema, {
        ...dataAttachmentRequestFixture,
        providerBody: { messages: [] },
      }).valid,
    ).toBe(false);
  });

  it("requires export previews to bind the revision and MapSpec they were reviewed against", () => {
    const { baseRevision: _baseRevision, ...withoutBaseRevision } = exportPreviewFixture;
    const { specHash: _specHash, ...withoutSpecHash } = exportPreviewFixture;

    expect(validateWorkbenchSchema(WorkbenchExportPreviewSchema, withoutBaseRevision).valid).toBe(false);
    expect(validateWorkbenchSchema(WorkbenchExportPreviewSchema, withoutSpecHash).valid).toBe(false);
    // A receipt is historical evidence, so it stays readable without those fields.
    expect(validateWorkbenchSchema(WorkbenchExportReceiptSchema, exportReceiptFixture).valid).toBe(true);
  });

  it("accepts stable Workbench diagnostics in public result contracts", () => {
    const revisionConflict = {
      severity: "error",
      code: WorkbenchDiagnosticCodes.RevisionConflict,
      message: "The project revision changed after the plan was created.",
      path: "/baseRevision",
    };

    expect(
      validateWorkbenchSchema(WorkbenchApplyResultSchema, {
        ...applyResultFixture,
        diagnostics: [revisionConflict],
      }).valid,
    ).toBe(true);
    expect(
      validateWorkbenchSchema(WorkbenchExportPreviewSchema, {
        ...exportPreviewFixture,
        diagnostics: [{ ...revisionConflict, code: WorkbenchDiagnosticCodes.UnsafePath }],
      }).valid,
    ).toBe(true);
  });

  it("rejects raw prompts and provider bodies in plans", () => {
    const rawPrompt = validateWorkbenchPlan({ ...planFixture, rawPrompt: "private prompt" });
    const providerBody = validateWorkbenchPlan({ ...planFixture, providerBody: { messages: [] } });

    expect(rawPrompt.valid).toBe(false);
    expect(providerBody.valid).toBe(false);
    expect(rawPrompt.diagnostics[0]?.code).toBe(WorkbenchDiagnosticCodes.SchemaInvalid);
  });

  it("hashes canonical plan fields without retaining sensitive extras", () => {
    const reorderedPlan = {
      createdAt: planFixture.createdAt,
      diagnostics: planFixture.diagnostics,
      unsupportedIntents: planFixture.unsupportedIntents,
      resourceRequests: planFixture.resourceRequests,
      affectedPaths: planFixture.affectedPaths,
      commands: planFixture.commands,
      promptHash: planFixture.promptHash,
      baseRevision: planFixture.baseRevision,
      goal: planFixture.goal,
      id: planFixture.id,
      schemaVersion: planFixture.schemaVersion,
    };
    const withSensitiveExtras = {
      ...planFixture,
      rawPrompt: "private prompt",
      providerBody: { messages: [{ content: "private prompt" }] },
    };

    expect(createWorkbenchPlanHash(planFixture)).toBe(createWorkbenchPlanHash(reorderedPlan));
    expect(createWorkbenchPlanHash(planFixture)).toBe(createWorkbenchPlanHash(withSensitiveExtras));
    expect(createWorkbenchPlanHash(planFixture)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("uses the repository SHA-256 convention for prompt hashes", () => {
    expect(createWorkbenchPromptHash("hello")).toBe(
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("rejects sensitive and arbitrary telemetry properties", () => {
    expect(validateWorkbenchTelemetryEvent(telemetryFixture).valid).toBe(true);

    for (const properties of [
      { prompt: "secret" },
      { data: { feature: "secret" } },
      { mapSpec: { version: "0.1" } },
      { path: "/private/project" },
      { apiKey: "sk-test" },
      { credentials: { token: "secret" } },
      { providerBody: { messages: [] } },
      { arbitrary: "not allow-listed" },
    ]) {
      const result = validateWorkbenchTelemetryEvent({ ...telemetryFixture, properties });
      expect(result.valid).toBe(false);
      expect(result.diagnostics[0]?.code).toBe(WorkbenchDiagnosticCodes.TelemetryPayloadRejected);
    }
  });

  it("requires explicit telemetry consent", () => {
    const result = validateWorkbenchTelemetryEvent({ ...telemetryFixture, consent: false });

    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.code).toBe(WorkbenchDiagnosticCodes.TelemetryConsentRequired);
  });

  it("rejects sensitive fields from export evidence", () => {
    expect(
      validateWorkbenchSchema(WorkbenchExportPreviewSchema, {
        ...exportPreviewFixture,
        providerBody: { messages: [] },
      }).valid,
    ).toBe(false);
    expect(
      validateWorkbenchSchema(WorkbenchExportReceiptSchema, {
        ...exportReceiptFixture,
        rawPrompt: "private prompt",
      }).valid,
    ).toBe(false);
  });
});
