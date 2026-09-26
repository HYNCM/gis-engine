import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { MAX_JSON_BODY_BYTES, readJsonBody, WorkbenchRequestBodyError } from "../../apps/workbench/server/index.mjs";

function request(chunks: string[], headers: Record<string, string> = {}) {
  const emitter = new EventEmitter() as EventEmitter & { headers: Record<string, string>; resume: () => void };
  emitter.headers = headers;
  emitter.resume = () => undefined;
  queueMicrotask(() => {
    for (const chunk of chunks) emitter.emit("data", chunk);
    emitter.emit("end");
  });
  return emitter;
}

describe("Workbench request body limits", () => {
  it("parses a bounded JSON body", async () => {
    await expect(readJsonBody(request(['{"ok":true}']))).resolves.toEqual({ ok: true });
  });

  it("rejects an oversized Content-Length before parsing", async () => {
    await expect(
      readJsonBody(request([], { "content-length": String(MAX_JSON_BODY_BYTES + 1) })),
    ).rejects.toBeInstanceOf(WorkbenchRequestBodyError);
  });

  it("rejects an oversized streamed body with a stable diagnostic", async () => {
    const error = await readJsonBody(request(["x".repeat(12)]), 8).catch((value) => value);
    expect(error).toMatchObject({
      status: 413,
      diagnostics: [{ code: "WORKBENCH.DATA_TOO_LARGE", path: "/body" }],
    });
  });
});
