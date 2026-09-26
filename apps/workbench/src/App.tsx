import { Boxes, ChevronDown, CircleDot, Github, LoaderCircle } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import CenterWorkspace, { type CenterTab } from "./components/CenterWorkspace";
import ProgressTrack from "./components/ProgressTrack";
import ProjectRail from "./components/ProjectRail";
import TaskInspector, { type InspectorTab } from "./components/TaskInspector";
import { basicMapTemplate } from "./templates";
import type {
  DataInspection,
  Diagnostic,
  ExportPreview,
  ExportReceipt,
  WorkbenchPlanResult,
  WorkbenchPreviewResult,
  WorkbenchProjectState,
} from "./workbench-types";

interface DataAttachmentReceipt {
  path: string;
  sourceId: string;
  sha256: string;
  bytes: number;
  revision: string;
}

export interface ServerState {
  status: "ready" | "loading" | "blocked" | "applied" | "reviewed";
  spec: Record<string, unknown>;
  style: Record<string, unknown> | null;
  summary: {
    mapId: string;
    revision: string;
    sourceCount: number;
    layerCount: number;
    center: [number, number] | null;
    zoom: number | null;
  };
  diagnostics: Diagnostic[];
  commandEvidence?: {
    commandCount?: number;
    committed: boolean;
    rolledBack: boolean;
    failed?: boolean;
    changedPathCount: number;
  };
  provider?: {
    providerId: string;
    confidence?: { score: number; level: string };
    promptHash?: string;
    traceId?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: string;
  evidence?: {
    commandEvidence?: ServerState["commandEvidence"];
    provider?: ServerState["provider"];
    diagnostics?: Diagnostic[];
  };
}

interface ProviderProfile {
  id: string;
  label: string;
  protocol: string;
  model?: string;
  enabled: boolean;
  missingCredential: boolean;
}

const SAMPLE_GEOJSON = JSON.stringify(
  {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: [121.47, 31.23] }, properties: { category: "A" } },
      { type: "Feature", geometry: { type: "Point", coordinates: [120.16, 30.25] }, properties: { category: "B" } },
    ],
  },
  null,
  2,
);

