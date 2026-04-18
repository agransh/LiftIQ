import { NextRequest, NextResponse } from "next/server";
import { callGemini, isGeminiAvailable } from "@/lib/ai/gemini-client";
import {
  CRISIS_RESPONSE,
  SAFE_FALLBACK_REFLECTION,
  buildReflectPrompt,
  detectCrisisLanguage,
  type ReflectInput,
} from "@/lib/mind/prompts";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  let body: Partial<ReflectInput> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { reflection: SAFE_FALLBACK_REFLECTION, source: "fallback" },
      { status: 200 },
    );
  }

  const text = typeof body.text === "string" ? body.text : "";
  const mode = (body.mode ?? "checkin") as ReflectInput["mode"];
  const level = typeof body.level === "number" ? body.level : undefined;
  const mood = typeof body.mood === "string" ? body.mood : undefined;

  if (detectCrisisLanguage(text)) {
    return NextResponse.json({ reflection: CRISIS_RESPONSE, source: "safety" });
  }

  if (!isGeminiAvailable()) {
    return NextResponse.json({
      reflection: SAFE_FALLBACK_REFLECTION,
      source: "fallback",
    });
  }

  const prompt = buildReflectPrompt({ mode, text, level, mood });

  try {
    const res = await callGemini({
      prompt,
      maxTokens: 220,
      temperature: 0.6,
    });
    if (!res.ok || !res.text) {
      return NextResponse.json({
        reflection: SAFE_FALLBACK_REFLECTION,
        source: "fallback",
      });
    }
    // Defense-in-depth: strip any role/clinical leakage the model might add.
    const cleaned = res.text
      .replace(/^\s*(assistant|ai|reflection):\s*/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    return NextResponse.json({ reflection: cleaned, source: "ai" });
  } catch {
    return NextResponse.json({
      reflection: SAFE_FALLBACK_REFLECTION,
      source: "fallback",
    });
  }
}
