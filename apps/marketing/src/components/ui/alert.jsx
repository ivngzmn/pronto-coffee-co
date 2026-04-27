import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "rounded-lg border px-4 py-3 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/40 text-foreground",
        destructive: "border-red-200 bg-red-50 text-red-700",
        success: "border-green-200 bg-green-50 text-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Alert({ className, variant, ...props }) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <p className={cn("leading-6", className)} {...props} />;
}

export { alertVariants };
