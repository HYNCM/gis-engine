import { applyJsonPatch, invertPatch } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("JSON patch utilities", () => {
  it("applies and inverts object changes", () => {
    const before = { paint: { color: "blue", opacity: 0.5 } };
    const patch = [{ op: "replace" as const, path: "/paint/color", value: "red" }];
    const after = applyJsonPatch(before, patch);
    const inverse = invertPatch(before, patch);

    expect(after).toEqual({ paint: { color: "red", opacity: 0.5 } });
    expect(applyJsonPatch(after, inverse)).toEqual(before);
  });

  it("applies and inverts sequential array operations", () => {
    const before = { layers: ["a", "b", "c"] };
    const patch = [
      { op: "remove" as const, path: "/layers/0" },
      { op: "remove" as const, path: "/layers/0" },
    ];
    const after = applyJsonPatch(before, patch);
    const inverse = invertPatch(before, patch);

    expect(after).toEqual({ layers: ["c"] });
    expect(applyJsonPatch(after, inverse)).toEqual(before);
  });

  it("rejects replace on a missing object property", () => {
    expect(() => applyJsonPatch({ paint: {} }, [{ op: "replace", path: "/paint/color", value: "red" }])).toThrow(
      /replace target/,
    );
  });
});
