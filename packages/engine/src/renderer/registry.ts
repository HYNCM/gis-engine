import type { RendererAdapter } from "./adapter.js";

export type RendererAdapterFactory = () => RendererAdapter;

const adapterFactories = new Map<string, RendererAdapterFactory>();

export function registerAdapter(id: string, factory: RendererAdapterFactory): void {
  if (!id) throw new Error("Adapter id is required.");
  adapterFactories.set(id, factory);
}

export function createAdapter(id: string): RendererAdapter {
  const factory = adapterFactories.get(id);
  if (!factory) throw new Error(`Renderer adapter "${id}" is not registered.`);
  return factory();
}

export function listAdapters(): string[] {
  return [...adapterFactories.keys()].sort();
}
