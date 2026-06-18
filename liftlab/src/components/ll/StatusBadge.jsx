import { cn } from "@/lib/utils";
const VARIANTS = {
    green: "bg-[#f3ba60]/12 text-[#f3ba60] border-[#f3ba60]/30",
    blue: "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30",
    orange: "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30",
    red: "bg-[#736a6a]/12 text-[#736a6a] border-[#736a6a]/30",
    grey: "bg-muted text-muted-foreground border-border",
};
export function statusToVariant(status) {
    const s = status.toLowerCase();
    if (["active", "paid", "operational", "completed", "verified", "open", "ok", "balanced"].some((k) => s.includes(k)))
        return "green";
    if (["partial", "in progress", "maintenance", "due soon", "pending", "on hold", "crowded"].some((k) => s.includes(k)))
        return "orange";
    if (["overdue", "expired", "out of order", "critical", "absent", "not found"].some((k) => s.includes(k)))
        return "red";
    if (["pro", "elite", "group", "blue"].some((k) => s.includes(k)))
        return "blue";
    return "grey";
}
export function StatusBadge({ children, variant, status, pulse, className, }) {
    const v = variant ?? (status ? statusToVariant(status) : "grey");
    return (<span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap", VARIANTS[v], className)}>
      {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot"/>}
      {children}
    </span>);
}
