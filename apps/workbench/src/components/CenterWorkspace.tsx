import { Braces, Files, Map as MapIcon } from "lucide-react";
import type { ServerState } from "../App";
import type { WorkbenchProjectState } from "../workbench-types";
import MapSpecEditor from "./MapSpecEditor";
import MapStage from "./MapStage";

export type CenterTab = "map" | "mapspec" | "files";

interface Props {
  tab: CenterTab;
  state: WorkbenchProjectState;
  previewSpec: Record<string, unknown> | null;
  onTabChange: (tab: CenterTab) => void;
}

const FILES = ["gis-engine.project.json", "mapspec.json", "data/", ".gis-engine/revisions/", "exports/"];

export default function CenterWorkspace({ tab, state, previewSpec, onTabChange }: Props) {
  const spec = previewSpec ?? state.spec;
  const revision = String(spec.revision ?? state.project.currentRevision);
  const serverState: ServerState = {
    status: "ready",
    spec,
    style: null,
    summary: {
      mapId: String(spec.id ?? state.project.id),
      revision,
      sourceCount: Object.keys((spec.sources as Record<string, unknown>) ?? {}).length,
      layerCount: Array.isArray(spec.layers) ? spec.layers.length : 0,
      center: ((spec.view as Record<string, unknown> | undefined)?.center as [number, number] | undefined) ?? null,
      zoom: ((spec.view as Record<string, unknown> | undefined)?.zoom as number | undefined) ?? null,
    },
    diagnostics: [],
  };

  return (
    <main className="center-workspace">
      <div className="workspace-tabs" role="tablist" aria-label="Project view">
        <button className={tab === "map" ? "active" : ""} onClick={() => onTabChange("map")} type="button">
          <MapIcon size={14} aria-hidden="true" /> Map
        </button>
        <button className={tab === "mapspec" ? "active" : ""} onClick={() => onTabChange("mapspec")} type="button">
          <Braces size={14} aria-hidden="true" /> MapSpec
        </button>
        <button className={tab === "files" ? "active" : ""} onClick={() => onTabChange("files")} type="button">
          <Files size={14} aria-hidden="true" /> Files
        </button>
        <span className="workspace-context">{previewSpec ? "Preview copy" : `Revision ${revision}`}</span>
      </div>
      <div className="center-content">
        {tab === "map" ? <MapStage serverState={serverState} /> : null}
        {tab === "mapspec" ? (
          <MapSpecEditor value={JSON.stringify(spec, null, 2)} onChange={() => {}} diagnostics={[]} readOnly />
        ) : null}
        {tab === "files" ? (
          <div className="file-browser">
            <div className="file-browser-heading">
              <h2>Project files</h2>
              <span>JSON files are the source of truth</span>
            </div>
            {FILES.map((file) => (
              <div className="file-row" key={file}>
                <Files size={15} aria-hidden="true" />
                <code>{file}</code>
                <span>{file.endsWith("/") ? "directory" : "tracked"}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
