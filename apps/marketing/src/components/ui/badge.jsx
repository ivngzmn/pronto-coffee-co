import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent/70 text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-card text-muted-foreground",
        destructive: "border border-red-200 bg-red-50 text-red-700",
        success: "border border-green-200 bg-green-50 text-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
