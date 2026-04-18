// Mind module — local persistence. Uses its own key namespace
// so it never collides with the existing LiftIQ storage keys.

import type {
  BreathingSession,
  CheckIn,
  JournalEntry,
  MindSessionSummary,
} from "./types";

const KEYS = {
  CHECK_INS: "liftiq-mind-check-ins",
  BREATHING: "liftiq-mind-breathing",
  JOURNAL: "liftiq-mind-journal",
  SESSIONS: "liftiq-mind-sessions",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode — silently degrade
  }
}

export function getCheckIns(): CheckIn[] {
  return read<CheckIn[]>(KEYS.CHECK_INS, []);
}
export function saveCheckIn(c: CheckIn): void {
  const all = getCheckIns();
  all.unshift(c);
  write(KEYS.CHECK_INS, all.slice(0, 200));
}

export function getBreathingSessions(): BreathingSession[] {
  return read<BreathingSession[]>(KEYS.BREATHING, []);
}
export function saveBreathingSession(s: BreathingSession): void {
  const all = getBreathingSessions();
  all.unshift(s);
  write(KEYS.BREATHING, all.slice(0, 200));
}

export function getJournalEntries(): JournalEntry[] {
  return read<JournalEntry[]>(KEYS.JOURNAL, []);
}
export function saveJournalEntry(e: JournalEntry): void {
  const all = getJournalEntries();
  all.unshift(e);
  write(KEYS.JOURNAL, all.slice(0, 200));
}

export function getMindSessions(): MindSessionSummary[] {
  return read<MindSessionSummary[]>(KEYS.SESSIONS, []);
}
export function saveMindSession(s: MindSessionSummary): void {
  const all = getMindSessions();
  all.unshift(s);
  write(KEYS.SESSIONS, all.slice(0, 200));
}

export function getLatestCheckIn(): CheckIn | null {
  return getCheckIns()[0] ?? null;
}
