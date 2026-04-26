import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-card text-muted-foreground",
        accent: "bg-accent/30 text-accent-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Chip({ className, variant, ...props }) {
  return <span className={cn(chipVariants({ variant }), className)} {...props} />;
}

export { chipVariants };
