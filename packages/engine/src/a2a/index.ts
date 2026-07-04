/**
 * Agent-to-Agent (A2A) Protocol Stub
 *
 * Implements the minimum viable A2A protocol interface for GIS Engine:
 * - AgentCard JSON discovery (well-known endpoint)
 * - Task routing (accept/execute/complete lifecycle)
 * - Capability declaration
 *
 * This is a stub implementation defining the contract shape. Actual
 * HTTP transport, authentication, and task persistence are not implemented.
 *
 * Reference: Google A2A Protocol Specification (2025)
 *
 * @module a2a
 */

import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic } from "../types.js";

// ---------------------------------------------------------------------------
// AgentCard — well-known discovery document
// ---------------------------------------------------------------------------

export interface A2AAgentCard {
  name: string;
  description: string;
  version: string;
  protocolVersion: "0.2";
  url: string;
  capabilities: A2AAgentCapabilities;
  skills: A2AAgentSkill[];
  authentication: A2AAgentAuthentication;
  provider: {
    organization: string;
    url: string;
  };
}

export interface A2AAgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  stateTransitionHistory: boolean;
}

export interface A2AAgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes: string[];
  outputModes: string[];
}

export interface A2AAgentAuthentication {
  schemes: string[];
  credentials?: string;
}

// ---------------------------------------------------------------------------
// Task lifecycle
// ---------------------------------------------------------------------------

export type A2ATaskState = "submitted" | "working" | "input-required" | "completed" | "failed" | "canceled";

export interface A2ATask {
  id: string;
  sessionId: string;
  status: {
    state: A2ATaskState;
    message?: A2AMessage;
    timestamp: string;
  };
  history: A2AMessage[];
  artifacts: A2AArtifact[];
  metadata: Record<string, unknown>;
}

export interface A2AMessage {
  role: "user" | "agent";
  parts: A2APart[];
}

export type A2APart =
  | { type: "text"; text: string }
  | { type: "file"; file: { name: string; mimeType: string; bytes?: string; uri?: string } }
  | { type: "data"; data: Record<string, unknown> };

export interface A2AArtifact {
  name: string;
  description?: string;
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

export interface A2ATaskSendRequest {
  id: string;
  sessionId: string;
  message: A2AMessage;
  acceptedOutputModes?: string[];
  metadata?: Record<string, unknown>;
}

export interface A2ATaskSendResponse {
  task: A2ATask;
}

// ---------------------------------------------------------------------------
// GIS Engine A2A Agent Card
// ---------------------------------------------------------------------------

export function createGisEngineAgentCard(options: { url?: string; version?: string } = {}): A2AAgentCard {
  return {
    name: "GIS Engine",
    description:
      "Schema-first, AI-operable map SDK. Accepts natural language map intents and returns validated MapSpec configurations with rendering commands.",
    version: options.version ?? "1.7.0",
    protocolVersion: "0.2",
    url: options.url ?? "/a2a",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: "map-spec-generation",
        name: "Map Spec Generation",
        description: "Generate a validated MapSpec from a natural language map description.",
        tags: ["gis", "map", "cartography", "geojson"],
        examples: [
          "Create a choropleth map of population density by county",
          "Show a heatmap of earthquake events in California",
          "Display point clusters of restaurant locations in Tokyo",
        ],
        inputModes: ["text/plain"],
        outputModes: ["application/json"],
      },
      {
        id: "map-spec-editing",
        name: "Map Spec Editing",
        description: "Edit an existing MapSpec using natural language instructions.",
        tags: ["gis", "map", "edit", "styling"],
        examples: [
          "Change the fill color to blue",
          "Add a zoom range of 8-14 to all layers",
          "Filter features where population > 100000",
        ],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "map-validation",
        name: "Map Validation",
        description: "Validate a MapSpec and return structured diagnostics.",
        tags: ["gis", "validation", "schema"],
        examples: ["Validate this MapSpec configuration"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "style-recommendation",
        name: "Style Recommendation",
        description: "Analyze GeoJSON data and recommend appropriate map styles.",
        tags: ["gis", "styling", "recommendation"],
        examples: ["Recommend styles for this GeoJSON dataset"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
    ],
    authentication: {
      schemes: ["none"],
    },
    provider: {
      organization: "GIS Engine",
      url: "https://github.com/nicepkg/gis-engine",
    },
  };
}

// ---------------------------------------------------------------------------
// Task router (stub)
// ---------------------------------------------------------------------------

export interface A2ATaskRouterOptions {
  agentCard: A2AAgentCard;
}

export class A2ATaskRouter {
  private readonly agentCard: A2AAgentCard;
  private readonly tasks = new Map<string, A2ATask>();

  constructor(options: A2ATaskRouterOptions) {
    this.agentCard = options.agentCard;
  }

  getAgentCard(): A2AAgentCard {
    return this.agentCard;
  }

  /**
   * Route a task send request to the appropriate skill handler.
   * Currently returns a stub "working" response for all skills.
   */
  async handleTaskSend(request: A2ATaskSendRequest): Promise<A2ATaskSendResponse> {
    const existingTask = this.tasks.get(request.id);
    const task: A2ATask = existingTask ?? {
      id: request.id,
      sessionId: request.sessionId,
      status: { state: "submitted", timestamp: new Date().toISOString() },
      history: [],
      artifacts: [],
      metadata: {},
    };

    task.history.push(request.message);
    task.status = {
      state: "working",
      timestamp: new Date().toISOString(),
      message: {
        role: "agent",
        parts: [{ type: "text", text: "GIS Engine A2A stub: task received and queued for processing." }],
      },
    };

    // Stub: immediately mark as completed with a placeholder artifact
    task.status = {
      state: "completed",
      timestamp: new Date().toISOString(),
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: "GIS Engine A2A stub: task completed. Actual skill handlers are not yet implemented.",
          },
        ],
      },
    };

    task.artifacts.push({
      name: "stub-response",
      description: "Placeholder artifact from A2A stub implementation.",
      parts: [
        {
          type: "data",
          data: {
            stub: true,
            skillCount: this.agentCard.skills.length,
            message: "A2A task routing is implemented; skill handlers require future development.",
          },
        },
      ],
    });

    this.tasks.set(request.id, task);
    return { task };
  }

  /**
   * Get a task by ID.
   */
  async handleTaskGet(taskId: string): Promise<A2ATask | null> {
    return this.tasks.get(taskId) ?? null;
  }

  /**
   * Cancel a task.
   */
  async handleTaskCancel(taskId: string): Promise<A2ATask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = {
      state: "canceled",
      timestamp: new Date().toISOString(),
    };
    return task;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateAgentCard(card: unknown): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (!card || typeof card !== "object") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SpecInvalidType,
      message: "AgentCard must be a non-null object.",
      path: "/agentCard",
    });
    return diagnostics;
  }

  const record = card as Record<string, unknown>;

  if (typeof record.name !== "string" || record.name.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SpecMissingField,
      message: "AgentCard.name is required and must be a non-empty string.",
      path: "/agentCard/name",
    });
  }

  if (record.protocolVersion !== "0.2") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: 'AgentCard.protocolVersion must be "0.2".',
      path: "/agentCard/protocolVersion",
    });
  }

  if (!Array.isArray(record.skills) || record.skills.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecMissingField,
      message: "AgentCard should declare at least one skill.",
      path: "/agentCard/skills",
    });
  }

  return diagnostics;
}
