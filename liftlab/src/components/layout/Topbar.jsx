"use client";
import { useEffect, useState } from "react";
import { Search, Bell, Menu, X, Check, Trash2, XCircle, UserPlus } from "lucide-react";
import { useNav } from "@/store/navStore";
import { useUI } from "@/store/uiStore";
import { useAppStore, useVisibleNotifications, useUnreadCount } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ll/ThemeToggle";
import { Sidebar } from "./Sidebar";

const TITLES = {
  dashboard: { title: "Dashboard", sub: "Live gym overview & KPIs" },
  members: { title: "Members", sub: "Manage members, profiles & progress" },
  staff: { title: "Staff", sub: "Trainers, nutritionists & operations" },
  schedule: { title: "Class Schedule", sub: "Day / week / month calendar" },
  machines: { title: "Machines & Space", sub: "Equipment, maintenance & floor plan" },
  nutrition: { title: "Nutrition", sub: "Plans, macros & compliance" },
  supplements: { title: "Supplements & Products", sub: "Inventory, sponsors & sales" },
  fees: { title: "Fees & Finance", sub: "Billing lifecycle & revenue" },
  reports: { title: "Reports", sub: "Exportable insights & summaries" },
};

export function Topbar() {
  const { active } = useNav();
  const { openAddMember, openSettings } = useUI();
  const [now, setNow] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = useVisibleNotifications();
  const unreadCount = useUnreadCount();
  const markRead = useAppStore((s) => s.markRead);
  const dismiss = useAppStore((s) => s.dismiss);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const clearAll = useAppStore((s) => s.clearAll);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = TITLES[active];

  // Clean time + date formatting
  const time = now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--";
  const seconds = now ? String(now.getSeconds()).padStart(2, "0") : "--";
  const date = now ? now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }) : "";

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "var(--bar-dark)", borderColor: "rgba(246,246,246,0.08)" }}
      >
        <div className="flex items-center gap-2 md:gap-4 px-4 md:px-6 h-16">
          {/* Mobile menu */}
          <button
            className="lg:hidden p-2 -ml-1 text-[#F6F6F6]/70 hover:text-[#F6F6F6] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Title block */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl md:text-2xl font-semibold text-[#F6F6F6] leading-none truncate">
              {meta.title}
            </h1>
            <p className="text-[11px] text-[#F6F6F6]/50 mt-1 truncate hidden sm:block">{meta.sub}</p>
          </div>

          {/* Right cluster — icons with hover states */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Add Member — icon button with tooltip */}
            <button
              onClick={openAddMember}
              className="group relative h-9 w-9 md:h-9 md:w-auto md:px-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#F3BA60] text-[#202022] text-sm font-semibold hover:bg-[#F3BA60]/90 transition-colors"
              aria-label="Add member"
              title="Add member"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">Add</span>
            </button>

            {/* Search — icon trigger (desktop expands) */}
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#F6F6F6]/8 border border-[#F6F6F6]/8 transition-colors hover:bg-[#F6F6F6]/12">
              <Search className="h-4 w-4 text-[#F6F6F6]/50" />
              <input
                placeholder="Search members, staff…"
                className="bg-transparent text-[#F6F6F6] text-sm placeholder:text-[#F6F6F6]/40 outline-none w-44"
              />
            </div>

            {/* Clock — clean HH:MM with small seconds */}
            <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#F6F6F6]/5">
              <div className="text-right leading-none">
                <p className="font-mono-ll text-[15px] font-semibold text-[#F3BA60] tabular-nums">
                  {time}
                  <span className="text-[10px] text-[#F6F6F6]/40 ml-0.5">:{seconds}</span>
                </p>
                <p className="text-[10px] text-[#F6F6F6]/50 mt-0.5 uppercase tracking-wider">{date}</p>
              </div>
            </div>

            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) markAllRead();
                }}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg text-[#F6F6F6]/70 hover:text-[#F6F6F6] hover:bg-[#F6F6F6]/8 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F3BA60] ring-2 ring-[#202022] pulse-dot" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 glass-strong rounded-2xl p-2 z-50 max-h-[28rem] overflow-y-auto ll-scroll"
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs uppercase tracking-wider text-[#F6F6F6]/60 font-semibold">
                            Notifications
                          </p>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-mono-ll px-1.5 py-0.5 rounded-full bg-[#F3BA60]/15 text-[#F3BA60]">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-[11px] text-[#F6F6F6]/50 hover:text-[#F6F6F6] flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Clear
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="px-3 py-12 text-center">
                          <div className="mx-auto h-12 w-12 rounded-full bg-[#F3BA60]/12 flex items-center justify-center mb-3">
                            <Check className="h-6 w-6 text-[#F3BA60]" />
                          </div>
                          <p className="text-sm text-[#202022] font-medium">All caught up</p>
                          <p className="text-xs text-[#736A6A] mt-1">No new notifications.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="group relative px-3 py-2.5 rounded-lg hover:bg-[#F6F6F6]/5 cursor-pointer transition-colors"
                            onClick={() => markRead(n.id)}
                          >
                            <div className="flex items-start gap-2.5 pr-6">
                              <span
                                className="mt-1 h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: n.color }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-[#202022] truncate font-medium">{n.title}</p>
                                <p className="text-xs text-[#736A6A] truncate mt-0.5">{n.desc}</p>
                                <p className="text-[10px] text-[#736A6A]/70 mt-1 font-mono-ll">
                                  {timeAgo(n.createdAt)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismiss(n.id);
                              }}
                              className="absolute top-2 right-2 p-1 rounded-md text-[#736A6A] opacity-0 group-hover:opacity-100 hover:text-[#202022] hover:bg-[#F6F6F6]/10 transition-all"
                              aria-label="Dismiss"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile chip */}
            <button
              onClick={openSettings}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-[#F3BA60] to-[#B6B1C0] flex items-center justify-center text-[#202022] font-bold text-sm hover:opacity-90 transition-opacity ring-2 ring-[#F6F6F6]/10 hover:ring-[#F6F6F6]/20"
              aria-label="Open settings"
              title="Settings"
            >
              AD
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full lg:hidden"
            >
              <button
                className="absolute -right-10 top-4 p-2 text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
