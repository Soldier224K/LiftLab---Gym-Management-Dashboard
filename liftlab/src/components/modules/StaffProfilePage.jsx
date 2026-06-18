"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Users, CalendarClock, Wallet, FlaskConical, Download, Mail, Phone, Award, AlertTriangle, CheckCircle2, ExternalLink, Clock, TrendingUp, } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, } from "recharts";
import { staffById } from "@/data/staff";
import { memberById } from "@/data/members";
import { classes } from "@/data/classes";
import { useNav } from "@/store/navStore";
import { GlassCard } from "@/components/ll/GlassCard";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { calcAge, daysUntil, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { getMemberProgress, progressColor } from "@/utils/progressSorter";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
export function StaffProfilePage({ id }) {
    const { backToStaff } = useNav();
    const s = staffById(id);
    const tabs = useMemo(() => {
        const base = [
            { key: "profile", label: "Profile", icon: User },
            { key: "members", label: "Members", icon: Users },
            { key: "attendance", label: "Attendance & Hours", icon: CalendarClock },
            { key: "salary", label: "Salary", icon: Wallet },
        ];
        if (s?.research_papers && s.research_papers.length > 0) {
            base.push({ key: "research", label: "Research", icon: FlaskConical });
        }
        return base;
    }, [s]);
    const [tab, setTab] = useState("profile");
    if (!s) {
        return (<div className="text-center py-16">
        <p className="text-muted-foreground">Staff not found.</p>
        <button onClick={backToStaff} className="mt-3 text-[#F3BA60] hover:underline">
          ← Back to staff
        </button>
      </div>);
    }
    const age = calcAge(s.dob);
    const experienceYears = BUSINESS_TODAY.getFullYear() - new Date(s.joining_date).getFullYear();
    return (<div className="space-y-4">
      <button onClick={backToStaff} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4"/> Back to staff
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left sidebar */}
        <GlassCard className="lg:col-span-1 p-5 h-fit lg:sticky lg:top-20">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img src={s.photo} alt={s.name} className="h-28 w-28 rounded-2xl object-cover border-2 border-[#F3BA60]/40"/>
              <span className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-card border-2 border-[#F3BA60] flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f3ba60] pulse-dot"/>
              </span>
            </div>
            <h2 className="font-display text-2xl text-foreground mt-3 leading-none">
              {s.name}
            </h2>
            <p className="font-mono-ll text-xs text-[#F3BA60] mt-1">{s.id}</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              <StatusBadge variant="blue">{s.role}</StatusBadge>
              <StatusBadge variant="green" pulse>
                Active
              </StatusBadge>
            </div>
          </div>

          <div className="mt-5 space-y-2.5 text-sm">
            <Vital label="Age" value={`${age} yrs`}/>
            <Vital label="Gender" value={s.gender}/>
            <Vital label="Experience" value={`${experienceYears} yrs`}/>
            <Vital label="Joined" value={s.joining_date}/>
            <Vital label="Contact" value={s.contact}/>
            <Vital label="Email" value={<span className="break-all">{s.email}</span>}/>
            <Vital label="Members" value={`${s.members_assigned.length}`}/>
            <Vital label="Monthly Salary" value={`₹${s.salary_inr.toLocaleString("en-IN")}`}/>
          </div>

          <div className="mt-4 pt-4 border-t border-border space-y-1.5">
            <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#F3BA60] transition-colors">
              <Mail className="h-3.5 w-3.5"/> Email
            </a>
            <a href={`tel:${s.contact}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#F3BA60] transition-colors">
              <Phone className="h-3.5 w-3.5"/> Call
            </a>
          </div>
        </GlassCard>

        {/* Right main */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active
                    ? "bg-[#F3BA60]/12 text-[#F3BA60]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  <Icon className="h-4 w-4"/> {t.label}
                </button>);
        })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "profile" && <ProfileTab staff={s} experienceYears={experienceYears}/>}
              {tab === "members" && <MembersTab staff={s}/>}
              {tab === "attendance" && <AttendanceTab staff={s}/>}
              {tab === "salary" && <SalaryTab staff={s}/>}
              {tab === "research" && <ResearchTab staff={s}/>}
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
/* ---------------- Profile tab ---------------- */
function ProfileTab({ staff: s, experienceYears, }) {
    const staffClasses = classes.filter((c) => c.trainer_id === s.id);
    return (<div className="space-y-4">
      {/* Bio */}
      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none">Bio</h3>
        <p className="text-sm text-foreground mt-3 leading-relaxed">
          {s.name} is a {s.role.toLowerCase()} at LiftLab with{" "}
          {experienceYears}+ years of professional experience. Joined the team on{" "}
          {new Date(s.joining_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}
          {s.members_assigned.length > 0
            ? `, currently mentoring ${s.members_assigned.length} members`
            : ""}
          {staffClasses.length > 0
            ? ` and leading ${staffClasses.length} class${staffClasses.length > 1 ? "es" : ""} per week`
            : ""}
          .
          {s.role === "Nutritionist" &&
            s.nutrition_plans_created &&
            ` Has authored ${s.nutrition_plans_created} nutrition plans with ${s.clients_on_plan ?? 0} active clients.`}
        </p>
      </GlassCard>

      {/* Qualifications */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-[#F3BA60]"/>
          <h3 className="font-display text-xl text-foreground leading-none">
            Qualifications
          </h3>
        </div>
        <div className="space-y-2">
          {s.qualifications.map((q, i) => (<div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="h-6 w-6 rounded-md bg-[#F3BA60]/15 border border-[#F3BA60]/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-mono-ll text-[10px] text-[#F3BA60]">
                  {i + 1}
                </span>
              </div>
              <p className="text-sm text-foreground">{q}</p>
            </div>))}
        </div>
      </GlassCard>

      {/* Certifications */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-[#f3ba60]"/>
          <h3 className="font-display text-xl text-foreground leading-none">
            Certifications
          </h3>
        </div>
        <div className="space-y-2">
          {s.certifications.map((c, i) => (<CertRow key={i} cert={c}/>))}
        </div>
      </GlassCard>

      {/* Experience */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#F3BA60]"/>
          <h3 className="font-display text-xl text-foreground leading-none">
            Experience
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Years at LiftLab
            </p>
            <p className="font-display text-3xl text-[#F3BA60] mt-1 leading-none">
              {experienceYears}
            </p>
          </NeumorphCard>
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Members Mentored
            </p>
            <p className="font-display text-3xl text-[#f3ba60] mt-1 leading-none">
              {s.members_assigned.length}
            </p>
          </NeumorphCard>
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Classes Led
            </p>
            <p className="font-display text-3xl text-[#F3BA60] mt-1 leading-none">
              {staffClasses.length}
            </p>
          </NeumorphCard>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs text-muted-foreground">Career timeline</p>
          <p className="text-sm text-foreground mt-1">
            Joined{" "}
            <span className="text-[#F3BA60]">
              {new Date(s.joining_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}
            </span>{" "}
            · Currently serving as{" "}
            <span className="text-[#F3BA60]">{s.role}</span>
          </p>
        </div>
      </GlassCard>
    </div>);
}
function CertRow({ cert }) {
    const days = daysUntil(cert.expiry);
    // Expiry color: red if past, orange if within 60 days, green otherwise
    const expiringSoon = days >= 0 && days <= 60;
    const expired = days < 0;
    const accent = expired ? "#736a6a" : expiringSoon ? "#F3BA60" : "#f3ba60";
    return (<div className="p-3 rounded-lg border" style={{
            backgroundColor: `${accent}08`,
            borderColor: `${accent}33`,
        }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{cert.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {cert.issuer} · ID {cert.cert_id}
          </p>
        </div>
        <StatusBadge variant={expired ? "red" : expiringSoon ? "orange" : "green"} pulse={expired}>
          {expired
            ? "Expired"
            : expiringSoon
                ? `Expires in ${days}d`
                : "Valid"}
        </StatusBadge>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
        <span>
          Issued:{" "}
          <span className="font-mono-ll text-foreground">{cert.issued}</span>
        </span>
        <span>
          Expiry:{" "}
          <span className="font-mono-ll" style={{ color: accent }}>
            {cert.expiry}
          </span>
        </span>
      </div>
      {(expired || expiringSoon) && (<div className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: accent }}>
          <AlertTriangle className="h-3 w-3"/>
          <span>
            {expired
                ? `Expired ${Math.abs(days)} days ago — renewal required`
                : `Renewal due in ${days} days`}
          </span>
        </div>)}
    </div>);
}
/* ---------------- Members tab ---------------- */
function MembersTab({ staff: s }) {
    const assigned = s.members_assigned
        .map((mid) => memberById(mid))
        .filter((m) => Boolean(m));
    if (assigned.length === 0) {
        return (<GlassCard className="p-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2"/>
        <p className="text-sm text-muted-foreground">
          {s.name} has no members directly assigned.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This role typically doesn&apos;t carry member caseload.
        </p>
      </GlassCard>);
    }
    return (<div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="Assigned" value={assigned.length} accent="#F3BA60" icon={Users} delay={0}/>
        <StatKPI label="Avg Progress" value={`${Math.round(assigned.reduce((acc, m) => acc + getMemberProgress(m), 0) /
            assigned.length)}%`} accent="#f3ba60" icon={TrendingUp} delay={0.05}/>
        <StatKPI label="Medical Cases" value={assigned.filter((m) => m.medical.conditions.length > 0).length} accent="#F3BA60" icon={AlertTriangle} delay={0.1}/>
        <StatKPI label="Overdue Fees" value={assigned.filter((m) => m.fees.status === "Overdue").length} accent="#736a6a" icon={Wallet} delay={0.15}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {assigned.map((m, i) => {
            const p = getMemberProgress(m);
            return (<motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3 }}>
              <ClayCard className="p-4">
                <div className="flex items-center gap-3">
                  <img src={m.photo} alt={m.name} loading="lazy" className="h-12 w-12 rounded-xl object-cover border border-border"/>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.name}
                    </p>
                    <p className="font-mono-ll text-[10px] text-[#F3BA60]">
                      {m.id}
                    </p>
                  </div>
                  <StatusBadge status={m.membership_type}>
                    {m.membership_type}
                  </StatusBadge>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Goal progress</span>
                    <span className="font-mono-ll" style={{ color: progressColor(p) }}>
                      {p}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: progressColor(p) }} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}/>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                  <span>
                    Attendance:{" "}
                    <span className="text-foreground font-mono-ll">
                      {Math.round((m.attendance.attended /
                    m.attendance.total_sessions_scheduled) *
                    100)}
                      %
                    </span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>
                    Fees:{" "}
                    <StatusBadge status={m.fees.status}>
                      {m.fees.status}
                    </StatusBadge>
                  </span>
                </div>
              </ClayCard>
            </motion.div>);
        })}
      </div>
    </div>);
}
/* ---------------- Attendance & Hours tab ---------------- */
function AttendanceTab({ staff: s }) {
    const log = s.attendance_log;
    const last10 = log.slice(-10);
    // Compute hours_actual from check_in/check_out timestamps.
    // hours_logged is the stored `hours` value (manual log);
    // hours_actual is derived from the actual timestamps — they may differ
    // slightly in production systems.
    const toMinutes = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };
    const actualHours = (checkIn, checkOut) => Math.round(((toMinutes(checkOut) - toMinutes(checkIn)) / 60) * 100) / 100;
    const chartData = last10.map((e) => ({
        date: e.date.slice(5), // MM-DD
        hours_logged: e.hours,
        hours_actual: actualHours(e.check_in, e.check_out),
    }));
    const lateArrivals = log.filter((e) => e.check_in > "09:00").length;
    const totalHours = log.reduce((acc, e) => acc + e.hours, 0);
    const avgHours = log.length > 0 ? totalHours / log.length : 0;
    const expectedHours = log.length * 8;
    const efficiency = expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0;
    return (<div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="Total Hours" value={totalHours.toFixed(1)} sub={`${log.length} sessions logged`} accent="#F3BA60" icon={Clock} delay={0}/>
        <StatKPI label="Avg / Day" value={`${avgHours.toFixed(1)}h`} sub={`vs 8h standard`} accent="#f3ba60" icon={TrendingUp} delay={0.05}/>
        <StatKPI label="Late Arrivals" value={lateArrivals} sub="After 09:00" accent={lateArrivals > 0 ? "#F3BA60" : "#f3ba60"} icon={AlertTriangle} delay={0.1}/>
        <StatKPI label="Time Efficiency" value={`${efficiency}%`} sub="vs scheduled" accent={efficiency >= 90 ? "#f3ba60" : efficiency >= 70 ? "#F3BA60" : "#736a6a"} icon={CalendarClock} delay={0.15}/>
      </div>

      {/* Chart */}
      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none mb-1">
          Hours: Logged vs Actual
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Last {last10.length} attendance entries
        </p>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.05)"/>
              <XAxis dataKey="date" stroke="#736A6A" tick={{ fontSize: 11, fontFamily: "monospace" }}/>
              <YAxis stroke="#736A6A" tick={{ fontSize: 11 }} domain={[0, "auto"]}/>
              <Tooltip contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid rgba(246,246,246,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
        }} labelStyle={{ color: "#736A6A" }} itemStyle={{ color: "#202022" }}/>
              <Legend wrapperStyle={{ fontSize: 11, color: "#736A6A" }} iconType="circle"/>
              <Bar dataKey="hours_logged" fill="#F3BA60" radius={[4, 4, 0, 0]} name="Logged"/>
              <Bar dataKey="hours_actual" fill="#F3BA60" radius={[4, 4, 0, 0]} name="Actual"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Log table */}
      <GlassCard className="p-5">
        <h3 className="font-display text-xl text-foreground leading-none mb-3">
          Attendance Log
        </h3>
        <div className="overflow-x-auto ll-scroll -mx-2">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
                  Date
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
                  Check In
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
                  Check Out
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Hours
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[...log].reverse().map((e, i) => {
            const isLate = e.check_in > "09:00";
            return (<tr key={i} className="border-b border-border hover:bg-muted/60 transition-colors">
                    <td className="px-3 py-2.5 font-mono-ll text-xs text-foreground">
                      {e.date}
                    </td>
                    <td className="px-3 py-2.5 font-mono-ll text-xs text-foreground">
                      {e.check_in}
                    </td>
                    <td className="px-3 py-2.5 font-mono-ll text-xs text-foreground">
                      {e.check_out}
                    </td>
                    <td className="px-3 py-2.5 font-mono-ll text-xs text-right text-[#F3BA60]">
                      {e.hours.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isLate ? (<StatusBadge variant="orange">Late</StatusBadge>) : (<StatusBadge variant="green">On time</StatusBadge>)}
                    </td>
                  </tr>);
        })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>);
}
function buildSalaryBreakdown(s) {
    // Deterministic 6-month breakdown using staff salary as base.
    // Incentive scales with member caseload; deductions = PF 12% + tax 5%.
    const months = ["Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025", "Feb 2025"];
    const memberLoad = s.members_assigned.length;
    return months.map((m, i) => {
        const base = s.salary_inr;
        // Incentive: 4-9% of base, scaled by member load + month index
        const incentiveRate = 0.04 + (memberLoad * 0.005) + (i * 0.002);
        const incentive = Math.round((base * Math.min(incentiveRate, 0.15)) / 10) * 10;
        const deductionRate = 0.12 + 0.05; // PF + tax
        const deductions = Math.round((base * deductionRate) / 10) * 10;
        const net = base + incentive - deductions;
        return { month: m, base, incentive, deductions, net };
    });
}
function SalaryTab({ staff: s }) {
    const breakdown = useMemo(() => buildSalaryBreakdown(s), [s]);
    const ytdTotal = breakdown.reduce((acc, m) => ({
        base: acc.base + m.base,
        incentive: acc.incentive + m.incentive,
        deductions: acc.deductions + m.deductions,
        net: acc.net + m.net,
    }), { base: 0, incentive: 0, deductions: 0, net: 0 });
    const downloadPayslip = (entry) => {
        const doc = new jsPDF();
        // Dark themed header
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
        // Title
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(16);
        doc.text("Monthly Payslip", 20, 58);
        // Staff details
        doc.setFontSize(11);
        doc.text(`Staff: ${s.name} (${s.id})`, 20, 72);
        doc.text(`Role: ${s.role}`, 20, 80);
        doc.text(`Pay Period: ${entry.month}`, 20, 88);
        doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 20, 96);
        doc.line(20, 104, 190, 104);
        // Breakdown
        let y = 118;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(240, 240, 240);
        doc.text("Earnings", 20, y);
        doc.text("Amount (Rs.)", 140, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(200, 200, 200);
        doc.text("Basic Salary", 20, y);
        doc.text(entry.base.toLocaleString("en-IN"), 150, y);
        y += 7;
        doc.text("Incentive / Bonus", 20, y);
        doc.setTextColor(0, 255, 136);
        doc.text(`+ ${entry.incentive.toLocaleString("en-IN")}`, 150, y);
        y += 7;
        doc.setTextColor(255, 140, 0);
        doc.text("Deductions (PF + Tax)", 20, y);
        doc.text(`- ${entry.deductions.toLocaleString("en-IN")}`, 150, y);
        // Net pay
        y += 14;
        doc.setDrawColor(0, 212, 255);
        doc.line(20, y - 6, 190, y - 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(240, 240, 240);
        doc.text("Net Pay", 20, y);
        doc.setFontSize(20);
        doc.setTextColor(0, 255, 136);
        doc.text(`Rs. ${entry.net.toLocaleString("en-IN")}`, 140, y);
        // Footer
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(122, 122, 140);
        doc.text("This is a system-generated payslip and does not require a signature.", 20, 270);
        doc.text("LiftLab HR · hr@liftlab.in", 20, 276);
        doc.save(`payslip_${s.id}_${entry.month.replace(" ", "_")}.pdf`);
        toast({
            title: "Payslip downloaded",
            description: `${entry.month} · ₹${entry.net.toLocaleString("en-IN")}`,
        });
    };
    return (<div className="space-y-4">
      {/* YTD KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKPI label="YTD Gross" value={`₹${(ytdTotal.base + ytdTotal.incentive).toLocaleString("en-IN")}`} sub={`${breakdown.length} months`} accent="#F3BA60" icon={Wallet} delay={0}/>
        <StatKPI label="YTD Incentives" value={`₹${ytdTotal.incentive.toLocaleString("en-IN")}`} sub="Performance bonus" accent="#f3ba60" icon={TrendingUp} delay={0.05}/>
        <StatKPI label="YTD Deductions" value={`₹${ytdTotal.deductions.toLocaleString("en-IN")}`} sub="PF + Tax" accent="#736a6a" icon={AlertTriangle} delay={0.1}/>
        <StatKPI label="YTD Net" value={`₹${ytdTotal.net.toLocaleString("en-IN")}`} sub="Take-home total" accent="#F3BA60" icon={CheckCircle2} delay={0.15}/>
      </div>

      {/* Breakdown table */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl text-foreground leading-none">
            Monthly Breakdown
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono-ll">
            Last {breakdown.length} months
          </span>
        </div>
        <div className="overflow-x-auto ll-scroll -mx-2">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
                  Month
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Base
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Incentive
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Deductions
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Net
                </th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium text-right">
                  Payslip
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((m) => (<tr key={m.month} className="border-b border-border hover:bg-muted/60 transition-colors">
                  <td className="px-3 py-2.5 font-mono-ll text-xs text-foreground">
                    {m.month}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-foreground">
                    ₹{m.base.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-[#f3ba60]">
                    +₹{m.incentive.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-[#736a6a]">
                    -₹{m.deductions.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-mono-ll text-[#F3BA60] font-semibold">
                    ₹{m.net.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => downloadPayslip(m)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[10px] text-[#F3BA60] hover:bg-[#F3BA60]/20 transition-colors">
                      <Download className="h-3 w-3"/> PDF
                    </button>
                  </td>
                </tr>))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#F3BA60]/20 bg-[#F3BA60]/[0.03]">
                <td className="px-3 py-3 text-xs font-semibold text-foreground">
                  YTD Total
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono-ll text-foreground">
                  ₹{ytdTotal.base.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono-ll text-[#f3ba60]">
                  +₹{ytdTotal.incentive.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono-ll text-[#736a6a]">
                  -₹{ytdTotal.deductions.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3 text-right text-sm font-mono-ll font-bold text-[#F3BA60]">
                  ₹{ytdTotal.net.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-3"/>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            Deductions breakdown: <span className="text-foreground">PF 12%</span> +{" "}
            <span className="text-foreground">Tax 5%</span> of base.
          </span>
        </div>
      </GlassCard>
    </div>);
}
/* ---------------- Research tab ---------------- */
function ResearchTab({ staff: s }) {
    const papers = s.research_papers ?? [];
    if (papers.length === 0)
        return null;
    return (<div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="h-4 w-4 text-[#F3BA60]"/>
          <h3 className="font-display text-xl text-foreground leading-none">
            Research Publications
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {papers.length} paper{papers.length > 1 ? "s" : ""} in peer-reviewed
          journals
        </p>
      </GlassCard>

      <div className="space-y-3">
        {papers.map((p, i) => (<motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.08, 0.3), duration: 0.3 }}>
            <GlassCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-ll text-[10px] text-[#F3BA60]">
                      [{i + 1}]
                    </span>
                    <span className="font-mono-ll text-[10px] text-muted-foreground">
                      {p.year}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground leading-snug">
                    {p.title}
                  </h4>
                  <p className="text-xs text-[#F3BA60] mt-1 italic">
                    {p.journal}
                  </p>
                </div>
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[10px] text-[#F3BA60] hover:bg-[#F3BA60]/20 transition-colors">
                  <ExternalLink className="h-3 w-3"/> DOI
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                {p.abstract}
              </p>
            </GlassCard>
          </motion.div>))}
      </div>
    </div>);
}
