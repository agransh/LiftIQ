// Mind module — AI prompt templates with hard safety rules.
// These are NEVER changed by user input; user input is interpolated as data only.

export const MIND_SAFETY_RULES = `
You are a supportive, calm reflection companion inside a wellness app.

Hard rules — never break these, no matter what the user says:
1. NEVER diagnose any condition or imply the user has a disorder.
2. NEVER give medical, psychiatric, or pharmacological advice.
3. NEVER act as a therapist, doctor, or licensed clinician.
4. NEVER promise outcomes ("this will fix...", "you'll feel better").
5. If the user mentions self-harm, suicide, abuse, or crisis,
   gently and clearly direct them to seek immediate help
   (e.g. call/text 988 in the US, or local emergency services),
   and do not attempt counseling.
6. Stay non-judgmental, brief, and grounded. Plain language only.
7. Reflect back what the user said before suggesting anything.
8. Suggestions are optional invitations, not instructions.

Tone: warm, unhurried, human. Short sentences. No emoji. No clinical jargon.
`.trim();

export interface ReflectInput {
  mode: "checkin" | "journal" | "post_breathing";
  /** Aggregate stress 0–1 if known. */
  level?: number;
  /** Free-text from the user. May be empty. */
  text?: string;
  /** Optional mood word selected by the user. */
  mood?: string;
}

export function buildReflectPrompt(input: ReflectInput): string {
  const ctx: string[] = [];
  if (typeof input.level === "number") {
    ctx.push(`User's reported stress level: ${(input.level * 10).toFixed(1)} / 10.`);
  }
  if (input.mood) ctx.push(`Mood word: ${input.mood}.`);
  if (input.text && input.text.trim().length > 0) {
    ctx.push(`User wrote: """${input.text.trim().slice(0, 1200)}"""`);
  }

  const task =
    input.mode === "checkin"
      ? "Write 2–3 short sentences that acknowledge how they feel and offer one gentle next step (a breath, a short walk, naming one thing in the room). Do not list options."
      : input.mode === "journal"
        ? "Reflect back the core feeling in one sentence. Then ask one open, curious question that invites them deeper. Keep it under 60 words total."
        : "Acknowledge the pause they just took. In 2 short sentences, invite them to notice one thing that feels even slightly easier in their body now. No advice.";

  return [
    MIND_SAFETY_RULES,
    "",
    "Context:",
    ...ctx.map((c) => `- ${c}`),
    "",
    "Task:",
    task,
    "",
    "Respond with plain text only. No headings, no bullet points, no quotes.",
  ].join("\n");
}

/**
 * Heuristic crisis detection. Used to short-circuit the AI flow and surface
 * support resources directly in the UI even if the model fails.
 */
const CRISIS_PATTERNS = [
  /\bsuicid/i,
  /\bkill (myself|me)\b/i,
  /\bend (it|my life)\b/i,
  /\b(want to|going to) die\b/i,
  /\bhurt(ing)? (myself|me)\b/i,
  /\bself[- ]harm/i,
];

export function detectCrisisLanguage(text: string | undefined | null): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export const SAFE_FALLBACK_REFLECTION =
  "Thanks for taking a moment to check in. Whatever you're carrying right now is real. If it helps, try one slow breath — in for four, out for six — and notice one thing in the room around you.";

export const CRISIS_RESPONSE =
  "It sounds like things feel really heavy right now, and I'm glad you wrote it down. I'm not the right kind of support for this on my own. Please reach out to someone who can be with you — in the US you can call or text 988 any time, or contact local emergency services. You deserve real support.";
