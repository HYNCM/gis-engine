const messagesEl = document.querySelector("#messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const statusPill = document.querySelector("#status-pill");
const summaryList = document.querySelector("#summary-list");
const diagnosticsList = document.querySelector("#diagnostics-list");
const featureQuery = document.querySelector("#feature-query");
const commandJson = document.querySelector("#command-json");
const revisionReadout = document.querySelector("#revision-readout");
const cameraReadout = document.querySelector("#camera-readout");
const resetButton = document.querySelector("#reset-button");

let map;

const statusLabels = {
  applied: "Applied",
  blocked: "Blocked",
  ready: "Ready",
  reset: "Reset",
  unsupported: "Unsupported"
};

init().catch((error) => {
  setStatus("blocked");
  appendMessage("assistant", `Workbench failed to load: ${error.message}`);
});

async function init() {
  appendMessage("assistant", "Ready. Try changing point color, point size, or the Hangzhou camera.");
  renderFeatureQuery({ features: [], diagnostics: [] });
  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.getAttribute("data-prompt");
      if (prompt) submitPrompt(prompt);
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
}

async function submitPrompt(message) {
  appendMessage("user", message);
  setStatus("ready");
  const payload = await postJson("/api/chat", { message });
  appendMessage("assistant", payload.plan?.reply ?? "The workbench returned structured evidence.");
  applyPayload(payload);
}

function applyPayload(payload) {
  setStatus(payload.status);
  renderMap(payload);
  renderSummary(payload);
  renderDiagnostics(payload.diagnostics ?? []);
  commandJson.textContent = JSON.stringify(
    {
      plan: payload.plan ?? null,
      commandEvidence: payload.commandEvidence ?? null,
      results: payload.results ?? []
    },
    null,
    2
  );
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
  const tolerance = Math.max(0.004, 0.05 / Math.max(1, 2 ** (zoom - 10)));
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

function renderFeatureQuery(query) {
  const features = query?.features ?? [];
  const diagnostics = query?.diagnostics ?? [];

  if (features.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      diagnostics.length > 0 ? `Query returned ${diagnostics.length} diagnostic(s).` : "Click a point to inspect feature data.";
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
