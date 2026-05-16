import { createAdapter } from "../renderer/registry.js";
import type { MapSpec } from "../types.js";
import { MapRuntime } from "./MapRuntime.js";

export interface CreateMapOptions {
  renderer: string;
}

export async function createMap(container: HTMLElement, spec: MapSpec, options: CreateMapOptions): Promise<MapRuntime> {
  const adapter = createAdapter(options.renderer);
  return MapRuntime.create(spec, { adapter, container });
}
