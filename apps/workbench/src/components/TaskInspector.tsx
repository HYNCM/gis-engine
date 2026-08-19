import { Check, CircleAlert, FileDiff, PackageCheck, Send, Sparkles, X } from "lucide-react";
import type {
  Diagnostic,
  ExportPreview,
  ExportReceipt,
  WorkbenchPlanResult,
  WorkbenchPreviewResult,
} from "../workbench-types";

export type InspectorTab = "plan" | "diff" | "diagnostics" | "export";

interface Props {
  tab: InspectorTab;
  prompt: string;
  plan: WorkbenchPlanResult | null;
  preview: WorkbenchPreviewResult | null;
  diagnostics: Diagnostic[];
  exportPath: string;
  exportPreview: ExportPreview | null;
  exportReceipt: ExportReceipt | null;
  busy: boolean;
  onTabChange: (tab: InspectorTab) => void;
  onPromptChange: (value: string) => void;
  onGeneratePlan: () => void;
  onPreviewPlan: () => void;
  onAbandonPlan: () => void;
  onApplyPlan: () => void;
  onExportPathChange: (value: string) => void;
  onPreviewExport: () => void;
  onCommitExport: () => void;
}

const tabs: Array<{ id: InspectorTab; label: string }> = [
  { id: "plan", label: "AI plan" },
  { id: "diff", label: "Diff" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "export", label: "Export" },
];

