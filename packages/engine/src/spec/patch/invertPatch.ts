import type { JsonPatchOperation } from "../../types.js";
import { applyJsonPatch } from "./applyPatch.js";
import { getAtPath } from "./path.js";

export function invertPatch(document: unknown, patch: JsonPatchOperation[]): JsonPatchOperation[] {
  const inverse: JsonPatchOperation[] = [];
  let workingDocument = structuredClone(document);

  for (const operation of patch) {
    if (operation.op === "add") {
      inverse.unshift({ op: "remove", path: operation.path });
      workingDocument = applyJsonPatch(workingDocument, [operation]);
      continue;
    }

    if (operation.op === "remove") {
      inverse.unshift({ op: "add", path: operation.path, value: getAtPath(workingDocument, operation.path) });
      workingDocument = applyJsonPatch(workingDocument, [operation]);
      continue;
    }

    if (operation.op === "replace") {
      inverse.unshift({ op: "replace", path: operation.path, value: getAtPath(workingDocument, operation.path) });
      workingDocument = applyJsonPatch(workingDocument, [operation]);
    }
  }

  return inverse;
}
