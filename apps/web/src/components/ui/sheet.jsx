import * as React from "react";
import { cn } from "../../lib/utils";

const SheetContext = React.createContext(null);

export function Sheet({ open, onOpenChange, children }) {
  const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild = false, children }) {
  const { onOpenChange } = React.useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (event) => {
        children.props.onClick?.(event);
        onOpenChange?.(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange?.(true)}>
      {children}
    </button>
  );
}

export function SheetContent({ className, children, side = "left", ...props }) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  const sideClass = side === "right" ? "right-0 translate-x-full" : "left-0 -translate-x-full";
  const openClass = open ? "translate-x-0" : sideClass;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/30 transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-50 w-72 bg-white shadow-xl transition-transform duration-200",
          side === "right" ? "right-0" : "left-0",
          openClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn("space-y-1.5 p-4", className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold text-slate-950", className)} {...props} />;
}
