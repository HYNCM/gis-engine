/**
 * GET /api/providers — Return available AI provider profiles.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { query?: Record<string, string | string[]> };
type Res = ServerResponse & { json: (body: unknown) => void; status: (code: number) => Res };

export default function handler(_req: Req, res: Res): void {
  const deepseekKey = (process.env.DEEPSEEK_API_KEY ?? "").trim();
  const deepseekBaseUrl = (process.env.DEEPSEEK_BASE_URL ?? "").trim() || "https://api.deepseek.com";
  const deepseekModel = (process.env.DEEPSEEK_MODEL ?? "").trim() || "deepseek-v4-flash";

  const providers = [
    {
      id: "mock-ai",
      label: "Mock AI",
      protocol: "mock",
      enabled: true,
      missingCredential: false,
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat-completions",
      model: deepseekModel,
      baseUrl: deepseekBaseUrl,
      enabled: Boolean(deepseekKey),
      missingCredential: !deepseekKey,
    },
  ];

  res.status(200).json({ providers });
}
