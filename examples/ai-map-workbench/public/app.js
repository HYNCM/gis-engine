const messagesEl = document.querySelector("#messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const providerSelect = document.querySelector("#provider-select");
const providerStatus = document.querySelector("#provider-status");
const statusPill = document.querySelector("#status-pill");
const summaryList = document.querySelector("#summary-list");
const providerList = document.querySelector("#provider-list");
const diagnosticsList = document.querySelector("#diagnostics-list");
const sourcePromotionList = document.querySelector("#source-promotion-list");
const featureQuery = document.querySelector("#feature-query");
const auditList = document.querySelector("#audit-list");
const reviewList = document.querySelector("#review-list");
const commandJson = document.querySelector("#command-json");
const revisionReadout = document.querySelector("#revision-readout");
const cameraReadout = document.querySelector("#camera-readout");
const resetButton = document.querySelector("#reset-button");
const shell = document.querySelector(".workbench-shell");
const chatPanelToggle = document.querySelector("#toggle-chat-panel");
const evidencePanelToggle = document.querySelector("#toggle-evidence-panel");

let map;
let providerProfiles = [];
let selectedProviderId = "mock-ai";

const statusLabels = {
  applied: "Applied",
  blocked: "Blocked",
  ready: "Ready",
  reviewed: "Reviewed",
  reset: "Reset",
  unsupported: "Unsupported"
};

init().catch((error) => {
  setStatus("blocked");
  appendMessage("assistant", `Workbench failed to load: ${error.message}`);
});

async function init() {
  initSidebarControls();
  appendMessage("assistant", "Ready. Try changing point color, point size, or the Hangzhou camera.");
  renderFeatureQuery({ features: [], diagnostics: [] });
  await loadProviders();
  providerSelect.addEventListener("change", () => {
    const profile = providerProfiles.find((provider) => provider.id === providerSelect.value && provider.enabled);
    if (!profile) {
      providerSelect.value = selectedProviderId;
      renderProviderStatus();
      return;
    }
    selectedProviderId = profile.id;
    renderProviderStatus();
  });
  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.getAttribute("data-prompt");
      if (prompt) submitPrompt(prompt);
    });
  });
  document.querySelectorAll("[data-review-outcome]").forEach((button) => {
    button.addEventListener("click", () => {
      const outcome = button.getAttribute("data-review-outcome");
      if (outcome) submitReviewDecision(outcome);
    });
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = "";
    submitPrompt(message);
  });

  resetButton.addEventListener("click", async () => {
    const payload = await postJson("/api/reset", {});
    appendMessage("assistant", "Workbench reset to the starter map.");
    applyPayload(payload);
  });

  const state = await fetchJson("/api/state");
  applyPayload(state);
  await refreshReviewDecisions();
}

async function loadProviders() {
  try {
    const result = await fetchJson("/api/providers");
    providerProfiles = Array.isArray(result.providers) ? result.providers : [];
  } catch (error) {
    providerProfiles = [
      {
        id: "mock-ai",
        label: "Mock AI",
        model: "deterministic-mock",
        enabled: true,
        missingCredential: false
      }
    ];
  }

  const mockProvider = providerProfiles.find((provider) => provider.id === "mock-ai" && provider.enabled);
  const fallbackProvider = providerProfiles.find((provider) => provider.enabled);
  selectedProviderId = (mockProvider ?? fallbackProvider)?.id ?? "";
  renderProviderOptions();
  renderProviderStatus();
}

function renderProviderOptions() {
  const options = providerProfiles.map((provider) => {
    const option = document.createElement("option");
    option.value = provider.id;
    option.disabled = !provider.enabled;
    option.textContent = formatProviderOptionLabel(provider);
    return option;
  });
  providerSelect.replaceChildren(...options);
  providerSelect.value = selectedProviderId;
}

function formatProviderOptionLabel(provider) {
  const availability = provider.enabled ? "" : provider.missingCredential ? " (missing credential)" : " (unavailable)";
  return `${provider.label ?? provider.id} / ${provider.model ?? "model unknown"}${availability}`;
}

function renderProviderStatus() {
  const profile = providerProfiles.find((provider) => provider.id === selectedProviderId);
  if (!profile) {
    providerStatus.textContent = "No ready provider.";
    return;
  }
  if (profile.missingCredential) {
    providerStatus.textContent = "Missing server credential.";
    return;
  }
  providerStatus.textContent = `Next request: ${profile.label ?? profile.id}`;
}

function initSidebarControls() {
  restoreSidebarState("left", chatPanelToggle);
  restoreSidebarState("right", evidencePanelToggle);

  chatPanelToggle.addEventListener("click", () => toggleSidebar("left", chatPanelToggle));
  evidencePanelToggle.addEventListener("click", () => toggleSidebar("right", evidencePanelToggle));
}

function restoreSidebarState(side, button) {
  const collapsed = localStorage.getItem(`workbench-${side}-collapsed`) === "true";
  setSidebarCollapsed(side, button, collapsed);
}

