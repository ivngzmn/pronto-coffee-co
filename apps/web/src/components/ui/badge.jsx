import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-600",
        secondary: "bg-blue-50 text-blue-700",
        destructive: "bg-red-100 text-red-700",
        success: "bg-emerald-50 text-emerald-700",
        outline: "border border-slate-200 bg-white text-slate-600",
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
