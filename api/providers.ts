/**
 * GET /api/providers — Return available AI provider profiles.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { publicProviderProfiles } from "./studio-provider-guardrails";

type Req = IncomingMessage & { query?: Record<string, string | string[]> };
type Res = ServerResponse & { json: (body: unknown) => void; status: (code: number) => Res };

export default function handler(_req: Req, res: Res): void {
  res.status(200).json({ providers: publicProviderProfiles() });
}
