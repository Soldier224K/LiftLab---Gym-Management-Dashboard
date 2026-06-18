"use client";
// ============================================================
// NutritionPage — Module 6 of the LiftLab gym dashboard.
// Two sub-views via top toggle:
//   1. Plans Library — grid of member nutrition plans with filters.
//   2. Member Nutrition — calorie gauge, macro tracker, weekly meal
//      plan accordion, today's log entry form, weekly trend chart,
//      prescribed supplement stack with inline pill/capsule SVGs.
// Plus a lightweight "Create Plan" modal (visual 4-step demo).
//
// Data structures (inline notes for review):
//  - `members` is the seed array (Member[]) imported from @/data/members.
//  - `nutrition_plan.weekly_plan` is a Record<string, MealEntry> (hash-map
//    by weekday name). Lookup by day string is O(1).
//  - "Today's logged" calories / macros are deterministic synthetic values
//    derived from the member id (no Math.random) — same input always
//    produces the same gauge fill.
// ============================================================
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Salad, Search, Filter, ChevronDown, Plus, Flame, Beef, Wheat, Droplet, TrendingUp, Utensils, ChevronRight, CalendarDays, X, Check, Pill, ClipboardList, Target, } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, } from "recharts";
import { members, memberById } from "@/data/members";
import { staff } from "@/data/staff";
import { supplementById } from "@/data/supplements";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ll/GlassCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, } from "@/components/ui/accordion";
const CALORIE_RANGES = [
    { id: "All", label: "All Calories" },
    { id: "<2000", label: "< 2000 kcal" },
    { id: "2000-2500", label: "2000 – 2500" },
    { id: "2500-3000", label: "2500 – 3000" },
    { id: ">3000", label: "> 3000 kcal" },
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MACRO_META = [
    { key: "protein_g", label: "Protein", color: "#F3BA60", icon: Beef, kcalPerG: 4 },
    { key: "carbs_g", label: "Carbs", color: "#f3ba60", icon: Wheat, kcalPerG: 4 },
    { key: "fat_g", label: "Fat", color: "#F3BA60", icon: Droplet, kcalPerG: 9 },
];
// Hash map for staff lookup — O(1) by id.
const STAFF_HASH = Object.fromEntries(staff.map((s) => [s.id, s]));
function staffName(id) {
    return STAFF_HASH[id]?.name ?? id;
}
// ---------- Helpers (deterministic — no Math.random) ----------
/** Derive a deterministic 0..1 ratio from a member id — used for synthetic "today's logged" values. */
function ratioFromId(id, salt) {
    let h = salt;
    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) >>> 0;
    }
    // Map to 0.65..0.85 range
    return 0.65 + (h % 100) / 100 * 0.2;
}
/** Derive today's logged calories from the member's daily target (≈ 70%). */
function todaysLoggedCalories(member) {
    const target = member.nutrition_plan.daily_calories;
    if (target <= 0)
        return 0;
    return Math.round(target * ratioFromId(member.id, 7));
}
/** Derive a 7-day calorie trend (deterministic) ending at today. */
function weeklyTrend(member) {
    const target = member.nutrition_plan.daily_calories || 2000;
    const ratios = [0.85, 0.92, 0.78, 1.0, 0.88, 0.95, 0.7];
    return WEEKDAYS.map((d, i) => ({
        day: d.slice(0, 3),
        kcal: Math.round(target * ratios[i]),
    }));
}
/** Derive goal type from a member's first goal string. */
function goalTypeOf(m) {
    const g = (m.goals[0]?.goal ?? "").toLowerCase();
    if (m.medical?.conditions?.length > 0 || m.membership_type === "Medical-Referral")
        return "Medical";
    if (g.includes("lose") || g.includes("fat") || g.includes("cut"))
        return "Weight Loss";
    if (g.includes("gain") || g.includes("muscle") || g.includes("mass") || g.includes("strength") || g.includes("press") || g.includes("squat") || g.includes("deadlift"))
        return "Muscle Gain";
    return "Maintenance";
}
const GOAL_ACCENT = {
    "Weight Loss": "#F3BA60",
    "Muscle Gain": "#F3BA60",
    Maintenance: "#f3ba60",
    Medical: "#736a6a",
};
// ============================================================
// Page
// ============================================================
export function NutritionPage() {
    const [view, setView] = useState("library");
    const [selectedMemberId, setSelectedMemberId] = useState(members.find((m) => m.nutrition_plan.provided)?.id ?? members[0].id);
    const membersWithPlans = useMemo(() => members.filter((m) => m.nutrition_plan.provided), []);
    // KPIs
    const totalPlans = membersWithPlans.length;
    const avgCalories = totalPlans
        ? Math.round(membersWithPlans.reduce((a, m) => a + m.nutrition_plan.daily_calories, 0) /
            totalPlans)
        : 0;
    const avgProtein = totalPlans
        ? Math.round(membersWithPlans.reduce((a, m) => a + m.nutrition_plan.macros.protein_g, 0) / totalPlans)
        : 0;
    const nutritionistCount = useMemo(() => {
        const ids = new Set(membersWithPlans.map((m) => m.nutrition_plan.assigned_by));
        return ids.size;
    }, [membersWithPlans]);
    return (<div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Nutrition Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diet plans · meal tracking · macro coaching —{" "}
            <span className="text-[#F3BA60]">{totalPlans}</span> active plans ·{" "}
            <span className="text-[#f3ba60]">{nutritionistCount}</span> nutritionist
          </p>
        </div>
        {/* View toggle */}
        <div className="inline-flex p-1 rounded-xl bg-muted border border-border self-start">
          <ToggleButton active={view === "library"} onClick={() => setView("library")} icon={ClipboardList} label="Plans Library"/>
          <ToggleButton active={view === "member"} onClick={() => setView("member")} icon={Salad} label="Member Nutrition"/>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="Active Plans" value={totalPlans} sub={`${members.length - totalPlans} members without`} accent="#F3BA60" icon={ClipboardList} delay={0}/>
        <StatKPI label="Avg Daily Calories" value={avgCalories.toLocaleString("en-IN")} sub="kcal across all plans" accent="#F3BA60" icon={Flame} delay={0.05}/>
        <StatKPI label="Avg Protein Target" value={`${avgProtein}g`} sub="Macros assigned per day" accent="#f3ba60" icon={Beef} delay={0.1}/>
        <StatKPI label="Nutritionists" value={nutritionistCount} sub="Authoring plans" accent="#736a6a" icon={Target} delay={0.15}/>
      </div>

      <AnimatePresence mode="wait">
        {view === "library" ? (<motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <PlansLibrary onSelect={(id) => {
                setSelectedMemberId(id);
                setView("member");
            }}/>
          </motion.div>) : (<motion.div key="member" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <MemberNutrition selectedId={selectedMemberId} onSelect={setSelectedMemberId}/>
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
// ---------- Toggle button ----------
function ToggleButton({ active, onClick, icon: Icon, label, }) {
    return (<button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5"/>
      {label}
    </button>);
}
// ============================================================
// Plans Library — filterable grid of member nutrition plans.
// ============================================================
function PlansLibrary({ onSelect }) {
    const [query, setQuery] = useState("");
    const [nutriFilter, setNutriFilter] = useState("all");
    const [goalFilter, setGoalFilter] = useState("All");
    const [calorieFilter, setCalorieFilter] = useState("All");
    const plans = useMemo(() => members.filter((m) => m.nutrition_plan.provided), []);
    const nutritionists = useMemo(() => {
        const ids = Array.from(new Set(plans.map((p) => p.nutrition_plan.assigned_by)));
        return ids.map((id) => ({ id, name: staffName(id) }));
    }, [plans]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return plans.filter((m) => {
            const np = m.nutrition_plan;
            const matchesQuery = !q ||
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                staffName(np.assigned_by).toLowerCase().includes(q);
            const matchesNutri = nutriFilter === "all" || np.assigned_by === nutriFilter;
            const matchesGoal = goalFilter === "All" || goalTypeOf(m) === goalFilter;
            const cals = np.daily_calories;
            const matchesCalorie = calorieFilter === "All" ||
                (calorieFilter === "<2000" && cals < 2000) ||
                (calorieFilter === "2000-2500" && cals >= 2000 && cals <= 2500) ||
                (calorieFilter === "2500-3000" && cals > 2500 && cals <= 3000) ||
                (calorieFilter === ">3000" && cals > 3000);
            return matchesQuery && matchesNutri && matchesGoal && matchesCalorie;
        });
    }, [plans, query, nutriFilter, goalFilter, calorieFilter]);
    return (<div className="space-y-4">
      {/* Filter bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border flex-1 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by member, ID or nutritionist…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"/>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={nutriFilter} onValueChange={setNutriFilter}>
              <SelectTrigger className="bg-muted border-border text-foreground text-xs h-9 w-[180px]">
                <SelectValue placeholder="Nutritionist"/>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="all">All Nutritionists</SelectItem>
                {nutritionists.map((n) => (<SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={goalFilter} onValueChange={(v) => setGoalFilter(v)}>
              <SelectTrigger className="bg-muted border-border text-foreground text-xs h-9 w-[160px]">
                <SelectValue placeholder="Goal"/>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="All">All Goals</SelectItem>
                <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={calorieFilter} onValueChange={(v) => setCalorieFilter(v)}>
              <SelectTrigger className="bg-muted border-border text-foreground text-xs h-9 w-[160px]">
                <SelectValue placeholder="Calories"/>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {CALORIE_RANGES.map((r) => (<SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {(nutriFilter !== "all" || goalFilter !== "All" || calorieFilter !== "All" || query) && (<div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3"/> Active
            </span>
            {query && (<Chip onClear={() => setQuery("")}>"{query}"</Chip>)}
            {nutriFilter !== "all" && (<Chip onClear={() => setNutriFilter("all")}>
                {staffName(nutriFilter)}
              </Chip>)}
            {goalFilter !== "All" && (<Chip onClear={() => setGoalFilter("All")}>{goalFilter}</Chip>)}
            {calorieFilter !== "All" && (<Chip onClear={() => setCalorieFilter("All")}>
                {CALORIE_RANGES.find((r) => r.id === calorieFilter)?.label}
              </Chip>)}
          </div>)}
      </GlassCard>

      {/* Result count */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
          of {plans.length} plans
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m, i) => (<motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}>
            <PlanCard member={m} onView={() => onSelect(m.id)}/>
          </motion.div>))}
      </div>

      {filtered.length === 0 && (<div className="py-16 text-center text-sm text-muted-foreground">
          No nutrition plans match your filters.
        </div>)}
    </div>);
}
function Chip({ children, onClear, }) {
    return (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[11px] text-[#F3BA60]">
      {children}
      <button onClick={onClear} className="hover:text-foreground" aria-label="Clear filter">
        <X className="h-3 w-3"/>
      </button>
    </span>);
}
function PlanCard({ member: m, onView }) {
    const np = m.nutrition_plan;
    const goalType = goalTypeOf(m);
    const accent = GOAL_ACCENT[goalType];
    const totalMacroKcal = np.macros.protein_g * 4 + np.macros.carbs_g * 4 + np.macros.fat_g * 9;
    return (<ClayCard className="p-5 group">
      <div className="flex items-start gap-3">
        <img src={m.photo} alt={m.name} loading="lazy" className="h-14 w-14 rounded-2xl object-cover border-2" style={{ borderColor: `${accent}55` }}/>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl text-foreground leading-none truncate">
            {m.name}
          </h3>
          <p className="font-mono-ll text-[11px] text-[#F3BA60] mt-0.5">{m.id}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <StatusBadge variant="grey">{goalType}</StatusBadge>
            <StatusBadge variant="blue">{m.membership_type}</StatusBadge>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-muted/60 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Daily Calories
          </p>
          <p className="font-display text-2xl text-[#F3BA60] mt-0.5 leading-none">
            {np.daily_calories.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono-ll mt-0.5">kcal target</p>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/60 border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Assigned By
          </p>
          <p className="text-sm text-foreground mt-0.5 truncate">{staffName(np.assigned_by)}</p>
          <p className="text-[10px] text-muted-foreground font-mono-ll mt-0.5">
            upd {np.last_updated}
          </p>
        </div>
      </div>

      {/* Macro split mini-bars */}
      <div className="mt-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Macro Split
        </p>
        {MACRO_META.map((meta) => {
            const v = np.macros[meta.key];
            const pct = totalMacroKcal > 0 ? Math.round(((v * meta.kcalPerG) / totalMacroKcal) * 100) : 0;
            return (<div key={meta.key} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-12">{meta.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="h-full rounded-full" style={{ backgroundColor: meta.color }}/>
              </div>
              <span className="text-[10px] font-mono-ll text-foreground w-14 text-right">
                {v}g · {pct}%
              </span>
            </div>);
        })}
      </div>

      <button onClick={onView} className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-xs font-medium text-foreground hover:bg-[#F3BA60]/12 hover:border-[#F3BA60]/30 hover:text-[#F3BA60] transition-colors">
        View Member Nutrition
        <ChevronRight className="h-3.5 w-3.5"/>
      </button>
    </ClayCard>);
}
// ============================================================
// Member Nutrition — detailed view for one member.
// ============================================================
function MemberNutrition({ selectedId, onSelect, }) {
    const member = memberById(selectedId) ?? members.find((m) => m.nutrition_plan.provided);
    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [search, setSearch] = useState("");
    // Member picker dropdown
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerResults = useMemo(() => {
        const q = search.trim().toLowerCase();
        return members
            .filter((m) => !q ||
            m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q))
            .slice(0, 30);
    }, [search]);
    return (<div className="space-y-4">
      {/* Top: member picker + actions */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={member.photo} alt={member.name} loading="lazy" className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"/>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Viewing Plan For
              </p>
              <div className="relative">
                <button onClick={() => setPickerOpen((v) => !v)} className="flex items-center gap-2 text-foreground font-display text-2xl leading-none hover:text-[#F3BA60] transition-colors">
                  {member.name}
                  <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                </button>
                <AnimatePresence>
                  {pickerOpen && (<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute top-full left-0 mt-2 w-80 max-w-[90vw] z-30">
                      <GlassCard strong className="p-3">
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted border border-border mb-2">
                          <Search className="h-3.5 w-3.5 text-muted-foreground"/>
                          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"/>
                        </div>
                        <div className="max-h-64 overflow-y-auto ll-scroll space-y-0.5">
                          {pickerResults.map((m) => (<button key={m.id} onClick={() => {
                    onSelect(m.id);
                    setPickerOpen(false);
                    setSearch("");
                }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${m.id === member.id
                    ? "bg-[#F3BA60]/12 text-[#F3BA60]"
                    : "hover:bg-muted text-foreground"}`}>
                              <img src={m.photo} alt="" className="h-7 w-7 rounded-md object-cover"/>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs truncate">{m.name}</p>
                                <p className="font-mono-ll text-[10px] text-muted-foreground">
                                  {m.id}
                                </p>
                              </div>
                              {m.nutrition_plan.provided ? (<Check className="h-3.5 w-3.5 text-[#f3ba60]"/>) : (<span className="text-[9px] text-muted-foreground">no plan</span>)}
                            </button>))}
                          {pickerResults.length === 0 && (<p className="text-xs text-muted-foreground py-3 text-center">
                              No members match.
                            </p>)}
                        </div>
                      </GlassCard>
                    </motion.div>)}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <button onClick={() => setShowCreatePlan(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-3.5 w-3.5"/>
            Create Plan
          </button>
        </div>
      </GlassCard>

      {member.nutrition_plan.provided ? (<MemberNutritionDetail member={member}/>) : (<GlassCard className="p-10 text-center">
          <Salad className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
          <p className="text-sm text-foreground font-medium">
            No nutrition plan assigned yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Use <span className="text-[#F3BA60]">Create Plan</span> to design a meal & macro plan for {member.name}.
          </p>
        </GlassCard>)}

      <CreatePlanDialog open={showCreatePlan} onOpenChange={setShowCreatePlan} memberName={member.name}/>
    </div>);
}
function MemberNutritionDetail({ member }) {
    const np = member.nutrition_plan;
    const [logEntries, setLogEntries] = useState([]);
    // Today's logged values — deterministic synthetic baseline.
    const baseLogged = todaysLoggedCalories(member);
    const extraLogged = logEntries.reduce((a, e) => a + e.kcal, 0);
    const loggedCalories = baseLogged + extraLogged;
    const targetCalories = np.daily_calories;
    const caloriePct = Math.min(Math.round((loggedCalories / targetCalories) * 100), 100);
    // Macro logged — derived as target * deterministic ratio per macro.
    const macroLogged = {
        protein_g: Math.round(np.macros.protein_g * ratioFromId(member.id, 11)),
        carbs_g: Math.round(np.macros.carbs_g * ratioFromId(member.id, 13)),
        fat_g: Math.round(np.macros.fat_g * ratioFromId(member.id, 17)),
    };
    // Log entry form state
    const [mealType, setMealType] = useState("Breakfast");
    const [foodName, setFoodName] = useState("");
    const [foodKcal, setFoodKcal] = useState("");
    const handleLog = () => {
        if (!foodName.trim() || foodKcal === "" || foodKcal <= 0) {
            toast({
                title: "Missing fields",
                description: "Food name & calories are required.",
            });
            return;
        }
        const entry = {
            id: `log-${Date.now()}`,
            meal: mealType,
            food: foodName.trim(),
            kcal: Math.round(foodKcal),
            time: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        setLogEntries((prev) => [entry, ...prev]);
        setFoodName("");
        setFoodKcal("");
        toast({
            title: "Logged entry",
            description: `${entry.food} · ${entry.kcal} kcal · ${entry.meal}`,
        });
    };
    // Weekly trend chart data
    const trendData = useMemo(() => weeklyTrend(member), [member]);
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column: calorie gauge + macros */}
      <div className="lg:col-span-1 space-y-4">
        <CalorieGauge target={targetCalories} logged={loggedCalories} pct={caloriePct} memberName={member.name}/>
        <MacroTracker target={np.macros} logged={macroLogged}/>
        <SupplementStack supplements_ids={np.supplements_prescribed}/>
      </div>

      {/* Right column: meal plan + log form + trend */}
      <div className="lg:col-span-2 space-y-4">
        {/* Today's log entry form */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#F3BA60]/15 border border-[#F3BA60]/30 flex items-center justify-center">
              <Plus className="h-4 w-4 text-[#F3BA60]"/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-none">
                Log a Meal
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Add to today's intake — gauge updates live
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[10px] text-muted-foreground">Meal</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="bg-muted border-border text-foreground text-xs h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6 space-y-1">
              <Label className="text-[10px] text-muted-foreground">Food / Dish</Label>
              <input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Paneer tikka wrap" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px] text-muted-foreground">Calories</Label>
              <input type="number" min={0} value={foodKcal} onChange={(e) => setFoodKcal(e.target.value === "" ? "" : parseInt(e.target.value, 10))} placeholder="0" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-xs font-mono-ll text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50"/>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button onClick={handleLog} className="w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center" aria-label="Add log entry">
                <Plus className="h-4 w-4"/>
              </button>
            </div>
          </div>

          {/* Logged entries */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Today&apos;s Log
              </p>
              <span className="font-mono-ll text-[10px] text-muted-foreground">
                {logEntries.length} manual + {1} baseline
              </span>
            </div>
            {logEntries.length === 0 ? (<p className="text-xs text-muted-foreground py-2">
                No manual entries yet — baseline today is{" "}
                <span className="font-mono-ll text-[#F3BA60]">{baseLogged} kcal</span>.
              </p>) : (<div className="space-y-1 max-h-44 overflow-y-auto ll-scroll">
                {logEntries.map((e) => (<div key={e.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/60 border border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusBadge variant="blue">{e.meal}</StatusBadge>
                      <span className="text-xs text-foreground truncate">{e.food}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-ll text-xs text-[#F3BA60]">
                        +{e.kcal} kcal
                      </span>
                      <span className="font-mono-ll text-[10px] text-muted-foreground">
                        {e.time}
                      </span>
                      <button onClick={() => setLogEntries((prev) => prev.filter((p) => p.id !== e.id))} className="text-muted-foreground hover:text-[#736a6a]" aria-label="Remove entry">
                        <X className="h-3 w-3"/>
                      </button>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </GlassCard>

        {/* 7-day meal plan accordion */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-[#F3BA60]"/>
            <h3 className="font-display text-xl text-foreground leading-none">
              7-Day Meal Plan
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-ll ml-auto">
              upd {np.last_updated}
            </span>
          </div>
          <Accordion type="single" collapsible defaultValue="Monday">
            {WEEKDAYS.map((day) => {
            const meals = np.weekly_plan[day];
            if (!meals)
                return null;
            return (<AccordionItem key={day} value={day} className="border-border rounded-lg overflow-hidden mb-1.5 data-[state=open]:bg-muted/60">
                  <AccordionTrigger className="px-3 hover:no-underline hover:bg-muted/40 rounded-lg">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-base text-[#F3BA60]">
                        {day}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono-ll">
                        {meals.breakfast.slice(0, 28)}…
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {["breakfast", "lunch", "dinner", "snacks"].map((k) => (<div key={k} className="p-2.5 rounded-md bg-muted/40 border border-border">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {k}
                          </p>
                          <p className="text-xs text-foreground mt-0.5">{meals[k]}</p>
                        </div>))}
                    </div>
                  </AccordionContent>
                </AccordionItem>);
        })}
          </Accordion>
        </GlassCard>

        {/* Weekly calorie trend */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#f3ba60]"/>
              <h3 className="font-display text-xl text-foreground leading-none">
                Weekly Calorie Trend
              </h3>
            </div>
            <StatusBadge variant="green">
              Target {targetCalories.toLocaleString("en-IN")} kcal
            </StatusBadge>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.05)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={{ stroke: "rgba(246,246,246,0.08)" }} tickLine={false}/>
                <YAxis tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]}/>
                <Tooltip contentStyle={{
            background: "rgba(32,32,34,0.95)",
            border: "1px solid rgba(246,246,246,0.10)",
            borderRadius: 12,
            fontSize: 12,
        }} formatter={(v) => [`${v} kcal`, "Consumed"]}/>
                <Line type="monotone" dataKey="kcal" stroke="#F3BA60" strokeWidth={2.5} dot={{ fill: "#F3BA60", r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>);
}
// ---------- Calorie Gauge (RadialBarChart) ----------
function CalorieGauge({ target, logged, pct, memberName, }) {
    const remaining = Math.max(target - logged, 0);
    const over = logged > target;
    const accent = over ? "#736a6a" : pct >= 85 ? "#f3ba60" : "#F3BA60";
    return (<GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="h-4 w-4 text-[#F3BA60]"/>
        <h3 className="font-display text-xl text-foreground leading-none">
          Today&apos;s Calories
        </h3>
      </div>
      <div className="relative h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "cal", value: pct, fill: accent }]} startAngle={90} endAngle={90 - (pct / 100) * 360}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false}/>
            <RadialBar background={{ fill: "rgba(246,246,246,0.05)" }} dataKey="value" cornerRadius={10}/>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-display text-4xl leading-none" style={{ color: accent }}>
            {logged.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            of {target.toLocaleString("en-IN")} kcal
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{memberName}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Logged</p>
          <p className="font-display text-lg text-foreground mt-0.5 leading-none">
            {logged.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
          <p className="font-display text-lg mt-0.5 leading-none" style={{ color: accent }}>
            {remaining.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">% Goal</p>
          <p className="font-display text-lg text-foreground mt-0.5 leading-none">{pct}%</p>
        </div>
      </div>
    </GlassCard>);
}
// ---------- Macro Tracker (3 horizontal progress bars) ----------
function MacroTracker({ target, logged, }) {
    return (<GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Beef className="h-4 w-4 text-[#F3BA60]"/>
        <h3 className="font-display text-xl text-foreground leading-none">
          Macro Tracker
        </h3>
      </div>
      <div className="space-y-3">
        {MACRO_META.map((meta) => {
            const t = target[meta.key];
            const l = logged[meta.key];
            const pct = Math.min(Math.round((l / t) * 100), 100);
            const Icon = meta.icon;
            return (<div key={meta.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Icon className="h-3 w-3" style={{ color: meta.color }}/>
                  {meta.label}
                </span>
                <span className="font-mono-ll text-[11px] text-muted-foreground">
                  <span style={{ color: meta.color }}>{l}g</span> / {t}g · {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: meta.color }}/>
              </div>
            </div>);
        })}
      </div>
    </GlassCard>);
}
// ---------- Supplement Stack (with inline pill/capsule SVGs) ----------
function SupplementStack({ supplements_ids }) {
    return (<GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="h-4 w-4 text-[#f3ba60]"/>
        <h3 className="font-display text-xl text-foreground leading-none">
          Supplement Stack
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono-ll ml-auto">
          {supplements_ids.length} prescribed
        </span>
      </div>
      {supplements_ids.length === 0 ? (<p className="text-xs text-muted-foreground py-2">No supplements prescribed.</p>) : (<div className="space-y-2">
          {supplements_ids.map((id) => {
                const s = supplementById(id);
                if (!s)
                    return null;
                // Choose icon shape based on category.
                const isCapsule = s.category === "Vitamins" || s.category === "Fat Burner";
                return (<div key={id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/60 border border-border hover:border-[#f3ba60]/30 transition-colors">
                {isCapsule ? <CapsuleSVG /> : <BottleSVG />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {s.brand} · {s.category}
                  </p>
                </div>
                <span className="font-mono-ll text-[10px] text-[#f3ba60]">
                  {id}
                </span>
              </div>);
            })}
        </div>)}
    </GlassCard>);
}
// Inline SVG: pill bottle (orange/blue)
function BottleSVG() {
    return (<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="10" y="3" width="12" height="4" rx="1" fill="#F3BA60"/>
      <path d="M9 8h14a2 2 0 0 1 2 2v15a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V10a2 2 0 0 1 2-2z" fill="var(--card)" stroke="#F3BA60" strokeWidth="1.5"/>
      <rect x="9" y="14" width="14" height="6" rx="1" fill="#F3BA60" opacity="0.25"/>
      <rect x="11" y="16" width="10" height="2" rx="0.5" fill="#F3BA60"/>
    </svg>);
}
// Inline SVG: capsule (blue/green)
function CapsuleSVG() {
    return (<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <g transform="rotate(45 16 16)">
        <rect x="9" y="6" width="14" height="20" rx="7" fill="#F3BA60"/>
        <rect x="9" y="6" width="14" height="10" rx="7" fill="#f3ba60"/>
        <rect x="9" y="6" width="14" height="20" rx="7" fill="none" stroke="rgba(246,246,246,0.15)" strokeWidth="1"/>
      </g>
    </svg>);
}
// ============================================================
// Create Plan Dialog — lightweight 4-step visual demo.
// ============================================================
function CreatePlanDialog({ open, onOpenChange, memberName, }) {
    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState("Muscle Gain");
    const [budget, setBudget] = useState(2500);
    const [split, setSplit] = useState("High-Protein");
    const [day, setDay] = useState("Monday");
    const steps = ["Goal", "Calorie Budget", "Macro Split", "Meal Builder"];
    const reset = () => {
        setStep(0);
        setGoal("Muscle Gain");
        setBudget(2500);
        setSplit("High-Protein");
        setDay("Monday");
    };
    const close = (v) => {
        onOpenChange(v);
        if (!v) {
            // small delay so the modal exit animation isn't interrupted visually
            setTimeout(reset, 200);
        }
    };
    const finish = () => {
        toast({
            title: "Plan created (demo)",
            description: `${goal} · ${budget} kcal · ${split} · starting ${day} — for ${memberName}`,
        });
        close(false);
    };
    return (<Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[92vh] overflow-y-auto ll-scroll">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground leading-none">
            Create Nutrition Plan
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Demo workflow · for <span className="text-[#F3BA60]">{memberName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1.5 my-2">
          {steps.map((s, i) => (<div key={s} className="flex-1 flex items-center gap-1.5">
              <button onClick={() => setStep(i)} className={`flex-1 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider transition-all ${i === step
                ? "bg-[#F3BA60]/15 text-[#F3BA60] border border-[#F3BA60]/30"
                : i < step
                    ? "bg-[#f3ba60]/10 text-[#f3ba60] border border-[#f3ba60]/20"
                    : "bg-muted text-muted-foreground border border-border"}`}>
                {i + 1}. {s}
              </button>
            </div>))}
        </div>

        {/* Step content */}
        <div className="min-h-32 py-2">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              {step === 0 && (<div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Primary Goal
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Weight Loss", "Muscle Gain", "Maintenance", "Medical"].map((g) => (<button key={g} onClick={() => setGoal(g)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${goal === g
                    ? "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`} style={goal === g
                    ? { borderColor: `${GOAL_ACCENT[g]}55`, color: GOAL_ACCENT[g] }
                    : undefined}>
                          <span className="h-2 w-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: GOAL_ACCENT[g] }}/>
                          {g}
                        </button>))}
                  </div>
                </div>)}

              {step === 1 && (<div className="space-y-3">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Daily Calorie Budget
                  </Label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={1200} max={4500} step={50} value={budget} onChange={(e) => setBudget(parseInt(e.target.value, 10))} className="flex-1 accent-[#F3BA60]"/>
                    <span className="font-display text-3xl text-[#F3BA60] leading-none w-24 text-right">
                      {budget}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono-ll">
                    <span>1200 kcal</span>
                    <span>Deficit / Surplus calculated from BMR</span>
                    <span>4500 kcal</span>
                  </div>
                </div>)}

              {step === 2 && (<div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Macro Split Preset
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                {
                    id: "Balanced",
                    label: "Balanced (40/30/30)",
                    desc: "Carbs 40% · Protein 30% · Fat 30%",
                },
                {
                    id: "High-Protein",
                    label: "High-Protein (35/40/25)",
                    desc: "Carbs 35% · Protein 40% · Fat 25%",
                },
                {
                    id: "Low-Carb",
                    label: "Low-Carb (20/45/35)",
                    desc: "Carbs 20% · Protein 45% · Fat 35%",
                },
            ].map((p) => (<button key={p.id} onClick={() => setSplit(p.id)} className={`px-3 py-2.5 rounded-lg text-left border transition-colors ${split === p.id
                    ? "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30"
                    : "bg-muted/40 text-foreground border-border hover:bg-muted"}`}>
                        <p className="text-xs font-medium">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                      </button>))}
                  </div>
                </div>)}

              {step === 3 && (<div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Meal Builder · starting day
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => (<button key={d} onClick={() => setDay(d)} className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${day === d
                    ? "bg-[#F3BA60]/12 text-[#F3BA60] border-[#F3BA60]/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                        {d.slice(0, 3)}
                      </button>))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["breakfast", "lunch", "dinner", "snacks"].map((k) => (<div key={k} className="p-2.5 rounded-lg bg-muted/60 border border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {k}
                        </p>
                        <div className="mt-1 h-7 rounded-md bg-muted border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          <Utensils className="h-3 w-3 mr-1"/> Add dish
                        </div>
                      </div>))}
                  </div>
                </div>)}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="mt-3">
          <button onClick={() => close(false)} className="px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          {step > 0 && (<button onClick={() => setStep((s) => s - 1)} className="px-3 py-2 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted">
              Back
            </button>)}
          {step < 3 ? (<button onClick={() => setStep((s) => s + 1)} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
              Next
            </button>) : (<button onClick={finish} className="px-3 py-2 rounded-lg bg-[#f3ba60] text-black text-xs font-semibold hover:bg-[#f3ba60]/90">
              Create Plan
            </button>)}
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
