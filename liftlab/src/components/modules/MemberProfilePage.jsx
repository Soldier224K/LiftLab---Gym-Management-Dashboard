"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Activity, TrendingUp, Dumbbell, Salad, CalendarCheck, Wallet, Stethoscope, FileText, Undo2, Redo2, AlertTriangle, CheckCircle2, Target, Download, Plus, Pencil, } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis, } from "recharts";
import { memberById } from "@/data/members";
import { staff } from "@/data/staff";
import { useNav } from "@/store/navStore";
import { GlassCard } from "@/components/ll/GlassCard";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { calcAge, membershipStatus, daysUntil, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { HR_ZONES, maxHR, isSafePlan, } from "@/utils/heartRateZone";
import { getMemberProgress, progressColor } from "@/utils/progressSorter";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
const TABS = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "workout", label: "Workout Plan", icon: Dumbbell },
    { key: "nutrition", label: "Nutrition", icon: Salad },
    { key: "progress", label: "Progress", icon: TrendingUp },
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "fees", label: "Fees", icon: Wallet },
    { key: "medical", label: "Medical", icon: Stethoscope },
    { key: "documents", label: "Documents", icon: FileText },
];
export function MemberProfilePage({ id }) {
    const { backToMembers } = useNav();
    const member = memberById(id);
    const [tab, setTab] = useState("overview");
    if (!member) {
        return (<div className="text-center py-16">
        <p className="text-muted-foreground">Member not found.</p>
        <button onClick={backToMembers} className="mt-3 text-[#F3BA60] hover:underline">
          ← Back to members
        </button>
      </div>);
    }
    const age = calcAge(member.dob);
    const progress = getMemberProgress(member);
    const memStatus = membershipStatus(member.membership_expiry, member.fees.status === "Paid");
    const trainer = staff.find((s) => s.id === member.trainer_id);
    const counsellor = staff.find((s) => s.id === member.counsellor_id);
    const attPct = Math.round((member.attendance.attended / member.attendance.total_sessions_scheduled) * 100);
    const bodyFat = member.progress_tracker.body_fat_log.at(-1)?.value ?? 0;
    return (<div className="space-y-4">
      <button onClick={backToMembers} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4"/> Back to members
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left sidebar */}
        <GlassCard className="lg:col-span-1 p-5 h-fit lg:sticky lg:top-20">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img src={member.photo} alt={member.name} className="h-28 w-28 rounded-2xl object-cover border-2 border-[#F3BA60]/40"/>
              <span className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-card border-2 border-[#F3BA60] flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f3ba60] pulse-dot"/>
              </span>
            </div>
            <h2 className="font-display text-2xl text-foreground mt-3 leading-none">{member.name}</h2>
            <p className="font-mono-ll text-xs text-[#F3BA60] mt-1">{member.id}</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              <StatusBadge status={member.membership_type}>{member.membership_type}</StatusBadge>
              <StatusBadge status={memStatus} pulse={memStatus === "Expired"}>{memStatus}</StatusBadge>
              {member.medical.conditions.length > 0 && (<StatusBadge variant="orange">Medical</StatusBadge>)}
            </div>
          </div>

          <div className="mt-5 space-y-2.5 text-sm">
            <Vital label="Age" value={`${age} yrs`}/>
            <Vital label="Gender" value={member.gender}/>
            <Vital label="Height" value={`${member.height_cm} cm`}/>
            <Vital label="Weight" value={`${member.weight_kg} kg`}/>
            <Vital label="Blood" value={member.blood_group}/>
            <Vital label="Contact" value={member.contact}/>
            <Vital label="Trainer" value={trainer?.name ?? member.trainer_id}/>
            <Vital label="Counsellor" value={counsellor?.name ?? member.counsellor_id}/>
            <Vital label="Joined" value={member.joining_date}/>
            <Vital label="Expires" value={<span style={{ color: daysUntil(member.membership_expiry) < 30 ? "#F3BA60" : "#202022" }}>
                  {member.membership_expiry}
                </span>}/>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Emergency</p>
            <p className="text-sm text-foreground">{member.emergency_contact.name}</p>
            <p className="text-xs text-muted-foreground">{member.emergency_contact.relation} · {member.emergency_contact.phone}</p>
          </div>
        </GlassCard>

        {/* Right main */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active ? "bg-[#F3BA60]/12 text-[#F3BA60]" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  <Icon className="h-4 w-4"/> {t.label}
                </button>);
        })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "overview" && <OverviewTab member={member} age={age} progress={progress} attPct={attPct} bodyFat={bodyFat}/>}
              {tab === "workout" && <WorkoutTab member={member} age={age}/>}
              {tab === "nutrition" && <NutritionTab member={member}/>}
              {tab === "progress" && <ProgressTab member={member}/>}
              {tab === "attendance" && <AttendanceTab member={member}/>}
              {tab === "fees" && <FeesTab member={member}/>}
              {tab === "medical" && <MedicalTab member={member}/>}
              {tab === "documents" && <DocumentsTab member={member}/>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>);
}
function Vital({ label, value }) {
    return (<div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-right truncate">{value}</span>
    </div>);
}
/* ---------------- Overview tab ---------------- */
function OverviewTab({ member, age, progress, attPct, bodyFat }) {
    const m = member;
    const today = BUSINESS_TODAY.toLocaleDateString("en-IN", { weekday: "long" });
    const todaysPlan = m.workout_plan.weekly_split[today];
    return (<div className="space-y-4">
      {/* KPI pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Current Weight</p>
          <p className="font-display text-3xl text-[#F3BA60] mt-1 leading-none">{m.weight_kg}<span className="text-base text-muted-foreground">kg</span></p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Body Fat</p>
          <p className="font-display text-3xl text-[#f3ba60] mt-1 leading-none">{bodyFat}<span className="text-base text-muted-foreground">%</span></p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Streak</p>
          <p className="font-display text-3xl text-[#F3BA60] mt-1 leading-none">{m.attendance.streak_current}<span className="text-base text-muted-foreground">d</span></p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Attendance</p>
          <p className="font-display text-3xl text-[#F3BA60] mt-1 leading-none">{attPct}<span className="text-base text-muted-foreground">%</span></p>
        </NeumorphCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goals progress rings */}
        <GlassCard className="p-5">
          <h3 className="font-display text-xl text-foreground leading-none">Goals</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Average completion: {progress}%</p>
          <div className="space-y-4">
            {m.goals.map((g, i) => (<div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-[#F3BA60]"/>
                    <span className="text-sm text-foreground">{g.goal}</span>
                  </div>
                  <StatusBadge status={g.status}>{g.status}</StatusBadge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${g.completion_pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: progressColor(g.completion_pct) }}/>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono-ll">Target: {g.target_date}</span>
                  <span className="text-[10px] font-mono-ll" style={{ color: progressColor(g.completion_pct) }}>{g.completion_pct}%</span>
                </div>
              </div>))}
          </div>
        </GlassCard>

        {/* Today's workout */}
        <GlassCard className="p-5">
          <h3 className="font-display text-xl text-foreground leading-none">Today&apos;s Workout</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">{today} · {todaysPlan?.focus}</p>
          {todaysPlan && todaysPlan.exercises.length > 0 ? (<div className="space-y-2">
              {todaysPlan.exercises.map((ex, i) => (<div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="text-sm text-foreground">{ex.name}</span>
                  <span className="font-mono-ll text-xs text-[#F3BA60]">{ex.sets}×{ex.reps} · {ex.rest}</span>
                </div>))}
            </div>) : (<p className="text-sm text-muted-foreground py-6 text-center">Rest day. Focus on recovery & hydration.</p>)}
        </GlassCard>
      </div>
    </div>);
}
/* ---------------- Workout tab + HR Zone Planner + Undo ---------------- */
function WorkoutTab({ member, age }) {
    const m = member;
    const [expanded, setExpanded] = useState("Monday");
    const [plan, setPlan] = useState(m.workout_plan);
    // Workout Change Undo history — PS requirement (b) Stack
    const wh = useWorkoutHistory(m.workout_plan.history.map((h, i) => ({
        id: `hist-${i}`,
        date: h.date,
        change: h.change,
        changed_by: h.changed_by,
        snapshot: null,
    })));
    const maxHr = maxHR(age);
    const medicalFlagged = m.medical.conditions.length > 0;
    // collect all exercises across the week for safety check
    const allExercises = useMemo(() => {
        const ex = [];
        Object.values(plan.weekly_split).forEach((day) => {
            day.exercises.forEach((e) => ex.push({ hr_zone: e.hr_zone, name: e.name }));
        });
        return ex;
    }, [plan]);
    const safety = isSafePlan(allExercises, medicalFlagged);
    const handleAddExercise = (day) => {
        const newEx = { name: "New Exercise", sets: 3, reps: "10", rest: "60s" };
        setPlan((p) => ({
            ...p,
            weekly_split: {
                ...p.weekly_split,
                [day]: { ...p.weekly_split[day], exercises: [...p.weekly_split[day].exercises, newEx] },
            },
        }));
        const change = {
            id: `ch-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            change: `Added "New Exercise" to ${day}`,
            changed_by: "STF-001",
            snapshot: null,
        };
        wh.push(change);
        toast({ title: "Exercise added", description: change.change });
    };
    const handleUndo = () => {
        const c = wh.undo();
        if (c) {
            toast({ title: "Undo", description: `Reverted: ${c.change}` });
        }
        else {
            toast({ title: "Nothing to undo" });
        }
    };
    const handleRedo = () => {
        const c = wh.redo();
        if (c)
            toast({ title: "Redo", description: `Re-applied: ${c.change}` });
    };
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Weekly split */}
      <GlassCard className="lg:col-span-2 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl text-foreground leading-none">{plan.plan_name}</h3>
            <p className="text-xs text-muted-foreground mt-1 font-mono-ll">{plan.current_plan_id} · assigned {plan.assigned_date}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={!wh.canUndo} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Undo2 className="h-3.5 w-3.5"/> Undo
            </button>
            <button onClick={handleRedo} disabled={!wh.canRedo} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Redo2 className="h-3.5 w-3.5"/> Redo
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {Object.keys(plan.weekly_split).map((day) => {
            const d = plan.weekly_split[day];
            const isOpen = expanded === day;
            return (<div key={day} className="rounded-lg border border-border overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : day)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-[#F3BA60] w-24 text-left">{day}</span>
                    <span className="text-sm text-foreground">{d.focus}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono-ll">{d.exercises.length} exercises</span>
                </button>
                <AnimatePresence>
                  {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3 pt-1 space-y-1.5">
                        {d.exercises.length === 0 && (<p className="text-xs text-muted-foreground py-2">Rest day.</p>)}
                        {d.exercises.map((ex, i) => (<div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/40 text-sm">
                            <span className="text-foreground flex-1">{ex.name}</span>
                            <span className="font-mono-ll text-xs text-muted-foreground">{ex.sets}×{ex.reps}</span>
                            <span className="font-mono-ll text-xs text-muted-foreground">{ex.rest}</span>
                            {ex.hr_zone && (<span className="font-mono-ll text-[9px] px-1.5 py-0.5 rounded uppercase" style={{ color: HR_ZONES[ex.hr_zone - 1].color, backgroundColor: `${HR_ZONES[ex.hr_zone - 1].color}1a` }}>
                                Z{ex.hr_zone}
                              </span>)}
                            <button className="text-muted-foreground hover:text-[#F3BA60]">
                              <Pencil className="h-3 w-3"/>
                            </button>
                          </div>))}
                        <button onClick={() => handleAddExercise(day)} className="flex items-center gap-1 text-xs text-[#F3BA60] hover:underline mt-1">
                          <Plus className="h-3 w-3"/> Add exercise
                        </button>
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </div>);
        })}
        </div>
      </GlassCard>

      {/* HR Zone Planner + Undo history */}
      <div className="space-y-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-[#736a6a]"/>
            <h3 className="font-display text-xl text-foreground leading-none">HR Zone Planner</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Safe Training Planner · age {age}</p>
          <div className="rounded-lg bg-muted/60 border border-border p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Max HR (220 − age)</span>
              <span className="font-display text-2xl text-[#736a6a] leading-none">{maxHr}</span>
            </div>
          </div>
          <div className="space-y-2">
            {HR_ZONES.map((z) => {
            const lo = Math.round((z.min / 100) * maxHr);
            const hi = Math.round((z.max / 100) * maxHr);
            return (<div key={z.zone} className="flex items-center gap-2">
                  <div className="h-7 w-1.5 rounded-full" style={{ backgroundColor: z.color }}/>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">
                        Z{z.zone} · {z.name}
                        {z.zone === 3 && <span className="text-[10px] text-[#f3ba60] ml-1">SAFE</span>}
                      </span>
                      <span className="font-mono-ll text-[10px] text-muted-foreground">{lo}-{hi} bpm</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${z.max}%`, backgroundColor: z.color, opacity: 0.7 }}/>
                    </div>
                  </div>
                </div>);
        })}
          </div>
          <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${safety.safe ? "bg-[#f3ba60]/8 border-[#f3ba60]/30" : "bg-[#736a6a]/8 border-[#736a6a]/30"}`}>
            {safety.safe ? <CheckCircle2 className="h-4 w-4 text-[#f3ba60] shrink-0 mt-0.5"/> : <AlertTriangle className="h-4 w-4 text-[#736a6a] shrink-0 mt-0.5"/>}
            <div>
              <p className={`text-xs font-semibold ${safety.safe ? "text-[#f3ba60]" : "text-[#736a6a]"}`}>
                {safety.safe ? "Plan is safe" : "Safety alert"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{safety.reason}</p>
              {medicalFlagged && <p className="text-[10px] text-[#F3BA60] mt-1">Medical-flagged member — Zone 5 capped at 20 min.</p>}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-display text-xl text-foreground leading-none mb-3">Change History</h3>
          <p className="text-[10px] text-muted-foreground mb-3 font-mono-ll">Stack-based undo · {wh.history.length} entries</p>
          <div className="space-y-2 max-h-64 overflow-y-auto ll-scroll">
            {[...wh.history].reverse().map((c, i) => (<div key={c.id} className="flex gap-2 p-2 rounded-md bg-muted/40 border-l-2 border-[#F3BA60]/40">
                <div className="text-[10px] font-mono-ll text-muted-foreground shrink-0 mt-0.5">{i === 0 ? "►" : ""}</div>
                <div className="min-w-0">
                  <p className="text-xs text-foreground">{c.change}</p>
                  <p className="text-[10px] text-muted-foreground font-mono-ll mt-0.5">{c.date} · {c.changed_by}</p>
                </div>
              </div>))}
            {wh.history.length === 0 && (<p className="text-xs text-muted-foreground text-center py-4">No changes yet.</p>)}
          </div>
        </GlassCard>
      </div>
    </div>);
}
/* ---------------- Nutrition tab ---------------- */
function NutritionTab({ member }) {
    const m = member;
    const np = m.nutrition_plan;
    const [openDay, setOpenDay] = useState("Monday");
    const macroData = [
        { name: "Protein", value: np.macros.protein_g, color: "#F3BA60", kcal: np.macros.protein_g * 4 },
        { name: "Carbs", value: np.macros.carbs_g, color: "#f3ba60", kcal: np.macros.carbs_g * 4 },
        { name: "Fat", value: np.macros.fat_g, color: "#F3BA60", kcal: np.macros.fat_g * 9 },
    ];
    const totalMacroKcal = macroData.reduce((a, b) => a + b.kcal, 0);
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none">Daily Target</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Calorie budget</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "cal", value: 100, fill: "#F3BA60" }]} startAngle={90} endAngle={90 - (np.daily_calories / 3000) * 360}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false}/>
              <RadialBar background={{ fill: "rgba(246,246,246,0.05)" }} dataKey="value" cornerRadius={10}/>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center -mt-24 mb-12">
          <p className="font-display text-4xl text-[#F3BA60] leading-none">{np.daily_calories}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">kcal / day</p>
        </div>
        <div className="space-y-2 mt-2">
          {macroData.map((d) => (<div key={d.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }}/>
              <span className="text-xs text-foreground flex-1">{d.name}</span>
              <span className="font-mono-ll text-xs text-muted-foreground">{d.value}g · {Math.round((d.kcal / totalMacroKcal) * 100)}%</span>
            </div>))}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2 p-5">
        <h3 className="font-display text-xl text-foreground leading-none">Weekly Meal Plan</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Assigned by {np.assigned_by} · updated {np.last_updated}</p>
        <div className="space-y-2">
          {Object.entries(np.weekly_plan).map(([day, meals]) => {
            const isOpen = openDay === day;
            return (<div key={day} className="rounded-lg border border-border overflow-hidden">
                <button onClick={() => setOpenDay(isOpen ? "" : day)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60">
                  <span className="font-display text-base text-[#F3BA60]">{day}</span>
                  <span className="text-xs text-muted-foreground">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {["breakfast", "lunch", "dinner", "snacks"].map((k) => (<div key={k} className="p-2 rounded-md bg-muted/40">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                            <p className="text-xs text-foreground mt-0.5">{meals[k]}</p>
                          </div>))}
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </div>);
        })}
        </div>
        {np.supplements_prescribed.length > 0 && (<div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Supplements Prescribed</p>
            <div className="flex flex-wrap gap-2">
              {np.supplements_prescribed.map((s, i) => (<span key={i} className="px-2.5 py-1 rounded-full bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-xs text-[#F3BA60]">💊 {s}</span>))}
            </div>
          </div>)}
      </GlassCard>
    </div>);
}
/* ---------------- Progress tab ---------------- */
function ProgressTab({ member }) {
    const m = member;
    const [series, setSeries] = useState("weight");
    const data = series === "weight"
        ? m.progress_tracker.weight_log.map((w) => ({ date: w.date.slice(5), value: w.weight }))
        : m.progress_tracker.body_fat_log.map((w) => ({ date: w.date.slice(5), value: w.value }));
    return (<div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-foreground leading-none">Body Composition</h3>
          <div className="flex gap-1">
            {["weight", "body_fat"].map((s) => (<button key={s} onClick={() => setSeries(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${series === s ? "bg-[#F3BA60]/12 text-[#F3BA60]" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "weight" ? "Weight (kg)" : "Body Fat (%)"}
              </button>))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.05)" vertical={false}/>
              <XAxis dataKey="date" tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={{ stroke: "rgba(246,246,246,0.08)" }} tickLine={false}/>
              <YAxis tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]}/>
              <Tooltip contentStyle={{ background: "rgba(32,32,34,0.95)", border: "1px solid rgba(246,246,246,0.10)", borderRadius: 12, fontSize: 12 }}/>
              <Line type="monotone" dataKey="value" stroke="#F3BA60" strokeWidth={2.5} dot={{ fill: "#F3BA60", r: 3 }} activeDot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["bench_press_1rm", "squat_1rm", "deadlift_1rm"].map((lift) => {
            const log = m.progress_tracker.strength_log[lift];
            const first = log[0]?.value ?? 0;
            const last = log.at(-1)?.value ?? 0;
            const delta = last - first;
            const label = lift.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            return (<NeumorphCard key={lift} className="p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="font-display text-3xl text-foreground mt-1 leading-none">{last}<span className="text-base text-muted-foreground">kg</span></p>
              <p className={`text-xs font-mono-ll mt-1 ${delta >= 0 ? "text-[#f3ba60]" : "text-[#736a6a]"}`}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}kg since start
              </p>
            </NeumorphCard>);
        })}
      </div>

      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none mb-3">Measurements (cm)</h3>
        <div className="grid grid-cols-3 gap-3">
          {["chest_cm", "waist_cm", "bicep_cm"].map((k) => {
            const log = m.progress_tracker.measurements[k];
            const last = log.at(-1)?.value ?? 0;
            const first = log[0]?.value ?? 0;
            const label = k.replace("_cm", "").replace(/\b\w/g, (c) => c.toUpperCase());
            return (<div key={k} className="p-3 rounded-lg bg-muted/60 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="font-display text-2xl text-[#F3BA60] mt-1 leading-none">{last}</p>
                <p className="text-[10px] text-muted-foreground font-mono-ll mt-1">from {first}cm</p>
              </div>);
        })}
        </div>
      </GlassCard>
    </div>);
}
/* ---------------- Attendance tab — GitHub-style heatmap ---------------- */
function AttendanceTab({ member }) {
    const m = member;
    // Build a synthetic year heatmap from monthly_log attendance rates
    const days = useMemo(() => {
        const arr = [];
        const today = BUSINESS_TODAY;
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 7);
            const month = m.attendance.monthly_log[key];
            let level = 0;
            if (month) {
                const rate = month.attended / month.total;
                const rnd = ((d.getDate() * 7) % 10) / 10;
                if (rnd < 0.3)
                    level = 0;
                else if (rnd < rate * 0.5)
                    level = 1;
                else if (rnd < rate * 0.75)
                    level = 2;
                else if (rnd < rate)
                    level = 3;
                else
                    level = 4;
            }
            arr.push({ date: d, level });
        }
        return arr;
    }, [m]);
    const levelColors = ["rgba(246,246,246,0.04)", "#736a6a", "#736a6a", "#f3ba60", "#F3BA60"];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7)
        weeks.push(days.slice(i, i + 7));
    const months = m.attendance.monthly_log;
    const monthEntries = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    return (<div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-foreground leading-none">Attendance Heatmap</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono-ll">
            Less
            {levelColors.map((c, i) => (<span key={i} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }}/>))}
            More
          </div>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-1 min-w-[680px]">
            {weeks.map((week, wi) => (<div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (<div key={di} className="h-3 w-3 rounded-sm" style={{ backgroundColor: levelColors[day.level] }} title={`${day.date.toDateString()} · level ${day.level}`}/>))}
              </div>))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {monthEntries.map(([month, v]) => {
            const pct = Math.round((v.attended / v.total) * 100);
            return (<NeumorphCard key={month} className="p-3">
              <p className="font-mono-ll text-xs text-muted-foreground">{month}</p>
              <p className="font-display text-2xl mt-1 leading-none" style={{ color: progressColor(pct) }}>{pct}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{v.attended}/{v.total} sessions</p>
            </NeumorphCard>);
        })}
      </div>
    </div>);
}
/* ---------------- Fees tab ---------------- */
function FeesTab({ member }) {
    const m = member;
    const f = m.fees;
    const downloadReceipt = (receipt, amount, mode, date) => {
        const doc = new jsPDF();
        doc.setFillColor(10, 10, 15);
        doc.rect(0, 0, 210, 297, "F");
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("LiftLab", 20, 30);
        doc.setTextColor(122, 122, 140);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Train Smart. Track Everything.", 20, 38);
        doc.setDrawColor(0, 212, 255);
        doc.line(20, 44, 190, 44);
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(16);
        doc.text("Payment Receipt", 20, 58);
        doc.setFontSize(11);
        doc.text(`Receipt #: ${receipt}`, 20, 72);
        doc.text(`Member: ${m.name} (${m.id})`, 20, 80);
        doc.text(`Date: ${date}`, 20, 88);
        doc.text(`Mode: ${mode}`, 20, 96);
        doc.line(20, 104, 190, 104);
        doc.setFontSize(22);
        doc.setTextColor(0, 255, 136);
        doc.text(`Rs. ${amount.toLocaleString("en-IN")}`, 20, 120);
        doc.setFontSize(10);
        doc.setTextColor(122, 122, 140);
        doc.text("Payment successful. Thank you.", 20, 130);
        doc.save(`${receipt}.pdf`);
        toast({ title: "Receipt downloaded", description: `${receipt}.pdf` });
    };
    return (<div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Monthly Fee</p>
          <p className="font-display text-2xl text-foreground mt-1 leading-none">₹{f.monthly_fee.toLocaleString("en-IN")}</p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total Paid</p>
          <p className="font-display text-2xl text-[#f3ba60] mt-1 leading-none">₹{f.total_paid.toLocaleString("en-IN")}</p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Outstanding</p>
          <p className="font-display text-2xl text-[#F3BA60] mt-1 leading-none">₹{f.total_due.toLocaleString("en-IN")}</p>
        </NeumorphCard>
        <NeumorphCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Status</p>
          <div className="mt-1.5">
            <StatusBadge status={f.status} pulse={f.status === "Overdue"}>{f.status}</StatusBadge>
          </div>
        </NeumorphCard>
      </div>

      {f.total_due > 0 && (<div className="p-4 rounded-xl bg-[#F3BA60]/8 border border-[#F3BA60]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#F3BA60]"/>
            <div>
              <p className="text-sm text-foreground font-medium">Outstanding balance: ₹{f.total_due.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">Please settle to avoid membership suspension.</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            Add Payment
          </button>
        </div>)}

      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none mb-3">Payment History</h3>
        <div className="space-y-2">
          {[...f.payment_history].reverse().map((p, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#f3ba60]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-[#f3ba60]"/>
                </div>
                <div>
                  <p className="text-sm text-foreground font-mono-ll">{p.receipt}</p>
                  <p className="text-[10px] text-muted-foreground font-mono-ll">{p.date} · {p.mode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg text-[#f3ba60]">₹{p.amount.toLocaleString("en-IN")}</span>
                <button onClick={() => downloadReceipt(p.receipt, p.amount, p.mode, p.date)} className="p-1.5 rounded-md text-muted-foreground hover:text-[#F3BA60] hover:bg-muted" aria-label="Download receipt">
                  <Download className="h-4 w-4"/>
                </button>
              </div>
            </div>))}
        </div>
      </GlassCard>
    </div>);
}
/* ---------------- Medical tab ---------------- */
function MedicalTab({ member }) {
    const m = member;
    const med = m.medical;
    return (<div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="font-display text-xl text-foreground leading-none mb-3">Conditions & Allergies</h3>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Conditions</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {med.conditions.length ? med.conditions.map((c, i) => (<StatusBadge key={i} variant="red">{c}</StatusBadge>)) : <span className="text-xs text-muted-foreground">None reported</span>}
          </div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Allergies</p>
          <div className="flex flex-wrap gap-2">
            {med.allergies.length ? med.allergies.map((a, i) => (<StatusBadge key={i} variant="orange">{a}</StatusBadge>)) : <span className="text-xs text-muted-foreground">None reported</span>}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Training Clearance</p>
            <StatusBadge variant={med.clearance_for_training ? "green" : "red"}>
              {med.clearance_for_training ? "Cleared for training" : "Not cleared"}
            </StatusBadge>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-display text-xl text-foreground leading-none mb-3">Physician</h3>
          <div className="space-y-2.5 text-sm">
            <Vital label="Name" value={med.physician}/>
            <Vital label="Contact" value={med.physician_contact}/>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-foreground leading-relaxed">{med.notes}</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none mb-3">Medical Reports</h3>
        <div className="space-y-2">
          {med.reports.map((r, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[#736a6a]"/>
                <div>
                  <p className="text-sm text-foreground">{r.type}</p>
                  <p className="text-[10px] text-muted-foreground font-mono-ll">{r.date} · {r.file}</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs text-[#F3BA60] hover:underline">
                <Download className="h-3.5 w-3.5"/> View
              </button>
            </div>))}
        </div>
      </GlassCard>
    </div>);
}
/* ---------------- Documents tab ---------------- */
function DocumentsTab({ member }) {
    const m = member;
    return (<GlassCard className="p-5">
      <h3 className="font-display text-xl text-foreground leading-none mb-3">Member Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {m.documents.map((d, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#F3BA60]"/>
              <div>
                <p className="text-sm text-foreground">{d.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono-ll">{d.file}</p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs text-[#F3BA60] hover:underline">
              <Download className="h-3.5 w-3.5"/> Download
            </button>
          </div>))}
      </div>
    </GlassCard>);
}
