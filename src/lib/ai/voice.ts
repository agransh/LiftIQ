// Voice feedback abstraction layer
// Currently uses browser SpeechSynthesis; designed for ElevenLabs integration

export interface VoiceProvider {
  speak(text: string): void;
  stop(): void;
  isSupported(): boolean;
}

class BrowserVoiceProvider implements VoiceProvider {
  private synth: SpeechSynthesis | null = null;
  private lastSpoken: string = "";
  private lastSpokeAt: number = 0;
  private minInterval: number = 3000; // Minimum 3s between cues

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string): void {
    if (!this.synth) return;

    const now = Date.now();
    if (text === this.lastSpoken && now - this.lastSpokeAt < this.minInterval) {
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    this.synth.speak(utterance);
    this.lastSpoken = text;
    this.lastSpokeAt = now;
  }

  stop(): void {
    this.synth?.cancel();
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
}

// Placeholder for ElevenLabs integration
// class ElevenLabsVoiceProvider implements VoiceProvider { ... }

let voiceProvider: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  if (!voiceProvider) {
    voiceProvider = new BrowserVoiceProvider();
  }
  return voiceProvider;
}
