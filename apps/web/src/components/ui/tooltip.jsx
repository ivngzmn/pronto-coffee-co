import * as React from "react";
import { cn } from "../../lib/utils";

const TooltipContext = React.createContext(null);

export function TooltipProvider({ children }) {
  return children;
}

export function Tooltip({ children }) {
  const triggerRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();

    setPosition({
      left: rect.right + 8,
      top: rect.top + rect.height / 2,
    });
  }, []);

  const show = React.useCallback(() => {
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const value = React.useMemo(
    () => ({ hide, open, position, show, triggerRef }),
    [hide, open, position, show]
  );

  return (
    <TooltipContext.Provider value={value}>
      <span className="flex min-w-0">{children}</span>
    </TooltipContext.Provider>
  );
}

function composeEventHandlers(theirHandler, ourHandler) {
  return (event) => {
    theirHandler?.(event);

    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}

function composeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    });
  };
}

export function TooltipTrigger({ asChild = false, children, ...props }) {
  const context = React.useContext(TooltipContext);

  if (!context) {
    throw new Error("TooltipTrigger must be used within a Tooltip.");
  }

  const childProps = React.isValidElement(children) ? children.props : {};
  const triggerProps = {
    ...props,
    onBlur: composeEventHandlers(childProps.onBlur, context.hide),
    onFocus: composeEventHandlers(childProps.onFocus, context.show),
    onMouseEnter: composeEventHandlers(childProps.onMouseEnter, context.show),
    onMouseLeave: composeEventHandlers(childProps.onMouseLeave, context.hide),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...triggerProps,
      ref: composeRefs(childProps.ref, context.triggerRef),
    });
  }

  return (
    <span ref={context.triggerRef} {...triggerProps}>
      {children}
    </span>
  );
}

export function TooltipContent({ className, side = "right", ...props }) {
  const context = React.useContext(TooltipContext);

  if (!context || !context.open || !context.position) {
    return null;
  }

  return (
    <span
      className={cn(
        "pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-100 shadow-sm",
        side === "right" ? "-translate-y-1/2" : "-translate-x-1/2 -translate-y-full",
        className
      )}
      role="tooltip"
      style={{
        left: context.position.left,
        top: context.position.top,
      }}
      {...props}
    />
  );
}
