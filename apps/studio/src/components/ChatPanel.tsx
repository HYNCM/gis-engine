import { useState, useRef, useEffect } from "react";
import type {
  AuditRecord,
  ChatMessage,
  ProviderProfile,
  ReviewDecision,
  SavedMapReviewLedgerAuditStatus,
  SavedMapReviewLedgerQuery,
  SavedMapReviewLedgerReviewOutcome,
  SavedMapReviewExport,
  SavedMapReviewExportEvent,
  SavedMapReviewExportKind,
  SavedMapReviewExportQuery,
  SavedMapReviewExportStatus,
  SavedMapHandoff,
  SavedMapReviewLedger,
  SavedMapSummary,
} from "../App";

interface Props {
  messages: ChatMessage[];
  status: string;
  onSend: (text: string) => void;
  onClose: () => void;
  providerId: string;
  providers: ProviderProfile[];
  onProviderChange: (id: string) => void;
  savedMaps: SavedMapSummary[];
  currentMapId: string | null;
  selectedHandoff: SavedMapHandoff | null;
  selectedLedger: SavedMapReviewLedger | null;
  selectedExport: SavedMapReviewExport | null;
  onInspectMap: (id: string) => void;
  onInspectLedger: (id: string, query?: SavedMapReviewLedgerQuery) => void;
  onInspectExport: (id: string, query?: SavedMapReviewExportQuery) => void;
  onLoadMap: (id: string) => void;
  onDeleteMap: (id: string) => void;
}

const PROMPTS = [
  { label: "Red", prompt: "make points red" },
  { label: "Blue", prompt: "make points blue" },
  { label: "Larger", prompt: "increase point size" },
  { label: "Smaller", prompt: "decrease point size" },
  { label: "Landmarks", prompt: "show only landmarks" },
  { label: "Zoom 12+", prompt: "make points visible above zoom 12" },
  { label: "Hangzhou", prompt: "zoom to Hangzhou" },
  { label: "Reset", prompt: "reset" },
];

const EXPORT_KIND_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Audit", value: "audit" },
  { label: "Review", value: "review" },
] as const;

