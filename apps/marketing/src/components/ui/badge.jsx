import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
