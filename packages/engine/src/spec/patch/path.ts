export function escapePathSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

export function joinPath(...segments: string[]): string {
  if (segments.length === 0) return "";
  return `/${segments.map(escapePathSegment).join("/")}`;
}

export function normalizePatchPath(path: string): string {
  if (path === "") return "";
  if (!path.startsWith("/")) return `/${path}`;
  return path.replace(/\/{2,}/g, "/");
}

export function sortChangedPaths(paths: string[]): string[] {
  return [...new Set(paths.map(normalizePatchPath))].sort((left, right) => left.localeCompare(right));
}

export function getAtPath(value: unknown, path: string): unknown {
  if (path === "") return value;
  const parts = path.split("/").slice(1).map(unescapePathSegment);
  let current: unknown = value;

  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function unescapePathSegment(segment: string): string {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}
