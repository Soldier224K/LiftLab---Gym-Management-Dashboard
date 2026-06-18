"use client";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, UserCog, CalendarDays, Dumbbell, Salad, Pill, Wallet, FileBarChart, Settings, } from "lucide-react";
import { useNav } from "@/store/navStore";
import { useUI } from "@/store/uiStore";
import { useAppStore } from "@/store/appStore";
import { Logo } from "@/components/ll/Logo";
import { cn } from "@/lib/utils";
import { useMaintenanceAlert } from "@/hooks/useMaintenanceAlert";
import { machines } from "@/data/machines";
import { membershipStatus } from "@/hooks/useAgeAutoUpdate";
export function Sidebar({ onNavigate }) {
    const { active, set } = useNav();
    const { openSettings } = useUI();
    const members = useAppStore((s) => s.members);
    const { hasAlerts, overdueCount, dueSoonCount } = useMaintenanceAlert(machines);
    const expiredMembers = members.filter((m) => {
        const st = membershipStatus(m.membership_expiry, m.fees.status === "Paid");
        return st === "Expired";
    }).length;
    const overdueFees = members.filter((m) => m.fees.status === "Overdue").length;
    const items = [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "members", label: "Members", icon: Users, badge: expiredMembers || undefined, badgeColor: "#F3BA60" },
        { key: "staff", label: "Staff", icon: UserCog },
        { key: "schedule", label: "Schedule", icon: CalendarDays },
        {
            key: "machines",
            label: "Machines",
            icon: Dumbbell,
            badge: hasAlerts ? overdueCount + dueSoonCount : undefined,
            badgeColor: "#736a6a",
        },
        { key: "nutrition", label: "Nutrition", icon: Salad },
        { key: "supplements", label: "Supplements", icon: Pill },
        { key: "fees", label: "Fees", icon: Wallet, badge: overdueFees || undefined, badgeColor: "#736a6a" },
        { key: "reports", label: "Reports", icon: FileBarChart },
    ];
    return (<aside className="h-full w-[260px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-2xl">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto ll-scroll px-3 py-2 space-y-0.5">
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F6F6F6]/40">
          Workspace
        </p>
        {items.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (<button key={item.key} onClick={() => {
                    set(item.key);
                    onNavigate?.();
                }} className={cn("relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group", isActive
                    ? "text-[#F3BA60] bg-[#F3BA60]/15"
                    : "text-[#F6F6F6]/70 hover:text-[#F6F6F6] hover:bg-white/8")}>
              {isActive && (<motion.span layoutId="nav-active" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#F3BA60]" transition={{ type: "spring", stiffness: 400, damping: 30 }}/>)}
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-[#F3BA60]")}/>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (<span className="text-[10px] font-mono-ll px-1.5 py-0.5 rounded-full" style={{
                        color: item.badgeColor,
                        backgroundColor: `${item.badgeColor}1f`,
                    }}>
                  {item.badge}
                </span>) : null}
            </button>);
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
        <button onClick={() => {
            openSettings();
            onNavigate?.();
        }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", "text-[#F6F6F6]/70 hover:text-[#F6F6F6] hover:bg-white/8")}>
          <Settings className="h-[18px] w-[18px]"/>
          Settings
        </button>
        <div className="px-3 py-3 rounded-lg" style={{ backgroundColor: "rgba(246,246,246,0.05)" }}>
          <p className="text-[10px] uppercase tracking-wider text-[#F6F6F6]/40">System</p>
          <p className="text-xs text-[#f3ba60] mt-1 font-mono-ll flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f3ba60] pulse-dot"/>
            All systems online
          </p>
        </div>
      </div>
    </aside>);
}
