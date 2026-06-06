import type { JsonPatchOperation } from "../../types.js";
import { normalizePatchPath, unescapePathSegment } from "./path.js";

export function applyJsonPatch<T>(document: T, patch: JsonPatchOperation[]): T {
  const clone = structuredClone(document) as T;

  for (const rawOperation of patch) {
    const operation = { ...rawOperation, path: normalizePatchPath(rawOperation.path) };
    applyOperation(clone as Record<string, unknown>, operation);
  }

  return clone;
}

function applyOperation(document: Record<string, unknown>, operation: JsonPatchOperation): void {
  const parts = operation.path.split("/").slice(1).map(unescapePathSegment);
  const key = parts.pop();
  if (key === undefined) throw new Error("Patch path is empty.");

  let target: unknown = document;
  for (const part of parts) {
    if (target === null || typeof target !== "object") {
      throw new Error(`Patch target path does not exist: ${operation.path}`);
    }
    target = (target as Record<string, unknown>)[part];
  }

  if (target === null || typeof target !== "object") {
    throw new Error(`Patch target path does not exist: ${operation.path}`);
  }

  const container = target as Record<string, unknown> | unknown[];

  if (Array.isArray(container)) {
    applyArrayOperation(container, key, operation);
    return;
  }

  if (operation.op === "remove") {
    if (!Object.hasOwn(container as Record<string, unknown>, key)) {
      throw new Error(`Patch remove target does not exist: ${operation.path}`);
    }
    delete (container as Record<string, unknown>)[key];
    return;
  }

  if (operation.op === "replace") {
    if (!Object.hasOwn(container as Record<string, unknown>, key)) {
      throw new Error(`Patch replace target does not exist: ${operation.path}`);
    }
    (container as Record<string, unknown>)[key] = operation.value;
    return;
  }

  if (operation.op === "add") {
    (container as Record<string, unknown>)[key] = operation.value;
    return;
  }

  throw new Error(`Unsupported patch operation: ${operation.op}`);
}

function applyArrayOperation(container: unknown[], key: string, operation: JsonPatchOperation): void {
  const index = key === "-" ? container.length : Number.parseInt(key, 10);
  if (Number.isNaN(index)) throw new Error(`Invalid array patch index: ${key}`);

  if (operation.op === "remove") {
    if (index < 0 || index >= container.length)
      throw new Error(`Patch remove array index out of bounds: ${operation.path}`);
    container.splice(index, 1);
    return;
  }

  if (operation.op === "add") {
    if (index < 0 || index > container.length)
      throw new Error(`Patch add array index out of bounds: ${operation.path}`);
    container.splice(index, 0, operation.value);
    return;
  }

  if (operation.op === "replace") {
    if (index < 0 || index >= container.length)
      throw new Error(`Patch replace array index out of bounds: ${operation.path}`);
    container[index] = operation.value;
    return;
  }

  throw new Error(`Unsupported array patch operation: ${operation.op}`);
}
