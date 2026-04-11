let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playBeep(freq: number, durationMs: number, volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.setTargetAtTime(0, ctx.currentTime + durationMs / 1000 - 0.02, 0.01);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playCountdownTick(secondsLeft: number) {
  if (secondsLeft <= 3) return;
  playBeep(600, 100, 0.25);
}

export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    const start = ctx.currentTime + i * 0.12;
    gain.gain.setTargetAtTime(0, start + 0.2, 0.05);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

export function playStartGong() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 1047;
  gain.gain.value = 0.5;
  gain.gain.setTargetAtTime(0, ctx.currentTime + 0.3, 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

let lastSpokenText = "";
let lastSpokeAt = 0;
const SPEAK_COOLDOWN = 3000;

export function speakCue(text: string, force = false) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const now = Date.now();
  if (!force && text === lastSpokenText && now - lastSpokeAt < SPEAK_COOLDOWN) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Daniel"))
  ) || voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
  lastSpokenText = text;
  lastSpokeAt = now;
}

export function speakCountdown(seconds: number) {
  if (seconds === 10) {
    speakCue("Get into position. 10 seconds.", true);
  } else if (seconds === 5) {
    speakCue("5 seconds.", true);
  } else if (seconds === 3) {
    speakCue("3", true);
  } else if (seconds === 2) {
    speakCue("2", true);
  } else if (seconds === 1) {
    speakCue("1", true);
  }
}
