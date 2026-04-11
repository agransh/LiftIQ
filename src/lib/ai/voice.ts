// ── VoiceManager: production-grade live coaching voice system ──

export type Priority = "high" | "medium" | "low";

export interface CueMetadata {
  exercise?: string;
  phase?: string;
  repCount?: number;
  score?: number;
}

export interface QueueEntry {
  text: string;
  priority: Priority;
  enqueuedAt: number;
  metadata?: CueMetadata;
}

export type VoiceState = "idle" | "speaking" | "paused" | "cooldown" | "unavailable";

export interface VoiceDebugInfo {
  state: VoiceState;
  currentCue: string | null;
  currentPriority: Priority | null;
  queueContents: { text: string; priority: Priority }[];
  lastSpokenAt: number;
  cooldownRemaining: number;
  cueCooldowns: Record<string, number>;
  frameStability: Record<string, number>;
  totalSpoken: number;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

// ── Timing constants ──
const GLOBAL_COOLDOWN_MS = 3000;
const PER_CUE_COOLDOWN_MS = 10000;
const HIGH_PRIORITY_CUE_COOLDOWN_MS = 6000;
const FRAME_STABILITY_THRESHOLD = 4;
const HIGH_PRIORITY_STABILITY = 2;
const QUEUE_MAX_SIZE = 4;
const STALE_QUEUE_ENTRY_MS = 8000;
const ENCOURAGEMENT_INTERVAL_REPS = 5;
const ENCOURAGEMENT_COOLDOWN_MS = 12000;

// ── Voice selection ──
const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Female",
  "Google UK English Male",
  "Microsoft Zira",
  "Microsoft David",
  "Samantha",
  "Alex",
  "Karen",
  "Daniel",
];

const ENCOURAGEMENTS = [
  "Nice rep!",
  "Good form!",
  "Keep it up!",
  "Strong!",
  "Looking good!",
  "That's it!",
  "Great job!",
  "Solid!",
  "Nailing it!",
];

// ── Priority classification ──
const HIGH_PRIORITY_KEYWORDS = [
  "back straight", "knees caving", "hips sag", "spine", "careful",
  "don't let", "stop", "dangerous", "injury", "rounding",
];
const LOW_PRIORITY_KEYWORDS = [
  "good", "nice", "great", "keep it up", "strong", "solid", "perfect",
  "well done", "lockout", "nailing",
];

export function classifyCuePriority(cue: string): Priority {
  const lower = cue.toLowerCase();
  if (HIGH_PRIORITY_KEYWORDS.some((k) => lower.includes(k))) return "high";
  if (LOW_PRIORITY_KEYWORDS.some((k) => lower.includes(k))) return "low";
  return "medium";
}

// ── Listener for UI reactivity ──
type VoiceChangeListener = (info: {
  state: VoiceState;
  currentCue: string | null;
  queueSize: number;
}) => void;

// ── VoiceManager ──

class VoiceManager {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: QueueEntry[] = [];

  private state: VoiceState = "idle";
  private currentCue: string | null = null;
  private currentPriority: Priority | null = null;
  private processing = false;
  private paused = false;

  private lastSpokenGlobal = 0;
  private cueCooldowns = new Map<string, number>();
  private cueFrameCounts = new Map<string, number>();
  private lastEncouragementAt = 0;
  private repCountAtLastEncouragement = 0;
  private totalSpoken = 0;

  private processTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: VoiceChangeListener[] = [];

