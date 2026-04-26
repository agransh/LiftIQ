"use client";

import { motion } from "framer-motion";

interface Props {
  greeting: string;
  subline: string;
}

export function MindHero({ greeting, subline }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-8 sm:pt-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6FFFE9]/25 bg-[#6FFFE9]/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6FFFE9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6FFFE9] shadow-[0_0_10px_rgba(111,255,233,0.9)]" />
            Mind
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] leading-[1.05]">
            <span className="mind-text-primary">{greeting}</span>
            <br />
            <span className="mind-gradient-text">how are you feeling today?</span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed mind-text-secondary">
            {subline}
          </p>
        </motion.div>
      </div>
      <div className="mind-accent-line" />
    </section>
  );
}
