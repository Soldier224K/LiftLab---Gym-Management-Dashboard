import { cn } from "@/lib/utils";
/** Glassmorphism container — modals, nav, sensor panels, floating overlays */
export function GlassCard({ children, className, strong, ...props }) {
    return (<div className={cn(strong ? "glass-strong" : "glass", className)} {...props}>
      {children}
    </div>);
}
