const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

interface GeminiResponse {
  text: string;
  ok: boolean;
}

function getApiKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    null
  );
}

export function isGeminiAvailable(): boolean {
  const key = getApiKey();
  return !!key && key !== "placeholder" && key.length > 10;
}

export async function callGemini(req: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  if (!apiKey) return { text: "", ok: false };

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig: {
      maxOutputTokens: req.maxTokens ?? 200,
      temperature: req.temperature ?? 0.7,
    },
  };

  if (req.jsonMode) {
    body.generationConfig = {
      ...(body.generationConfig as Record<string, unknown>),
      responseMimeType: "application/json",
    };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return { text: "", ok: false };

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return { text: text || "", ok: !!text };
}
