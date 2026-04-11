import { JointStatus } from "@/types";

export interface FormExplanation {
  title: string;
  explanation: string;
  fixTip: string;
}

export interface ExplainerInput {
  exercise: string;
  issue: string;
  severity: JointStatus;
  metrics?: Record<string, number>;
  recentMistakes?: string[];
}

export function buildGeminiPrompt(input: ExplainerInput): string {
  const { exercise, issue, severity, metrics, recentMistakes } = input;

  const exerciseName = exercise.replace("-", " ");
  const severityText = severity === "poor" ? "significant" : severity === "moderate" ? "moderate" : "minor";

  let context = `A user is doing ${exerciseName} and has a ${severityText} form issue: "${issue}".`;
  if (metrics && Object.keys(metrics).length > 0) {
    context += ` Measured joint angles: ${JSON.stringify(metrics)}.`;
  }
  if (recentMistakes && recentMistakes.length > 0) {
    context += ` They also had these other issues: ${recentMistakes.join(", ")}.`;
  }

  return `You are a friendly, expert personal trainer giving real-time coaching feedback.

${context}

Respond with a JSON object with exactly these fields:
- "title": a short 3-6 word name for the issue (e.g. "Knees Caving Inward")
- "explanation": 1-2 sentences explaining WHY this matters for the user's body/performance. Be specific to ${exerciseName}. Sound like a coach, not a textbook.
- "fixTip": 1 sentence with a concrete, actionable fix the user can try on their next rep.

Rules:
- Be concise and human. No jargon.
- Be specific to ${exerciseName}, not generic.
- Do NOT repeat the issue name in the explanation.
- JSON only, no markdown, no backticks.`;
}

// ── Rule-based fallback map ──

type FallbackMap = Record<string, Record<string, FormExplanation>>;

