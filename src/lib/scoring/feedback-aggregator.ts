import { JointFeedback } from "@/types";

/**
 * Sliding-window aggregator that converts per-frame issue lists into
 * "stable" issues — issues that have been observed in at least
 * `MIN_OCCURRENCES` of the last `WINDOW_SIZE` frames.
 *
 * This is the single biggest accuracy lever in the live coaching loop.
 * `scoreRep` runs every detection frame and produces issues from the
 * current angles; without aggregation, a single noisy MediaPipe frame
 * (one bad knee angle, one occluded shoulder) causes the UI to flicker
 * "knee caving" or "shoulders uneven" and the voice to queue cues for
 * problems that aren't actually happening.
 *
 * The aggregator also remembers the most-severe status seen for each issue
 * within the window, so a "moderate" reading once and "poor" twice will
 * surface as "poor".
 */
export class FeedbackAggregator {
  /** Frames considered for stability voting. ~6 frames at 30 fps ≈ 200 ms. */
  private static readonly WINDOW_SIZE = 6;
  /** Minimum frame occurrences to surface an issue. */
  private static readonly MIN_OCCURRENCES = 3;

  /** Issue key → array of last WINDOW_SIZE booleans (1 = present this frame). */
  private occurrences = new Map<string, number[]>();
  /** Issue key → most recently observed JointFeedback (kept for status/joint). */
  private latest = new Map<string, JointFeedback>();
  /** Issue key → highest-severity status seen in current window ("poor" > "moderate" > "good"). */
  private peakStatus = new Map<string, JointFeedback["status"]>();

  /**
   * Push the current frame's raw issue list into the window. Returns the
   * stable issue list — only issues that have appeared in at least
   * MIN_OCCURRENCES of the last WINDOW_SIZE frames, with their peak status.
   *
   * `frameAccepted=false` lets the caller signal "this frame is too low
   * confidence to count for or against issues" — the window still rolls
   * forward but we don't credit or debit any issue for this frame.
   */
  push(rawIssues: JointFeedback[], frameAccepted = true): JointFeedback[] {
    const seenThisFrame = new Set<string>();

    if (frameAccepted) {
      for (const issue of rawIssues) {
        const key = this.keyFor(issue);
        seenThisFrame.add(key);
        this.latest.set(key, issue);

        const prevPeak = this.peakStatus.get(key);
        if (!prevPeak || severityRank(issue.status) > severityRank(prevPeak)) {
          this.peakStatus.set(key, issue.status);
        }
      }
    }

    // Roll every tracked issue's window forward (record presence/absence).
    const allKeys = new Set<string>([
      ...this.occurrences.keys(),
      ...seenThisFrame,
    ]);
    for (const key of allKeys) {
      const window = this.occurrences.get(key) ?? [];
      // If the frame was rejected we don't change anyone's tally — but we
      // also don't want the window to grow forever, so we still roll it.
      window.push(frameAccepted && seenThisFrame.has(key) ? 1 : 0);
      while (window.length > FeedbackAggregator.WINDOW_SIZE) window.shift();
      this.occurrences.set(key, window);
    }

    // Emit only stable issues.
    const out: JointFeedback[] = [];
    for (const [key, window] of this.occurrences) {
      const count = window.reduce((s, v) => s + v, 0);
      if (count < FeedbackAggregator.MIN_OCCURRENCES) continue;
      const base = this.latest.get(key);
      if (!base) continue;
      out.push({
        ...base,
        status: this.peakStatus.get(key) ?? base.status,
      });
    }

    // Drop issues that have been absent for the entire window — keeps the
    // map from growing unbounded over a long set.
    for (const [key, window] of this.occurrences) {
      if (window.every((v) => v === 0)) {
        this.occurrences.delete(key);
        this.latest.delete(key);
        this.peakStatus.delete(key);
      }
    }

    return out;
  }

  /**
   * Snapshot of stable issues seen across the current rep — used to populate
   * the rep result's `issues` field after a rep completes. Equivalent to
   * `push([], frameAccepted)` but without rolling the window.
   */
  snapshot(): JointFeedback[] {
    const out: JointFeedback[] = [];
    for (const [key, window] of this.occurrences) {
      const count = window.reduce((s, v) => s + v, 0);
      if (count < FeedbackAggregator.MIN_OCCURRENCES) continue;
      const base = this.latest.get(key);
      if (!base) continue;
      out.push({
        ...base,
        status: this.peakStatus.get(key) ?? base.status,
      });
    }
    return out;
  }

  reset(): void {
    this.occurrences.clear();
    this.latest.clear();
    this.peakStatus.clear();
  }

  private keyFor(issue: JointFeedback): string {
    return `${issue.joint}::${issue.message}`;
  }
}

function severityRank(status: JointFeedback["status"]): number {
  switch (status) {
    case "poor": return 3;
    case "moderate": return 2;
    case "good": return 1;
    default: return 0;
  }
}

/**
 * Lightweight cue stabilizer — same idea as FeedbackAggregator but for
 * coaching cue strings (which don't carry severity). A cue is emitted only
 * once it's appeared in MIN_OCCURRENCES of the last WINDOW_SIZE frames,
 * which prevents the live UI from flashing "Go lower" for one frame.
 */
export class CueStabilizer {
  private static readonly WINDOW_SIZE = 6;
  private static readonly MIN_OCCURRENCES = 3;

  private occurrences = new Map<string, number[]>();

  push(rawCues: string[], frameAccepted = true): string[] {
    const seen = new Set<string>(frameAccepted ? rawCues : []);
    const allKeys = new Set<string>([...this.occurrences.keys(), ...seen]);
    for (const key of allKeys) {
      const window = this.occurrences.get(key) ?? [];
      window.push(seen.has(key) ? 1 : 0);
      while (window.length > CueStabilizer.WINDOW_SIZE) window.shift();
      this.occurrences.set(key, window);
    }

    const out: string[] = [];
    for (const [key, window] of this.occurrences) {
      const count = window.reduce((s, v) => s + v, 0);
      if (count >= CueStabilizer.MIN_OCCURRENCES) out.push(key);
    }

    for (const [key, window] of this.occurrences) {
      if (window.every((v) => v === 0)) this.occurrences.delete(key);
    }

    return out;
  }

  reset(): void {
    this.occurrences.clear();
  }
}
