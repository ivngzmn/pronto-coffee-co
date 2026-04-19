import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
