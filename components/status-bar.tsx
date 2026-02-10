"use client";

import { cn } from "@/lib/utils";

interface StatusBarProps {
  message: string;
  kind: "ok" | "err" | "warn" | "";
}

export function StatusBar({ message, kind }: StatusBarProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "text-sm whitespace-pre-wrap leading-relaxed",
        kind === "ok" && "text-emerald-400",
        kind === "err" && "text-red-400",
        kind === "warn" && "text-amber-400",
        kind === "" && "text-muted-foreground"
      )}
    >
      {message}
    </p>
  );
}
