import { describe, expect, it } from "vitest";
import type { RendererAdapter } from "@gis-engine/engine";

export function createAdapterContractSuite(name: string, createAdapter: () => RendererAdapter): void {
  describe(`${name} renderer adapter contract`, () => {
    it("exposes capabilities and supports destroy reporting", async () => {
      const adapter = createAdapter();
      const capabilities = await adapter.getCapabilities();
      expect(capabilities.renderer).toBe(adapter.id);

      const report = await adapter.destroy();
      expect(report.destroyed).toBe(true);
    });
  });
}
