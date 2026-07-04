/**
 * GET /api/providers — Return available AI provider profiles.
 */

export const runtime = "edge";

export default function handler(_req: Request): Response {
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

  return Response.json({ providers });
}
