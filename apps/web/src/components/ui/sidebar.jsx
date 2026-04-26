import * as React from "react";
import { cn } from "../../lib/utils";

const SidebarContext = React.createContext(null);

export function SidebarProvider({ open, onOpenChange, mobileOpen = false, onMobileOpenChange, children }) {
  const value = React.useMemo(
    () => ({ open, onOpenChange, mobileOpen, onMobileOpenChange }),
    [open, onOpenChange, mobileOpen, onMobileOpenChange]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

export function Sidebar({ className, children, ...props }) {
  const { open, mobileOpen, onMobileOpenChange } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex lg:flex-col",
          open ? "w-64" : "w-[76px]",
          className
        )}
        data-state={open ? "expanded" : "collapsed"}
        {...props}
      >
        {children}
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/30 transition-opacity lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onMobileOpenChange?.(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({ className, ...props }) {
  return <div className={cn("border-b border-slate-100 px-4 py-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <div className={cn("flex-1 overflow-y-auto p-3", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div className={cn("border-t border-slate-100 p-4", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }) {
  return <nav className={cn("space-y-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

export function SidebarInset({ className, children, ...props }) {
  const { open } = useSidebar();

  return (
    <div
      className={cn("min-h-screen transition-[padding] duration-200", open ? "lg:pl-64" : "lg:pl-[76px]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
