import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, MapSpec } from "../types.js";
import { escapePathSegment } from "./patch/path.js";

export type ResourceUrlScheme = "http:" | "https:" | "pmtiles:";

export interface ResourcePolicy {
  allowRelativeUrls?: boolean;
  allowedSchemes: ResourceUrlScheme[];
  allowedHosts: string[];
  allowedPathPrefixes?: string[];
  maxResourceBytes?: number;
  timeoutMs?: number;
}

export const defaultResourcePolicy: ResourcePolicy = {
  allowRelativeUrls: true,
  allowedSchemes: ["http:", "https:", "pmtiles:"],
  allowedHosts: ["localhost", "127.0.0.1", "::1", "[::1]"],
  timeoutMs: 10000,
};

export function validateResourcePolicy(spec: MapSpec, policy: ResourcePolicy = defaultResourcePolicy): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const [sourceId, source] of Object.entries(spec.sources)) {
    if (source === null || typeof source !== "object") continue;
    const sourcePath = `/sources/${escapePathSegment(sourceId)}`;

    if (source.type === "geojson" && typeof source.data === "string") {
      diagnostics.push(...validateResourceUrl(source.data, `${sourcePath}/data`, policy));
    }

    if (source.type === "raster" && Array.isArray(source.tiles)) {
      for (const [index, tileUrl] of source.tiles.entries()) {
        if (typeof tileUrl === "string")
          diagnostics.push(...validateResourceUrl(tileUrl, `${sourcePath}/tiles/${index}`, policy));
      }
    }

    if (source.type === "pmtiles" && typeof source.url === "string") {
      diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
    }

    if (source.type === "flatgeobuf" && typeof source.url === "string") {
      diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
    }

    if (source.type === "geoparquet" && typeof source.url === "string") {
      diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
    }

    if (source.type === "geotiff" && typeof source.url === "string") {
      diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
    }

    if (source.type === "vector") {
      if ("tiles" in source && Array.isArray(source.tiles)) {
        for (const [index, tileUrl] of source.tiles.entries()) {
          diagnostics.push(...validateResourceUrl(tileUrl, `${sourcePath}/tiles/${index}`, policy));
        }
      }

      if ("url" in source && typeof source.url === "string") {
        diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
      }
    }
  }

  return diagnostics;
}

export function validateResourceUrl(
  urlString: string,
  path: string,
  policy: ResourcePolicy = defaultResourcePolicy,
): Diagnostic[] {
  // Browsers remove TAB, LF and CR anywhere in a URL before recognizing its scheme
  // or authority. Apply the same normalization before classifying relative refs.
  const trimmedUrl = urlString.trim().replace(/[\t\n\r]/g, "");
  if (trimmedUrl.length === 0) return [blocked(urlString, path, "Resource URL must not be empty.")];

  // Treat network-path references (e.g. "//example.com/data.geojson") as remote URLs rather than local paths.
  // WHATWG URL parsing also treats "\\", "/\" and "\/" prefixes as authority introducers, so they must be
  // normalized here; otherwise such refs match the "relative URL" rule and bypass host allowlisting.
  const effectiveUrl = isNetworkPathReference(trimmedUrl) ? `http:${trimmedUrl.replace(/\\/g, "/")}` : trimmedUrl;

  if (isRelativeResourceUrl(effectiveUrl)) {
    if (policy.allowRelativeUrls === false) {
      return [blocked(urlString, path, "Relative resource URLs are blocked by policy.")];
    }
    if (hasPathTraversal(trimmedUrl)) {
      return [blocked(urlString, path, "Relative resource URLs must not contain path traversal sequences (..).")];
    }
    return validatePathPrefix(effectiveUrl, urlString, path, policy);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(effectiveUrl);
  } catch {
    return [blocked(urlString, path, "Resource URL is invalid or blocked by policy.")];
  }

  const scheme = parsedUrl.protocol;
  if (!isAllowedScheme(scheme, policy)) {
    return [blocked(urlString, path, `URL scheme "${scheme}" is not allowed by policy.`)];
  }

  if ((scheme === "http:" || scheme === "https:") && !policy.allowedHosts.includes(parsedUrl.hostname)) {
    return [blocked(urlString, path, `Remote host "${parsedUrl.hostname}" is not in ResourcePolicy.allowedHosts.`)];
  }

  return validatePathPrefix(parsedUrl.pathname, urlString, path, policy);
}

function isAllowedScheme(scheme: string, policy: ResourcePolicy): scheme is ResourceUrlScheme {
  return policy.allowedSchemes.includes(scheme as ResourceUrlScheme);
}

function validatePathPrefix(
  resourcePath: string,
  originalUrl: string,
  diagnosticPath: string,
  policy: ResourcePolicy,
): Diagnostic[] {
  if (!policy.allowedPathPrefixes || policy.allowedPathPrefixes.length === 0) return [];

  const pathname = normalizeResourcePath(resourcePath);
  if (policy.allowedPathPrefixes.some((prefix) => pathInDirectory(pathname, prefix))) return [];

  return [blocked(originalUrl, diagnosticPath, `Resource path "${pathname}" is not allowed by policy.`)];
}

const relativePathBase = "http://resource-policy.invalid/";

// Prefixes name directories, not string prefixes: "/tiles" covers "/tiles" and "/tiles/a.json"
// but must not cover "/tiles-evil". Dot segments are resolved before the comparison so a path
// cannot claim one directory while resolving into another.
function pathInDirectory(pathname: string, prefix: string): boolean {
  const directory = normalizeResourcePath(prefix).replace(/\/+$/, "");
  if (directory.length === 0) return true;
  return pathname === directory || pathname.startsWith(`${directory}/`);
}

function normalizeResourcePath(value: string): string {
  try {
    // Stripping leading slashes first keeps "//x" a path rather than a network-path reference.
    return new URL(`/${value.replace(/^\/+/, "")}`, relativePathBase).pathname;
  } catch {
    return `/${value.replace(/^\/+/, "")}`;
  }
}

function blocked(urlString: string, path: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.SecurityUrlBlocked,
    message,
    path,
    relatedResources: [{ kind: "url", id: urlString }],
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Use a relative, pmtiles:, localhost, or policy-allowlisted http(s) resource URL.",
    },
  };
}

function isNetworkPathReference(urlString: string): boolean {
  return /^[/\\]{2}/.test(urlString);
}

function isRelativeResourceUrl(urlString: string): boolean {
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(urlString);
}

function hasPathTraversal(urlString: string): boolean {
  const pathname = urlString.split(/[?#]/, 1)[0] ?? "";
  return pathname
    .replace(/\\/g, "/")
    .replace(/%2e/gi, ".")
    .split("/")
    .some((segment) => segment === "..");
}
