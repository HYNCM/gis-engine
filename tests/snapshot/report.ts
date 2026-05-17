import type { Diagnostic } from "@gis-engine/engine";

export type SnapshotReportStatus = "passed" | "failed" | "skipped";
export type SnapshotReportSuite = "snapshot.smoke" | "snapshot.visual";

export interface SnapshotReport {
  kind: "SnapshotReport";
  version: "0.1";
  suite: SnapshotReportSuite;
  renderer: string;
  status: SnapshotReportStatus;
  passed: boolean;
  skipped: boolean;
  reason?: string;
  skipReason?: string;
  lifecycle: {
    loaded: boolean;
    snapshotted: boolean;
    exported: boolean;
    destroyed: boolean;
  };
  spec: {
    id?: string;
    revision?: string;
    sourceCount: number;
    layerCount: number;
  };
  snapshot?: {
    passed: boolean;
    format: "png" | "jpeg" | "data-url";
    width: number;
    height: number;
    dataUrlPrefix?: string;
    byteLength?: number;
  };
  diagnostics: Diagnostic[];
  consoleErrors: string[];
  artifacts: {
    actualImage?: string;
    diffImage?: string;
    reportJson?: string;
    consoleLog?: string;
  };
}

export function assertSnapshotReport(report: unknown): asserts report is SnapshotReport {
  assert(isRecord(report), "SnapshotReport must be an object.");
  assert(report.kind === "SnapshotReport", "SnapshotReport.kind must be SnapshotReport.");
  assert(report.version === "0.1", "SnapshotReport.version must be 0.1.");
  assert(report.suite === "snapshot.smoke" || report.suite === "snapshot.visual", "SnapshotReport.suite is invalid.");
  assert(typeof report.renderer === "string" && report.renderer.length > 0, "SnapshotReport.renderer is required.");
  assert(isSnapshotStatus(report.status), "SnapshotReport.status is invalid.");
  assert(typeof report.passed === "boolean", "SnapshotReport.passed must be boolean.");
  assert(typeof report.skipped === "boolean", "SnapshotReport.skipped must be boolean.");
  assert(report.passed === (report.status === "passed"), "SnapshotReport.passed must match status.");
  assert(report.skipped === (report.status === "skipped"), "SnapshotReport.skipped must match status.");

  if (report.status === "skipped") {
    assert(typeof report.reason === "string" && report.reason.length > 0, "Skipped SnapshotReport requires a reason.");
    assert(typeof report.skipReason === "string" && report.skipReason.length > 0, "Skipped SnapshotReport requires a skipReason.");
  }

  assert(isRecord(report.lifecycle), "SnapshotReport.lifecycle must be an object.");
  for (const key of ["loaded", "snapshotted", "exported", "destroyed"] as const) {
    assert(typeof report.lifecycle[key] === "boolean", `SnapshotReport.lifecycle.${key} must be boolean.`);
  }

  assert(isRecord(report.spec), "SnapshotReport.spec must be an object.");
  if ("id" in report.spec) assert(typeof report.spec.id === "string", "SnapshotReport.spec.id must be string.");
  if ("revision" in report.spec) {
    assert(typeof report.spec.revision === "string", "SnapshotReport.spec.revision must be string.");
  }
  assert(Number.isInteger(report.spec.sourceCount) && report.spec.sourceCount >= 0, "SnapshotReport.spec.sourceCount is invalid.");
  assert(Number.isInteger(report.spec.layerCount) && report.spec.layerCount >= 0, "SnapshotReport.spec.layerCount is invalid.");

  if (report.snapshot !== undefined) {
    assert(isRecord(report.snapshot), "SnapshotReport.snapshot must be an object.");
    assert(typeof report.snapshot.passed === "boolean", "SnapshotReport.snapshot.passed must be boolean.");
    assert(
      report.snapshot.format === "png" || report.snapshot.format === "jpeg" || report.snapshot.format === "data-url",
      "SnapshotReport.snapshot.format is invalid."
    );
    assert(Number.isInteger(report.snapshot.width) && report.snapshot.width > 0, "SnapshotReport.snapshot.width is invalid.");
    assert(Number.isInteger(report.snapshot.height) && report.snapshot.height > 0, "SnapshotReport.snapshot.height is invalid.");
    if ("dataUrlPrefix" in report.snapshot) {
      assert(typeof report.snapshot.dataUrlPrefix === "string", "SnapshotReport.snapshot.dataUrlPrefix must be string.");
    }
    if ("byteLength" in report.snapshot) {
      assert(Number.isInteger(report.snapshot.byteLength) && report.snapshot.byteLength >= 0, "SnapshotReport.snapshot.byteLength is invalid.");
    }
  }

  assert(Array.isArray(report.diagnostics), "SnapshotReport.diagnostics must be an array.");
  for (const diagnostic of report.diagnostics) {
    assert(isRecord(diagnostic), "SnapshotReport diagnostic must be an object.");
    assert(
      diagnostic.severity === "error" || diagnostic.severity === "warning" || diagnostic.severity === "info",
      "SnapshotReport diagnostic severity is invalid."
    );
    assert(typeof diagnostic.code === "string" && diagnostic.code.length > 0, "SnapshotReport diagnostic code is required.");
    assert(typeof diagnostic.message === "string" && diagnostic.message.length > 0, "SnapshotReport diagnostic message is required.");
  }

  assert(Array.isArray(report.consoleErrors), "SnapshotReport.consoleErrors must be an array.");
  for (const error of report.consoleErrors) {
    assert(typeof error === "string", "SnapshotReport console error must be string.");
  }

  assert(isRecord(report.artifacts), "SnapshotReport.artifacts must be an object.");
  for (const key of ["actualImage", "diffImage", "reportJson", "consoleLog"] as const) {
    if (key in report.artifacts) assert(typeof report.artifacts[key] === "string", `SnapshotReport.artifacts.${key} must be string.`);
  }
}

function isSnapshotStatus(status: unknown): status is SnapshotReportStatus {
  return status === "passed" || status === "failed" || status === "skipped";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
