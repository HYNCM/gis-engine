import { MapRuntime, MockAdapter, type MapSpec, type SnapshotOptions } from "@gis-engine/engine";
import mapSpec from "./map.json" with { type: "json" };

async function runSnapshotLifecycle() {
  const adapter = new MockAdapter();
  const options: SnapshotOptions = { width: 512, height: 320, format: "data-url" };

  // 1. Create runtime
  console.log("=== Creating MapRuntime ===");
  const runtime = await MapRuntime.create(mapSpec as MapSpec, {
    adapter,
    container: {} as HTMLElement,
  });
  console.log(`Spec ID: ${mapSpec.id}`);

  // 2. Take snapshot
  console.log("\n=== Taking Snapshot ===");
  const snapshot = await runtime.snapshot(options);
  console.log(`Passed: ${snapshot.passed}`);
  console.log(`Diagnostics: ${snapshot.diagnostics.length}`);
  console.log(`Data URL: ${snapshot.dataUrl?.slice(0, 40)}...`);

  // 3. Export spec
  console.log("\n=== Exporting Spec ===");
  const exported = runtime.exportSpec();
  console.log(`Exported ID: ${exported.id}`);
  console.log(`Layers: ${exported.layers.length}`);

  // 4. Destroy
  console.log("\n=== Destroying Runtime ===");
  const destroyReport = await runtime.destroy();
  console.log(`Destroyed: ${destroyReport.destroyed}`);
  console.log(`Resources cleaned: ${JSON.stringify(destroyReport.resources)}`);

  console.log("\nSnapshot lifecycle complete.");
}

runSnapshotLifecycle();
