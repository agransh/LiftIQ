import { RepResult, JointFeedback } from "@/types";

// Pluggable AI feedback module
// Currently uses rule-based generation; can be swapped for Gemini API

interface WorkoutSummaryInput {
  exercise: string;
  reps: RepResult[];
  avgScore: number;
  duration: number;
}

export function generateWorkoutFeedback(input: WorkoutSummaryInput): string {
  const { exercise, reps, avgScore, duration } = input;

  if (reps.length === 0) {
    return "No reps recorded. Try positioning yourself fully in the camera frame and performing the exercise with controlled movements.";
  }

  const allIssues = reps.flatMap((r) => r.issues);
  const issueCounts = countIssues(allIssues);
  const topIssues = Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const lines: string[] = [];

  // Performance summary
  if (avgScore >= 85) {
    lines.push(`Great ${exercise} session! Your average score of ${avgScore}/100 shows strong form consistency.`);
  } else if (avgScore >= 65) {
    lines.push(`Solid ${exercise} workout. Your average score of ${avgScore}/100 is decent, with room for improvement.`);
  } else {
    lines.push(`Your ${exercise} session scored ${avgScore}/100 on average. Let's focus on form improvements.`);
  }

  // Duration context
  const mins = Math.floor(duration / 60);
  lines.push(`You completed ${reps.length} reps in ${mins > 0 ? `${mins}m` : "under a minute"}.`);

  // Top issues
  if (topIssues.length > 0) {
    lines.push("\nKey areas to work on:");
    for (const [issue, count] of topIssues) {
      lines.push(`• ${issue} (flagged ${count} times)`);
    }
  }

  // Score trend
  if (reps.length >= 3) {
    const firstHalf = reps.slice(0, Math.floor(reps.length / 2));
    const secondHalf = reps.slice(Math.floor(reps.length / 2));
    const firstAvg = firstHalf.reduce((s, r) => s + r.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + r.score, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 5) {
      lines.push("\nYour form improved as the set progressed — nice warmup curve!");
    } else if (secondAvg < firstAvg - 5) {
      lines.push("\nYour form declined toward the end — try fewer reps with better form next time.");
    } else {
      lines.push("\nYour consistency was solid throughout the set.");
    }
  }

  return lines.join("\n");
}

function countIssues(issues: JointFeedback[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    if (issue.message) {
      counts[issue.message] = (counts[issue.message] || 0) + 1;
    }
  }
  return counts;
}

// Placeholder for real Gemini integration
export async function generateAIFeedback(input: WorkoutSummaryInput): Promise<string> {
  // When a real Gemini API key is available, replace this with:
  // const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', { ... });
  // For now, use the rule-based generator
  return generateWorkoutFeedback(input);
}
