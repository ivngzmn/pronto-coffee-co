import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ label, className, children, ...props }) {
  return (
    <label className={cn("block space-y-2", className)} {...props}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