const FALLBACK_EXPLANATIONS: FallbackMap = {
  "knees caving in": {
    squat: {
      title: "Knees Caving Inward",
      explanation: "Your knees are collapsing inward during the squat, which reduces stability and can put extra stress on the knee ligaments over time.",
      fixTip: "Focus on pushing your knees outward over your toes as you descend — imagine spreading the floor apart with your feet.",
    },
    lunge: {
      title: "Front Knee Caving In",
      explanation: "Your front knee is tracking inward instead of staying aligned with your foot, which reduces balance and can strain the joint.",
      fixTip: "Drive your knee outward so it stays directly over your second toe throughout the lunge.",
    },
    _default: {
      title: "Knees Caving Inward",
      explanation: "Your knees are collapsing inward, which reduces power output and increases injury risk at the joint.",
      fixTip: "Push your knees outward over your toes and focus on balanced foot pressure.",
    },
  },
  "go lower": {
    squat: {
      title: "Shallow Squat Depth",
      explanation: "You're cutting the movement short before your thighs reach parallel. This limits glute and quad activation where they fire the most.",
      fixTip: "Aim to lower your hips until your thighs are at least parallel to the ground — go slow and controlled.",
    },
    lunge: {
      title: "Shallow Lunge Depth",
      explanation: "You're not lowering far enough to fully engage the glutes and quads, which makes the exercise less effective.",
      fixTip: "Lower your back knee closer to the floor, keeping your torso tall and your front shin vertical.",
    },
    _default: {
      title: "Not Enough Depth",
      explanation: "You're not going through the full range of motion, leaving muscle activation on the table.",
      fixTip: "Try to go deeper in a controlled manner — full range of motion builds more strength.",
    },
  },
  "keep your chest up": {
    squat: {
      title: "Forward Torso Lean",
      explanation: "Your chest is dropping forward, which shifts the load onto your lower back instead of your legs. This can fatigue your back before your legs even get challenged.",
      fixTip: "Brace your core, look slightly upward, and think about driving your chest toward the ceiling as you stand up.",
    },
    _default: {
      title: "Chest Dropping Forward",
      explanation: "Your upper body is collapsing forward, which compromises your center of gravity and puts strain on the lower back.",
      fixTip: "Think about keeping your chest proud and shoulders pulled back throughout the movement.",
    },
  },
  "keep your back straight": {
    squat: {
      title: "Spine Rounding",
      explanation: "Your lower back is rounding under the movement, which compresses the spinal discs and shifts load away from your legs.",
      fixTip: "Take a big breath, brace your core like you're about to get punched, and keep your chest up.",
    },
    pushup: {
      title: "Back Not Straight",
      explanation: "Your spine is rounding or sagging during the push-up, meaning your core isn't holding tension. This reduces push-up effectiveness and strains the lower back.",
      fixTip: "Squeeze your glutes and tighten your abs to create a rigid plank line from head to heels.",
    },
    _default: {
      title: "Spine Not Neutral",
      explanation: "Your back is rounding or arching, which increases spinal stress and reduces the effectiveness of the exercise.",
      fixTip: "Maintain a neutral spine by bracing your core throughout the movement.",
    },
  },
  "hips are sagging": {
    pushup: {
      title: "Hips Dropping Down",
      explanation: "Your hips are sinking below your shoulder line, which means your core has disengaged. This dumps stress onto your lower back instead of working your chest and triceps.",
      fixTip: "Squeeze your glutes and abs hard — imagine your body is a rigid plank from head to heels.",
    },
    plank: {
      title: "Hip Sag in Plank",
      explanation: "Your hips are sinking, which takes the work off your core and puts it on your lower back — the opposite of what you want.",
      fixTip: "Tighten your abs and imagine pulling your belly button up toward your spine.",
    },
    _default: {
      title: "Hips Sagging",
      explanation: "Your hips are dropping below the rest of your body, which disengages the core and stresses the lower back.",
      fixTip: "Engage your core and glutes to maintain a straight body line.",
    },
  },
  "hips are too high": {
    pushup: {
      title: "Piking at the Hips",
      explanation: "You're piking up, creating an inverted V shape. This shifts the work to your shoulders and away from your chest, and it's not a proper push-up position.",
      fixTip: "Lower your hips until your body forms a completely straight line from head to heels.",
    },
    _default: {
      title: "Hips Too High",
      explanation: "Your hips are elevated above the neutral line, changing the exercise mechanics and reducing effectiveness.",
      fixTip: "Lower your hips to create a straight body position.",
    },
  },
  "lower your chest more": {
    pushup: {
      title: "Half-Rep Push-Ups",
      explanation: "You're only going partway down, which skips the hardest part of the push-up where your chest actually builds strength. Half reps = half results.",
      fixTip: "Lower until your elbows reach about 90 degrees and your chest nearly touches the floor.",
    },
    _default: {
      title: "Incomplete Range of Motion",
      explanation: "You're not going deep enough to fully activate the target muscles.",
      fixTip: "Lower yourself further for full range of motion — that's where the gains happen.",
    },
  },
  "keep elbows tucked": {
    pushup: {
      title: "Elbows Flaring Out",
      explanation: "Your elbows are splaying out to the sides, which puts your shoulders in a vulnerable position and can lead to impingement over time.",
      fixTip: "Keep your elbows at about 45 degrees from your body — not straight out to the sides.",
    },
    "bicep-curl": {
      title: "Elbows Drifting Forward",
      explanation: "Your elbows are swinging forward, which recruits your front delts to help and takes work away from the biceps.",
      fixTip: "Pin your elbows to your sides and only move your forearms — let the biceps do all the work.",
    },
    _default: {
      title: "Elbows Not Tucked",
      explanation: "Your elbows are flaring outward, which changes the muscle engagement and increases joint stress.",
      fixTip: "Keep your elbows closer to your body throughout the movement.",
    },
  },
  "curl higher": {
    "bicep-curl": {
      title: "Incomplete Curl",
      explanation: "You're stopping short at the top of the curl, missing the peak contraction where the bicep works hardest.",
      fixTip: "Squeeze your bicep hard at the top and bring the weight all the way up to your shoulder.",
    },
    _default: {
      title: "Short Range of Motion",
      explanation: "You're not completing the full range of motion at the top of the movement.",
      fixTip: "Complete the full curl to maximize muscle activation.",
    },
  },
  "keep weight balanced": {
    squat: {
      title: "Weight Shifting to One Side",
      explanation: "You're favoring one leg, which creates asymmetric loading and can lead to muscle imbalances or injury over time.",
      fixTip: "Distribute your weight evenly across both feet — press through the entire foot, not just toes or heels.",
    },
    _default: {
      title: "Unbalanced Weight Distribution",
      explanation: "Your weight isn't evenly distributed, which reduces stability and exercise effectiveness.",
      fixTip: "Focus on centering your weight and maintaining equal pressure on both sides.",
    },
  },
  "don't let knees cave in": {
    squat: {
      title: "Knee Valgus Under Load",
      explanation: "Your knees are tracking inward as you push up, which means your glutes aren't activating properly. This is a common cause of knee pain.",
      fixTip: "Actively push your knees outward — imagine you're trying to spread the floor apart with your feet.",
    },
    _default: {
      title: "Knees Collapsing Inward",
      explanation: "Your knees are caving in during the movement, reducing power and increasing joint stress.",
      fixTip: "Drive your knees outward in line with your toes throughout the entire movement.",
    },
  },
  "keep arms even": {
    pushup: {
      title: "Asymmetric Arm Movement",
      explanation: "One arm is doing more work than the other, which creates uneven muscle development and can lead to overuse injuries on the dominant side.",
      fixTip: "Focus on pressing evenly with both hands and lowering your chest symmetrically.",
    },
    _default: {
      title: "Arms Not Even",
      explanation: "Your arms aren't moving symmetrically, which creates imbalanced loading.",
      fixTip: "Focus on moving both arms at the same speed and through the same range of motion.",
    },
  },
  "keep body straight": {
    pushup: {
      title: "Body Line Breaking",
      explanation: "Your body isn't maintaining a straight line, which means your core has disengaged and the push-up is less effective.",
      fixTip: "Tighten everything — abs, glutes, quads — and maintain a rigid plank from head to heels.",
    },
    _default: {
      title: "Body Not Aligned",
      explanation: "Your body alignment has broken, which reduces exercise effectiveness and can cause strain.",
      fixTip: "Engage your core and maintain a straight line throughout the movement.",
    },
  },
  "hinge at the hips": {
    squat: {
      title: "Not Hinging Properly",
      explanation: "You're folding forward at the waist instead of sitting back into the squat. This overloads your lower back instead of your legs.",
      fixTip: "Initiate the squat by pushing your hips back first, as if sitting into a chair behind you.",
    },
    _default: {
      title: "Missing Hip Hinge",
      explanation: "You're not hinging at the hips properly, which shifts load to the wrong muscles.",
      fixTip: "Push your hips back as the primary movement, keeping your chest tall.",
    },
  },
};

export function getFallbackExplanation(issue: string, exercise: string): FormExplanation {
  const key = issue.toLowerCase().trim();

  for (const [pattern, exerciseMap] of Object.entries(FALLBACK_EXPLANATIONS)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      const match = exerciseMap[exercise] || exerciseMap._default;
      if (match) return match;
    }
  }

  const displayIssue = issue.charAt(0).toUpperCase() + issue.slice(1);
  const exerciseName = exercise.replace("-", " ");
  return {
    title: displayIssue,
    explanation: `This form issue was detected during your ${exerciseName}. Addressing it will improve your movement quality and reduce injury risk.`,
    fixTip: `Focus on correcting this on your next set — slow down and pay extra attention to form.`,
  };
}

export function validateExplanation(obj: unknown): obj is FormExplanation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.title === "string" && o.title.length > 0 &&
    typeof o.explanation === "string" && o.explanation.length > 0 &&
    typeof o.fixTip === "string" && o.fixTip.length > 0
  );
}
