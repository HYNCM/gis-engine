# AI Map Workbench Provider Profiles Design

## Goal

Allow AI Map Workbench users to choose a server-enabled AI API provider while
preserving the existing GIS Engine safety contract. The first provider slice
supports server-side profiles for DeepSeek and other OpenAI-compatible chat
completion APIs.

## Confirmed Scope

- Provider selection model: server-side provider profiles.
- First supported protocol: OpenAI-compatible chat completions.
- Built-in profile target: DeepSeek.
- Custom target: one OpenAI-compatible profile with configurable base URL,
  model, label, and API key environment variable name.
- Credential boundary: API keys stay on the server and are never sent to the
  browser, returned by APIs, or stored in audit records.
- Mutation boundary: real model output cannot mutate `MapSpec` directly; it
  must normalize into structured intent before command creation.
- Fallback: mock planner remains the default deterministic mode.

## Architecture

The workbench server owns provider discovery, credential lookup, external API
calls, response parsing, and audit metadata. The browser can only list and
select provider ids returned by the server.

Required flow:

```txt
UI provider id + user message
  -> server provider profile lookup
  -> server API key lookup
  -> OpenAI-compatible chat completion call
  -> structured JSON intent extraction
  -> normalizeWorkbenchProviderPlan
  -> createMapGenerationCommandSkeleton
  -> applyCommands
  -> generationEvidence + bounded audit
```

The existing injected provider path remains useful for tests, but production
provider mode is resolved from configured profiles rather than browser-provided
connection details.

## Provider Profile Contract

Provider profile metadata describes how the server should connect to a provider
without storing the secret value:

```ts
type WorkbenchProviderProfile = {
  id: string;
  label: string;
  protocol: "openai-chat-completions";
  baseUrl: string;
  model: string;
  apiKeyEnv: string;
  enabled: boolean;
};
```

The public provider list returned to the UI must be a safe projection:

```ts
type PublicWorkbenchProviderProfile = {
  id: string;
  label: string;
  protocol: "openai-chat-completions";
  model: string;
  enabled: boolean;
  missingCredential: boolean;
};
```

The public shape intentionally excludes the API key, raw environment value,
request headers, and raw provider response.

## Configuration

The initial implementation should support:

- `mock-ai`: always available, deterministic, and selected by default.
- `deepseek`: built-in server profile enabled when its API key environment
  variable is present.
- `openai-compatible`: optional custom profile configured with server
  environment variables for label, base URL, model, and API key env name.

Implementation should verify current provider documentation before hard-coding
any DeepSeek endpoint or model default. The design only requires the protocol
to be OpenAI-compatible.

## Model Output Contract

The provider adapter prompts the model to return JSON containing structured
intent and optional confidence:

```json
{
  "intent": {
    "mapId": "ai-map-workbench",
    "targetDomains": ["feature-display"],
    "styleEdits": [
      {
        "layerId": "poi-circles",
        "paint": {
          "circle-color": "#ef4444"
        }
      }
    ]
  },
  "confidence": {
    "level": "medium",
    "reasons": ["User asked to make point features red."]
  }
}
```

The server adds provider provenance such as `providerId`, `promptHash`, and
`traceId`, then calls `normalizeWorkbenchProviderPlan`. The existing forbidden
provider fields remain blocked: `rawPrompt`, `prompt`, `promptText`,
`javascript`, `commands`, `mapSpec`, and `patch`.

## UI Behavior

The UI adds a provider selector near the existing provider evidence area. It
loads safe provider metadata from `/api/providers`, selects `mock-ai` by
default, and sends only the user message plus selected `providerId` to
`/api/chat`.

The UI displays safe evidence fields only:

- provider id and label
- model name
- provider status
- prompt hash
- trace id
- generation delivery status
- command evidence
- diagnostic counts

The UI must not display API keys, raw provider responses, raw prompts, complete
`MapSpec` payloads, feature payloads, or screenshots.

## Error Handling

Provider errors should return structured diagnostics and leave the active map
revision unchanged.

- Missing or disabled profile: configuration diagnostic.
- Missing credential: configuration diagnostic.
- Provider HTTP failure, rate limit, authentication failure, timeout, or empty
  response: provider diagnostic.
- Invalid JSON or unsupported model output fields: existing provider-output
  diagnostic path with `CAPABILITY.UNSUPPORTED` at `/providerOutput`.
- Failed command skeleton or command replay: existing command diagnostics and
  no failed mutation commit.

Audit records remain bounded and payload-free. They may include provider id,
prompt hash, trace id, status, command count, diagnostic counts, and revision
movement.

## Testing

Automated coverage should include:

- Provider profile discovery hides secret values and marks missing credentials.
- DeepSeek and custom profile config build OpenAI-compatible request metadata.
- Mocked OpenAI-compatible responses normalize into `WorkbenchProviderPlan`.
- Non-JSON, HTTP failure, timeout, empty response, and forbidden fields return
  structured diagnostics without spec mutation.
- `/api/chat` routes provider-selected requests through the existing command
  path and returns compact generation evidence.
- `/api/audit` remains bounded and does not include raw prompts, raw model
  output, API keys, map specs, feature payloads, or browser state.

Verification should run the focused provider/workbench tests, documentation
tests, whitespace checks, and `pnpm check`.

## Non-Goals

- No browser-entered or browser-stored API keys.
- No arbitrary HTTP request templating in the first slice.
- No provider plugin runtime in the first slice.
- No durable audit database.
- No hosted product promotion.
- No new MCP tool names.
- No direct model-generated commands, JavaScript, `MapSpec`, or JSON Patch
  mutation path.
- No stable SceneView3D runtime or 3D renderer claim.

## Acceptance Criteria

- Users can choose `mock-ai`, DeepSeek, or a configured OpenAI-compatible
  profile from the workbench UI when the server enables them.
- Missing credentials are visible as safe disabled provider state.
- Real provider calls happen server-side only.
- Successful provider output produces command-based map edits through
  `applyCommands`.
- Unsafe or invalid provider output is blocked before mutation.
- Generation evidence and audit records remain compact and payload-free.
