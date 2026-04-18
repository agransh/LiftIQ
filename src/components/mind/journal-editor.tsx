"use client";

import { useEffect, useState } from "react";
import { Pencil, Send } from "lucide-react";

interface Props {
  initialPrompt?: string;
  onSubmit: (text: string) => void;
  submitting?: boolean;
}

const PROMPTS = [
  "What's taking up the most space in your mind right now?",
  "What's one thing you'd like to set down for the day?",
  "When did you last feel even a small moment of ease?",
  "If today had a weather report, what would it be?",
  "What's something you appreciated today, however small?",
];

function pickRandomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export function JournalEditor({ initialPrompt, onSubmit, submitting }: Props) {
  // Use stable initial value to keep render pure; randomize on mount.
  const [prompt, setPrompt] = useState(initialPrompt ?? PROMPTS[0]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialPrompt) return;
    queueMicrotask(() => setPrompt(pickRandomPrompt()));
  }, [initialPrompt]);

  const cycle = () => {
    setPrompt(pickRandomPrompt());
  };

  return (
    <div className="mind-card rounded-2xl p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6FFFE9]/10 border border-[#6FFFE9]/20">
          <Pencil className="h-4 w-4 text-[#6FFFE9]" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] mind-text-primary leading-relaxed font-medium">
            {prompt}
          </p>
          <button
            type="button"
            onClick={cycle}
            className="mt-1 text-[11px] mind-text-secondary hover:text-[#6FFFE9] transition-colors"
          >
            Try another prompt
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write as much or as little as you want…"
        rows={6}
        className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] mind-text-primary placeholder:text-white/25 outline-none transition-colors focus:border-[#6FFFE9]/40 focus:bg-white/[0.03]"
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] mind-text-secondary">
          Stored locally on your device.
        </span>
        <button
          type="button"
          disabled={submitting || text.trim().length < 2}
          onClick={() => onSubmit(text.trim())}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE] px-5 py-2.5 text-sm font-semibold text-[#0B132B] shadow-[0_0_24px_-6px_rgba(111,255,233,0.55)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {submitting ? "Saving…" : "Save & reflect"}
        </button>
      </div>
    </div>
  );
}
