import { useState } from "react";
import type {
  AuditRecord,
  ChatMessage,
  ReviewDecision,
  ReviewDecisionReasonCode,
  ReviewDecisionRequest,
  ServerState,
} from "../App";

interface Props {
  messages: ChatMessage[];
  serverState: ServerState | null;
  auditRecords?: AuditRecord[];
  reviewDecisions?: ReviewDecision[];
  onReviewDecision?: (request: ReviewDecisionRequest) => void;
  onClose: () => void;
}

const FOLLOW_UP_TASK_ID_PATTERN = /^TASK-\d{4}W\d{2}-[A-Z]+-\d{3}$/;

const REVIEW_REASON_OPTIONS: Record<
  ReviewDecision["outcome"],
  Array<{ label: string; value: ReviewDecisionReasonCode }>
> = {
  accepted: [{ label: "Accepted", value: "review-accepted" }],
  blocked: [
    { label: "Manual block", value: "manual-review-blocked" },
    { label: "Provider output", value: "provider-output-blocked" },
    { label: "Visual evidence", value: "visual-evidence-required" },
    { label: "Scene3D boundary", value: "scene3d-extension-only" },
    { label: "Promotion required", value: "product-promotion-required" },
  ],
  "follow-up-required": [
    {
      label: "Delivery confirmation",
      value: "delivery-needs-confirmation",
    },
    {
      label: "Provider resources",
      value: "provider-resource-follow-up",
    },
    {
      label: "Audit retention",
      value: "audit-retention-follow-up",
    },
    {
      label: "Spatial query",
      value: "spatial-query-follow-up",
    },
    {
      label: "Promotion required",
      value: "product-promotion-required",
    },
  ],
};

