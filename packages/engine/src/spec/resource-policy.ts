import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, MapSpec } from "../types.js";

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
  timeoutMs: 10000
};

export function validateResourcePolicy(spec: MapSpec, policy: ResourcePolicy = defaultResourcePolicy): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const [sourceId, source] of Object.entries(spec.sources)) {
    const sourcePath = `/sources/${escapePathSegment(sourceId)}`;

    if (source.type === "geojson" && typeof source.data === "string") {
      diagnostics.push(...validateResourceUrl(source.data, `${sourcePath}/data`, policy));
    }

    if (source.type === "raster" && Array.isArray(source.tiles)) {
      for (const [index, tileUrl] of source.tiles.entries()) {
        if (typeof tileUrl === "string") diagnostics.push(...validateResourceUrl(tileUrl, `${sourcePath}/tiles/${index}`, policy));
      }
    }

    if (source.type === "pmtiles" && typeof source.url === "string") {
      diagnostics.push(...validateResourceUrl(source.url, `${sourcePath}/url`, policy));
    }
  }

  return diagnostics;
}

export function validateResourceUrl(urlString: string, path: string, policy: ResourcePolicy = defaultResourcePolicy): Diagnostic[] {
  const trimmedUrl = urlString.trim();
  if (trimmedUrl.length === 0) return [blocked(urlString, path, "Resource URL must not be empty.")];

  if (isRelativeResourceUrl(trimmedUrl)) {
    if (policy.allowRelativeUrls === false) {
      return [blocked(urlString, path, "Relative resource URLs are blocked by policy.")];
    }
    return validatePathPrefix(trimmedUrl, urlString, path, policy);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
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

function validatePathPrefix(pathname: string, originalUrl: string, diagnosticPath: string, policy: ResourcePolicy): Diagnostic[] {
  if (!policy.allowedPathPrefixes || policy.allowedPathPrefixes.length === 0) return [];

  if (policy.allowedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) return [];

  return [blocked(originalUrl, diagnosticPath, `Resource path "${pathname}" is not allowed by policy.`)];
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
      message: "Use a relative, pmtiles:, localhost, or policy-allowlisted http(s) resource URL."
    }
  };
}

function isRelativeResourceUrl(urlString: string): boolean {
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(urlString);
}

function escapePathSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
