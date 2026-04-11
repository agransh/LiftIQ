import { JointFeedback } from "@/types";

interface ExplanationInput {
  issue: string;
  exercise: string;
  metrics?: Record<string, number>;
}

const RULE_BASED_EXPLANATIONS: Record<string, Record<string, string>> = {
  "knees caving in": {
    squat: "Your knees are collapsing inward, which stresses the ligaments and reduces power. Push your knees outward over your toes as you descend.",
    lunge: "Your front knee is caving inward. Focus on driving it outward in line with your toes to protect the joint.",
    _default: "Your knees are caving inward. Push them out over your toes to maintain stability.",
  },
  "go lower": {
    squat: "You're not hitting full depth yet. Aim to get your thighs parallel to the ground — that's where the glutes really activate.",
    lunge: "Try to lower your back knee closer to the ground for a full range of motion.",
    _default: "Try to go deeper in the movement for full muscle activation.",
  },
  "keep your chest up": {
    squat: "Your torso is leaning too far forward, which shifts load to your lower back. Brace your core and keep your chest proud.",
    _default: "Your upper body is collapsing forward. Think about driving your chest up toward the ceiling.",
  },
  "keep your back straight": {
    squat: "Your spine is rounding under load. Brace your core hard and imagine a rod running along your spine.",
    pushup: "Your back is rounding or sagging. Engage your core to maintain a straight line from head to heels.",
    _default: "Maintain a neutral spine throughout the movement to avoid back strain.",
  },
  "hips are sagging": {
    pushup: "Your hips are dropping below your shoulders, which means your core isn't engaged. Squeeze your glutes and abs to keep a straight plank line.",
    plank: "Your hips are sinking. Tighten your core and imagine pulling your belly button to your spine.",
    _default: "Your hips are sagging. Engage your core to maintain proper alignment.",
  },
  "hips are too high": {
    pushup: "You're piking up at the hips. Lower them until your body forms a straight line from head to heels.",
    _default: "Your hips are too high. Lower them to maintain a neutral body position.",
  },
  "lower your chest more": {
    pushup: "You're doing half reps. Lower your chest until your elbows are at about 90 degrees for full muscle activation.",
    _default: "Go deeper in the movement — aim for a full range of motion.",
  },
  "keep elbows tucked": {
    pushup: "Your elbows are flaring out wide, which stresses the shoulders. Keep them at about 45 degrees from your body.",
    "bicep-curl": "Your elbows are drifting forward. Pin them to your sides so your biceps do all the work.",
    _default: "Keep your elbows close to your body for better joint safety.",
  },
  "curl higher": {
    "bicep-curl": "You're not completing the curl at the top. Squeeze your bicep hard and bring the weight all the way up to your shoulder.",
    _default: "Complete the full range of motion by curling higher.",
  },
  "keep weight balanced": {
    squat: "You're shifting weight to one side. Distribute it evenly across both feet — think about pressing through the whole foot.",
    _default: "Your weight is uneven. Focus on staying balanced on both sides.",
  },
  "don't let knees cave in": {
    squat: "Your knees are tracking inward under load. Actively push them out — imagine spreading the floor with your feet.",
    _default: "Your knees are collapsing inward. Drive them out over your toes.",
  },
};

function getExplanationFromRules(input: ExplanationInput): string {
  const key = input.issue.toLowerCase();

  for (const [pattern, exerciseMap] of Object.entries(RULE_BASED_EXPLANATIONS)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return exerciseMap[input.exercise] || exerciseMap._default || "";
    }
  }

  return `Focus on correcting "${input.issue}" during your ${input.exercise}. Slow down and pay attention to form.`;
}

export async function generateExplanation(
  issue: string,
  exercise: string,
  metrics?: Record<string, number>
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && apiKey !== "placeholder") {
    try {
      const prompt = `You are a friendly, expert personal trainer. A user doing ${exercise} has this form issue: "${issue}". ${
        metrics ? `Their joint angles: ${JSON.stringify(metrics)}.` : ""
      } Explain in 1-2 short sentences why this matters and how to fix it. Sound like a coach, not a textbook.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 120, temperature: 0.7 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      // Fall through to rule-based
    }
  }

  return getExplanationFromRules({ issue, exercise, metrics });
}

export function getExplanationsForIssues(
  issues: JointFeedback[],
  exercise: string
): { issue: string; explanation: string }[] {
  const seen = new Set<string>();
  const results: { issue: string; explanation: string }[] = [];

  for (const iss of issues) {
    const msg = iss.message || "";
    if (!msg || seen.has(msg)) continue;
    seen.add(msg);
    results.push({
      issue: msg,
      explanation: getExplanationFromRules({ issue: msg, exercise }),
    });
  }

  return results.slice(0, 5);
}
