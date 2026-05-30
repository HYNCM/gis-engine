const messagesEl = document.querySelector("#messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const statusPill = document.querySelector("#status-pill");
const summaryList = document.querySelector("#summary-list");
const diagnosticsList = document.querySelector("#diagnostics-list");
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
  } else {
    map.setStyle(payload.style, { diff: false });
    map.jumpTo({ center, zoom });
  }
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
