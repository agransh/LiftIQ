"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { JournalEditor } from "@/components/mind/journal-editor";
import { AIReflectionPanel } from "@/components/mind/ai-reflection-panel";
import { getJournalEntries, saveJournalEntry, saveMindSession, getLatestCheckIn } from "@/lib/mind/storage";
import type { JournalEntry } from "@/lib/mind/types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reflectTrigger, setReflectTrigger] = useState(0);
  const [lastText, setLastText] = useState<string>("");

  useEffect(() => {
    queueMicrotask(() => setEntries(getJournalEntries().slice(0, 5)));
  }, []);

  const handleSubmit = (text: string) => {
    setSubmitting(true);
    const entry: JournalEntry = {
      id: `je_${Date.now()}`,
      createdAt: Date.now(),
      body: text,
    };
    saveJournalEntry(entry);
    setEntries([entry, ...entries].slice(0, 5));
    setLastText(text);
    setReflectTrigger(Date.now());

    const latest = getLatestCheckIn();
    saveMindSession({
      id: `ms_${Date.now()}`,
      createdAt: Date.now(),
      intervention: "reflection",
      startLevel: latest?.level ?? 0.3,
    });

    setTimeout(() => setSubmitting(false), 400);
  };

  return (
    <main className="mx-auto min-w-0 max-w-4xl px-4 py-8 pt-[max(2.5rem,calc(1.25rem+var(--safe-top)))] sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/mind"
        className="inline-flex items-center gap-1.5 text-[12px] mind-text-secondary hover:text-[#6FFFE9] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Mind
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mind-text-primary">
          A space to write
        </h1>
        <p className="mt-2 text-[14px] mind-text-secondary">
          Open-ended journaling with a gentle AI reflection. Nothing leaves your device unless you ask for a reflection.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <JournalEditor onSubmit={handleSubmit} submitting={submitting} />
          {reflectTrigger > 0 && (
            <AIReflectionPanel mode="journal" text={lastText} trigger={reflectTrigger} />
          )}
        </div>

        <aside>
          <div className="mind-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#6FFFE9]" />
              <h3 className="text-sm font-semibold mind-text-primary">Recent entries</h3>
            </div>
            {entries.length === 0 ? (
              <p className="text-[12px] mind-text-secondary">
                Your entries will appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
                      {new Date(e.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <p className="mt-1.5 text-[13px] mind-text-primary leading-relaxed line-clamp-3">
                      {e.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
