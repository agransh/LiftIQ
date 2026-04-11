import { JointFeedback, JointStatus } from "@/types";
import { callGemini, isGeminiAvailable } from "./gemini-client";
import {
  FormExplanation,
  ExplainerInput,
  buildGeminiPrompt,
  getFallbackExplanation,
  validateExplanation,
} from "./explainer-prompts";

// ── In-memory cache ──
// Keyed by "exercise|issue" — avoids re-calling Gemini for repeated identical queries
const explanationCache = new Map<string, FormExplanation>();
const MAX_CACHE_SIZE = 50;

function cacheKey(exercise: string, issue: string): string {
  return `${exercise.toLowerCase()}|${issue.toLowerCase().trim()}`;
}

function getCached(exercise: string, issue: string): FormExplanation | null {
  return explanationCache.get(cacheKey(exercise, issue)) ?? null;
}

function setCache(exercise: string, issue: string, explanation: FormExplanation): void {
  if (explanationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = explanationCache.keys().next().value;
    if (firstKey) explanationCache.delete(firstKey);
  }
  explanationCache.set(cacheKey(exercise, issue), explanation);
}

// ── Main API ──

export async function generateFormExplanation(input: ExplainerInput): Promise<FormExplanation> {
  const { exercise, issue, severity, metrics, recentMistakes } = input;

  const cached = getCached(exercise, issue);
  if (cached) return cached;

  if (isGeminiAvailable()) {
    try {
      const prompt = buildGeminiPrompt({ exercise, issue, severity, metrics, recentMistakes });
      const response = await callGemini({ prompt, maxTokens: 250, temperature: 0.7, jsonMode: true });

      if (response.ok && response.text) {
        const parsed = JSON.parse(response.text);
        if (validateExplanation(parsed)) {
          const result: FormExplanation = {
            title: parsed.title,
            explanation: parsed.explanation,
            fixTip: parsed.fixTip,
          };
          setCache(exercise, issue, result);
          return result;
        }
      }
    } catch {
      // Gemini failed — fall through to rule-based
    }
  }

  const fallback = getFallbackExplanation(issue, exercise);
  setCache(exercise, issue, fallback);
  return fallback;
}

// ── Batch API for post-workout summaries ──

export async function generateFormExplanations(
  issues: JointFeedback[],
  exercise: string,
  recentMistakes?: string[]
): Promise<FormExplanation[]> {
  const seen = new Set<string>();
  const unique: { issue: string; severity: JointStatus }[] = [];

  for (const iss of issues) {
    const msg = iss.message || "";
    if (!msg || seen.has(msg.toLowerCase())) continue;
    seen.add(msg.toLowerCase());
    unique.push({ issue: msg, severity: iss.status });
  }

  const top = unique.slice(0, 5);

  const results = await Promise.all(
    top.map((u) =>
      generateFormExplanation({
        exercise,
        issue: u.issue,
        severity: u.severity,
        recentMistakes: recentMistakes || top.filter((t) => t.issue !== u.issue).map((t) => t.issue),
      })
    )
  );

  return results;
}

// ── Sync fallback for immediate use (no Gemini) ──

export function getExplanationsForIssues(
  issues: JointFeedback[],
  exercise: string
): FormExplanation[] {
  const seen = new Set<string>();
  const results: FormExplanation[] = [];

  for (const iss of issues) {
    const msg = iss.message || "";
    if (!msg || seen.has(msg.toLowerCase())) continue;
    seen.add(msg.toLowerCase());

    const cached = getCached(exercise, msg);
    if (cached) {
      results.push(cached);
    } else {
      results.push(getFallbackExplanation(msg, exercise));
    }
  }

  return results.slice(0, 5);
}
