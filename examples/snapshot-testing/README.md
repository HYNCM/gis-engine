# snapshot-testing

Demonstrates the full snapshot lifecycle: create a map runtime, take a snapshot, export the spec, and clean up — all without a browser, using the `MockAdapter`.

## What This Example Shows

1. **Creating a `MapRuntime`** from a valid MapSpec with the `MockAdapter`.
2. **Taking a snapshot** via `runtime.snapshot()` — returns a `SnapshotResult` with `passed`, `diagnostics`, and a `dataUrl`.
3. **Exporting the spec** via `runtime.exportSpec()` — get a deterministic copy of the current map state.
4. **Destroying the runtime** via `runtime.destroy()` — idempotent cleanup.

## Files

| File | Purpose |
|---|---|
| `map.json` | A valid MapSpec with a GeoJSON source and styled circle layer. |
| `validate.ts` | Script that runs the full snapshot lifecycle and prints results. |

## Key Concepts

Snapshots are deterministic and headless. The `MockAdapter` supports snapshots without a browser or MapLibre, making them ideal for CI smoke tests.

```typescript
const runtime = await MapRuntime.create(spec, { adapter: new MockAdapter(), container: {} });
const snapshot = await runtime.snapshot({ width: 256, height: 160, format: "data-url" });
// snapshot.passed === true
// snapshot.dataUrl === "data:image/png;base64,mock"
```

For pixel-level visual regression testing, use `MapLibreAdapter` with Playwright (see `pnpm test:snapshot:visual`).

## Usage

```bash
npx tsx validate.ts
```
