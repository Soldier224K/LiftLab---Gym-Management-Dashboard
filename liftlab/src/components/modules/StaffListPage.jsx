"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, CalendarClock, ShieldCheck, XCircle, ArrowRight, ScanSearch, } from "lucide-react";
import { staff } from "@/data/staff";
import { getTodayClasses } from "@/data/classes";
import { useNav } from "@/store/navStore";
import { ClayCard } from "@/components/ll/ClayCard";
import { GlassCard } from "@/components/ll/GlassCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { calcAge, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
const ROLE_FILTERS = [
    "All",
    "Head Trainer",
    "Personal Trainer",
    "Nutritionist",
    "Physiotherapist",
    "Front Desk",
    "Manager",
];
/** Deterministic pseudo "on duty" flag — derived from staff id + today's weekday. */
function isOnDuty(s) {
    const numPart = parseInt(s.id.split("-")[1] ?? "0", 10);
    const todayIdx = BUSINESS_TODAY.getDay();
    return (numPart + todayIdx) % 2 === 0;
}
const ROLE_ACCENT = {
    "Head Trainer": "#F3BA60",
    "Personal Trainer": "#f3ba60",
    Nutritionist: "#F3BA60",
    Physiotherapist: "#736a6a",
    "Front Desk": "#736A6A",
    Manager: "#F3BA60",
};
export function StaffListPage() {
    const { openStaff } = useNav();
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return staff.filter((s) => {
            const matchesQuery = !q ||
                s.name.toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q) ||
                s.role.toLowerCase().includes(q);
            const matchesRole = roleFilter === "All" || s.role === roleFilter;
            return matchesQuery && matchesRole;
        });
    }, [query, roleFilter]);
    // Aggregate KPIs
    const onDutyCount = useMemo(() => staff.filter((s) => isOnDuty(s)).length, []);
    const totalMembersAssigned = useMemo(() => staff.reduce((acc, s) => acc + s.members_assigned.length, 0), []);
    const avgSalary = useMemo(() => Math.round(staff.reduce((acc, s) => acc + s.salary_inr, 0) / staff.length), []);
    return (<div className="space-y-4 relative">
      <div className="xl:grid xl:grid-cols-[1fr_340px] xl:gap-4 xl:items-start">
        <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Staff Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trainers, nutritionists, physiotherapists & ops team —{" "}
            <span className="text-[#F3BA60]">{staff.length}</span> active members
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="Total Staff" value={staff.length} sub="Across 6 roles" accent="#F3BA60" icon={Users} delay={0}/>
        <StatKPI label="On Duty Now" value={onDutyCount} sub={`${staff.length - onDutyCount} off today`} accent="#f3ba60" icon={ShieldCheck} delay={0.05}/>
        <StatKPI label="Members Assigned" value={totalMembersAssigned} sub="Direct reports" accent="#F3BA60" icon={Users} delay={0.1}/>
        <StatKPI label="Avg Salary" value={`₹${(avgSalary / 1000).toFixed(0)}K`} sub="Monthly cost / head" accent="#736a6a" icon={CalendarClock} delay={0.15}/>
      </div>

      {/* Toolbar */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border flex-1 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, ID or role…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"/>
          </div>
        </div>

        {/* Role chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ROLE_FILTERS.map((role) => {
            const active = roleFilter === role;
            const count = role === "All"
                ? staff.length
                : staff.filter((s) => s.role === role).length;
            return (<button key={role} onClick={() => setRoleFilter(role)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${active
                    ? "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"}`}>
                {role}
                <span className={`font-mono-ll text-[10px] ${active ? "text-[#F3BA60]" : "text-muted-foreground"}`}>
                  {count}
                </span>
              </button>);
        })}
        </div>
      </GlassCard>

      {/* Result count */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
          of {staff.length}
        </span>
        {roleFilter !== "All" && (<span className="px-3 py-1.5 rounded-full bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[#F3BA60]">
            {roleFilter}
          </span>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s, i) => (<motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}>
            <StaffCard staff={s} onOpen={() => openStaff(s.id)}/>
          </motion.div>))}
      </div>

      {filtered.length === 0 && (<div className="py-16 text-center text-sm text-muted-foreground">
          No staff match your filters.
        </div>)}
        </div>

        {/* Trainer ID Checker — HASH MAP data structure (right sidebar on xl) */}
        <div className="hidden xl:block xl:sticky xl:top-20">
          <TrainerIDChecker floating={false}/>
        </div>
      </div>

      {/* Mobile/tablet: inline widget (below grid, avoids overlap) */}
      <div className="xl:hidden">
        <TrainerIDChecker floating={false}/>
      </div>
    </div>);
}
/* ---------------- Staff card ---------------- */
function StaffCard({ staff: s, onOpen }) {
    const onDuty = isOnDuty(s);
    const accent = ROLE_ACCENT[s.role];
    const age = calcAge(s.dob);
    return (<ClayCard className="p-5 cursor-pointer hover:border-[#F3BA60]/40 transition-colors group" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
            }
        }}>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img src={s.photo} alt={s.name} loading="lazy" className="h-16 w-16 rounded-2xl object-cover border-2" style={{ borderColor: `${accent}55` }}/>
          <span className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center" style={{
            backgroundColor: onDuty ? "#f3ba60" : "var(--muted)",
            borderColor: onDuty ? "#f3ba60" : "#736A6A",
        }}>
            {onDuty && <span className="h-1.5 w-1.5 rounded-full bg-background"/>}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl text-foreground leading-none truncate">
              {s.name}
            </h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#F3BA60] group-hover:translate-x-0.5 transition-all shrink-0"/>
          </div>
          <p className="font-mono-ll text-[11px] text-[#F3BA60] mt-0.5">{s.id}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <StatusBadge variant={s.role === "Head Trainer" ? "blue" : "green"}>
              {s.role}
            </StatusBadge>
            <StatusBadge variant={onDuty ? "green" : "grey"} pulse={onDuty}>
              {onDuty ? "On Duty" : "Off"}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Members
          </p>
          <p className="font-display text-2xl text-foreground leading-none mt-1">
            {s.members_assigned.length}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Age
          </p>
          <p className="font-display text-2xl text-foreground leading-none mt-1">
            {age}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Exp (yrs)
          </p>
          <p className="font-display text-2xl text-foreground leading-none mt-1">
            {BUSINESS_TODAY.getFullYear() - new Date(s.joining_date).getFullYear()}
          </p>
        </div>
      </div>
    </ClayCard>);
}
function TrainerIDChecker({ floating = true }) {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);
    // HASH MAP data structure: built once from the staff array.
    // Object.fromEntries gives us a plain JS object whose keys are staff ids.
    // Lookup by key is O(1) — independent of staff array length — meeting PS requirement (d).
    const staffHashMap = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), []);
    const todayClasses = useMemo(() => getTodayClasses(), []);
    const handleLookup = () => {
        const id = input.trim().toUpperCase();
        if (!id) {
            setResult(null);
            return;
        }
        // O(1) hash-map lookup — no linear scan
        const found = staffHashMap[id];
        setResult(found ? { status: "found", staff: found } : { status: "not_found", id });
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleLookup();
        }
    };
    const trainerClassesToday = useMemo(() => {
        if (result?.status !== "found")
            return [];
        return todayClasses.filter((c) => c.trainer_id === result.staff.id);
    }, [result, todayClasses]);
    return (<div className={floating ? "fixed top-20 right-4 z-30 w-[min(92vw,360px)]" : "w-full"}>
      <GlassCard strong className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[#F3BA60]/15 border border-[#F3BA60]/30 flex items-center justify-center">
            <ScanSearch className="h-4 w-4 text-[#F3BA60]"/>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-none">
              Trainer ID Checker
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Hash Map · O(1) lookup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. STF-001" className="flex-1 min-w-0 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono-ll text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
          <button onClick={handleLookup} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            Verify
          </button>
        </div>

        <AnimatePresence mode="wait">
          {result && (<motion.div key={result.status + (result.status === "found" ? result.staff.id : result.id)} initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 6 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="mt-3">
              {result.status === "found" ? (<div className="p-3 rounded-xl bg-[#f3ba60]/8 border border-[#f3ba60]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f3ba60] uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5"/> ✓ Verified
                    </span>
                    <span className="font-mono-ll text-[10px] text-muted-foreground">
                      {result.staff.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={result.staff.photo} alt={result.staff.name} className="h-12 w-12 rounded-lg object-cover border border-[#f3ba60]/40"/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {result.staff.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{result.staff.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#f3ba60]/15">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Today&apos;s Classes
                      </p>
                      <p className="font-display text-xl text-[#f3ba60] leading-none mt-0.5">
                        {trainerClassesToday.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Members
                      </p>
                      <p className="font-display text-xl text-foreground leading-none mt-0.5">
                        {result.staff.members_assigned.length}
                      </p>
                    </div>
                  </div>

                  {trainerClassesToday.length > 0 && (<div className="mt-2 space-y-1">
                      {trainerClassesToday.map((c) => (<div key={c.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate text-foreground">{c.name}</span>
                          <span className="font-mono-ll">
                            {c.time_start}–{c.time_end}
                          </span>
                        </div>))}
                    </div>)}
                </div>) : (<div className="p-3 rounded-xl bg-[#736a6a]/8 border border-[#736a6a]/30">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#736a6a] uppercase tracking-wider">
                    <XCircle className="h-3.5 w-3.5"/> ✗ Not Found
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Trainer ID{" "}
                    <span className="font-mono-ll text-[#736a6a]">{result.id}</span>{" "}
                    not found or inactive.
                  </p>
                </div>)}
            </motion.div>)}
        </AnimatePresence>

        {result === null && (<p className="text-[10px] text-muted-foreground mt-2">
            Press Enter or click Verify. Try <span className="font-mono-ll text-[#F3BA60]">STF-001</span>{" "}
            or <span className="font-mono-ll text-[#F3BA60]">STF-999</span>.
          </p>)}
      </GlassCard>
    </div>);
}
