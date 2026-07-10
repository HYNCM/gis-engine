/**
 * GET /api/providers — Return available AI provider profiles.
 */

import { publicProviderProfiles } from "../../../api/studio-provider-guardrails";

export const runtime = "edge";

export default function handler(_req: Request): Response {
  return Response.json({ providers: publicProviderProfiles() });
}
