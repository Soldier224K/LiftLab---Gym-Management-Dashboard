"use client";
// ============================================================
// SchedulePage — Module 4 of the LiftLab gym dashboard.
// Views: Day / Week / Month (state-based, no router).
// Add Class modal with **Trainer ID Verification (Hash Map)**.
// Weekly PDF export via jsPDF, dark LiftLab branding.
// ============================================================
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, FileDown, Clock, Users, ChevronLeft, ChevronRight, XCircle, ShieldCheck, AlertTriangle, MapPin, GripVertical, } from "lucide-react";
import { jsPDF } from "jspdf";
import { classes as seedClasses, getTodayClasses, } from "@/data/classes";
import { BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { staff } from "@/data/staff";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ll/GlassCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
const WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];
const DAY_SHORT = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
};
const START_HOUR = 5; // 5 AM
const END_HOUR = 22; // 10 PM (inclusive)
const HOUR_PX = 56; // row height per hour in the week grid
const CLASS_COLORS = ["#F3BA60", "#f3ba60", "#F3BA60", "#736a6a", "#b6b1c0", "#f3ba60"];
const CLASS_TYPE_ACCENT = {
    Group: "#F3BA60",
    Personal: "#f3ba60",
    Open: "#F3BA60",
    Specialty: "#736a6a",
};
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const TYPES = ["Group", "Personal", "Open", "Specialty"];
// ---------- Time helpers ----------
function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}
function formatTimeShort(t) {
    const [h, m] = t.split(":").map(Number);
    const ampm = (h ?? 0) >= 12 ? "PM" : "AM";
    const hh = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12;
    return `${hh}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}
function getWeekStart(d) {
    const date = new Date(d);
    const day = date.getDay(); // 0 Sun ... 6 Sat
    const diff = day === 0 ? -6 : 1 - day; // back to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}
function sameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
// ---------- Default empty form ----------
function emptyForm() {
    return {
        name: "",
        trainer_id: "",
        type: "Group",
        room: "",
        capacity: 20,
        enrolled: 0,
        time_start: "07:00",
        time_end: "08:00",
        days: [],
        level: "All Levels",
        color: CLASS_COLORS[0],
    };
}
// ============================================================
// Component
// ============================================================
export function SchedulePage() {
    const [view, setView] = useState("Week");
    const [weekAnchor, setWeekAnchor] = useState(() => getWeekStart(BUSINESS_TODAY));
    const [monthAnchor, setMonthAnchor] = useState(() => BUSINESS_TODAY);
    // Local classes appended via "Add Class" — never mutate the seed array.
    const [localClasses, setLocalClasses] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    // Combined class list = seed + locally-added classes.
    const allClasses = useMemo(() => [...seedClasses, ...localClasses], [localClasses]);
    const today = useMemo(() => BUSINESS_TODAY, []);
    const todayClasses = useMemo(() => getTodayClasses(today), [today]);
    // KPIs
    const totalClasses = allClasses.length;
    const totalSessionsWeek = useMemo(() => allClasses.reduce((acc, c) => acc + c.days.length, 0), [allClasses]);
    const totalEnrolled = useMemo(() => allClasses.reduce((acc, c) => acc + c.enrolled, 0), [allClasses]);
    const fullClasses = useMemo(() => allClasses.filter((c) => c.enrolled >= c.capacity).length, [allClasses]);
    const shiftWeek = (delta) => setWeekAnchor((w) => addDays(w, delta * 7));
    const shiftMonth = (delta) => {
        const r = new Date(monthAnchor);
        r.setMonth(r.getMonth() + delta);
        setMonthAnchor(r);
    };
    return (<div className="space-y-5 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Class Schedule
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly studio plan ·{" "}
            <span className="text-[#F3BA60]">{totalClasses}</span> active classes ·{" "}
            <span className="text-[#f3ba60]">{totalSessionsWeek}</span> sessions / week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={setView}/>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4"/> Add Class
          </button>
          <button onClick={() => exportWeeklyPDF(allClasses, weekAnchor)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-muted transition-colors">
            <FileDown className="h-4 w-4"/> Export PDF
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="Active Classes" value={totalClasses} sub="Across all studios" accent="#F3BA60" icon={CalendarDays} delay={0}/>
        <StatKPI label="Sessions / Week" value={totalSessionsWeek} sub="Recurring weekday slots" accent="#f3ba60" icon={Clock} delay={0.05}/>
        <StatKPI label="Total Enrolment" value={totalEnrolled} sub="Member slots booked" accent="#F3BA60" icon={Users} delay={0.1}/>
        <StatKPI label="Full Classes" value={fullClasses} sub="At capacity" accent="#736a6a" icon={AlertTriangle} delay={0.15}/>
      </div>

      {/* Legend */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground uppercase tracking-[0.14em] text-[10px]">
            Class Types
          </span>
          {TYPES.map((t) => (<span key={t} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CLASS_TYPE_ACCENT[t] }}/>
              <span className="text-foreground">{t}</span>
            </span>))}
          <span className="ml-auto text-[10px] text-muted-foreground font-mono-ll hidden sm:inline">
            Tip: drag a class card to reschedule (preview only)
          </span>
        </div>
      </GlassCard>

      {/* View body */}
      <AnimatePresence mode="wait">
        {view === "Day" && (<motion.div key="day" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <DayView classes={allClasses} todayClasses={todayClasses}/>
          </motion.div>)}
        {view === "Week" && (<motion.div key="week" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <WeekView classes={allClasses} weekAnchor={weekAnchor} onPrev={() => shiftWeek(-1)} onNext={() => shiftWeek(1)} onToday={() => setWeekAnchor(getWeekStart(new Date()))}/>
          </motion.div>)}
        {view === "Month" && (<motion.div key="month" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <MonthView classes={allClasses} monthAnchor={monthAnchor} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} onToday={() => setMonthAnchor(new Date())}/>
          </motion.div>)}
      </AnimatePresence>

      {/* Add Class Modal */}
      <AddClassDialog open={showAdd} onOpenChange={setShowAdd} onSubmit={(cls) => {
            setLocalClasses((prev) => [...prev, cls]);
            setShowAdd(false);
            toast({
                title: "Class added",
                description: `${cls.name} · ${cls.time_start}–${cls.time_end}`,
            });
        }}/>
    </div>);
}
// ============================================================
// View toggle
// ============================================================
function ViewToggle({ view, onChange }) {
    const modes = ["Day", "Week", "Month"];
    return (<div className="inline-flex items-center rounded-lg bg-muted border border-border p-0.5">
      {modes.map((m) => {
            const active = view === m;
            return (<button key={m} onClick={() => onChange(m)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"}`}>
            {m}
          </button>);
        })}
    </div>);
}
function WeekView({ classes, weekAnchor, onPrev, onNext, onToday }) {
    const weekStart = getWeekStart(weekAnchor);
    const today = BUSINESS_TODAY;
    // Days of the week as Date objects.
    const days = WEEKDAYS.map((_, i) => addDays(weekStart, i));
    const hours = useMemo(() => {
        const arr = [];
        for (let h = START_HOUR; h <= END_HOUR; h++)
            arr.push(h);
        return arr;
    }, []);
    const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_PX;
    return (<GlassCard className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} aria-label="Previous week" className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-foreground"/>
          </button>
          <button onClick={onNext} aria-label="Next week" className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-foreground"/>
          </button>
          <button onClick={onToday} className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted">
            Today
          </button>
          <p className="font-display text-xl text-foreground ml-2 leading-none">
            {days[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
            {days[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono-ll hidden sm:block">
          {classes.length} classes · drag to preview reschedule
        </p>
      </div>

      {/* Day headers */}
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
        <div />
        {days.map((d, i) => {
            const isToday = sameDay(d, today);
            const isWeekend = i >= 5;
            return (<div key={WEEKDAYS[i]} className={`text-center pb-2 border-b ${isToday ? "border-[#F3BA60]/40" : "border-border"}`}>
              <p className={`text-[10px] uppercase tracking-[0.14em] ${isToday ? "text-[#F3BA60]" : isWeekend ? "text-[#F3BA60]" : "text-muted-foreground"}`}>
                {DAY_SHORT[WEEKDAYS[i]]}
              </p>
              <p className={`font-display text-2xl mt-0.5 leading-none ${isToday ? "text-[#F3BA60]" : "text-foreground"}`}>
                {d.getDate()}
              </p>
            </div>);
        })}
      </div>

      {/* Body */}
      <div className="grid relative mt-2" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
        {/* Hour gutter */}
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h, idx) => (<div key={h} className="absolute right-2 text-[10px] font-mono-ll text-muted-foreground -translate-y-1/2" style={{ top: idx * HOUR_PX }}>
              {h % 12 === 0 ? 12 : h % 12}
              {h < 12 ? "a" : "p"}
            </div>))}
        </div>

        {/* Day columns */}
        {days.map((d, i) => {
            const weekday = WEEKDAYS[i];
            const isToday = sameDay(d, today);
            const dayClasses = classes.filter((c) => c.days.includes(weekday));
            return (<div key={weekday} className={`relative border-l ${isToday ? "border-[#F3BA60]/30 bg-[#F3BA60]/[0.03]" : "border-border"}`} style={{ height: totalHeight }}>
              {/* hour gridlines */}
              {hours.map((_, idx) => (<div key={idx} className="absolute left-0 right-0 border-t border-border" style={{ top: idx * HOUR_PX }}/>))}

              {/* class cards */}
              {dayClasses.map((c, ci) => {
                    const startMin = timeToMinutes(c.time_start);
                    const endMin = timeToMinutes(c.time_end);
                    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_PX;
                    const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_PX - 4);
                    const trainer = staff.find((s) => s.id === c.trainer_id);
                    return (<motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(ci * 0.03, 0.2), duration: 0.25 }} drag dragSnapToOrigin dragElastic={0.08} dragMomentum={false} whileDrag={{ zIndex: 50, scale: 1.03, cursor: "grabbing" }} className="absolute left-1 right-1 rounded-lg p-2 cursor-grab active:cursor-grabbing overflow-hidden group" style={{
                            top,
                            height,
                            backgroundColor: `${c.color}1a`,
                            borderLeft: `3px solid ${c.color}`,
                            border: `1px solid ${c.color}40`,
                        }} title={`${c.name} · drag to reschedule (preview only)`}>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[11px] font-semibold leading-tight text-foreground truncate" style={{ color: c.color }}>
                        {c.name}
                      </p>
                      <GripVertical className="h-3 w-3 text-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {trainer?.name ?? "Unassigned"}
                    </p>
                    <p className="text-[10px] font-mono-ll text-foreground/70 mt-0.5">
                      {formatTimeShort(c.time_start)} – {formatTimeShort(c.time_end)}
                    </p>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-border text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-2.5 w-2.5"/>
                        {c.room}
                      </span>
                      <span className="font-mono-ll">
                        {c.enrolled}/{c.capacity}
                      </span>
                    </div>
                  </motion.div>);
                })}
            </div>);
        })}
      </div>
    </GlassCard>);
}
// ============================================================
// Day View — single-column timeline of today's classes.
// ============================================================
function DayView({ classes, todayClasses, }) {
    const today = useMemo(() => BUSINESS_TODAY, []);
    const weekday = useMemo(() => today.toLocaleDateString("en-IN", { weekday: "long" }), [today]);
    // Prefer getTodayClasses (date-fns based) but fall back to a manual filter on
    // the combined array so locally-added classes appear too.
    const localToday = useMemo(() => classes.filter((c) => c.days.includes(weekday)), [classes, weekday]);
    const allToday = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const c of [...todayClasses, ...localToday]) {
            if (!seen.has(c.id)) {
                seen.add(c.id);
                out.push(c);
            }
        }
        return out.sort((a, b) => timeToMinutes(a.time_start) - timeToMinutes(b.time_start));
    }, [todayClasses, localToday]);
    return (<GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-2xl text-foreground leading-none">
            {today.toLocaleDateString("en-IN", { weekday: "long" })}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono-ll">
            {today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
            · {allToday.length} classes scheduled
          </p>
        </div>
        <StatusBadge variant="blue" pulse>
          Today
        </StatusBadge>
      </div>

      {allToday.length === 0 && (<div className="py-12 text-center text-sm text-muted-foreground">
          No classes scheduled today. Enjoy the rest day!
        </div>)}

      <div className="space-y-2">
        {allToday.map((c, i) => {
            const trainer = staff.find((s) => s.id === c.trainer_id);
            const full = c.enrolled >= c.capacity;
            return (<motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <ClayCard className="p-4 flex items-center gap-4" style={{ borderLeft: `4px solid ${c.color}` }}>
                <div className="text-center shrink-0 min-w-[72px] px-2 py-1 rounded-lg bg-muted/60 border border-border">
                  <p className="font-display text-2xl text-foreground leading-none">
                    {c.time_start.split(":")[0]}
                    <span className="text-muted-foreground text-base">
                      :{c.time_start.split(":")[1]}
                    </span>
                  </p>
                  <p className="font-mono-ll text-[10px] text-muted-foreground mt-1">
                    → {formatTimeShort(c.time_end)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-foreground font-semibold text-base leading-tight">
                      {c.name}
                    </h4>
                    <span className="text-[10px] font-mono-ll px-2 py-0.5 rounded-full" style={{ color: c.color, backgroundColor: `${c.color}1a` }}>
                      {c.type.toUpperCase()}
                    </span>
                    <StatusBadge variant={full ? "red" : "green"} pulse={full}>
                      {full ? "Full" : "Open"}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trainer?.name ?? "Unassigned"} · {c.room} · {c.level}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3"/>
                      <span className="text-foreground font-semibold">{c.enrolled}</span>/
                      {c.capacity}
                    </span>
                    <span className="font-mono-ll text-muted-foreground">{c.id}</span>
                  </div>
                </div>
              </ClayCard>
            </motion.div>);
        })}
      </div>
    </GlassCard>);
}
// ============================================================
// Month View — calendar grid with class counts per day (heat).
// ============================================================
function MonthView({ classes, monthAnchor, onPrev, onNext, onToday, }) {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 Sun ... 6 Sat
    // Convert Sunday=0 to Monday-indexed offset.
    const gridOffset = startWeekday === 0 ? 6 : startWeekday - 1;
    const daysInMonth = lastDay.getDate();
    const today = BUSINESS_TODAY;
    // For each day-of-month, count classes whose days[] includes that weekday name.
    const countsByDay = useMemo(() => {
        const map = new Map();
        for (let d = 1; d <= daysInMonth; d++) {
            const wd = new Date(year, month, d).toLocaleDateString("en-IN", {
                weekday: "long",
            });
            const count = classes.filter((c) => c.days.includes(wd)).length;
            map.set(d, count);
        }
        return map;
    }, [classes, daysInMonth, month, year]);
    const cells = [];
    for (let i = 0; i < gridOffset; i++)
        cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
        cells.push(d);
    while (cells.length % 7 !== 0)
        cells.push(null);
    const maxCount = Math.max(1, ...Array.from(countsByDay.values()));
    const heatColor = (count) => {
        if (count === 0) return "rgba(246,246,246,0.05)";
        const t = count / maxCount;
        // Palette-only discrete colors — no interpolation
        if (t < 0.34) return "rgba(224,219,243,0.45)"; // lavender
        if (t < 0.67) return "rgba(115,106,106,0.45)"; // brown
        return "rgba(243,186,96,0.45)";                 // orange
    };
    return (<GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} aria-label="Previous month" className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-foreground"/>
          </button>
          <button onClick={onNext} aria-label="Next month" className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-foreground"/>
          </button>
          <button onClick={onToday} className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted">
            Today
          </button>
          <p className="font-display text-2xl text-foreground ml-2 leading-none">
            {monthAnchor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono-ll hidden sm:block">
          Heat = classes per day
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (<div key={d} className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground text-center pb-1">
            {DAY_SHORT[d]}
          </div>))}
        {cells.map((day, i) => {
            if (day === null)
                return <div key={`e-${i}`}/>;
            const count = countsByDay.get(day) ?? 0;
            const isToday = today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;
            return (<motion.div key={day} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.01, 0.15) }} className="aspect-square rounded-lg p-2 flex flex-col border" style={{
                    backgroundColor: heatColor(count),
                    borderColor: isToday ? "#F3BA60" : "rgba(246,246,246,0.05)",
                }}>
              <p className={`font-display text-lg leading-none ${isToday ? "text-[#F3BA60]" : "text-foreground"}`}>
                {day}
              </p>
              <div className="mt-auto">
                {count > 0 ? (<>
                    <p className="font-display text-2xl leading-none" style={{
                        color: count / maxCount > 0.5 ? "#F3BA60" : "#F3BA60",
                    }}>
                      {count}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">
                      classes
                    </p>
                  </>) : (<p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">
                    Rest
                  </p>)}
              </div>
            </motion.div>);
        })}
      </div>
    </GlassCard>);
}
function AddClassDialog({ open, onOpenChange, onSubmit }) {
    const [form, setForm] = useState(emptyForm);
    const [trainerError, setTrainerError] = useState(null);
    // ---- HASH MAP for trainer verification (PS requirement d) ----
    // O(1) lookup by staff id; built once from the staff array.
    // No linear scan needed on every keystroke / submit.
    const staffHashMap = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), []);
    // Only "Trainer" roles are eligible (Head Trainer + Personal Trainer).
    const trainerStaff = useMemo(() => staff.filter((s) => s.role === "Head Trainer" || s.role === "Personal Trainer"), []);
    const verifyTrainer = (id) => {
        const trimmed = id.trim().toUpperCase();
        if (!trimmed)
            return { ok: false, error: "Trainer ID is required" };
        // O(1) hash map lookup
        const found = staffHashMap[trimmed];
        if (!found) {
            return { ok: false, error: `⛔ Trainer ID ${trimmed} not found or inactive` };
        }
        if (found.role !== "Head Trainer" && found.role !== "Personal Trainer") {
            return {
                ok: false,
                error: `⛔ ${trimmed} is ${found.role}, not an active Trainer`,
            };
        }
        return { ok: true, staff: found };
    };
    const handleTrainerChange = (value) => {
        setForm((f) => ({ ...f, trainer_id: value }));
        if (!value.trim()) {
            setTrainerError(null);
            return;
        }
        const v = verifyTrainer(value);
        setTrainerError(v.ok ? null : v.error ?? null);
    };
    const toggleDay = (d) => {
        setForm((f) => ({
            ...f,
            days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
        }));
    };
    const valid = form.name.trim() &&
        form.room.trim() &&
        form.days.length > 0 &&
        verifyTrainer(form.trainer_id).ok &&
        timeToMinutes(form.time_end) > timeToMinutes(form.time_start) &&
        form.capacity > 0 &&
        form.enrolled >= 0 &&
        form.enrolled <= form.capacity;
    const handleSubmit = () => {
        if (!valid)
            return;
        const v = verifyTrainer(form.trainer_id);
        if (!v.ok || !v.staff)
            return;
        const id = `CLS-${String(Date.now()).slice(-6)}`;
        const cls = {
            id,
            name: form.name.trim(),
            trainer_id: v.staff.id,
            type: form.type,
            room: form.room.trim(),
            capacity: form.capacity,
            enrolled: form.enrolled,
            time_start: form.time_start,
            time_end: form.time_end,
            days: form.days,
            equipment_needed: [],
            level: form.level,
            color: form.color,
        };
        onSubmit(cls);
        setForm(emptyForm());
        setTrainerError(null);
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto ll-scroll">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            Add New Class
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a recurring weekly class. Trainer IDs are verified via hash map
            (O(1) lookup).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cls-name" className="text-xs text-muted-foreground">
              Class Name *
            </Label>
            <input id="cls-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunrise HIIT" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
          </div>

          {/* Trainer ID with verification */}
          <div className="space-y-1.5">
            <Label htmlFor="cls-trainer" className="text-xs text-muted-foreground">
              Trainer ID *
              <span className="ml-1 text-[10px] text-[#F3BA60] font-mono-ll">
                · Hash Map lookup
              </span>
            </Label>
            <div className="flex gap-2">
              <Select value={form.trainer_id} onValueChange={handleTrainerChange}>
                <SelectTrigger className="flex-1 bg-muted border-border text-foreground h-9">
                  <SelectValue placeholder="Pick a trainer…"/>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {trainerStaff.map((s) => (<SelectItem key={s.id} value={s.id} className="text-foreground focus:bg-[#F3BA60]/10 focus:text-[#F3BA60]">
                      <span className="font-mono-ll text-[10px] text-[#F3BA60] mr-2">
                        {s.id}
                      </span>
                      {s.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
              <input value={form.trainer_id} onChange={(e) => handleTrainerChange(e.target.value)} placeholder="or type STF-XXX" className="w-36 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono-ll text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            {/* Inline verification result */}
            <AnimatePresence mode="wait">
              {trainerError && (<motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-1.5 text-[11px] text-[#736a6a] font-medium">
                  <XCircle className="h-3.5 w-3.5"/>
                  {trainerError}
                </motion.div>)}
              {!trainerError && form.trainer_id.trim() && (<motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-1.5 text-[11px] text-[#f3ba60] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5"/>✓ Verified —{" "}
                  {staffHashMap[form.trainer_id.trim().toUpperCase()]?.name}
                </motion.div>)}
            </AnimatePresence>
          </div>

          {/* Type + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="w-full bg-muted border-border text-foreground h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TYPES.map((t) => (<SelectItem key={t} value={t} className="text-foreground focus:bg-[#F3BA60]/10 focus:text-[#F3BA60]">
                      {t}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm((f) => ({
            ...f,
            level: v,
        }))}>
                <SelectTrigger className="w-full bg-muted border-border text-foreground h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {LEVELS.map((l) => (<SelectItem key={l} value={l} className="text-foreground focus:bg-[#F3BA60]/10 focus:text-[#F3BA60]">
                      {l}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room + Capacity + Enrolled */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="cls-room" className="text-xs text-muted-foreground">
                Room *
              </Label>
              <input id="cls-room" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="Studio A" className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls-cap" className="text-xs text-muted-foreground">
                Capacity
              </Label>
              <input id="cls-cap" type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value || "0", 10) }))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls-enr" className="text-xs text-muted-foreground">
                Enrolled
              </Label>
              <input id="cls-enr" type="number" min={0} value={form.enrolled} onChange={(e) => setForm((f) => ({ ...f, enrolled: parseInt(e.target.value || "0", 10) }))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cls-ts" className="text-xs text-muted-foreground">
                Start Time
              </Label>
              <input id="cls-ts" type="time" value={form.time_start} onChange={(e) => setForm((f) => ({ ...f, time_start: e.target.value }))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono-ll text-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls-te" className="text-xs text-muted-foreground">
                End Time
              </Label>
              <input id="cls-te" type="time" value={form.time_end} onChange={(e) => setForm((f) => ({ ...f, time_end: e.target.value }))} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono-ll text-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
          </div>
          {timeToMinutes(form.time_end) <= timeToMinutes(form.time_start) && (<p className="text-[11px] text-[#736a6a]">
              ⛔ End time must be after start time
            </p>)}

          {/* Days multi-select chips */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Recurring Days * <span className="text-[10px]">(pick at least one)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
            const active = form.days.includes(d);
            return (<button key={d} type="button" onClick={() => toggleDay(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active
                    ? "bg-[#F3BA60]/15 text-[#F3BA60] border-[#F3BA60]/40"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"}`}>
                    {DAY_SHORT[d]}
                  </button>);
        })}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Accent Colour</Label>
            <div className="flex flex-wrap gap-2">
              {CLASS_COLORS.map((c) => (<button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))} className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c ? "scale-110 border-border" : "border-transparent"}`} style={{ backgroundColor: c }} aria-label={`Pick colour ${c}`}/>))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-muted">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!valid} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
            Add Class
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
// ============================================================
// PDF Export — dark LiftLab themed weekly schedule.
// ============================================================
function exportWeeklyPDF(allClasses, weekAnchor) {
    const weekStart = getWeekStart(weekAnchor);
    const doc = new jsPDF();
    // Dark background
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, 210, 297, "F");
    // Header
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("LiftLab", 20, 26);
    doc.setTextColor(122, 122, 140);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Train Smart. Track Everything.", 20, 33);
    doc.setDrawColor(0, 212, 255);
    doc.line(20, 40, 190, 40);
    // Title
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Weekly Class Schedule", 20, 54);
    // Date range
    const end = addDays(weekStart, 6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 122, 140);
    doc.text(`${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, 20, 61);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, 67);
    // Per-day sections
    let y = 80;
    WEEKDAYS.forEach((wd, i) => {
        const dayDate = addDays(weekStart, i);
        const dayClasses = allClasses
            .filter((c) => c.days.includes(wd))
            .sort((a, b) => timeToMinutes(a.time_start) - timeToMinutes(b.time_start));
        // Day header
        if (y > 260) {
            doc.addPage();
            doc.setFillColor(10, 10, 15);
            doc.rect(0, 0, 210, 297, "F");
            y = 30;
        }
        doc.setFillColor(0, 212, 255);
        doc.rect(20, y - 5, 170, 0.6, "F");
        doc.setTextColor(0, 212, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`${wd} · ${dayDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, 20, y + 4);
        doc.setTextColor(122, 122, 140);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`${dayClasses.length} class${dayClasses.length === 1 ? "" : "es"}`, 190, y + 4, {
            align: "right",
        });
        y += 12;
        if (dayClasses.length === 0) {
            doc.setTextColor(122, 122, 140);
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text("— Rest day —", 26, y);
            y += 8;
        }
        else {
            dayClasses.forEach((c) => {
                if (y > 275) {
                    doc.addPage();
                    doc.setFillColor(10, 10, 15);
                    doc.rect(0, 0, 210, 297, "F");
                    y = 30;
                }
                const trainer = staff.find((s) => s.id === c.trainer_id);
                doc.setTextColor(240, 240, 240);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text(c.name, 26, y);
                doc.setTextColor(0, 255, 136);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(`${c.time_start}–${c.time_end}`, 190, y, { align: "right" });
                y += 5;
                doc.setTextColor(180, 180, 180);
                doc.setFontSize(9);
                doc.text(`Trainer: ${trainer?.name ?? "TBD"} (${c.trainer_id})  ·  ${c.room}  ·  ${c.level}  ·  ${c.enrolled}/${c.capacity} enrolled  ·  ${c.type}`, 26, y);
                y += 9;
            });
        }
        y += 3;
    });
    // Footer
    doc.setDrawColor(0, 212, 255);
    doc.line(20, 285, 190, 285);
    doc.setTextColor(122, 122, 140);
    doc.setFontSize(8);
    doc.text("LiftLab · Weekly Schedule · System-generated", 20, 291);
    const fname = `liftlab_schedule_${weekStart.toISOString().slice(0, 10)}.pdf`;
    doc.save(fname);
    toast({
        title: "Schedule exported",
        description: fname,
    });
}
