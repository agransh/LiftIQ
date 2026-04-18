import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";

export default function MindLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen has-bottom-nav md:pb-0 mind-bg">
      <Navbar />
      {/* Ambient teal/mint glow specific to the Mind module */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[10%] h-[60vh] w-[60vh] rounded-full bg-[#5BC0BE]/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-25%] right-[5%] h-[55vh] w-[55vh] rounded-full bg-[#6FFFE9]/[0.06] blur-[110px]" />
        <div className="absolute top-[35%] right-[35%] h-[28vh] w-[28vh] rounded-full bg-[#1C2541]/[0.5] blur-[90px]" />
      </div>
      {children}
    </div>
  );
}
