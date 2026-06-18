"use client";
// ============================================================
// ReportsPage — Module 9 of the LiftLab gym dashboard.
// 5 report cards → A4-style preview Dialog → dark LiftLab-themed
// PDF export (jsPDF). Deterministic synthetic data where needed.
// ============================================================
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, TrendingUp, IndianRupee, Users, Wrench, Activity, Download, X, Target, CircleDot, } from "lucide-react";
import { jsPDF } from "jspdf";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, } from "recharts";
import { Dialog, DialogContent, DialogPortal, DialogOverlay, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { members, memberById } from "@/data/members";
import { staff } from "@/data/staff";
import { machines } from "@/data/machines";
import { classes } from "@/data/classes";
import { useMaintenanceAlert } from "@/hooks/useMaintenanceAlert";
import { calcAge, daysUntil, machineServiceStatus, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ll/GlassCard";
import { ClayCard } from "@/components/ll/ClayCard";
const money = (n) => "₹" + n.toLocaleString("en-IN");
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Deterministic maintenance cost per maintenance-log type (no Math.random).
const MAINT_COST_BY_TYPE = {
    Routine: 1500,
    Quarterly: 3500,
    "Half-Yearly": 6000,
    Annual: 12000,
    Repair: 8000,
    Inspection: 1000,
};
const maintCost = (type) => MAINT_COST_BY_TYPE[type] ?? 2000;
const REPORT_CARDS = [
    {
        key: "member-progress",
        title: "Member Progress Report",
        description: "Individual member progress — weight log, goals, attendance, current 1RMs.",
        icon: TrendingUp,
        accent: "#F3BA60",
    },
    {
        key: "monthly-revenue",
        title: "Monthly Revenue Report",
        description: "Revenue KPIs, 12-month trend, top paying members.",
        icon: IndianRupee,
        accent: "#f3ba60",
    },
    {
        key: "staff-attendance",
        title: "Staff Attendance Summary",
        description: "Hours logged this month, late arrivals, on-duty rate per staff.",
        icon: Users,
        accent: "#F3BA60",
    },
    {
        key: "machine-maintenance",
        title: "Machine Maintenance Report",
        description: "All machines, service status, overdue count, maintenance cost sum.",
        icon: Wrench,
        accent: "#736a6a",
    },
    {
        key: "class-utilization",
        title: "Class Utilization Report",
        description: "Enrolled vs capacity per class, utilization %, list of full classes.",
        icon: Activity,
        accent: "#B6B1C0",
    },
];
// ============================================================
// Component
// ============================================================
export function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
    const reportMeta = REPORT_CARDS.find((r) => r.key === selectedReport) ?? null;
    return (<div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-display text-4xl md:text-5xl text-foreground leading-none">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Generate and export PDF reports across every LiftLab module.
        </p>
      </motion.div>

      {/* Member selector (only relevant for the Member Progress report) */}
      <GlassCard className="p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4 text-[#F3BA60]"/>
          <span>Member for Progress Report:</span>
        </div>
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="flex-1 bg-muted border-border text-foreground h-9 max-w-md">
            <SelectValue placeholder="Pick a member…"/>
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-72">
            {members.map((m) => (<SelectItem key={m.id} value={m.id} className="text-foreground focus:bg-muted">
                <span className="font-mono-ll text-[10px] text-[#F3BA60] mr-2">{m.id}</span>
                {m.name}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map((r, i) => (<motion.div key={r.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
            <ClayCard className="h-full cursor-pointer group hover:scale-[1.01] transition-transform" onClick={() => setSelectedReport(r.key)} role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedReport(r.key);
                }
            }}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl p-2.5 border shrink-0" style={{
                backgroundColor: `${r.accent}14`,
                borderColor: `${r.accent}33`,
                color: r.accent,
            }}>
                  <r.icon className="h-5 w-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl text-foreground leading-none">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: r.accent }}>
                    <FileText className="h-3.5 w-3.5"/>
                    <span>Open Preview</span>
                  </div>
                </div>
              </div>
            </ClayCard>
          </motion.div>))}
      </div>

      {/* Report preview dialog */}
      <Dialog open={selectedReport !== null} onOpenChange={(o) => !o && setSelectedReport(null)}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent showCloseButton={false} className="max-w-4xl w-full p-0 bg-background border-border max-h-[92vh] overflow-y-auto ll-scroll">
            <DialogTitle className="sr-only">LiftLab Report Preview</DialogTitle>
            <DialogDescription className="sr-only">
              A4-style preview of the selected report. Use the Export PDF button to download.
            </DialogDescription>
            {reportMeta && (<ReportPreview reportKey={reportMeta.key} title={reportMeta.title} accent={reportMeta.accent} selectedMemberId={selectedMemberId} onClose={() => setSelectedReport(null)}/>)}
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>);
}
// ============================================================
// ReportPreview — A4-styled paper card on the dark dialog bg.
// ============================================================
function ReportPreview({ reportKey, title, accent, selectedMemberId, onClose, }) {
    const today = BUSINESS_TODAY.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const handleExport = () => {
        switch (reportKey) {
            case "member-progress": {
                const m = memberById(selectedMemberId);
                if (m)
                    exportMemberProgressPdf(m);
                break;
            }
            case "monthly-revenue":
                exportMonthlyRevenuePdf();
                break;
            case "staff-attendance":
                exportStaffAttendancePdf();
                break;
            case "machine-maintenance":
                exportMachineMaintenancePdf();
                break;
            case "class-utilization":
                exportClassUtilizationPdf();
                break;
        }
    };
    return (<div className="flex flex-col">
      {/* Action bar (dark, above paper) */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg p-1.5 border shrink-0" style={{ backgroundColor: `${accent}14`, borderColor: `${accent}33`, color: accent }}>
            <FileText className="h-4 w-4"/>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{title}</p>
            <p className="text-[10px] text-muted-foreground">A4 preview · LiftLab Reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Download className="h-3.5 w-3.5"/>
            Export PDF
          </button>
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs hover:bg-muted transition-colors">
            <X className="h-3.5 w-3.5"/>
            Close
          </button>
        </div>
      </div>

      {/* A4 paper */}
      <div className="p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-[#f6f6f6] text-[#202022] rounded-xl shadow-2xl overflow-hidden">
          {/* Paper header */}
          <div className="bg-background text-foreground px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-display text-3xl leading-none" style={{ color: accent }}>
                LiftLab
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">
                Train Smart. Track Everything.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground font-mono-ll mt-0.5">
                {today} · LL-RPT-{reportKey.slice(0, 3).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Paper content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={reportKey + selectedMemberId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {reportKey === "member-progress" && (<MemberProgressContent memberId={selectedMemberId}/>)}
                {reportKey === "monthly-revenue" && <MonthlyRevenueContent />}
                {reportKey === "staff-attendance" && <StaffAttendanceContent />}
                {reportKey === "machine-maintenance" && <MachineMaintenanceContent />}
                {reportKey === "class-utilization" && <ClassUtilizationContent />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Paper footer */}
          <div className="px-6 py-3 border-t border-black/10 bg-[#e0dbf3] text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Generated by LiftLab Gym Management System</span>
            <span className="font-mono-ll">contact@liftlab.in · v1.0</span>
          </div>
        </motion.div>
      </div>
    </div>);
}
// ============================================================
// 1. Member Progress Report content
// ============================================================
function MemberProgressContent({ memberId }) {
    const m = memberById(memberId);
    if (!m) {
        return <p className="text-sm text-muted-foreground">Select a member to view progress.</p>;
    }
    const weightLog = m.progress_tracker.weight_log;
    const strength = m.progress_tracker.strength_log;
    const latest1RM = {
        bench: strength.bench_press_1rm.at(-1)?.value ?? 0,
        squat: strength.squat_1rm.at(-1)?.value ?? 0,
        deadlift: strength.deadlift_1rm.at(-1)?.value ?? 0,
    };
    const att = m.attendance;
    const attPct = Math.round((att.attended / att.total_sessions_scheduled) * 100);
    return (<div className="space-y-5">
      {/* Member header */}
      <div className="flex items-center gap-4">
        <img src={m.photo} alt={m.name} className="h-16 w-16 rounded-xl object-cover border border-black/10"/>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl text-[#202022] leading-none">{m.name}</h2>
          <p className="text-xs text-muted-foreground font-mono-ll mt-1">
            {m.id} · {m.membership_type} · Age {calcAge(m.dob)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Joined {m.joining_date} · Expires {m.membership_expiry}
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaperKPI label="Attendance" value={`${attPct}%`} accent="#202022"/>
        <PaperKPI label="Current Streak" value={`${att.streak_current} days`} accent="#f3ba60"/>
        <PaperKPI label="Weight" value={`${m.weight_kg} kg`} accent="#f3ba60"/>
        <PaperKPI label="Height" value={`${m.height_cm} cm`} accent="#736a6a"/>
      </div>

      {/* Weight progression */}
      <PaperSection title="Weight Progression (kg)">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightLog} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false}/>
              <XAxis dataKey="date" stroke="#736A6A" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)}/>
              <YAxis stroke="#736A6A" fontSize={10} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]}/>
              <Tooltip contentStyle={{
            backgroundColor: "#202022",
            border: "1px solid rgba(246,246,246,0.1)",
            borderRadius: 8,
            color: "#202022",
            fontSize: 11,
        }} labelStyle={{ color: "#736A6A" }}/>
              <Line type="monotone" dataKey="weight" stroke="#202022" strokeWidth={2} dot={{ r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PaperSection>

      {/* Goals + 1RMs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaperSection title="Goals Completion">
          <div className="space-y-2">
            {m.goals.map((g, i) => (<div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#202022] truncate pr-2">{g.goal}</span>
                  <span className="font-mono-ll text-muted-foreground shrink-0">{g.completion_pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                width: `${g.completion_pct}%`,
                backgroundColor: g.completion_pct >= 80 ? "#f3ba60" : g.completion_pct >= 50 ? "#f3ba60" : "#736a6a",
            }}/>
                </div>
              </div>))}
          </div>
        </PaperSection>

        <PaperSection title="Current 1RMs (kg)">
          <div className="grid grid-cols-3 gap-2">
            <PaperStat label="Bench" value={latest1RM.bench} accent="#202022"/>
            <PaperStat label="Squat" value={latest1RM.squat} accent="#f3ba60"/>
            <PaperStat label="Deadlift" value={latest1RM.deadlift} accent="#f3ba60"/>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Total: <span className="font-mono-ll">{latest1RM.bench + latest1RM.squat + latest1RM.deadlift} kg</span>
          </p>
        </PaperSection>
      </div>
    </div>);
}
// ============================================================
// 2. Monthly Revenue Report content
// ============================================================
function MonthlyRevenueContent() {
    const data = useMemo(() => {
        const totalCollected = members.reduce((s, m) => s + m.fees.total_paid, 0);
        const pending = members.reduce((s, m) => s + m.fees.total_due, 0);
        const overdue = members
            .filter((m) => m.fees.status === "Overdue")
            .reduce((s, m) => s + m.fees.total_due, 0);
        const collectionRate = totalCollected + pending > 0
            ? Math.round((totalCollected / (totalCollected + pending)) * 100)
            : 0;
        const topPayers = [...members]
            .sort((a, b) => b.fees.total_paid - a.fees.total_paid)
            .slice(0, 5);
        const monthlyRevenue = members.reduce((s, m) => s + m.fees.monthly_fee, 0);
        const now = new Date();
        const chart = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const idx = 11 - i;
            const collection = Math.round(monthlyRevenue * (0.85 + idx * 0.01));
            chart.push({
                month: MONTH_ABBR[d.getMonth()],
                revenue: monthlyRevenue,
                collection,
            });
        }
        return { totalCollected, pending, overdue, collectionRate, topPayers, chart };
    }, []);
    return (<div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaperKPI label="Total Collected" value={money(data.totalCollected)} accent="#f3ba60"/>
        <PaperKPI label="Pending" value={money(data.pending)} accent="#f3ba60"/>
        <PaperKPI label="Overdue" value={money(data.overdue)} accent="#736a6a"/>
        <PaperKPI label="Collection Rate" value={`${data.collectionRate}%`} accent="#202022"/>
      </div>

      <PaperSection title="12-Month Revenue vs Collection">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="paperRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#202022" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#202022" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="paperCol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f3ba60" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#f3ba60" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false}/>
              <XAxis dataKey="month" stroke="#736A6A" fontSize={10} tickLine={false} axisLine={false}/>
              <YAxis stroke="#736A6A" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => "₹" + (Number(v) / 1000).toFixed(0) + "k"}/>
              <Tooltip contentStyle={{
            backgroundColor: "#202022",
            border: "1px solid rgba(246,246,246,0.1)",
            borderRadius: 8,
            color: "#202022",
            fontSize: 11,
        }} labelStyle={{ color: "#736A6A" }} formatter={(value) => money(value)}/>
              <Area type="monotone" dataKey="revenue" stroke="#202022" strokeWidth={2} fill="url(#paperRev)"/>
              <Area type="monotone" dataKey="collection" stroke="#f3ba60" strokeWidth={2} fill="url(#paperCol)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PaperSection>

      <PaperSection title="Top 5 Paying Members">
        <div className="space-y-2">
          {data.topPayers.map((m, i) => (<div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/[0.04] border border-black/5">
              <span className="font-display text-xl text-muted-foreground w-6 text-center">{i + 1}</span>
              <img src={m.photo} alt={m.name} className="h-8 w-8 rounded-full object-cover border border-black/10"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#202022] font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono-ll">{m.id} · {m.membership_type}</p>
              </div>
              <span className="font-display text-lg text-[#f3ba60]">{money(m.fees.total_paid)}</span>
            </div>))}
        </div>
      </PaperSection>
    </div>);
}
// ============================================================
// 3. Staff Attendance Summary content
// ============================================================
function StaffAttendanceContent() {
    const rows = useMemo(() => {
        return staff.map((s) => {
            const log = s.attendance_log;
            const totalHours = log.reduce((sum, e) => sum + e.hours, 0);
            const lateArrivals = log.filter((e) => e.check_in > "09:00").length;
            const onDutyPct = log.length > 0
                ? Math.min(100, Math.round((totalHours / (log.length * 8)) * 100))
                : 0;
            return { staff: s, totalHours, lateArrivals, onDutyPct, entries: log.length };
        });
    }, []);
    return (<div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaperKPI label="Total Staff" value={String(rows.length)} accent="#202022"/>
        <PaperKPI label="Total Hours" value={rows.reduce((s, r) => s + r.totalHours, 0).toFixed(1)} accent="#f3ba60"/>
        <PaperKPI label="Late Arrivals" value={String(rows.reduce((s, r) => s + r.lateArrivals, 0))} accent="#f3ba60"/>
        <PaperKPI label="Avg On-Duty" value={`${Math.round(rows.reduce((s, r) => s + r.onDutyPct, 0) / rows.length)}%`} accent="#736a6a"/>
      </div>

      <PaperSection title="Staff Attendance Log — This Month">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left py-2 px-2">Staff</th>
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-right py-2 px-2">Hours</th>
                <th className="text-right py-2 px-2">Late</th>
                <th className="text-right py-2 px-2">On-Duty %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (<tr key={r.staff.id} className="border-b border-black/5">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <img src={r.staff.photo} alt={r.staff.name} className="h-7 w-7 rounded-full object-cover border border-black/10"/>
                      <div>
                        <p className="text-xs text-[#202022] font-medium">{r.staff.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-ll">{r.staff.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">{r.staff.role}</td>
                  <td className="py-2 px-2 text-right font-mono-ll text-[#202022]">
                    {r.totalHours.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={`font-mono-ll text-xs ${r.lateArrivals > 0 ? "text-[#f3ba60]" : "text-muted-foreground"}`}>
                      {r.lateArrivals}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={`font-mono-ll text-xs ${r.onDutyPct >= 90 ? "text-[#f3ba60]" : r.onDutyPct >= 75 ? "text-[#f3ba60]" : "text-[#736a6a]"}`}>
                      {r.onDutyPct}%
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </PaperSection>
    </div>);
}
// ============================================================
// 4. Machine Maintenance Report content
// ============================================================
function MachineMaintenanceContent() {
    const { overdueCount, dueSoonCount } = useMaintenanceAlert(machines);
    const data = useMemo(() => {
        const totalCost = machines.reduce((s, m) => s + m.maintenance_log.reduce((cs, e) => cs + maintCost(e.type), 0), 0);
        const statusCount = {
            Operational: machines.filter((m) => m.status === "Operational").length,
            "Under Maintenance": machines.filter((m) => m.status === "Under Maintenance").length,
            "Out of Order": machines.filter((m) => m.status === "Out of Order").length,
        };
        return { totalCost, statusCount };
    }, []);
    return (<div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaperKPI label="Total Machines" value={String(machines.length)} accent="#202022"/>
        <PaperKPI label="Overdue Service" value={String(overdueCount)} accent="#736a6a"/>
        <PaperKPI label="Due Soon" value={String(dueSoonCount)} accent="#f3ba60"/>
        <PaperKPI label="Maint. Cost (sum)" value={money(data.totalCost)} accent="#f3ba60"/>
      </div>

      <PaperSection title="Machine Inventory & Service Status">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left py-2 px-2">Machine</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Next Service</th>
                <th className="text-right py-2 px-2">Usage hrs</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => {
            const svc = machineServiceStatus(m.next_service_due);
            const svcColor = svc === "Overdue" ? "#736a6a" : svc === "Due Soon" ? "#f3ba60" : "#f3ba60";
            return (<tr key={m.id} className="border-b border-black/5">
                    <td className="py-2 px-2">
                      <p className="text-xs text-[#202022] font-medium">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-ll">
                        {m.id} · {m.category}
                      </p>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border" style={{
                    color: svcColor,
                    borderColor: `${svcColor}40`,
                    backgroundColor: `${svcColor}14`,
                }}>
                        <CircleDot className="h-2.5 w-2.5"/>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-xs font-mono-ll" style={{ color: svcColor }}>
                        {m.next_service_due}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">({svc})</span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono-ll text-xs text-[#202022]">
                      {m.usage_hours_total.toLocaleString("en-IN")}
                    </td>
                  </tr>);
        })}
            </tbody>
          </table>
        </div>
      </PaperSection>
    </div>);
}
// ============================================================
// 5. Class Utilization Report content
// ============================================================
function ClassUtilizationContent() {
    const data = useMemo(() => {
        const rows = classes.map((c) => ({
            name: c.name,
            id: c.id,
            enrolled: c.enrolled,
            capacity: c.capacity,
            utilization: Math.round((c.enrolled / c.capacity) * 100),
        }));
        const fullClasses = rows.filter((r) => r.enrolled >= r.capacity);
        const avgUtilization = Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length);
        return { rows, fullClasses, avgUtilization };
    }, []);
    return (<div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PaperKPI label="Total Classes" value={String(data.rows.length)} accent="#202022"/>
        <PaperKPI label="Full Classes" value={String(data.fullClasses.length)} accent="#736a6a"/>
        <PaperKPI label="Avg Utilization" value={`${data.avgUtilization}%`} accent="#f3ba60"/>
        <PaperKPI label="Total Enrolment" value={String(data.rows.reduce((s, r) => s + r.enrolled, 0))} accent="#736a6a"/>
      </div>

      <PaperSection title="Enrolled vs Capacity">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false}/>
              <XAxis dataKey="name" stroke="#736A6A" fontSize={9} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0}/>
              <YAxis stroke="#736A6A" fontSize={10} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{
            backgroundColor: "#202022",
            border: "1px solid rgba(246,246,246,0.1)",
            borderRadius: 8,
            color: "#202022",
            fontSize: 11,
        }} labelStyle={{ color: "#736A6A" }}/>
              <Bar dataKey="capacity" fill="rgba(0,0,0,0.12)" radius={[4, 4, 0, 0]} name="Capacity"/>
              <Bar dataKey="enrolled" radius={[4, 4, 0, 0]} name="Enrolled">
                {data.rows.map((r, i) => (<Cell key={i} fill={r.utilization >= 100
                ? "#736a6a"
                : r.utilization >= 80
                    ? "#f3ba60"
                    : "#202022"}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PaperSection>

      <PaperSection title="Full Classes">
        {data.fullClasses.length === 0 ? (<p className="text-xs text-muted-foreground">No classes at full capacity.</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.fullClasses.map((c) => (<div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#736a6a]/8 border border-[#736a6a]/20">
                <div>
                  <p className="text-sm text-[#202022] font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono-ll">{c.id}</p>
                </div>
                <span className="font-display text-lg text-[#736a6a]">
                  {c.enrolled}/{c.capacity}
                </span>
              </div>))}
          </div>)}
      </PaperSection>
    </div>);
}
// ============================================================
// Paper primitives (light background variants)
// ============================================================
function PaperKPI({ label, value, accent }) {
    return (<div className="p-3 rounded-lg border bg-white" style={{ borderColor: `${accent}30` }}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-display text-2xl mt-1 leading-none" style={{ color: accent }}>
        {value}
      </p>
    </div>);
}
function PaperSection({ title, children }) {
    return (<div className="p-4 rounded-lg bg-white border border-black/8">
      <h3 className="text-sm font-semibold text-[#202022] mb-3 flex items-center gap-1.5">
        <span className="h-3 w-1 rounded-full bg-[#202022]"/>
        {title}
      </h3>
      {children}
    </div>);
}
function PaperStat({ label, value, accent }) {
    return (<div className="p-2 rounded-lg bg-black/[0.04] border border-black/5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-display text-xl mt-1" style={{ color: accent }}>
        {value}
      </p>
    </div>);
}
// ============================================================
// PDF Exports — dark LiftLab themed (brand consistency).
// Each helper writes a structured dark-themed PDF report.
// ============================================================
function liftLabPdfHeader(doc, title, subtitle) {
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
    // Report title
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, 54);
    // Subtitle (date / id)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 122, 140);
    const dateStr = new Date().toLocaleString("en-IN");
    doc.text(subtitle ?? `Generated: ${dateStr}`, 20, 61);
    return 74; // y-start for body
}
function liftLabPdfFooter(doc) {
    doc.setFontSize(9);
    doc.setTextColor(122, 122, 140);
    doc.setFont("helvetica", "normal");
    doc.text("LiftLab Gym Management System · contact@liftlab.in", 20, 285);
    doc.text(`Page ${doc.getNumberOfPages()}`, 190, 285, { align: "right" });
}
function ensurePageSpace(doc, y, needed) {
    if (y + needed > 270) {
        doc.addPage();
        doc.setFillColor(10, 10, 15);
        doc.rect(0, 0, 210, 297, "F");
        return 30;
    }
    return y;
}
// ---- 1. Member Progress PDF ----
function exportMemberProgressPdf(m) {
    const doc = new jsPDF();
    let y = liftLabPdfHeader(doc, "Member Progress Report", `${m.name} · ${m.id} · Generated ${new Date().toLocaleString("en-IN")}`);
    const att = m.attendance;
    const attPct = Math.round((att.attended / att.total_sessions_scheduled) * 100);
    const strength = m.progress_tracker.strength_log;
    const latest1RM = {
        bench: strength.bench_press_1rm.at(-1)?.value ?? 0,
        squat: strength.squat_1rm.at(-1)?.value ?? 0,
        deadlift: strength.deadlift_1rm.at(-1)?.value ?? 0,
    };
    // Member info
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${m.name}  (${m.id})`, 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 122, 140);
    doc.text(`Membership: ${m.membership_type}   Age: ${calcAge(m.dob)}   Joined: ${m.joining_date}`, 20, y);
    y += 5;
    doc.text(`Height: ${m.height_cm} cm   Weight: ${m.weight_kg} kg   Expiry: ${m.membership_expiry}`, 20, y);
    y += 10;
    // KPIs
    doc.setTextColor(0, 255, 136);
    doc.setFont("helvetica", "bold");
    doc.text(`Attendance: ${attPct}%`, 20, y);
    doc.text(`Streak: ${att.streak_current}d`, 80, y);
    doc.text(`1RM Total: ${latest1RM.bench + latest1RM.squat + latest1RM.deadlift}kg`, 140, y);
    y += 10;
    // Weight log
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(11);
    doc.text("Weight Log", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(240, 240, 240);
    m.progress_tracker.weight_log.forEach((w) => {
        y = ensurePageSpace(doc, y, 5);
        doc.text(`${w.date}    ${w.weight} kg`, 24, y);
        y += 5;
    });
    y += 4;
    // 1RMs
    y = ensurePageSpace(doc, y, 12);
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(11);
    doc.text("Current 1RMs", 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(240, 240, 240);
    doc.text(`Bench: ${latest1RM.bench} kg   Squat: ${latest1RM.squat} kg   Deadlift: ${latest1RM.deadlift} kg`, 24, y);
    y += 10;
    // Goals
    y = ensurePageSpace(doc, y, 8);
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(11);
    doc.text("Goals", 20, y);
    y += 6;
    doc.setFontSize(9);
    m.goals.forEach((g) => {
        y = ensurePageSpace(doc, y, 5);
        doc.setTextColor(240, 240, 240);
        doc.text(`${g.goal}`, 24, y);
        doc.setTextColor(122, 122, 140);
        doc.text(`${g.completion_pct}%`, 170, y);
        y += 5;
    });
    liftLabPdfFooter(doc);
    const fname = `liftlab_progress_${m.id}.pdf`;
    doc.save(fname);
    toast({ title: "Report exported", description: fname });
}
// ---- 2. Monthly Revenue PDF ----
function exportMonthlyRevenuePdf() {
    const doc = new jsPDF();
    let y = liftLabPdfHeader(doc, "Monthly Revenue Report");
    const totalCollected = members.reduce((s, m) => s + m.fees.total_paid, 0);
    const pending = members.reduce((s, m) => s + m.fees.total_due, 0);
    const overdue = members
        .filter((m) => m.fees.status === "Overdue")
        .reduce((s, m) => s + m.fees.total_due, 0);
    const collectionRate = totalCollected + pending > 0 ? Math.round((totalCollected / (totalCollected + pending)) * 100) : 0;
    doc.setFontSize(11);
    doc.setTextColor(0, 255, 136);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Collected: Rs. ${totalCollected.toLocaleString("en-IN")}`, 20, y);
    y += 6;
    doc.setTextColor(255, 140, 0);
    doc.text(`Pending:         Rs. ${pending.toLocaleString("en-IN")}`, 20, y);
    y += 6;
    doc.setTextColor(255, 59, 92);
    doc.text(`Overdue:         Rs. ${overdue.toLocaleString("en-IN")}`, 20, y);
    y += 6;
    doc.setTextColor(0, 212, 255);
    doc.text(`Collection Rate: ${collectionRate}%`, 20, y);
    y += 12;
    // 12-month trend
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(11);
    doc.text("12-Month Trend", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(240, 240, 240);
    const monthlyRevenue = members.reduce((s, m) => s + m.fees.monthly_fee, 0);
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const idx = 11 - i;
        const collection = Math.round(monthlyRevenue * (0.85 + idx * 0.01));
        y = ensurePageSpace(doc, y, 5);
        doc.text(`${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}    Revenue: Rs. ${monthlyRevenue.toLocaleString("en-IN")}    Collection: Rs. ${collection.toLocaleString("en-IN")}`, 24, y);
        y += 5;
    }
    y += 6;
    // Top 5 payers
    y = ensurePageSpace(doc, y, 12);
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(11);
    doc.text("Top 5 Paying Members", 20, y);
    y += 6;
    doc.setFontSize(9);
    const topPayers = [...members].sort((a, b) => b.fees.total_paid - a.fees.total_paid).slice(0, 5);
    topPayers.forEach((m, i) => {
        y = ensurePageSpace(doc, y, 5);
        doc.setTextColor(240, 240, 240);
        doc.text(`${i + 1}. ${m.name} (${m.id})`, 24, y);
        doc.setTextColor(0, 255, 136);
        doc.text(`Rs. ${m.fees.total_paid.toLocaleString("en-IN")}`, 160, y);
        y += 5;
    });
    liftLabPdfFooter(doc);
    const fname = "liftlab_revenue_report.pdf";
    doc.save(fname);
    toast({ title: "Report exported", description: fname });
}
// ---- 3. Staff Attendance PDF ----
function exportStaffAttendancePdf() {
    const doc = new jsPDF();
    let y = liftLabPdfHeader(doc, "Staff Attendance Summary");
    doc.setFontSize(10);
    doc.setTextColor(122, 122, 140);
    doc.setFont("helvetica", "bold");
    doc.text("Staff", 20, y);
    doc.text("Role", 80, y);
    doc.text("Hours", 140, y, { align: "right" });
    doc.text("Late", 165, y, { align: "right" });
    doc.text("On-Duty", 190, y, { align: "right" });
    y += 5;
    doc.setDrawColor(0, 212, 255);
    doc.line(20, y - 1, 190, y - 1);
    y += 3;
    doc.setFont("helvetica", "normal");
    staff.forEach((s) => {
        const log = s.attendance_log;
        const totalHours = log.reduce((sum, e) => sum + e.hours, 0);
        const lateArrivals = log.filter((e) => e.check_in > "09:00").length;
        const onDutyPct = log.length > 0
            ? Math.min(100, Math.round((totalHours / (log.length * 8)) * 100))
            : 0;
        y = ensurePageSpace(doc, y, 5);
        doc.setTextColor(240, 240, 240);
        doc.text(s.name.slice(0, 22), 20, y);
        doc.setTextColor(122, 122, 140);
        doc.text(s.role.slice(0, 18), 80, y);
        doc.setTextColor(240, 240, 240);
        doc.text(totalHours.toFixed(1), 140, y, { align: "right" });
        doc.setTextColor(lateArrivals > 0 ? 255 : 122, lateArrivals > 0 ? 140 : 122, lateArrivals > 0 ? 0 : 140);
        doc.text(String(lateArrivals), 165, y, { align: "right" });
        doc.setTextColor(onDutyPct >= 90 ? 0 : 255, onDutyPct >= 90 ? 255 : 140, onDutyPct >= 90 ? 136 : 0);
        doc.text(`${onDutyPct}%`, 190, y, { align: "right" });
        y += 5;
    });
    liftLabPdfFooter(doc);
    const fname = "liftlab_staff_attendance.pdf";
    doc.save(fname);
    toast({ title: "Report exported", description: fname });
}
// ---- 4. Machine Maintenance PDF ----
function exportMachineMaintenancePdf() {
    const doc = new jsPDF();
    let y = liftLabPdfHeader(doc, "Machine Maintenance Report");
    const overdueCount = machines.filter((m) => daysUntil(m.next_service_due) < 0).length;
    const dueSoonCount = machines.filter((m) => {
        const d = daysUntil(m.next_service_due);
        return d >= 0 && d <= 7;
    }).length;
    const totalCost = machines.reduce((s, m) => s + m.maintenance_log.reduce((cs, e) => cs + maintCost(e.type), 0), 0);
    doc.setFontSize(11);
    doc.setTextColor(0, 212, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Machines: ${machines.length}`, 20, y);
    y += 6;
    doc.setTextColor(255, 59, 92);
    doc.text(`Overdue: ${overdueCount}`, 20, y);
    y += 6;
    doc.setTextColor(255, 140, 0);
    doc.text(`Due Soon: ${dueSoonCount}`, 20, y);
    y += 6;
    doc.setTextColor(0, 255, 136);
    doc.text(`Maint. Cost Sum: Rs. ${totalCost.toLocaleString("en-IN")}`, 20, y);
    y += 12;
    // Table header
    doc.setFontSize(10);
    doc.setTextColor(122, 122, 140);
    doc.setFont("helvetica", "bold");
    doc.text("Machine", 20, y);
    doc.text("Status", 100, y);
    doc.text("Next Service", 145, y);
    doc.text("Hours", 190, y, { align: "right" });
    y += 5;
    doc.setDrawColor(0, 212, 255);
    doc.line(20, y - 1, 190, y - 1);
    y += 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    machines.forEach((m) => {
        y = ensurePageSpace(doc, y, 5);
        const svc = machineServiceStatus(m.next_service_due);
        doc.setTextColor(240, 240, 240);
        doc.text(`${m.name} (${m.id})`.slice(0, 40), 20, y);
        doc.setTextColor(122, 122, 140);
        doc.text(m.status.slice(0, 18), 100, y);
        const svcColor = svc === "Overdue" ? [255, 59, 92] : svc === "Due Soon" ? [255, 140, 0] : [0, 255, 136];
        doc.setTextColor(...svcColor);
        doc.text(m.next_service_due, 145, y);
        doc.setTextColor(240, 240, 240);
        doc.text(m.usage_hours_total.toLocaleString("en-IN"), 190, y, { align: "right" });
        y += 5;
    });
    liftLabPdfFooter(doc);
    const fname = "liftlab_machine_maintenance.pdf";
    doc.save(fname);
    toast({ title: "Report exported", description: fname });
}
// ---- 5. Class Utilization PDF ----
function exportClassUtilizationPdf() {
    const doc = new jsPDF();
    let y = liftLabPdfHeader(doc, "Class Utilization Report");
    const rows = classes.map((c) => ({
        name: c.name,
        id: c.id,
        enrolled: c.enrolled,
        capacity: c.capacity,
        utilization: Math.round((c.enrolled / c.capacity) * 100),
    }));
    const fullClasses = rows.filter((r) => r.enrolled >= r.capacity);
    const avgUtilization = Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length);
    doc.setFontSize(11);
    doc.setTextColor(0, 212, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Classes: ${rows.length}`, 20, y);
    y += 6;
    doc.setTextColor(255, 59, 92);
    doc.text(`Full Classes: ${fullClasses.length}`, 20, y);
    y += 6;
    doc.setTextColor(0, 255, 136);
    doc.text(`Avg Utilization: ${avgUtilization}%`, 20, y);
    y += 12;
    // Table header
    doc.setFontSize(10);
    doc.setTextColor(122, 122, 140);
    doc.setFont("helvetica", "bold");
    doc.text("Class", 20, y);
    doc.text("Enrolled", 130, y, { align: "right" });
    doc.text("Capacity", 160, y, { align: "right" });
    doc.text("Util %", 190, y, { align: "right" });
    y += 5;
    doc.setDrawColor(0, 212, 255);
    doc.line(20, y - 1, 190, y - 1);
    y += 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    rows.forEach((r) => {
        y = ensurePageSpace(doc, y, 5);
        doc.setTextColor(240, 240, 240);
        doc.text(r.name.slice(0, 36), 20, y);
        doc.text(String(r.enrolled), 130, y, { align: "right" });
        doc.setTextColor(122, 122, 140);
        doc.text(String(r.capacity), 160, y, { align: "right" });
        const utilColor = r.utilization >= 100 ? [255, 59, 92] : r.utilization >= 80 ? [255, 140, 0] : [0, 255, 136];
        doc.setTextColor(...utilColor);
        doc.text(`${r.utilization}%`, 190, y, { align: "right" });
        y += 5;
    });
    if (fullClasses.length > 0) {
        y += 6;
        y = ensurePageSpace(doc, y, 10);
        doc.setFontSize(11);
        doc.setTextColor(255, 59, 92);
        doc.setFont("helvetica", "bold");
        doc.text("Full Classes", 20, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        fullClasses.forEach((c) => {
            y = ensurePageSpace(doc, y, 5);
            doc.setTextColor(240, 240, 240);
            doc.text(`${c.name} (${c.id}) — ${c.enrolled}/${c.capacity}`, 24, y);
            y += 5;
        });
    }
    liftLabPdfFooter(doc);
    const fname = "liftlab_class_utilization.pdf";
    doc.save(fname);
    toast({ title: "Report exported", description: fname });
}
