import type { JsonPatchOperation } from "../../types.js";
import { normalizePatchPath, sortChangedPaths } from "./path.js";

export function normalizePatch(patch: JsonPatchOperation[]): JsonPatchOperation[] {
  return patch.map((operation) => {
    const normalized: JsonPatchOperation = {
      ...operation,
      path: normalizePatchPath(operation.path),
    };
    return normalized;
  });
}

export function changedPathsForPatch(patch: JsonPatchOperation[]): string[] {
  return sortChangedPaths(patch.map((operation) => operation.path));
}
