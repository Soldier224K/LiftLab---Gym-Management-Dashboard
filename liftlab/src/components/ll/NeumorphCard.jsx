import { cn } from "@/lib/utils";
/** Neumorphism container — stat cards, KPI summary rows */
export function NeumorphCard({ children, className, inset, ...props }) {
    return (<div className={cn(inset ? "neumorph-inset" : "neumorph", "rounded-2xl", className)} {...props}>
      {children}
    </div>);
}
