/**
 * GET /api/providers — Return available AI provider profiles.
 */

import { publicProviderProfiles } from "../../../api/workbench-provider-guardrails";

export const runtime = "edge";

export default function handler(_req: Request): Response {
  return Response.json({ providers: publicProviderProfiles() });
}