function toggleSidebar(side, button) {
  const collapsed = !shell.classList.contains(`${side}-collapsed`);
  setSidebarCollapsed(side, button, collapsed);
  localStorage.setItem(`workbench-${side}-collapsed`, String(collapsed));
}

function setSidebarCollapsed(side, button, collapsed) {
  shell.classList.toggle(`${side}-collapsed`, collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", collapsed ? `Expand ${side} sidebar` : `Collapse ${side} sidebar`);
  requestAnimationFrame(() => {
    map?.resize?.();
  });
}

async function submitPrompt(message) {
  appendMessage("user", message);
  setStatus("ready");
  const payload = await postJson("/api/chat", { message, providerId: selectedProviderId });
  appendMessage("assistant", payload.plan?.reply ?? "The workbench returned structured evidence.");
  applyPayload(payload);
}

async function submitReviewDecision(outcome) {
  const payload = await postJson("/api/review-decision", reviewDecisionRequest(outcome));
  if (payload.decision) {
    appendMessage("assistant", `Review decision recorded: ${payload.decision.outcome}.`);
  } else {
    appendMessage("assistant", "Review decision was blocked by structured diagnostics.");
  }
  setStatus(payload.status);
  renderDiagnostics(payload.diagnostics ?? []);
  renderReviewDecisions(payload.decisions ?? []);
}

function reviewDecisionRequest(outcome) {
  if (outcome === "accepted") return { outcome, reasonCodes: ["review-accepted"] };
  if (outcome === "blocked") return { outcome, reasonCodes: ["manual-review-blocked"] };
  return {
    outcome,
    reasonCodes: ["visual-evidence-required"],
    followUpTaskIds: ["TASK-2026W23-AWP-006"]
  };
}

function applyPayload(payload) {
  setStatus(payload.status);
  renderMap(payload);
  renderSummary(payload);
  renderProviderEvidence(payload);
  renderDiagnostics(payload.diagnostics ?? []);
  refreshAudit();
  refreshReviewDecisions();
  commandJson.textContent = JSON.stringify(
    {
      plan: payload.plan ?? null,
      provider: payload.provider ?? null,
      generationEvidence: payload.generationEvidence ?? null,
      commandEvidence: payload.commandEvidence ?? null,
      results: payload.results ?? []
    },
    null,
    2
  );
}

async function refreshAudit() {
  try {
    const audit = await fetchJson("/api/audit");
    renderAudit(audit.records ?? []);
  } catch (error) {
    renderAudit([]);
  }
}

async function refreshReviewDecisions() {
  try {
    const payload = await fetchJson("/api/review-decisions");
    renderReviewDecisions(payload.decisions ?? []);
  } catch (error) {
    renderReviewDecisions([]);
  }
}

function renderMap(payload) {
  if (!payload.style) return;
  const center = payload.summary?.center ?? [120.15, 30.28];
  const zoom = payload.summary?.zoom ?? 11;

  if (!map) {
    map = new maplibregl.Map({
      container: "map",
      style: payload.style,
      center,
      zoom,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", (event) => queryMapFeatures(event.lngLat));
  } else {
    map.setStyle(payload.style, { diff: false });
    map.jumpTo({ center, zoom });
  }
}

async function queryMapFeatures(lngLat) {
  const zoom = map?.getZoom?.() ?? 11;
  const tolerance = Math.max(0.012, 0.08 / Math.max(1, 2 ** (zoom - 10)));
  const payload = await postJson("/api/query", {
    bbox: [lngLat.lng - tolerance, lngLat.lat - tolerance, lngLat.lng + tolerance, lngLat.lat + tolerance],
    layers: ["poi-circles"]
  });
  renderFeatureQuery(payload.query);
}

function renderSummary(payload) {
  const summary = payload.summary ?? {};
  revisionReadout.textContent = `revision ${summary.revision ?? "--"}`;
  cameraReadout.textContent = formatCamera(summary.center, summary.zoom);

  const rows = [
    ["Map", summary.mapId ?? "unknown"],
    ["Revision", summary.revision ?? "--"],
    ["Sources", String(summary.sourceCount ?? 0)],
    ["Layers", String(summary.layerCount ?? 0)],
    ["Commands", String(payload.commandEvidence?.commandCount ?? 0)]
  ];

  summaryList.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      return [term, description];
    })
  );
}

function renderProviderEvidence(payload) {
  const provider = payload.provider;
  const evidence = payload.generationEvidence;
  const planner = evidence?.planner;
  const delivery = evidence?.delivery;
  const evidenceProviderId = provider?.providerId ?? "mock";
  const evidenceProfile = provider?.providerId
    ? providerProfiles.find((profile) => profile.id === provider.providerId)
    : undefined;
  const rows = [
    ["Provider", evidenceProviderId],
    ["Model", evidenceProfile?.model ?? "--"],
    ["Raw prompt", provider?.retainedRawPrompt === false ? "not retained" : "not provided"],
    ["Planner", planner?.provided ? planner.plannerId : "mock fallback"],
    ["Confidence", provider?.confidence?.level ?? planner?.confidence?.level ?? "--"],
    ["Delivery", delivery?.status ?? "not requested"],
    ["Prompt hash", evidence?.promptHash ?? "--"]
  ];

  providerList.replaceChildren(...definitionRows(rows));
  renderSourcePromotionCandidates(delivery?.sourcePromotionCandidates ?? []);
}

