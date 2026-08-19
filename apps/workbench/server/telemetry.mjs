import { validateWorkbenchTelemetryEvent, WorkbenchDiagnosticCodes } from "../dist/contracts/index.js";
import { openWorkbenchProject } from "./project-store.mjs";

const DEFAULT_EVENT_CAP = 1000;

export function createLocalTelemetrySink(options = {}) {
  const eventCap = Number.isInteger(options.eventCap) && options.eventCap > 0 ? options.eventCap : DEFAULT_EVENT_CAP;
  const events = [];

  return Object.freeze({
    transport: "local-memory",
    record(event) {
      events.push(structuredClone(event));
      if (events.length > eventCap) events.splice(0, events.length - eventCap);
    },
    list() {
      return structuredClone(events);
    },
    clear() {
      events.splice(0, events.length);
    },
  });
}

export async function recordWorkbenchTelemetry(projectRoot, event, sink) {
  const state = await openWorkbenchProject(projectRoot);
  if (state.project.telemetryConsent !== true || event?.consent !== true) {
    return failure(
      WorkbenchDiagnosticCodes.TelemetryConsentRequired,
      "Workbench telemetry requires explicit project consent.",
      "/consent",
    );
  }

  const validation = validateWorkbenchTelemetryEvent(event);
  if (!validation.valid) return { ok: false, diagnostics: validation.diagnostics };
  if (event.projectId !== state.project.id) {
    return failure(
      WorkbenchDiagnosticCodes.TelemetryPayloadRejected,
      "Telemetry projectId must match the open project.",
      "/projectId",
    );
  }
  if (sink?.transport !== "local-memory" || typeof sink.record !== "function") {
    return failure(
      WorkbenchDiagnosticCodes.TelemetryPayloadRejected,
      "Workbench v1 telemetry accepts only the local in-memory sink.",
      "/sink",
    );
  }

  sink.record(event);
  return { ok: true, recorded: true, diagnostics: [] };
}

function failure(code, message, path) {
  return { ok: false, diagnostics: [{ severity: "error", code, message, path }] };
}