export default function EvidencePanel({
  messages,
  serverState,
  auditRecords = [],
  reviewDecisions = [],
  onReviewDecision,
  onClose,
}: Props) {
  const [reviewOutcome, setReviewOutcome] =
    useState<ReviewDecision["outcome"]>("accepted");
  const [reviewReason, setReviewReason] =
    useState<ReviewDecisionReasonCode>("review-accepted");
  const [followUpTaskInput, setFollowUpTaskInput] = useState("");
  const lastMsg = messages
    .filter((m) => m.role === "assistant" && m.evidence)
    .at(-1);
  const ev = lastMsg?.evidence;
  const diags = ev?.diagnostics || serverState?.diagnostics || [];
  const cmd = ev?.commandEvidence || serverState?.commandEvidence;
  const provider = ev?.provider || serverState?.provider;
  const latestAudit = auditRecords.at(-1);
  const canReview = Boolean(latestAudit);
  const followUpTaskIds = followUpTaskInput
    .split(",")
    .map((taskId) => taskId.trim())
    .filter(Boolean);
  const invalidFollowUpTaskIds = followUpTaskIds.filter(
    (taskId) => !FOLLOW_UP_TASK_ID_PATTERN.test(taskId),
  );
  const reviewValidation = !latestAudit
    ? "No audit record yet."
    : reviewOutcome === "accepted" &&
        (latestAudit.status === "blocked" ||
          latestAudit.diagnosticCounts.error > 0)
      ? "Accepted decisions require non-blocked evidence."
      : reviewOutcome === "follow-up-required" && followUpTaskIds.length === 0
        ? "Follow-up decisions require at least one task id."
        : reviewOutcome === "follow-up-required" &&
            invalidFollowUpTaskIds.length > 0
          ? "Follow-up task ids must match TASK-YYYYWww-ABC-000."
          : null;
  const canSubmitReview = canReview && reviewValidation === null;

  const setReviewComposerOutcome = (outcome: ReviewDecision["outcome"]) => {
    setReviewOutcome(outcome);
    setReviewReason(REVIEW_REASON_OPTIONS[outcome][0].value);
    if (outcome !== "follow-up-required") {
      setFollowUpTaskInput("");
    }
  };

  const submitReview = () => {
    if (!onReviewDecision || !canSubmitReview) return;
    onReviewDecision({
      outcome: reviewOutcome,
      reasonCodes: [reviewReason],
      ...(reviewOutcome === "follow-up-required"
        ? { followUpTaskIds }
        : {}),
    });
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div>
          <p className="text-xs text-blue-400 font-medium tracking-wide">
            EVIDENCE
          </p>
          <h2 className="text-sm font-semibold">Review Trail</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-sm px-1"
          title="Close evidence"
        >
          x
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
        {serverState && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">Map Summary</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-300">
              <span>Revision</span>
              <span className="text-right font-mono">
                {serverState.summary.revision}
              </span>
              <span>Sources</span>
              <span className="text-right">
                {serverState.summary.sourceCount}
              </span>
              <span>Layers</span>
              <span className="text-right">
                {serverState.summary.layerCount}
              </span>
            </div>
          </div>
        )}

        {cmd && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">Last Command</p>
            <div className="space-y-0.5 text-gray-300">
              <p>
                Commands:{" "}
                <span className="font-mono">{cmd.commandCount ?? "--"}</span>
              </p>
              <p>
                Committed:{" "}
                <span
                  className={cmd.committed ? "text-green-400" : "text-red-400"}
                >
                  {String(cmd.committed)}
                </span>
              </p>
              <p>
                Rolled back:{" "}
                <span
                  className={
                    cmd.rolledBack ? "text-yellow-400" : "text-gray-500"
                  }
                >
                  {String(cmd.rolledBack)}
                </span>
              </p>
              {cmd.failed != null && (
                <p>
                  Failed:{" "}
                  <span
                    className={cmd.failed ? "text-red-400" : "text-gray-500"}
                  >
                    {String(cmd.failed)}
                  </span>
                </p>
              )}
              <p>
                Paths changed:{" "}
                <span className="font-mono">{cmd.changedPathCount}</span>
              </p>
            </div>
          </div>
        )}

        {provider && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">AI Provider</p>
            <p className="text-gray-300 font-mono">{provider.providerId}</p>
            {provider.confidence && (
              <p className="text-gray-500">
                Confidence: {provider.confidence.level} (
                {(provider.confidence.score * 100).toFixed(0)}%)
              </p>
            )}
            {provider.promptHash && (
              <p className="text-gray-500 font-mono break-all">
                prompt: {provider.promptHash}
              </p>
            )}
            {provider.traceId && (
              <p className="text-gray-500 font-mono break-all">
                trace: {provider.traceId}
              </p>
            )}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <p className="text-gray-400 font-medium">Review Decision</p>
          <div className="flex overflow-hidden rounded border border-gray-700">
            <button
              disabled={!canReview}
              onClick={() => setReviewComposerOutcome("accepted")}
              className={`flex-1 px-2 py-1 text-xs transition ${
                reviewOutcome === "accepted"
                  ? "bg-green-900/50 text-green-200"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              } disabled:opacity-30`}
            >
              Accept
            </button>
            <button
              disabled={!canReview}
              onClick={() => setReviewComposerOutcome("blocked")}
              className={`flex-1 px-2 py-1 text-xs transition ${
                reviewOutcome === "blocked"
                  ? "bg-red-900/50 text-red-200"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              } disabled:opacity-30`}
            >
              Block
            </button>
            <button
              disabled={!canReview}
              onClick={() => setReviewComposerOutcome("follow-up-required")}
              className={`flex-1 px-2 py-1 text-xs transition ${
                reviewOutcome === "follow-up-required"
                  ? "bg-yellow-900/50 text-yellow-100"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              } disabled:opacity-30`}
            >
              Follow
            </button>
          </div>
          <label className="block text-gray-500">
            <span className="mb-1 block">Review reason</span>
            <select
              value={reviewReason}
              onChange={(event) =>
                setReviewReason(event.target.value as ReviewDecisionReasonCode)
              }
              disabled={!canReview}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-30"
            >
              {REVIEW_REASON_OPTIONS[reviewOutcome].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {reviewOutcome === "follow-up-required" && (
            <label className="block text-gray-500">
              <span className="mb-1 block">Follow-up task ids</span>
              <input
                value={followUpTaskInput}
                onChange={(event) => setFollowUpTaskInput(event.target.value)}
                disabled={!canReview}
                placeholder="TASK-2026W23-SER-001"
                className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-30"
              />
              <span className="mt-1 block text-[10px] text-gray-600">
                Comma-separated ids stay bounded to the compact review record.
              </span>
            </label>
          )}
          {latestAudit ? (
            <p className="text-gray-500">
              Evidence: <span className="font-mono">{latestAudit.id}</span>
            </p>
          ) : (
            <p className="text-gray-600 italic">No audit record yet</p>
          )}
          <div className="flex items-center justify-between gap-2">
            {reviewValidation ? (
              <p className="text-[11px] text-amber-300">{reviewValidation}</p>
            ) : (
              <span className="text-[11px] text-gray-600">
                Outcome stays append-only and payload-free.
              </span>
            )}
            <button
              disabled={!canSubmitReview}
              onClick={submitReview}
              className="rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-30"
            >
              Record review
            </button>
          </div>
        </div>

        {latestAudit && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">Replay Context</p>
            <p className="text-gray-300">
              Revision{" "}
              <span className="font-mono">{latestAudit.fromRevision}</span> to{" "}
              <span className="font-mono">{latestAudit.toRevision}</span>
            </p>
            <p className="text-gray-500">
              Provider{" "}
              <span className="font-mono">{latestAudit.providerId}</span>,{" "}
              {latestAudit.commandCount} command(s)
            </p>
            {latestAudit.promptHash && (
              <p className="text-gray-600 font-mono break-all">
                {latestAudit.promptHash}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-gray-400 font-medium">
            Session Audit ({auditRecords.length})
          </p>
          {auditRecords.length === 0 ? (
            <p className="text-gray-600 italic">No session records</p>
          ) : (
            auditRecords
              .slice(-5)
              .reverse()
              .map((record) => (
                <div key={record.id} className="rounded bg-gray-800/70 p-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-gray-300">
                      {record.status}
                    </span>
                    <span className="text-gray-500">
                      {record.fromRevision} to {record.toRevision}
                    </span>
                  </div>
                  <p className="text-gray-500">
                    {record.providerId} / {record.commandCount} command(s)
                  </p>
                  <p className="text-gray-600">
                    errors {record.diagnosticCounts.error}, warnings{" "}
                    {record.diagnosticCounts.warning}
                  </p>
                </div>
              ))
          )}
        </div>

        <div className="space-y-1">
          <p className="text-gray-400 font-medium">
            Review History ({reviewDecisions.length})
          </p>
          {reviewDecisions.length === 0 ? (
            <p className="text-gray-600 italic">No review decisions</p>
          ) : (
            reviewDecisions
              .slice(-5)
              .reverse()
              .map((decision) => (
                <div
                  key={decision.decisionId}
                  className="rounded bg-gray-800/70 p-2"
                >
                  <p className="font-mono text-gray-300">{decision.outcome}</p>
                  <p className="text-gray-500">
                    {decision.reasonCodes.join(", ")}
                  </p>
                  {decision.followUpTaskIds && (
                    <p className="text-gray-600">
                      {decision.followUpTaskIds.join(", ")}
                    </p>
                  )}
                </div>
              ))
          )}
        </div>

        <div className="space-y-1">
          <p className="text-gray-400 font-medium">
            Diagnostics ({diags.length})
          </p>
          {diags.length === 0 ? (
            <p className="text-gray-600 italic">No issues</p>
          ) : (
            diags.slice(0, 20).map((d, i) => (
              <div
                key={i}
                className={`rounded p-2 ${d.severity === "error" ? "bg-red-900/30 border border-red-800/50" : d.severity === "warning" ? "bg-yellow-900/20 border border-yellow-800/30" : "bg-gray-800/50"}`}
              >
                <p className="text-gray-300 font-mono text-[11px]">{d.code}</p>
                <p className="text-gray-400 mt-0.5">{d.message}</p>
                {d.path && (
                  <p className="text-gray-600 text-[10px] mt-0.5">
                    path: {d.path}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {!cmd &&
          !provider &&
          diags.length === 0 &&
          auditRecords.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <p>Send a message to see</p>
              <p>review evidence here.</p>
            </div>
          )}
      </div>
    </>
  );
}
