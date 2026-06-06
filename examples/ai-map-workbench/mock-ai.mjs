const POINT_LAYER_ID = "poi-circles";

const AUTHOR = {
  type: "agent",
  id: "mock-ai",
  name: "Local mock AI",
};

export function planMockAiEdit(input) {
  const normalized = normalizeInput(input);

  if (matches(normalized, ["red", "crimson", "danger"])) {
    return planned("style-red", "Color point features red.", [
      paintCommand("cmd-mock-red-points", {
        "circle-color": "#ef4444",
      }),
    ]);
  }

  if (matches(normalized, ["blue", "default", "calm"])) {
    return planned("style-blue", "Color point features blue.", [
      paintCommand("cmd-mock-blue-points", {
        "circle-color": "#2563eb",
      }),
    ]);
  }

  if (matches(normalized, ["larger", "bigger", "increase", "large"])) {
    return planned("size-large", "Increase point radius.", [
      paintCommand("cmd-mock-large-points", {
        "circle-radius": 13,
      }),
    ]);
  }

  if (matches(normalized, ["smaller", "decrease", "small"])) {
    return planned("size-small", "Decrease point radius.", [
      paintCommand("cmd-mock-small-points", {
        "circle-radius": 5,
      }),
    ]);
  }

  if (matches(normalized, ["hangzhou", "zoom", "center"])) {
    return planned("view-hangzhou", "Center the map on Hangzhou.", [
      {
        id: "cmd-mock-zoom-hangzhou",
        version: "0.1",
        type: "setView",
        view: {
          center: [120.15, 30.28],
          zoom: 12,
        },
        author: AUTHOR,
        reason: "Mock AI recognized a Hangzhou view request.",
        sourcePromptHash: "sha256:mock-ai-view-hangzhou",
      },
    ]);
  }

  if (matches(normalized, ["reset", "start over", "original"])) {
    return {
      status: "reset",
      intent: "reset",
      reply: "Resetting the workbench to the starter map.",
      commands: [],
    };
  }

  return {
    status: "unsupported",
    intent: "unsupported",
    reply: "I can change point color, adjust point size, zoom to Hangzhou, or reset this local demo.",
    commands: [],
  };
}

function normalizeInput(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function matches(input, terms) {
  return terms.some((term) => input.includes(term));
}

function planned(intent, reply, commands) {
  return {
    status: "planned",
    intent,
    reply,
    commands,
  };
}

function paintCommand(id, paint) {
  return {
    id,
    version: "0.1",
    type: "setPaint",
    layerId: POINT_LAYER_ID,
    paint,
    author: AUTHOR,
    reason: "Mock AI converted local chat text into a GIS Engine setPaint command.",
    sourcePromptHash: `sha256:${id}`,
  };
}