  constructor() {
    if (typeof window === "undefined") return;
    this.synth = window.speechSynthesis;

    if (this.synth) {
      this.pickVoice();
      // Chrome loads voices asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.pickVoice();
      }
    }
  }

  // ── Public API ──

  speakCue(text: string, priority: Priority = "medium", metadata?: CueMetadata): void {
    if (!this.synth || !text.trim() || this.paused) return;

    const now = Date.now();
    const key = this.normalizeKey(text);

    // Per-cue cooldown (shorter for safety cues)
    const cooldown = priority === "high" ? HIGH_PRIORITY_CUE_COOLDOWN_MS : PER_CUE_COOLDOWN_MS;
    const lastUsed = this.cueCooldowns.get(key) || 0;
    if (now - lastUsed < cooldown) return;

    // Frame stability — require the issue to persist before speaking
    const requiredFrames = priority === "high" ? HIGH_PRIORITY_STABILITY : FRAME_STABILITY_THRESHOLD;
    const frames = (this.cueFrameCounts.get(key) || 0) + 1;
    this.cueFrameCounts.set(key, frames);
    if (frames < requiredFrames) return;

    // Dedupe — don't enqueue if already in queue
    if (this.queue.some((e) => this.normalizeKey(e.text) === key)) return;

    this.enqueue({ text: text.trim(), priority, enqueuedAt: now, metadata });
    this.scheduleProcess();
  }

  speakEncouragement(currentRepCount: number): void {
    if (currentRepCount <= 0 || this.paused) return;

    const now = Date.now();
    if (now - this.lastEncouragementAt < ENCOURAGEMENT_COOLDOWN_MS) return;
    if (currentRepCount - this.repCountAtLastEncouragement < ENCOURAGEMENT_INTERVAL_REPS) return;

    this.repCountAtLastEncouragement = currentRepCount;
    this.lastEncouragementAt = now;
    const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    // Encouragement bypasses frame stability (it's event-driven, not per-frame)
    this.cueFrameCounts.set(this.normalizeKey(msg), FRAME_STABILITY_THRESHOLD);
    this.speakCue(msg, "low");
  }

  stop(): void {
    this.synth?.cancel();
    this.queue = [];
    this.processing = false;
    this.currentCue = null;
    this.currentPriority = null;
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
    this.setState("idle");
  }

  pause(): void {
    this.paused = true;
    this.synth?.pause();
    this.setState("paused");
  }

  resume(): void {
    this.paused = false;
    this.synth?.resume();
    this.setState(this.synth?.speaking ? "speaking" : "idle");
    this.scheduleProcess();
  }

  clearQueue(): void {
    this.queue = [];
    this.notify();
  }

  resetSession(): void {
    this.stop();
    this.cueCooldowns.clear();
    this.cueFrameCounts.clear();
    this.repCountAtLastEncouragement = 0;
    this.lastEncouragementAt = 0;
    this.totalSpoken = 0;
  }

  resetFrameCounts(): void {
    this.cueFrameCounts.clear();
  }

  getState(): VoiceState {
    return this.state;
  }

  getDebugInfo(): VoiceDebugInfo {
    const now = Date.now();
    const cdRemaining = Math.max(0, GLOBAL_COOLDOWN_MS - (now - this.lastSpokenGlobal));
    const cooldowns: Record<string, number> = {};
    this.cueCooldowns.forEach((ts, key) => {
      const remaining = Math.max(0, PER_CUE_COOLDOWN_MS - (now - ts));
      if (remaining > 0) cooldowns[key] = remaining;
    });
    const stability: Record<string, number> = {};
    this.cueFrameCounts.forEach((count, key) => {
      stability[key] = count;
    });

    return {
      state: this.state,
      currentCue: this.currentCue,
      currentPriority: this.currentPriority,
      queueContents: this.queue.map((e) => ({ text: e.text, priority: e.priority })),
      lastSpokenAt: this.lastSpokenGlobal,
      cooldownRemaining: cdRemaining,
      cueCooldowns: cooldowns,
      frameStability: stability,
      totalSpoken: this.totalSpoken,
    };
  }

  getCurrentCue(): string | null {
    return this.currentCue;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  onChange(listener: VoiceChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ── Private ──

  private enqueue(entry: QueueEntry): void {
    this.queue.push(entry);
    this.queue.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);

    // Drop stale entries
    const now = Date.now();
    this.queue = this.queue.filter((e) => now - e.enqueuedAt < STALE_QUEUE_ENTRY_MS);

    // Cap size — keep highest priority
    if (this.queue.length > QUEUE_MAX_SIZE) {
      this.queue = this.queue.slice(0, QUEUE_MAX_SIZE);
    }

    this.notify();
  }

  private scheduleProcess(): void {
    if (this.processTimer) return;
    this.processTimer = setTimeout(() => {
      this.processTimer = null;
      this.processQueue();
    }, 50);
  }

  private processQueue(): void {
    if (this.processing || !this.synth || this.queue.length === 0 || this.paused) return;

    const now = Date.now();
    const cooldownRemaining = GLOBAL_COOLDOWN_MS - (now - this.lastSpokenGlobal);
    if (cooldownRemaining > 0) {
      this.setState("cooldown");
      this.processTimer = setTimeout(() => {
        this.processTimer = null;
        this.processQueue();
      }, cooldownRemaining + 50);
      return;
    }

    // Drop stale entries before processing
    this.queue = this.queue.filter((e) => now - e.enqueuedAt < STALE_QUEUE_ENTRY_MS);
    if (this.queue.length === 0) return;

    const entry = this.queue[0];

    // If currently speaking, only interrupt for a significantly higher-priority cue
    if (this.synth.speaking && this.currentPriority) {
      const currentRank = PRIORITY_RANK[this.currentPriority];
      const newRank = PRIORITY_RANK[entry.priority];
      if (newRank > currentRank) {
        this.synth.cancel();
        // Cancelled speech will trigger onend/onerror -> processQueue re-runs
        return;
      }
      // Lower or equal priority — wait for current speech to finish
      this.processTimer = setTimeout(() => {
        this.processTimer = null;
        this.processQueue();
      }, 300);
      return;
    }

    // Take from queue
    this.queue.shift();
    this.processing = true;
    this.currentCue = entry.text;
    this.currentPriority = entry.priority;

    const utterance = new SpeechSynthesisUtterance(entry.text);

    // Voice settings
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Safety cues: slightly slower, louder
    if (entry.priority === "high") {
      utterance.rate = 0.9;
      utterance.volume = 1.0;
    }

    // Encouragement: brighter
    if (entry.priority === "low") {
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
    }

    utterance.onstart = () => {
      this.setState("speaking");
    };

    utterance.onend = () => {
      this.processing = false;
      this.currentCue = null;
      this.currentPriority = null;
      this.setState("idle");
      this.scheduleProcess();
    };

    utterance.onerror = (ev) => {
      // "interrupted" is expected when we cancel for a higher-priority cue
      if (ev.error !== "interrupted" && ev.error !== "canceled") {
        console.warn("[VoiceManager] Speech error:", ev.error);
      }
      this.processing = false;
      this.currentCue = null;
      this.currentPriority = null;
      this.setState("idle");
      this.scheduleProcess();
    };

    this.lastSpokenGlobal = now;
    this.cueCooldowns.set(this.normalizeKey(entry.text), now);
    this.cueFrameCounts.delete(this.normalizeKey(entry.text));
    this.totalSpoken++;

    try {
      this.synth.speak(utterance);
    } catch {
      this.processing = false;
      this.currentCue = null;
      this.currentPriority = null;
      this.setState("unavailable");
    }

    this.notify();
  }

  private pickVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Try preferred voices first
    for (const name of PREFERRED_VOICES) {
      const v = voices.find((v) => v.name.includes(name));
      if (v) {
        this.selectedVoice = v;
        return;
      }
    }

    // Fallback: first English voice
    const english = voices.find((v) => v.lang.startsWith("en"));
    if (english) {
      this.selectedVoice = english;
      return;
    }

    // Last resort: first available
    this.selectedVoice = voices[0] || null;
  }

  private normalizeKey(text: string): string {
    return text.toLowerCase().trim();
  }

  private setState(newState: VoiceState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.notify();
  }

  private notify(): void {
    const info = {
      state: this.state,
      currentCue: this.currentCue,
      queueSize: this.queue.length,
    };
    for (const listener of this.listeners) {
      try { listener(info); } catch { /* don't crash on listener errors */ }
    }
  }
}

// ── Singleton ──

let instance: VoiceManager | null = null;

export function getVoiceManager(): VoiceManager {
  if (!instance) {
    instance = new VoiceManager();
  }
  return instance;
}

// Backwards-compatible alias
export function getVoiceProvider(): VoiceManager {
  return getVoiceManager();
}

// Re-export the priority classifier under the old name
export const getCuePriority = classifyCuePriority;
