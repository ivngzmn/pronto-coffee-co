import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SheetContext = React.createContext(null);

export function Sheet({ open, onOpenChange, children }) {
  const value = React.useMemo(
    () => ({ open, onOpenChange }),
    [open, onOpenChange],
  );

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
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

export function SheetContent({
  className,
  children,
  side = "right",
  title,
  ...props
}) {
  const { open, onOpenChange } = React.useContext(SheetContext);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-950/35"
        onClick={() => onOpenChange?.(false)}
      />
      <section
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-md flex-col border-border bg-card shadow-2xl",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        {...props}
      >
        {children}
      </section>
    </>,
    document.body,
  );
}

export function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn("border-b border-border px-5 py-4", className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }) {
  return (
    <p
      className={cn("mt-1 text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function SheetBody({ className, ...props }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto p-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "max-h-[58vh] overflow-y-auto border-t border-border p-5",
        className,
      )}
      {...props}
    />
  );
}

export function SheetClose({ className, ...props }) {
  const { onOpenChange } = React.useContext(SheetContext);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => onOpenChange?.(false)}
      {...props}
    >
      <X className="size-4" aria-hidden="true" />
    </Button>
  );
}
