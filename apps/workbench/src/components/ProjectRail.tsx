import { Database, FileJson, FileUp, History, Layers3, Plus, RotateCcw } from "lucide-react";
import type { DataInspection, WorkbenchProjectState } from "../workbench-types";

interface Props {
  state: WorkbenchProjectState;
  dataText: string;
  dataFileName: string;
  dataSourceId: string;
  inspection: DataInspection | null;
  attachedPath: string | null;
  busy: boolean;
  onDataTextChange: (value: string) => void;
  onDataFileNameChange: (value: string) => void;
  onDataSourceIdChange: (value: string) => void;
  onFileSelect: (file: File | null) => void;
  onInspectData: () => void;
  onAttachData: () => void;
  onRestore: (revision: string) => void;
}

export default function ProjectRail({
  state,
  dataText,
  dataFileName,
  dataSourceId,
  inspection,
  attachedPath,
  busy,
  onDataTextChange,
  onDataFileNameChange,
  onDataSourceIdChange,
  onFileSelect,
  onInspectData,
  onAttachData,
  onRestore,
}: Props) {
  const sources = Object.entries((state.spec.sources as Record<string, { type?: string }>) ?? {});
  const layers = ((state.spec.layers as Array<{ id?: string; type?: string; source?: string }>) ?? []).filter(Boolean);

  return (
    <aside className="project-rail" aria-label="Project explorer">
      <section className="rail-section project-summary">
        <div className="section-heading">
          <FileJson size={14} aria-hidden="true" />
          <h2>Project</h2>
        </div>
        <strong>{state.project.name}</strong>
        <span className="mono-caption">revision {state.project.currentRevision}</span>
      </section>

      <section className="rail-section">
        <div className="section-heading">
          <Database size={14} aria-hidden="true" />
          <h2>Data sources</h2>
          <span className="count">{sources.length}</span>
        </div>
        <div className="rail-list">
          {sources.map(([id, source]) => (
            <div className="rail-row" key={id}>
              <span className="source-mark" aria-hidden="true" />
              <span>{id}</span>
              <small>{source.type ?? "unknown"} · ready</small>
            </div>
          ))}
        </div>
        <label className="field-label" htmlFor="data-file">
          GeoJSON file
        </label>
        <input
          id="data-file"
          className="text-input"
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          disabled={busy}
          onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
        />
        <label className="field-label" htmlFor="data-source-id">
          Source id
        </label>
        <input
          id="data-source-id"
          className="text-input"
          value={dataSourceId}
          disabled={busy}
          onChange={(event) => onDataSourceIdChange(event.target.value)}
        />
        <label className="field-label" htmlFor="data-file-name">
          Project filename
        </label>
        <input
          id="data-file-name"
          className="text-input"
          value={dataFileName}
          disabled={busy}
          onChange={(event) => onDataFileNameChange(event.target.value)}
        />
        <textarea
          id="data-paste"
          className="data-input"
          value={dataText}
          onChange={(event) => onDataTextChange(event.target.value)}
          aria-label="Paste GeoJSON data"
          spellCheck={false}
        />
        <button className="secondary-button full-width" type="button" disabled={busy} onClick={onInspectData}>
          <Database size={14} aria-hidden="true" />
          Inspect data
        </button>
        {inspection ? (
          <div className="inspection-summary" role="status">
            <span>{inspection.featureCount ?? 0} features</span>
            <span>{inspection.geometryTypes?.join(", ") || inspection.kind}</span>
            <span>{inspection.bytes} bytes</span>
          </div>
        ) : null}
        {inspection ? (
          <button className="primary-button full-width" type="button" disabled={busy} onClick={onAttachData}>
            <Plus size={14} aria-hidden="true" />
            Attach source
          </button>
        ) : null}
        {attachedPath ? (
          <div className="inspection-summary" role="status">
            <FileUp size={14} aria-hidden="true" />
            <span>Attached {attachedPath}</span>
          </div>
        ) : null}
      </section>

      <section className="rail-section">
        <div className="section-heading">
          <Layers3 size={14} aria-hidden="true" />
          <h2>Layers</h2>
          <span className="count">{layers.length}</span>
        </div>
        <div className="rail-list">
          {layers.map((layer) => (
            <div className="rail-row" key={layer.id}>
              <span className={`layer-mark layer-${layer.type ?? "unknown"}`} aria-hidden="true" />
              <span>{layer.id}</span>
              <small>{layer.type}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="rail-section history-section">
        <div className="section-heading">
          <History size={14} aria-hidden="true" />
          <h2>History</h2>
          <span className="count">{state.history.length}</span>
        </div>
        <div className="history-list">
          {[...state.history].reverse().map((entry) => {
            const current = entry.revision === state.project.currentRevision;
            return (
              <div className={`history-row ${current ? "is-current" : ""}`} key={`${entry.revision}-${entry.kind}`}>
                <span className="history-node" aria-hidden="true" />
                <div>
                  <strong>Revision {entry.revision}</strong>
                  <small>{entry.kind}</small>
                </div>
                {!current ? (
                  <button
                    className="icon-button"
                    type="button"
                    title={`Restore revision ${entry.revision}`}
                    aria-label={`Restore revision ${entry.revision}`}
                    disabled={busy}
                    onClick={() => onRestore(entry.revision)}
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
