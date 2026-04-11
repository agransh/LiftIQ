export interface VoiceProvider {
  speak(text: string, priority?: "high" | "medium" | "low"): void;
  stop(): void;
  isSupported(): boolean;
}

type Priority = "high" | "medium" | "low";

interface QueueEntry {
  text: string;
  priority: Priority;
  timestamp: number;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

const GLOBAL_COOLDOWN_MS = 2500;
const PER_CUE_COOLDOWN_MS = 8000;
const ENCOURAGEMENT_INTERVAL_REPS = 5;
const FRAME_STABILITY_THRESHOLD = 3;

const ENCOURAGEMENTS = [
  "Nice work!",
  "Good rep!",
  "Keep it up!",
  "Strong form!",
  "Looking good!",
  "That's it!",
  "Great job!",
];

class SmartVoiceCoach implements VoiceProvider {
  private synth: SpeechSynthesis | null = null;
  private queue: QueueEntry[] = [];
  private lastSpokenGlobal = 0;
  private cueCooldowns = new Map<string, number>();
  private cueFrameCounts = new Map<string, number>();
  private processing = false;
  private repCountAtLastEncouragement = 0;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, priority: Priority = "medium"): void {
    if (!this.synth || !text) return;

    const now = Date.now();
    const key = text.toLowerCase().trim();

    const lastUsed = this.cueCooldowns.get(key) || 0;
    if (now - lastUsed < PER_CUE_COOLDOWN_MS) return;

    const frames = (this.cueFrameCounts.get(key) || 0) + 1;
    this.cueFrameCounts.set(key, frames);

    if (priority !== "high" && frames < FRAME_STABILITY_THRESHOLD) return;

    this.queue.push({ text, priority, timestamp: now });
    this.queue.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);

    if (this.queue.length > 3) {
      this.queue = this.queue.slice(0, 3);
    }

    this.processQueue();
  }

  speakEncouragement(currentRepCount: number): void {
    if (currentRepCount <= 0) return;
    if (currentRepCount - this.repCountAtLastEncouragement < ENCOURAGEMENT_INTERVAL_REPS) return;

    this.repCountAtLastEncouragement = currentRepCount;
    const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    this.speak(msg, "low");
  }

  resetFrameCounts(): void {
    this.cueFrameCounts.clear();
  }

  private processQueue(): void {
    if (this.processing || !this.synth || this.queue.length === 0) return;

    const now = Date.now();
    if (now - this.lastSpokenGlobal < GLOBAL_COOLDOWN_MS) {
      setTimeout(() => this.processQueue(), GLOBAL_COOLDOWN_MS - (now - this.lastSpokenGlobal));
      return;
    }

    const entry = this.queue.shift();
    if (!entry) return;

    if (this.synth.speaking) {
      const currentPriority = this.currentSpeakingPriority;
      if (PRIORITY_RANK[entry.priority] > PRIORITY_RANK[currentPriority]) {
        this.synth.cancel();
      } else {
        this.queue.unshift(entry);
        setTimeout(() => this.processQueue(), 500);
        return;
      }
    }

    this.processing = true;
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;

    utterance.onend = () => {
      this.processing = false;
      this.processQueue();
    };
    utterance.onerror = () => {
      this.processing = false;
      this.processQueue();
    };

    this.lastSpokenGlobal = now;
    this.cueCooldowns.set(entry.text.toLowerCase().trim(), now);
    this.cueFrameCounts.delete(entry.text.toLowerCase().trim());
    this.currentSpeakingPriority = entry.priority;
    this.synth.speak(utterance);
  }

  private currentSpeakingPriority: Priority = "low";

  stop(): void {
    this.synth?.cancel();
    this.queue = [];
    this.processing = false;
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
}

let voiceProvider: SmartVoiceCoach | null = null;

export function getVoiceProvider(): SmartVoiceCoach {
  if (!voiceProvider) {
    voiceProvider = new SmartVoiceCoach();
  }
  return voiceProvider;
}

export function getCuePriority(cue: string): Priority {
  const lower = cue.toLowerCase();
  const highPriority = ["back straight", "knees caving", "hips sagging", "stop", "careful", "spine"];
  const lowPriority = ["good", "nice", "great", "keep it up", "lockout"];

  if (highPriority.some((k) => lower.includes(k))) return "high";
  if (lowPriority.some((k) => lower.includes(k))) return "low";
  return "medium";
}