export default function App() {
  const [state, setState] = useState<WorkbenchProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [projectName, setProjectName] = useState("My first GIS project");
  const [providers, setProviders] = useState<ProviderProfile[]>([
    { id: "mock-ai", label: "Mock AI", protocol: "mock", enabled: true, missingCredential: false },
  ]);
  const [providerId, setProviderId] = useState("mock-ai");
  const [centerTab, setCenterTab] = useState<CenterTab>("map");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("plan");
  const [dataText, setDataText] = useState(SAMPLE_GEOJSON);
  const [dataFileName, setDataFileName] = useState("sample.geojson");
  const [dataSourceId, setDataSourceId] = useState("sample-data");
  const [inspection, setInspection] = useState<DataInspection | null>(null);
  const [attachment, setAttachment] = useState<DataAttachmentReceipt | null>(null);
  const [prompt, setPrompt] = useState("Make the points red and easier to see");
  const [plan, setPlan] = useState<WorkbenchPlanResult | null>(null);
  const [preview, setPreview] = useState<WorkbenchPreviewResult | null>(null);
  const [appliedOnce, setAppliedOnce] = useState(false);
  const [exportPath, setExportPath] = useState("exports/map-app");
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [exportReceipt, setExportReceipt] = useState<ExportReceipt | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  const loadCurrentProject = useCallback(async () => {
    try {
      const current = await request<WorkbenchProjectState | null>("/api/projects/current");
      if (!current) {
        setState(null);
        setAppliedOnce(false);
        setAttachment(null);
        setExportReceipt(null);
        return;
      }
      setState(current);
      setAppliedOnce(current.history.length > 1);
      setExportReceipt(current.exportReceipts?.at(-1) ?? null);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentProject();
  }, [loadCurrentProject]);

  useEffect(() => {
    void request<{ providers: ProviderProfile[] }>("/api/providers")
      .then((response) => setProviders(response.providers))
      .catch(() => undefined);
  }, []);

  const run = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true);
    setDiagnostics([]);
    try {
      await operation();
    } catch (error) {
      setDiagnostics(diagnosticsFromError(error));
      setInspectorTab("diagnostics");
    } finally {
      setBusy(false);
    }
  }, []);

  const createProject = () =>
    run(async () => {
      const initialSpec = structuredClone(basicMapTemplate.spec) as Record<string, unknown>;
      initialSpec.id = "workbench-map";
      initialSpec.revision = "0";
      initialSpec.view = { mode: "map2d", center: [120.8, 30.75], zoom: 6 };
      const initialSources = initialSpec.sources as Record<string, Record<string, unknown>>;
      const initialSource = Object.values(initialSources)[0];
      if (initialSource?.type === "geojson") initialSource.data = JSON.parse(SAMPLE_GEOJSON);
      const selectedProvider = providers.find((profile) => profile.id === providerId);
      const created = await request<WorkbenchProjectState>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          id: "project-1",
          name: projectName.trim(),
          initialSpec,
          provider:
            selectedProvider?.protocol === "mock"
              ? { kind: "mock" }
              : {
                  kind: "openai-compatible",
                  profileId: selectedProvider?.id,
                  model: selectedProvider?.model,
                },
        }),
      });
      setState(created);
      setAttachment(null);
    });

  const handleDataTextChange = (value: string) => {
    setDataText(value);
    setInspection(null);
    setAttachment(null);
  };

  const handleDataFileNameChange = (value: string) => {
    setDataFileName(value);
    setAttachment(null);
  };

  const handleDataSourceIdChange = (value: string) => {
    setDataSourceId(value);
    setAttachment(null);
  };

  const selectDataFile = (file: File | null) => {
    if (!file) return;
    void file
      .text()
      .then((content) => {
        const stem = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^A-Za-z0-9_-]/g, "-")
          .replace(/^-+/, "");
        setDataText(content);
        setDataFileName(file.name);
        setDataSourceId(stem || "uploaded-data");
        setInspection(null);
        setAttachment(null);
      })
      .catch(() => {
        setDiagnostics([
          {
            severity: "error",
            code: "WORKBENCH.DATA_UNSUPPORTED",
            path: "/file",
            message: "The selected file could not be read.",
          },
        ]);
        setInspectorTab("diagnostics");
      });
  };

  const inspectData = () =>
    run(async () => {
      if (!state) return;
      let value: unknown;
      try {
        value = JSON.parse(dataText);
      } catch {
        throw new ApiError([
          {
            severity: "error",
            code: "WORKBENCH.DATA_UNSUPPORTED",
            path: "/value",
            message: "GeoJSON must be valid JSON.",
          },
        ]);
      }
      const response = await request<{ ok: true; result: DataInspection }>(
        `/api/projects/${state.project.id}/data/inspect`,
        { method: "POST", body: JSON.stringify({ kind: "geojson", value }) },
      );
      setInspection(response.result);
    });

  const attachData = () =>
    run(async () => {
      if (!state || !inspection) return;
      let value: unknown;
      try {
        value = JSON.parse(dataText);
      } catch {
        throw new ApiError([
          {
            severity: "error",
            code: "WORKBENCH.DATA_UNSUPPORTED",
            path: "/value",
            message: "GeoJSON must be valid JSON.",
          },
        ]);
      }
      const response = await request<{ ok: true; result: DataAttachmentReceipt }>(
        `/api/projects/${state.project.id}/data/attach`,
        {
          method: "POST",
          body: JSON.stringify({
            kind: "geojson",
            value,
            sourceId: dataSourceId,
            fileName: dataFileName,
            baseRevision: state.project.currentRevision,
          }),
        },
      );
      setAttachment(response.result);
      await loadCurrentProject();
    });

  const generatePlan = () =>
    run(async () => {
      if (!state) return;
      const response = await request<{ ok: true; result: WorkbenchPlanResult }>(
        `/api/projects/${state.project.id}/plans`,
        { method: "POST", body: JSON.stringify({ prompt }) },
      );
      setPlan(response.result);
      setPreview(null);
      setInspectorTab("plan");
    });

  const previewPlan = () =>
    run(async () => {
      if (!state || !plan) return;
      const response = await request<{ ok: true; result: WorkbenchPreviewResult }>(
        `/api/projects/${state.project.id}/plans/${plan.planHash}/preview`,
        { method: "POST" },
      );
      setPreview(response.result);
      setInspectorTab("diff");
      setCenterTab("map");
    });

  const abandonPlan = useCallback(() => {
    setPlan(null);
    setPreview(null);
    setInspectorTab("plan");
  }, []);

  const applyPlan = () =>
    run(async () => {
      if (!state || !plan) return;
      await request(`/api/projects/${state.project.id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          schemaVersion: "gis-engine.workbench.apply-request.v1",
          projectId: state.project.id,
          planHash: plan.planHash,
          baseRevision: plan.plan.baseRevision,
        }),
      });
      setAppliedOnce(true);
      setPlan(null);
      setPreview(null);
      await loadCurrentProject();
    });

  const restoreRevision = (revision: string) =>
    run(async () => {
      if (!state) return;
      await request(`/api/projects/${state.project.id}/revisions/${revision}/restore`, {
        method: "POST",
        body: JSON.stringify({ baseRevision: state.project.currentRevision }),
      });
      setPlan(null);
      setPreview(null);
      await loadCurrentProject();
    });

  const previewExport = () =>
    run(async () => {
      if (!state) return;
      const response = await request<{ ok: true; result: ExportPreview }>(
        `/api/projects/${state.project.id}/export/preview`,
        { method: "POST", body: JSON.stringify({ targetRelativePath: exportPath }) },
      );
      setExportPreview(response.result);
      setExportReceipt(null);
      setInspectorTab("export");
      if (response.result.diagnostics.length > 0) setDiagnostics(response.result.diagnostics);
    });

  const commitExport = () =>
    run(async () => {
      if (!state || !exportPreview) return;
      const response = await request<{ ok: true; result: ExportReceipt }>(
        `/api/projects/${state.project.id}/export/commit`,
        { method: "POST", body: JSON.stringify({ previewHash: exportPreview.previewHash }) },
      );
      setExportReceipt(response.result);
    });

  const progress = useMemo(() => {
    if (!state) return 0;
    if (!inspection) return 1;
    if (!preview && !appliedOnce) return 2;
    if (!appliedOnce) return 3;
    if (!exportReceipt) return 4;
    return 5;
  }, [appliedOnce, exportReceipt, inspection, preview, state]);

  const taskDiagnostics = useMemo(
    () => [
      ...diagnostics,
      ...(plan?.plan.diagnostics ?? []),
      ...(preview?.diagnostics ?? []),
      ...(exportPreview?.diagnostics ?? []),
    ],
    [diagnostics, exportPreview, plan, preview],
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <LoaderCircle className="spin" size={22} />
        <span>Opening Workbench</span>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="first-run-shell">
        <header className="brand-bar">
          <Brand />
          <a href="https://github.com/HYNCM/gis-engine" aria-label="Open source repository">
            <Github size={16} />
          </a>
        </header>
        <main className="create-project-panel">
          <div className="create-project-title">
            <Boxes size={24} />
            <div>
              <h1>Create project</h1>
              <p>Start from a local MapSpec and sample GeoJSON.</p>
            </div>
          </div>
          <label htmlFor="project-name">Project name</label>
          <input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          <label htmlFor="project-provider">AI provider</label>
          <select id="project-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
            {providers.map((profile) => (
              <option disabled={!profile.enabled} key={profile.id} value={profile.id}>
                {profile.label}
                {profile.missingCredential ? " (credential not configured)" : ""}
              </option>
            ))}
          </select>
          <button
            className="primary-button"
            type="button"
            disabled={busy || !projectName.trim()}
            onClick={createProject}
          >
            {busy ? <LoaderCircle className="spin" size={15} /> : <Boxes size={15} />} Create project
          </button>
          {diagnostics.map((item) => (
            <p className="create-error" key={item.code}>
              {item.message}
            </p>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="workbench-shell">
      <header className="brand-bar">
        <Brand />
        <button className="project-switcher" type="button" title="Current local project">
          <span>{state.project.name}</span>
          <ChevronDown size={13} />
        </button>
        <div className="header-status">
          <CircleDot size={13} />
          <span>Local</span>
          <code>rev {state.project.currentRevision}</code>
        </div>
      </header>
      <ProgressTrack completed={progress} />
      <div className="workspace-grid">
        <ProjectRail
          state={state}
          dataText={dataText}
          dataFileName={dataFileName}
          dataSourceId={dataSourceId}
          inspection={inspection}
          attachedPath={attachment?.path ?? null}
          busy={busy}
          onDataTextChange={handleDataTextChange}
          onDataFileNameChange={handleDataFileNameChange}
          onDataSourceIdChange={handleDataSourceIdChange}
          onFileSelect={selectDataFile}
          onInspectData={inspectData}
          onAttachData={attachData}
          onRestore={restoreRevision}
        />
        <CenterWorkspace
          tab={centerTab}
          state={state}
          previewSpec={preview?.spec ?? null}
          onTabChange={(tab) => startTransition(() => setCenterTab(tab))}
        />
        <TaskInspector
          tab={inspectorTab}
          prompt={prompt}
          plan={plan}
          preview={preview}
          diagnostics={taskDiagnostics}
          exportPath={exportPath}
          exportPreview={exportPreview}
          exportReceipt={exportReceipt}
          providerLabel={
            state.project.provider.kind === "mock"
              ? "Mock provider"
              : (providers.find((profile) => profile.id === state.project.provider.profileId)?.label ??
                "OpenAI-compatible provider")
          }
          busy={busy}
          onTabChange={(tab) => startTransition(() => setInspectorTab(tab))}
          onPromptChange={setPrompt}
          onGeneratePlan={generatePlan}
          onPreviewPlan={previewPlan}
          onAbandonPlan={abandonPlan}
          onApplyPlan={applyPlan}
          onExportPathChange={setExportPath}
          onPreviewExport={previewExport}
          onCommitExport={commitExport}
        />
      </div>
      {busy ? (
        <div className="operation-indicator" role="status">
          <LoaderCircle className="spin" size={14} /> Working
        </div>
      ) : null}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Boxes size={15} />
      </span>
      <div>
        <strong>GIS Engine</strong>
        <span className="brand-product">Workbench</span>
      </div>
    </div>
  );
}

class ApiError extends Error {
  diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics[0]?.message ?? "Workbench request failed.");
    this.diagnostics = diagnostics;
  }
}

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok || body?.ok === false) {
    throw new ApiError(
      body?.diagnostics ?? [
        {
          severity: "error",
          code: "WORKBENCH.REQUEST_FAILED",
          message: "Workbench request failed.",
          path,
        },
      ],
    );
  }
  return body as T;
}

function diagnosticsFromError(error: unknown): Diagnostic[] {
  if (error instanceof ApiError) return error.diagnostics;
  return [
    {
      severity: "error",
      code: "WORKBENCH.REQUEST_FAILED",
      message: error instanceof Error ? error.message : "Workbench request failed.",
    },
  ];
}
