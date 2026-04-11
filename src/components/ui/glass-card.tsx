"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, elevated, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl",
        elevated ? "glass-elevated" : "glass-card",
        glow && "border-glow glow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassCard.displayName = "GlassCard";
