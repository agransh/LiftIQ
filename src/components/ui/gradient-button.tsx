"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "lg" | "xl";
  asChild?: boolean;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, size = "default", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 font-bold text-white rounded-2xl transition-all duration-300",
        "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400",
        "hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "default" && "h-11 px-6 text-sm",
        size === "lg" && "h-13 px-8 text-base",
        size === "xl" && "h-15 px-10 text-lg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
GradientButton.displayName = "GradientButton";