export default function TaskInspector(props: Props) {
  return (
    <aside className="task-inspector" aria-label="Task inspector">
      <div className="inspector-tabs" role="tablist" aria-label="Task views">
        {tabs.map((tab) => (
          <button
            className={props.tab === tab.id ? "active" : ""}
            key={tab.id}
            type="button"
            onClick={() => props.onTabChange(tab.id)}
          >
            {tab.label}
            {tab.id === "diagnostics" && props.diagnostics.length > 0 ? (
              <span className="tab-count">{props.diagnostics.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="inspector-content">
        {props.tab === "plan" ? <PlanPanel {...props} /> : null}
        {props.tab === "diff" ? <DiffPanel preview={props.preview} /> : null}
        {props.tab === "diagnostics" ? <DiagnosticsPanel diagnostics={props.diagnostics} /> : null}
        {props.tab === "export" ? <ExportPanel {...props} /> : null}
      </div>
    </aside>
  );
}

function PlanPanel(props: Props) {
  return (
    <div className="inspector-panel">
      <div className="panel-title">
        <Sparkles size={15} aria-hidden="true" />
        <div>
          <h2>Describe the map change</h2>
          <span>Mock provider · preview required</span>
        </div>
      </div>
      <textarea
        className="prompt-input"
        value={props.prompt}
        onChange={(event) => props.onPromptChange(event.target.value)}
        placeholder="Make the points red and easier to see"
        aria-label="Map change request"
      />
      <button
        className="primary-button full-width"
        type="button"
        onClick={props.onGeneratePlan}
        disabled={props.busy || !props.prompt.trim()}
      >
        <Send size={14} aria-hidden="true" /> Generate plan
      </button>

      {props.plan ? (
        <div className="plan-details">
          <div className="plan-heading">
            <span>Reviewed input</span>
            <code>{props.plan.planHash.slice(0, 18)}…</code>
          </div>
          <h3>{props.plan.plan.goal}</h3>
          <dl>
            <div>
              <dt>Base revision</dt>
              <dd>{props.plan.plan.baseRevision}</dd>
            </div>
            <div>
              <dt>Commands</dt>
              <dd>{props.plan.plan.commands.length}</dd>
            </div>
            <div>
              <dt>Affected files</dt>
              <dd>{props.plan.plan.affectedPaths.length}</dd>
            </div>
          </dl>
          <div className="command-list">
            {props.plan.plan.commands.map((command, index) => (
              <div key={String(command.id ?? index)}>
                <code>{String(command.type)}</code>
                <span>{String(command.layerId ?? command.sourceId ?? "MapSpec")}</span>
              </div>
            ))}
          </div>
          {!props.preview ? (
            <button
              className="primary-button full-width"
              type="button"
              disabled={props.busy}
              onClick={props.onPreviewPlan}
            >
              <FileDiff size={14} aria-hidden="true" /> Preview changes
            </button>
          ) : (
            <div className="review-actions">
              <button className="secondary-button" type="button" disabled={props.busy} onClick={props.onAbandonPlan}>
                <X size={14} aria-hidden="true" /> Abandon plan
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={props.busy || !props.preview.canApply}
                onClick={props.onApplyPlan}
              >
                <Check size={14} aria-hidden="true" /> Apply plan
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles size={20} />}
          text="A structured plan will appear here before any project file changes."
        />
      )}
    </div>
  );
}

function DiffPanel({ preview }: { preview: WorkbenchPreviewResult | null }) {
  if (!preview)
    return <EmptyState icon={<FileDiff size={20} />} text="Preview a plan to inspect its MapSpec and file diff." />;
  const groups = [
    ["Added", preview.diff?.added ?? []],
    ["Modified", preview.diff?.modified ?? []],
    ["Removed", preview.diff?.removed ?? []],
  ] as const;
  return (
    <div className="inspector-panel">
      <div className="panel-title">
        <FileDiff size={15} />
        <div>
          <h2>Revision diff</h2>
          <span>
            {preview.baseRevision} → {preview.previewRevision}
          </span>
        </div>
      </div>
      <div className="diff-summary">
        {groups.map(([label, entries]) => (
          <section key={label}>
            <h3>
              {label}
              <span>{entries.length}</span>
            </h3>
            {entries.length ? entries.map((entry) => <code key={entry}>{entry}</code>) : <small>None</small>}
          </section>
        ))}
      </div>
      <div className="reversibility">
        <Check size={14} />
        <span>{preview.snapshot.reversible ? "Command batch is reversible" : "Rollback evidence unavailable"}</span>
      </div>
    </div>
  );
}

function DiagnosticsPanel({ diagnostics }: { diagnostics: Diagnostic[] }) {
  return (
    <div className="inspector-panel">
      <div className="panel-title">
        <CircleAlert size={15} />
        <div>
          <h2>Diagnostics</h2>
          <span>Stable codes from the current task</span>
        </div>
      </div>
      {diagnostics.length ? (
        diagnostics.map((item, index) => (
          <div className={`diagnostic-row severity-${item.severity}`} key={`${item.code}-${index}`}>
            <code>{item.code}</code>
            <p>{item.message}</p>
            <span>{item.path ?? "/"}</span>
          </div>
        ))
      ) : (
        <EmptyState icon={<Check size={20} />} text="No blocking diagnostics in the current task." />
      )}
    </div>
  );
}

function ExportPanel(props: Props) {
  return (
    <div className="inspector-panel">
      <div className="panel-title">
        <PackageCheck size={15} />
        <div>
          <h2>Export TypeScript app</h2>
          <span>Preview hashes before confirmed write</span>
        </div>
      </div>
      <label className="field-label" htmlFor="export-path">
        Project-relative target
      </label>
      <input
        id="export-path"
        className="text-input"
        value={props.exportPath}
        onChange={(event) => props.onExportPathChange(event.target.value)}
      />
      <button
        className="secondary-button full-width"
        type="button"
        disabled={props.busy}
        onClick={props.onPreviewExport}
      >
        Preview export
      </button>
      {props.exportPreview ? (
        <div className="export-files">
          <div className="plan-heading">
            <span>{props.exportPreview.files.length} files</span>
            <code>{props.exportPreview.previewHash.slice(0, 18)}…</code>
          </div>
          {props.exportPreview.files.slice(0, 8).map((file) => (
            <div key={file.path}>
              <code>{file.path}</code>
              <span>{file.bytes} B</span>
            </div>
          ))}
          <button
            className="primary-button full-width"
            type="button"
            disabled={props.busy || props.exportPreview.diagnostics.length > 0}
            onClick={props.onCommitExport}
          >
            <PackageCheck size={14} /> Confirm write
          </button>
        </div>
      ) : null}
      {props.exportReceipt ? (
        <div className="export-success" role="status">
          <Check size={16} />
          <div>
            <strong>Export verified</strong>
            <span>{props.exportReceipt.targetRelativePath}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="empty-state">
      {icon}
      <p>{text}</p>
    </div>
  );
}