const EXPORT_STATUS_OPTIONS: Array<{
  label: string;
  value: SavedMapReviewExportStatus;
}> = [
  { label: "All statuses", value: "all" },
  { label: "Applied", value: "applied" },
  { label: "Blocked", value: "blocked" },
  { label: "Ready", value: "ready" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Follow-up", value: "follow-up-required" },
];

const EXPORT_LIMIT_OPTIONS = [5, 10, 15, 25] as const;
const LEDGER_LIMIT_OPTIONS = [5, 10, 25, 50] as const;

const LEDGER_AUDIT_STATUS_OPTIONS: Array<{
  label: string;
  value: SavedMapReviewLedgerAuditStatus;
}> = [
  { label: "All audit", value: "all" },
  { label: "Applied", value: "applied" },
  { label: "Blocked", value: "blocked" },
  { label: "Ready", value: "ready" },
  { label: "Reviewed", value: "reviewed" },
];

const LEDGER_REVIEW_OUTCOME_OPTIONS: Array<{
  label: string;
  value: SavedMapReviewLedgerReviewOutcome;
}> = [
  { label: "All review", value: "all" },
  { label: "Accepted", value: "accepted" },
  { label: "Blocked", value: "blocked" },
  { label: "Follow-up", value: "follow-up-required" },
];

function eventKindLabel(kind: SavedMapReviewExportKind | "audit" | "review") {
  if (kind === "audit") return "Audit";
  if (kind === "review") return "Review";
  return "All";
}

function eventStatusTone(event: SavedMapReviewExportEvent) {
  if (event.status === "accepted" || event.status === "applied") {
    return "bg-green-950/40 text-green-200 border-green-900/60";
  }
  if (event.status === "blocked") {
    return "bg-red-950/40 text-red-200 border-red-900/60";
  }
  if (event.status === "follow-up-required") {
    return "bg-amber-950/40 text-amber-200 border-amber-900/60";
  }
  return "bg-gray-900 text-gray-300 border-gray-800";
}

function exportEventSummary(event: SavedMapReviewExportEvent) {
  if (event.kind === "audit") {
    return `revision ${event.fromRevision ?? "?"} -> ${event.toRevision ?? "?"} · ${
      event.commandCount ?? 0
    } command(s)`;
  }
  return `delivery ${event.deliveryStatus ?? "unknown"} · ${
    event.commandEvidence?.commandCount ?? 0
  } command(s)`;
}

function auditRecordSummary(record: AuditRecord) {
  return `revision ${record.fromRevision} -> ${record.toRevision} · ${
    record.commandCount
  } command(s)`;
}

function reviewDecisionSummary(decision: ReviewDecision) {
  return `delivery ${decision.deliveryStatus ?? "unknown"} · ${
    decision.commandEvidence?.commandCount ?? 0
  } command(s)`;
}

export default function ChatPanel({
  messages,
  status,
  onSend,
  onClose,
  providerId,
  providers,
  onProviderChange,
  savedMaps,
  currentMapId,
  selectedHandoff,
  selectedLedger,
  selectedExport,
  onInspectMap,
  onInspectLedger,
  onInspectExport,
  onLoadMap,
  onDeleteMap,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "thinking") return;
    onSend(input.trim());
    setInput("");
  };

  const enabledProviders = providers.filter((p) => p.enabled);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div>
          <p className="text-xs text-blue-400 font-medium tracking-wide">
            GIS ENGINE
          </p>
          <h1 className="text-base font-semibold">AI Map Studio</h1>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-sm px-1"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Provider selector */}
      <div className="px-4 py-2 border-b border-gray-800 shrink-0">
        <label className="text-xs text-gray-500 block mb-1">AI Provider</label>
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        >
          {enabledProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}{p.model ? ` / ${p.model}` : ""}
            </option>
          ))}
          {providers
            .filter((p) => !p.enabled)
            .map((p) => (
              <option key={p.id} value={p.id} disabled>
                {p.label}{p.model ? ` / ${p.model}` : ""} ({p.missingCredential ? "credential needed" : "unavailable"})
              </option>
            ))}
        </select>
      </div>

      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-gray-500">Saved Maps</label>
          <span className="text-[11px] text-gray-600">{savedMaps.length}</span>
        </div>
        {savedMaps.length === 0 ? (
          <p className="text-xs text-gray-600">No saved maps yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {savedMaps.map((map) => {
              const isCurrent = currentMapId === map.id;
              return (
                <div
                  key={map.id}
                  className={`rounded border px-2 py-2 ${isCurrent ? "border-blue-700 bg-blue-950/30" : "border-gray-800 bg-gray-900/70"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-200">
                        {map.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        v{map.revision} · {map.basemapId}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-[10px] text-blue-200">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-600">
                    audit {map.auditRecordCount} · review {map.reviewDecisionCount}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-600">
                      {new Date(map.updatedAt).toLocaleString()}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        onClick={() => onInspectExport(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => onInspectLedger(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Ledger
                      </button>
                      <button
                        onClick={() => onInspectMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onLoadMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-red-200 transition hover:bg-red-950/50 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedHandoff && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Workspace Handoff</label>
            <span className="text-[11px] text-gray-600">
              {selectedHandoff.handoff.status}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedHandoff.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedHandoff.workspace.revision} ·{" "}
              {selectedHandoff.workspace.basemapId} · audit{" "}
              {selectedHandoff.evidence.auditRecordCount} · review{" "}
              {selectedHandoff.evidence.reviewDecisionCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedHandoff.handoffVersion}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-950 p-2 text-[10px] leading-4 text-gray-400">
              {JSON.stringify(selectedHandoff, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {selectedLedger && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Review Ledger</label>
            <span className="text-[11px] text-gray-600">
              {selectedLedger.handoff.status}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedLedger.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedLedger.workspace.revision} ·{" "}
              {selectedLedger.workspace.basemapId} · audit{" "}
              {selectedLedger.summary.matchingAuditRecordCount}/
              {selectedLedger.audit.recordCount} · review{" "}
              {selectedLedger.summary.matchingReviewDecisionCount}/
              {selectedLedger.review.decisionCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              accepted {selectedLedger.summary.reviewOutcomeCounts.accepted} ·
              blocked {selectedLedger.summary.reviewOutcomeCounts.blocked} ·
              follow-up {selectedLedger.summary.reviewOutcomeCounts.followUpRequired}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              audit status {selectedLedger.filters.auditStatus} · review outcome{" "}
              {selectedLedger.filters.reviewOutcome} · limit{" "}
              {selectedLedger.filters.limit}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedLedger.reviewLedgerVersion}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-gray-500">
                Audit
                <select
                  value={selectedLedger.filters.auditStatus}
                  onChange={(event) =>
                    onInspectLedger(selectedLedger.workspace.mapId, {
                      auditStatus: event.target
                        .value as SavedMapReviewLedgerAuditStatus,
                      reviewOutcome: selectedLedger.filters.reviewOutcome,
                      limit: selectedLedger.filters.limit,
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  {LEDGER_AUDIT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-500">
                Review
                <select
                  value={selectedLedger.filters.reviewOutcome}
                  onChange={(event) =>
                    onInspectLedger(selectedLedger.workspace.mapId, {
                      auditStatus: selectedLedger.filters.auditStatus,
                      reviewOutcome: event.target
                        .value as SavedMapReviewLedgerReviewOutcome,
                      limit: selectedLedger.filters.limit,
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  {LEDGER_REVIEW_OUTCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-500">
                Limit
                <select
                  value={selectedLedger.filters.limit}
                  onChange={(event) =>
                    onInspectLedger(selectedLedger.workspace.mapId, {
                      auditStatus: selectedLedger.filters.auditStatus,
                      reviewOutcome: selectedLedger.filters.reviewOutcome,
                      limit: Number.parseInt(event.target.value, 10),
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  {LEDGER_LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 grid gap-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-gray-500">Audit Records</label>
                  <span className="text-[11px] text-gray-600">
                    {selectedLedger.audit.returnedRecordCount}/
                    {selectedLedger.audit.matchingRecordCount}
                  </span>
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {selectedLedger.audit.records.length === 0 ? (
                    <p className="rounded border border-dashed border-gray-800 bg-gray-950/60 px-2 py-2 text-[11px] text-gray-500">
                      No audit records match.
                    </p>
                  ) : (
                    selectedLedger.audit.records.map((record) => (
                      <div
                        key={record.id}
                        className="rounded border border-gray-800 bg-gray-950/70 p-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-medium text-gray-200">
                            {record.status}
                          </p>
                          <span className="text-[10px] text-gray-600">
                            {record.toRevision}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          provider {record.providerId} · {auditRecordSummary(record)}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-500">
                          diagnostics e{record.diagnosticCounts.error} / w
                          {record.diagnosticCounts.warning} / i
                          {record.diagnosticCounts.info}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-gray-500">Review Decisions</label>
                  <span className="text-[11px] text-gray-600">
                    {selectedLedger.review.returnedDecisionCount}/
                    {selectedLedger.review.matchingDecisionCount}
                  </span>
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {selectedLedger.review.decisions.length === 0 ? (
                    <p className="rounded border border-dashed border-gray-800 bg-gray-950/60 px-2 py-2 text-[11px] text-gray-500">
                      No review decisions match.
                    </p>
                  ) : (
                    selectedLedger.review.decisions.map((decision) => (
                      <div
                        key={decision.decisionId}
                        className="rounded border border-gray-800 bg-gray-950/70 p-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-medium text-gray-200">
                            {decision.outcome}
                          </p>
                          <span className="text-[10px] text-gray-600">
                            {decision.decisionId}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          provider {decision.providerId} ·{" "}
                          {reviewDecisionSummary(decision)}
                        </p>
                        {decision.reasonCodes.length > 0 && (
                          <p className="mt-1 text-[10px] text-gray-500">
                            reasons {decision.reasonCodes.join(", ")}
                          </p>
                        )}
                        {decision.followUpTaskIds &&
                          decision.followUpTaskIds.length > 0 && (
                            <p className="mt-1 text-[10px] text-gray-500">
                              follow-up {decision.followUpTaskIds.join(", ")}
                            </p>
                          )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <details className="mt-2 rounded border border-gray-800 bg-gray-950/60 p-2">
              <summary className="cursor-pointer text-[11px] text-gray-400">
                Raw Ledger
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto text-[10px] leading-4 text-gray-400">
                {JSON.stringify(selectedLedger, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {selectedExport && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Review Export</label>
            <span className="text-[11px] text-gray-600">
              {selectedExport.summary.returnedEventCount}/
              {selectedExport.summary.matchingEventCount}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedExport.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedExport.workspace.revision} ·{" "}
              {selectedExport.workspace.basemapId} · matched{" "}
              {selectedExport.summary.matchingEventCount}/
              {selectedExport.summary.totalEventCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              audit {selectedExport.summary.matchingAuditEventCount}/
              {selectedExport.summary.auditEventCount} · review{" "}
              {selectedExport.summary.matchingReviewEventCount}/
              {selectedExport.summary.reviewEventCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              cursor {selectedExport.filters.cursor} · limit{" "}
              {selectedExport.filters.limit}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              kind {selectedExport.filters.kind} · status{" "}
              {selectedExport.filters.status}
            </p>
            {selectedExport.summary.pageNewestEventAt &&
              selectedExport.summary.pageOldestEventAt && (
                <p className="mt-1 text-[11px] text-gray-600">
                  {new Date(
                    selectedExport.summary.pageNewestEventAt,
                  ).toLocaleString()}{" "}
                  →{" "}
                  {new Date(
                    selectedExport.summary.pageOldestEventAt,
                  ).toLocaleString()}
                </p>
              )}
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedExport.reviewExportVersion}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded border border-gray-800">
                {EXPORT_KIND_OPTIONS.map((option) => {
                  const active = selectedExport.filters.kind === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        onInspectExport(selectedExport.workspace.mapId, {
                          kind: option.value,
                          status: selectedExport.filters.status,
                          limit: selectedExport.filters.limit,
                        })
                      }
                      disabled={status === "thinking"}
                      className={`px-2 py-1 text-[11px] transition ${
                        active
                          ? "bg-blue-900/50 text-blue-100"
                          : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                      } disabled:opacity-40`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-1 text-[11px] text-gray-500">
                Status
                <select
                  value={selectedExport.filters.status}
                  onChange={(event) =>
                    onInspectExport(selectedExport.workspace.mapId, {
                      kind: selectedExport.filters.kind,
                      status: event.target.value as SavedMapReviewExportStatus,
                      limit: selectedExport.filters.limit,
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  {EXPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-500">
                Page size
                <select
                  value={selectedExport.filters.limit}
                  onChange={(event) =>
                    onInspectExport(selectedExport.workspace.mapId, {
                      kind: selectedExport.filters.kind,
                      status: selectedExport.filters.status,
                      limit: Number.parseInt(event.target.value, 10),
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  {EXPORT_LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs text-gray-500">Returned Events</label>
                <span className="text-[11px] text-gray-600">
                  {selectedExport.summary.returnedEventCount}/
                  {selectedExport.summary.matchingEventCount}
                </span>
              </div>
              {selectedExport.events.length === 0 ? (
                <p className="rounded border border-dashed border-gray-800 bg-gray-950/60 px-2 py-2 text-[11px] text-gray-500">
                  No events match the current filters.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {selectedExport.events.map((event) => (
                    <div
                      key={`${event.kind}:${event.eventId}`}
                      className="rounded border border-gray-800 bg-gray-950/70 p-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-200">
                            {eventKindLabel(event.kind)} · {event.status}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] ${eventStatusTone(event)}`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">
                        provider {event.providerId} · {exportEventSummary(event)}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500">
                        diagnostics e{event.diagnosticCounts.error} / w
                        {event.diagnosticCounts.warning} / i
                        {event.diagnosticCounts.info}
                      </p>
                      {event.reasonCodes && event.reasonCodes.length > 0 && (
                        <p className="mt-1 text-[10px] text-gray-500">
                          reasons {event.reasonCodes.join(", ")}
                        </p>
                      )}
                      {event.followUpTaskIds && event.followUpTaskIds.length > 0 && (
                        <p className="mt-1 text-[10px] text-gray-500">
                          follow-up {event.followUpTaskIds.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              {selectedExport.filters.cursor > 0 ? (
                <button
                  onClick={() =>
                    onInspectExport(
                      selectedExport.workspace.mapId,
                      {
                        cursor: Math.max(
                          selectedExport.filters.cursor -
                            selectedExport.filters.limit,
                          0,
                        ),
                        kind: selectedExport.filters.kind,
                        status: selectedExport.filters.status,
                        limit: selectedExport.filters.limit,
                      },
                    )
                  }
                  disabled={status === "thinking"}
                  className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                >
                  Newer
                </button>
              ) : (
                <span />
              )}
              {selectedExport.nextCursor !== null && (
                <button
                  onClick={() =>
                    onInspectExport(selectedExport.workspace.mapId, {
                      cursor: selectedExport.nextCursor ?? 0,
                      kind: selectedExport.filters.kind,
                      status: selectedExport.filters.status,
                      limit: selectedExport.filters.limit,
                    })
                  }
                  disabled={status === "thinking"}
                  className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                >
                  Older
                </button>
              )}
            </div>
            <details className="mt-2 rounded border border-gray-800 bg-gray-950/60 p-2">
              <summary className="cursor-pointer text-[11px] text-gray-400">
                Raw Envelope
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto text-[10px] leading-4 text-gray-400">
                {JSON.stringify(selectedExport, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-200"}`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.status && msg.role === "assistant" && (
                <span
                  className={`text-xs mt-1 inline-block ${msg.status === "applied" ? "text-green-400" : msg.status === "blocked" ? "text-red-400" : "text-gray-500"}`}
                >
                  {msg.status}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-2 flex gap-1.5 flex-wrap border-t border-gray-800 shrink-0">
        {PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => onSend(p.prompt)}
            disabled={status === "thinking"}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-gray-800 shrink-0"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              status === "thinking"
                ? "AI is thinking..."
                : "Describe your map change..."
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            disabled={status === "thinking"}
          />
          <button
            type="submit"
            disabled={status === "thinking" || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded text-sm font-medium transition"
          >
            {status === "thinking" ? "···" : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}
