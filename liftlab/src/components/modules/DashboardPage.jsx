"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, Dumbbell, TrendingUp, AlertCircle, UserCheck, Activity, ArrowRight, } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, } from "recharts";
import { StatKPI } from "@/components/ll/StatKPI";
import { GlassCard } from "@/components/ll/GlassCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { useNav } from "@/store/navStore";
import { members } from "@/data/members";
import { staff } from "@/data/staff";
import { machines } from "@/data/machines";
import { getTodayClasses } from "@/data/classes";
import { getMemberProgress, sortByProgressDesc, progressColor, } from "@/utils/progressSorter";
import { GYM_ZONES, occupancyPct, occupancyColor, balanceStatus, } from "@/utils/spaceBalancer";
import { useSensorQueue } from "@/hooks/useSensorQueue";
import { useMaintenanceAlert } from "@/hooks/useMaintenanceAlert";
import { membershipStatus, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { inr, num } from "@/utils/format";
import { ZoneFloorPlan } from "./ZoneFloorPlan";
export function DashboardPage() {
    const { openMember, set: setNav } = useNav();
    const { readings } = useSensorQueue(3000, 12);
    const { hasAlerts: machineAlerts, overdueCount, dueSoonCount } = useMaintenanceAlert(machines);
    const activeMembers = members.filter((m) => membershipStatus(m.membership_expiry, m.fees.status === "Paid") === "Active").length;
    const todayClasses = useMemo(() => getTodayClasses(), []);
    const operationalMachines = machines.filter((m) => m.status === "Operational").length;
    const revenue = members.reduce((acc, m) => acc + m.fees.total_paid, 0);
    const pendingFees = members.reduce((acc, m) => acc + m.fees.total_due, 0);
    const todayStr = BUSINESS_TODAY.toISOString().slice(0, 10);
    const staffOnDuty = staff.filter((s) => s.attendance_log.some((a) => a.date === todayStr)).length || Math.round(staff.length * 0.64);
    const progressRanked = useMemo(() => {
        const withProgress = members.map((m) => ({
            id: m.id,
            name: m.name,
            progress: getMemberProgress(m),
        }));
        return sortByProgressDesc(withProgress).slice(0, 10);
    }, []);
    const floorStatus = balanceStatus(GYM_ZONES);
    const ZONE_COLORS = {
        1: "#736A6A",
        2: "#F3BA60",
        3: "#f3ba60",
        4: "#F3BA60",
        5: "#736a6a",
    };
    const ZONE_NAMES = ["", "Recovery", "Fat Burn", "Aerobic", "Threshold", "VO2 Max"];
    return (<div className="space-y-6">
      {/* Hero banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-2xl border border-border" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(32,32,34,0.62), var(--background)), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: 220,
        }}>
        <div className="absolute inset-0 grid-bg opacity-40"/>
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <StatusBadge variant="green" pulse>
              LIVE
            </StatusBadge>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mt-3 leading-none">
              Train Smart. <span className="text-gradient-blue">Track Everything.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Real-time floor intelligence, member progress & maintenance signals — all in one command center.
            </p>
          </div>
          <div className="flex gap-6 md:gap-8">
            <div>
              <p className="font-display text-3xl md:text-4xl font-semibold text-[#f3ba60] leading-none">
                {floorStatus}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                Floor Status
              </p>
            </div>
            <div>
              <p className="font-mono-ll text-3xl md:text-4xl font-semibold tabular-nums text-[#F3BA60] leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                {num(activeMembers)}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                Active Members
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI row — Neumorphic */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatKPI label="Active Members" value={num(activeMembers)} sub="of 247 total" icon={Users} cardColor="#E0DBF3" delay={0.02}/>
        <StatKPI label="Classes Today" value={num(todayClasses.length)} sub="across 4 studios" icon={CalendarDays} cardColor="#F3BA60" delay={0.06}/>
        <StatKPI label="Machines Op." value={`${num(operationalMachines)}/${num(machines.length)}`} sub={`${overdueCount} overdue · ${dueSoonCount} due soon`} icon={Dumbbell} cardColor="#B6B1C0" delay={0.10}/>
        <StatKPI label="Revenue (MTD)" value={inr(revenue)} sub="collected" icon={TrendingUp} cardColor="#736A6A" delay={0.14}/>
        <StatKPI label="Pending Fees" value={inr(pendingFees)} sub="across members" icon={AlertCircle} cardColor="#E0DBF3" delay={0.18}/>
        <StatKPI label="Staff On Duty" value={`${num(staffOnDuty)}/${num(staff.length)}`} sub="today" icon={UserCheck} cardColor="#F3BA60" delay={0.22}/>
      </div>

      {/* Progress sorter + sensor queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display text-xl text-foreground leading-none">Progress Sorter</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Top 10 members by goal completion % · QuickSort O(n log n)
              </p>
            </div>
            <button onClick={() => setNav("members")} className="text-xs text-[#F3BA60] hover:underline flex items-center gap-1">
              All members <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressRanked} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.05)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill: "#736A6A", fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0]} axisLine={{ stroke: "rgba(246,246,246,0.08)" }} tickLine={false}/>
                <YAxis domain={[0, 100]} tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{ fill: "rgba(243,186,96,0.06)" }} contentStyle={{ background: "rgba(32,32,34,0.95)", border: "1px solid rgba(246,246,246,0.10)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#202022" }} formatter={(v) => [`${v}%`, "Progress"]}/>
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} cursor="pointer">
                  {progressRanked.map((entry, i) => (<Cell key={i} fill={progressColor(entry.progress)}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-mono-ll">
            <span>● click a bar to open the member profile</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: progressColor(100) }}/> 100%
              <span className="h-2 w-2 rounded-sm" style={{ background: progressColor(0) }}/> 0%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-xl text-foreground leading-none">Sensor Queue</h3>
              <p className="text-xs text-muted-foreground mt-1">FIFO · live wearable feed</p>
            </div>
            <Activity className="h-5 w-5 text-[#f3ba60] pulse-dot"/>
          </div>
          <div className="flex-1 max-h-72 overflow-y-auto ll-scroll space-y-1.5 pr-1">
            {readings.length === 0 && (<p className="text-xs text-muted-foreground text-center py-8">Waiting for sensor data…</p>)}
            {readings.map((r) => {
            const z = ZONE_COLORS[r.zone];
            const zoneName = ZONE_NAMES[r.zone];
            return (<motion.div key={r.id} initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} transition={{ duration: 0.25 }} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/60 border border-border text-[11px] font-mono-ll" style={{ borderLeft: `2px solid ${z}` }}>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(r.timestamp).toLocaleTimeString("en-IN", { hour12: false })}
                  </span>
                  <span className="text-[#F3BA60] shrink-0">{r.sensor_id}</span>
                  <span className="text-foreground">{r.heart_rate}bpm</span>
                  <span className="text-muted-foreground hidden sm:inline">{r.calories}kcal</span>
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase" style={{ color: z, backgroundColor: `${z}1a` }}>
                    {zoneName}
                  </span>
                </motion.div>);
        })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono-ll">
            {readings.length}/12 entries · dequeues oldest at capacity
          </p>
        </GlassCard>
      </div>

      {/* Class Schedule Hub preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-xl text-foreground leading-none">Today&apos;s Classes</h3>
            <p className="text-xs text-muted-foreground mt-1">Class Schedule Hub · tap to manage</p>
          </div>
          <button onClick={() => setNav("schedule")} className="text-xs text-[#F3BA60] hover:underline flex items-center gap-1">
            Full schedule <ArrowRight className="h-3 w-3"/>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
          {todayClasses.length === 0 && (<ClayCard className="min-w-[260px] opacity-60">
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            </ClayCard>)}
          {todayClasses.map((c, i) => {
            const full = c.enrolled >= c.capacity;
            const ratio = c.enrolled / c.capacity;
            const status = full ? "Full" : ratio > 0.5 ? "In Progress" : "Open";
            return (<motion.div key={c.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ClayCard className="min-w-[260px] cursor-pointer hover:-translate-y-1 transition-transform">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-mono-ll px-2 py-0.5 rounded-full" style={{ color: c.color, backgroundColor: `${c.color}1a` }}>
                      {c.type.toUpperCase()}
                    </span>
                    <StatusBadge status={status} pulse={status === "In Progress"}>
                      {status}
                    </StatusBadge>
                  </div>
                  <h4 className="text-foreground font-semibold text-base leading-tight">{c.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{c.room} · {c.level}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-mono-ll text-sm text-[#F3BA60]">{c.time_start}–{c.time_end}</span>
                    <span className="text-xs text-muted-foreground">{c.enrolled}/{c.capacity}</span>
                  </div>
                </ClayCard>
              </motion.div>);
        })}
        </div>
      </div>

      {/* Gym Space Balancer */}
      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-display text-xl text-foreground leading-none">Gym Space Balancer</h3>
            <p className="text-xs text-muted-foreground mt-1">Live zone occupancy · SVG floor plan</p>
          </div>
          <StatusBadge status={floorStatus} pulse={floorStatus === "Critical"}>
            Floor: {floorStatus}
          </StatusBadge>
        </div>
        <ZoneFloorPlan />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {GYM_ZONES.map((z) => {
            const pct = occupancyPct(z);
            const col = occupancyColor(pct);
            return (<NeumorphCard key={z.id} className="p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">{z.name}</p>
                <p className="font-display text-2xl mt-1 leading-none" style={{ color: col }}>
                  {z.current}<span className="text-muted-foreground text-base">/{z.capacity}</span>
                </p>
                <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }}/>
                </div>
              </NeumorphCard>);
        })}
        </div>
      </GlassCard>
    </div>);
}