function renderDiagnostics(diagnostics) {
  if (diagnostics.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No diagnostics.";
    diagnosticsList.replaceChildren(empty);
    return;
  }

  diagnosticsList.replaceChildren(
    ...diagnostics.map((diagnostic) => {
      const item = document.createElement("article");
      item.className = `diagnostic ${diagnostic.severity}`;
      const code = document.createElement("strong");
      code.textContent = diagnostic.code;
      const message = document.createElement("p");
      message.textContent = diagnostic.message;
      item.append(code, message);
      return item;
    })
  );
}

function renderSourcePromotionCandidates(candidates) {
  if (candidates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No source promotion candidates.";
    sourcePromotionList.replaceChildren(empty);
    return;
  }

  sourcePromotionList.replaceChildren(
    ...candidates.slice(0, 4).map((candidate) => {
      const article = document.createElement("article");
      article.className = "audit-card";
      const title = document.createElement("strong");
      title.textContent = `${candidate.format} / ${candidate.state}`;
      const meta = document.createElement("p");
      const sourceIds = Array.isArray(candidate.sourceIds) && candidate.sourceIds.length > 0 ? candidate.sourceIds.join(", ") : "no sources";
      meta.textContent = `${candidate.candidateId} / ${sourceIds}`;
      const resourcePolicy = document.createElement("p");
      resourcePolicy.textContent = `Resource policy: ${candidate.resourcePolicy ?? "not-checked"}`;
      const archiveContract = document.createElement("p");
      const archiveSummary = candidate.archiveContract
        ? `${candidate.archiveContract.state} / ${candidate.archiveContract.metadataFields?.length ?? 0} metadata fields / ${candidate.archiveContract.policyFields?.length ?? 0} policy fields`
        : "not-checked";
      archiveContract.textContent = `Archive contract: ${archiveSummary}`;
      const details = document.createElement("p");
      details.textContent = `${candidate.target} — ${candidate.exitCondition}`;
      article.append(title, meta, resourcePolicy, archiveContract, details);
      return article;
    })
  );
}

function definitionRows(rows) {
  return rows.flatMap(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    return [term, description];
  });
}

function renderFeatureQuery(query) {
  const features = query?.features ?? [];
  const diagnostics = query?.diagnostics ?? [];

  if (features.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      diagnostics.length > 0 ? `Query returned ${diagnostics.length} diagnostic(s).` : "No feature selected.";
    featureQuery.replaceChildren(empty);
    return;
  }

  featureQuery.replaceChildren(
    ...features.slice(0, 3).map((feature) => {
      const article = document.createElement("article");
      article.className = "feature-card";
      const name = document.createElement("strong");
      name.textContent = feature.properties?.name ?? "Unnamed feature";
      const meta = document.createElement("p");
      meta.textContent = feature.properties
        ? Object.entries(feature.properties)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" / ")
        : "No properties";
      article.append(name, meta);
      return article;
    })
  );
}

function renderAudit(records) {
  if (records.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No session records.";
    auditList.replaceChildren(empty);
    return;
  }

  auditList.replaceChildren(
    ...records
      .slice(-3)
      .reverse()
      .map((record) => {
        const article = document.createElement("article");
        article.className = "audit-card";
        const title = document.createElement("strong");
        title.textContent = `${record.status} / ${record.commandCount} command(s)`;
        const meta = document.createElement("p");
        meta.textContent = `${record.fromRevision} -> ${record.toRevision} / ${record.providerId}`;
        article.append(title, meta);
        return article;
      })
  );
}

function renderReviewDecisions(decisions) {
  if (decisions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No review decisions.";
    reviewList.replaceChildren(empty);
    return;
  }

  reviewList.replaceChildren(
    ...decisions
      .slice(-3)
      .reverse()
      .map((decision) => {
        const article = document.createElement("article");
        article.className = "audit-card";
        const title = document.createElement("strong");
        title.textContent = `${decision.outcome} / ${decision.reasonCodes?.join(", ") ?? "review"}`;
        const meta = document.createElement("p");
        meta.textContent = `${decision.auditRecordId ?? "no-audit"} / ${decision.providerId ?? "provider"}`;
        article.append(title, meta);
        return article;
      })
  );
}

function appendMessage(role, text) {
  const item = document.createElement("article");
  item.className = `message ${role}`;
  const label = document.createElement("span");
  label.textContent = role === "user" ? "You" : "Mock AI";
  const body = document.createElement("p");
  body.textContent = text;
  item.append(label, body);
  messagesEl.append(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setStatus(status) {
  statusPill.dataset.status = status;
  statusPill.textContent = statusLabels[status] ?? status;
}

function formatCamera(center, zoom) {
  if (!Array.isArray(center)) return "camera --";
  return `${center[0].toFixed(3)}, ${center[1].toFixed(3)} at z${Number(zoom ?? 0).toFixed(1)}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
