"use client";
// ============================================================
// MachinesPage — Module 5 of the LiftLab gym dashboard.
// Skeuomorphic machine grid + maintenance alert system +
// Gym Space Balancer with editable zone occupancy.
//
// Data structures (inline notes for review):
//  - `machines` is the seed array (Machine[]) imported from @/data/machines.
//  - `maintenance_log` is treated as a STACK — new entries pushed to the head
//    of the local copy, latest-first display. We never mutate the seed array.
//  - Maintenance Alert System: uses `daysUntil(next_service_due)` from
//    @/hooks/useAgeAutoUpdate for O(1) date arithmetic. When
//    daysUntil <= 7 (or negative = overdue), the card pulses orange.
// ============================================================
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Wrench, AlertTriangle, CheckCircle2, MapPin, Plus, Minus, Wrench as WrenchIcon, History, Bug, CalendarClock, } from "lucide-react";
import { machines as seedMachines, } from "@/data/machines";
import { staff } from "@/data/staff";
import { useMaintenanceAlert } from "@/hooks/useMaintenanceAlert";
import { daysUntil, machineServiceStatus, BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ll/GlassCard";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { MachineIcon, shapeForMachine, statusColor, } from "@/components/ll/MachineIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GYM_ZONES, occupancyPct, occupancyColor, balanceStatus, } from "@/utils/spaceBalancer";
const FILTER_TABS = [
    "All",
    "Operational",
    "Under Maintenance",
    "Out of Order",
];
const STATUS_ACCENT = {
    Operational: "#f3ba60",
    "Under Maintenance": "#F3BA60",
    "Out of Order": "#736a6a",
};
const DUE_SOON_WINDOW = 7;
// Staff lookup hash map (for technician name resolution).
const STAFF_HASH = Object.fromEntries(staff.map((s) => [s.id, s]));
function staffName(id) {
    return STAFF_HASH[id]?.name ?? id;
}
// ============================================================
// Page
// ============================================================
export function MachinesPage() {
    // Local machine state — we keep a copy so logging maintenance
    // updates next_service_due + maintenance_log without mutating the seed.
    const [localMachines, setLocalMachines] = useState(seedMachines);
    const [filter, setFilter] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const { overdueCount, dueSoonCount, alertMachines, hasAlerts, } = useMaintenanceAlert(localMachines);
    const total = localMachines.length;
    const operational = localMachines.filter((m) => m.status === "Operational").length;
    const underMaint = localMachines.filter((m) => m.status === "Under Maintenance").length;
    const outOfOrder = localMachines.filter((m) => m.status === "Out of Order").length;
    // Filtered list for the grid.
    const filtered = useMemo(() => {
        if (filter === "All")
            return localMachines;
        return localMachines.filter((m) => m.status === filter);
    }, [filter, localMachines]);
    const selected = useMemo(() => localMachines.find((m) => m.id === selectedId) ?? null, [localMachines, selectedId]);
    // Push a maintenance log entry onto the machine's log (STACK-like, latest first)
    // and recompute next_service_due = today + service_interval_days.
    const handleLogMaintenance = (machineId, entry) => {
        setLocalMachines((prev) => prev.map((m) => {
            if (m.id !== machineId)
                return m;
            const today = new Date();
            const next = new Date(today);
            next.setDate(next.getDate() + m.service_interval_days);
            const nextDue = next.toISOString().slice(0, 10);
            return {
                ...m,
                // maintenance_log is a list/stack — newest at index 0
                maintenance_log: [entry, ...m.maintenance_log],
                last_serviced: entry.date,
                next_service_due: nextDue,
                // An Out-of-Order machine that's been serviced flips to Under Maintenance.
                status: m.status === "Out of Order" ? "Under Maintenance" : m.status,
            };
        }));
        toast({
            title: "Maintenance logged",
            description: `${machineId} · ${entry.type} · next service rescheduled`,
        });
    };
    return (<div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Machine Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} machines across 5 zones ·{" "}
            <span className="text-[#F3BA60]">{operational} operational</span>
            {hasAlerts && (<span className="text-[#F3BA60]">
                {" "}· {overdueCount} overdue · {dueSoonCount} due soon
              </span>)}
          </p>
        </div>
        {hasAlerts && (<StatusBadge variant="orange" pulse>
            <AlertTriangle className="h-3 w-3"/>
            {overdueCount + dueSoonCount} service alerts
          </StatusBadge>)}
      </div>

      {/* KPI row — neumorphic StatKPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatKPI label="Total Machines" value={total} sub="Across 5 zones" accent="#F3BA60" icon={Dumbbell} delay={0}/>
        <StatKPI label="Operational" value={operational} sub={`${Math.round((operational / total) * 100)}% of fleet`} accent="#f3ba60" icon={CheckCircle2} delay={0.05}/>
        <StatKPI label="Under Maintenance" value={underMaint} sub="In service bay" accent="#F3BA60" icon={Wrench} delay={0.1}/>
        <StatKPI label="Out of Order" value={outOfOrder} sub="Needs repair" accent="#736a6a" icon={AlertTriangle} delay={0.15}/>
        <StatKPI label="Overdue Service" value={overdueCount} sub={`${dueSoonCount} due soon (≤7d)`} accent={overdueCount > 0 ? "#736a6a" : "#f3ba60"} icon={CalendarClock} delay={0.2}/>
      </div>

      {/* Filter tabs */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab;
            const count = tab === "All"
                ? total
                : localMachines.filter((m) => m.status === tab).length;
            const accent = tab === "Operational"
                ? "#f3ba60"
                : tab === "Under Maintenance"
                    ? "#F3BA60"
                    : tab === "Out of Order"
                        ? "#736a6a"
                        : "#F3BA60";
            return (<button key={tab} onClick={() => setFilter(tab)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active
                    ? "bg-muted text-foreground border-border"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"}`} style={active ? { borderColor: `${accent}40`, color: accent } : undefined}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }}/>
                {tab}
                <span className="font-mono-ll text-[10px] opacity-70">{count}</span>
              </button>);
        })}
          {alertMachines.length > 0 && (<span className="ml-auto text-[10px] text-muted-foreground font-mono-ll hidden sm:inline">
              {alertMachines.length} machine(s) need attention
            </span>)}
        </div>
      </GlassCard>

      {/* Machine grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((m, i) => (<MachineCard key={m.id} machine={m} delay={Math.min(i * 0.04, 0.3)} onClick={() => setSelectedId(m.id)}/>))}
      </div>

      {filtered.length === 0 && (<div className="py-16 text-center text-sm text-muted-foreground">
          No machines match this filter.
        </div>)}

      {/* Gym Space Balancer — editable */}
      <GymSpaceBalancer />

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (<MachineDetailDialog machine={selected} onOpenChange={(v) => !v && setSelectedId(null)} onLogMaintenance={handleLogMaintenance}/>)}
      </AnimatePresence>
    </div>);
}
function MachineCard({ machine: m, delay, onClick }) {
    // O(1) date check via daysUntil.
    const daysToService = daysUntil(m.next_service_due);
    const serviceStatus = machineServiceStatus(m.next_service_due);
    const isAlert = serviceStatus !== "OK"; // Due Soon OR Overdue
    const isOverdue = serviceStatus === "Overdue";
    const ledColor = statusColor(m.status);
    const pulse = m.status === "Out of Order" || isOverdue;
    const shape = shapeForMachine(m.name, m.category);
    return (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}>
      <ClayCard className={`p-4 cursor-pointer hover:-translate-y-1 transition-transform relative ${isAlert ? "pulse-border" : ""}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
            }
        }} style={isAlert
            ? {
                borderColor: `${isOverdue ? "#736a6a" : "#F3BA60"}60`,
                boxShadow: `0 0 0 1px ${isOverdue ? "#736a6a" : "#F3BA60"}40`,
            }
            : undefined}>
        {/* Status LED */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${pulse ? "pulse-dot" : ""}`} style={{ backgroundColor: ledColor, boxShadow: `0 0 8px ${ledColor}` }}/>
        </div>

        {/* Skeuomorphic icon */}
        <div className="rounded-xl p-3 border mb-3 inline-flex" style={{
            backgroundColor: `${ledColor}10`,
            borderColor: `${ledColor}30`,
        }}>
          <MachineIcon shape={shape} size={48}/>
        </div>

        {/* Name + IDs */}
        <h3 className="font-display text-xl text-foreground leading-none truncate">
          {m.name}
        </h3>
        <p className="font-mono-ll text-[11px] text-[#F3BA60] mt-0.5">{m.id}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {m.brand} · {m.model}
        </p>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <StatusBadge variant={m.status === "Operational"
            ? "green"
            : m.status === "Under Maintenance"
                ? "orange"
                : "red"} pulse={pulse}>
            {m.status}
          </StatusBadge>
          {isAlert && (<StatusBadge variant={isOverdue ? "red" : "orange"} pulse={isOverdue}>
              <AlertTriangle className="h-3 w-3"/>
              {isOverdue
                ? `OVERDUE by ${Math.abs(daysToService)}d`
                : `Service in ${daysToService}d`}
            </StatusBadge>)}
        </div>

        {/* Footer info */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border text-[11px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Zone
            </p>
            <p className="text-foreground flex items-center gap-1 truncate mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground"/>
              {m.location_zone}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Usage
            </p>
            <p className="text-foreground font-mono-ll mt-0.5">
              {m.usage_hours_total.toLocaleString("en-IN")}h
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Next Service
            </p>
            <p className="font-mono-ll mt-0.5" style={{ color: isAlert ? (isOverdue ? "#736a6a" : "#F3BA60") : "#202022" }}>
              {m.next_service_due}{" "}
              <span className="text-muted-foreground">
                ({daysToService >= 0 ? `in ${daysToService}d` : `${Math.abs(daysToService)}d ago`})
              </span>
            </p>
          </div>
        </div>
      </ClayCard>
    </motion.div>);
}
function MachineDetailDialog({ machine: m, onOpenChange, onLogMaintenance, }) {
    const [showLogForm, setShowLogForm] = useState(false);
    const today = BUSINESS_TODAY.toISOString().slice(0, 10);
    const [logDate, setLogDate] = useState(today);
    const [logType, setLogType] = useState("Routine");
    const [logNotes, setLogNotes] = useState("");
    const [logTech, setLogTech] = useState("In-house Tech");
    const [logCost, setLogCost] = useState("");
    const daysToService = daysUntil(m.next_service_due);
    const serviceStatus = machineServiceStatus(m.next_service_due);
    const ledColor = statusColor(m.status);
    const shape = shapeForMachine(m.name, m.category);
    const submit = () => {
        if (!logNotes.trim() || !logTech.trim()) {
            toast({
                title: "Missing fields",
                description: "Work done & technician are required.",
            });
            return;
        }
        onLogMaintenance(m.id, {
            date: logDate,
            type: logType,
            notes: logNotes.trim(),
            technician: logTech.trim(),
        });
        // Reset form
        setLogNotes("");
        setLogType("Routine");
        setLogCost("");
        setShowLogForm(false);
    };
    return (<Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[92vh] overflow-y-auto ll-scroll">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-3 border shrink-0" style={{
            backgroundColor: `${ledColor}10`,
            borderColor: `${ledColor}30`,
            color: ledColor,
        }}>
              <MachineIcon shape={shape} size={56}/>
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-3xl text-foreground leading-none">
                {m.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 font-mono-ll">
                {m.id} · {m.brand} {m.model} · {m.category}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge variant={m.status === "Operational"
            ? "green"
            : m.status === "Under Maintenance"
                ? "orange"
                : "red"} pulse={m.status === "Out of Order"}>
                  {m.status}
                </StatusBadge>
                <StatusBadge variant={serviceStatus === "OK"
            ? "green"
            : serviceStatus === "Due Soon"
                ? "orange"
                : "red"} pulse={serviceStatus === "Overdue"}>
                  {serviceStatus === "OK"
            ? "Service OK"
            : serviceStatus === "Due Soon"
                ? `Service in ${daysToService}d`
                : `Overdue by ${Math.abs(daysToService)}d`}
                </StatusBadge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Vital stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-2">
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Zone
            </p>
            <p className="text-sm text-foreground font-medium mt-1">{m.location_zone}</p>
          </NeumorphCard>
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Usage (hrs)
            </p>
            <p className="font-display text-2xl text-[#F3BA60] mt-1 leading-none">
              {m.usage_hours_total.toLocaleString("en-IN")}
            </p>
          </NeumorphCard>
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Purchased
            </p>
            <p className="text-sm text-foreground font-mono-ll mt-1">{m.purchase_date}</p>
          </NeumorphCard>
          <NeumorphCard className="p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Service Interval
            </p>
            <p className="text-sm text-foreground font-mono-ll mt-1">
              {m.service_interval_days}d
            </p>
          </NeumorphCard>
          <NeumorphCard className="p-3 col-span-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Last Serviced
            </p>
            <p className="text-sm text-foreground font-mono-ll mt-1">{m.last_serviced}</p>
          </NeumorphCard>
          <NeumorphCard className="p-3 col-span-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Next Service Due
            </p>
            <p className="text-sm font-mono-ll mt-1" style={{
            color: serviceStatus === "Overdue"
                ? "#736a6a"
                : serviceStatus === "Due Soon"
                    ? "#F3BA60"
                    : "#f3ba60",
        }}>
              {m.next_service_due}{" "}
              <span className="text-muted-foreground">
                ({daysToService >= 0 ? `${daysToService}d` : `${Math.abs(daysToService)}d overdue`})
              </span>
            </p>
          </NeumorphCard>
        </div>

        {/* Issues reported */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bug className="h-4 w-4 text-[#F3BA60]"/>
            <h4 className="text-sm font-semibold text-foreground">
              Issues Reported
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono-ll">
              {m.issues_reported.length} total
            </span>
          </div>
          {m.issues_reported.length === 0 ? (<p className="text-xs text-muted-foreground py-2">No issues reported.</p>) : (<div className="space-y-1.5">
              {m.issues_reported.map((iss, idx) => (<div key={idx} className={`rounded-lg p-2.5 border text-xs ${iss.resolved
                    ? "bg-[#f3ba60]/5 border-[#f3ba60]/20"
                    : "bg-[#F3BA60]/5 border-[#F3BA60]/20"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground">{iss.issue}</span>
                    <StatusBadge variant={iss.resolved ? "green" : "orange"}>
                      {iss.resolved ? "Resolved" : "Open"}
                    </StatusBadge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono-ll mt-1">
                    {iss.reported_date} · by {staffName(iss.reported_by)}
                  </p>
                </div>))}
            </div>)}
        </div>

        {/* Maintenance log timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#F3BA60]"/>
              <h4 className="text-sm font-semibold text-foreground">
                Maintenance Log
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono-ll">
                {m.maintenance_log.length} entries · stack (latest first)
              </span>
            </div>
            <button onClick={() => setShowLogForm((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
              <WrenchIcon className="h-3.5 w-3.5"/>
              {showLogForm ? "Cancel" : "Log Maintenance"}
            </button>
          </div>

          <AnimatePresence>
            {showLogForm && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <NeumorphCard inset className="p-3 space-y-2 mb-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Date</Label>
                      <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs font-mono-ll text-foreground outline-none focus:border-[#F3BA60]/50"/>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Type</Label>
                      <select value={logType} onChange={(e) => setLogType(e.target.value)} className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-[#F3BA60]/50">
                        <option className="bg-card">Routine</option>
                        <option className="bg-card">Quarterly</option>
                        <option className="bg-card">Half-Yearly</option>
                        <option className="bg-card">Annual</option>
                        <option className="bg-card">Repair</option>
                        <option className="bg-card">Inspection</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Technician</Label>
                      <input value={logTech} onChange={(e) => setLogTech(e.target.value)} className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-[#F3BA60]/50"/>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Cost (₹)</Label>
                      <input type="number" min={0} value={logCost} onChange={(e) => setLogCost(e.target.value === "" ? "" : parseInt(e.target.value, 10))} placeholder="0" className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs font-mono-ll text-foreground outline-none focus:border-[#F3BA60]/50"/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Work Done *</Label>
                    <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} placeholder="Describe the maintenance performed…" rows={3} className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F3BA60]/50 resize-none"/>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-muted-foreground">
                      Next service auto-reschedules to{" "}
                      <span className="font-mono-ll text-[#F3BA60]">
                        today + {m.service_interval_days}d
                      </span>
                    </p>
                    <button onClick={submit} className="px-3 py-1.5 rounded-md bg-[#f3ba60] text-black text-xs font-semibold hover:bg-[#f3ba60]/90">
                      Save Entry
                    </button>
                  </div>
                </NeumorphCard>
              </motion.div>)}
          </AnimatePresence>

          {m.maintenance_log.length === 0 ? (<p className="text-xs text-muted-foreground py-2">No maintenance recorded.</p>) : (<div className="relative pl-5 space-y-2 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-muted">
              {m.maintenance_log.map((log, idx) => (<div key={idx} className="relative">
                  <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#F3BA60] border-2 border-background"/>
                  <div className="rounded-lg p-2.5 bg-muted/40 border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#F3BA60]">
                        {log.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono-ll">
                        {log.date}
                      </span>
                    </div>
                    <p className="text-xs text-foreground mt-1">{log.notes}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Technician: {log.technician}
                    </p>
                  </div>
                </div>))}
            </div>)}
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-muted">
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
// ============================================================
// Gym Space Balancer — editable zone occupancy.
// Local ZoneFloorPlan variant that takes zones as a prop so +/- buttons
// re-color the floor plan live.
// ============================================================
const ZONE_META = {
    // grid coords on a 1000x520 viewBox
    cardio: { x: 30, y: 30, w: 380, h: 220 },
    weights: { x: 430, y: 30, w: 280, h: 220 },
    machines: { x: 730, y: 30, w: 240, h: 220 },
    group: { x: 30, y: 270, w: 520, h: 220 },
    recovery: { x: 570, y: 270, w: 400, h: 220 },
};
function GymSpaceBalancer() {
    const [zones, setZones] = useState(() => GYM_ZONES.map((z) => ({ ...z })));
    const floorStatus = balanceStatus(zones);
    const adjust = (id, delta) => {
        setZones((prev) => prev.map((z) => z.id === id
            ? {
                ...z,
                current: Math.max(0, Math.min(z.capacity, z.current + delta)),
            }
            : z));
    };
    return (<GlassCard className="p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="font-display text-xl text-foreground leading-none">
            Gym Space Balancer
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Live zone occupancy · editable · floor plan re-colours as you adjust
          </p>
        </div>
        <StatusBadge status={floorStatus} pulse={floorStatus === "Critical"}>
          Floor: {floorStatus}
        </StatusBadge>
      </div>

      {/* Editable SVG floor plan */}
      <div className="w-full overflow-x-auto hide-scrollbar">
        <svg viewBox="0 0 1000 520" className="w-full min-w-[640px] h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gym floor plan with live editable occupancy">
          <defs>
            <pattern id="floorGridMachines" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(246,246,246,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="1000" height="520" fill="var(--background)"/>
          <rect width="1000" height="520" fill="url(#floorGridMachines)"/>
          <rect x="20" y="20" width="960" height="480" fill="none" stroke="rgba(246,246,246,0.12)" strokeWidth="2" rx="8"/>
          <rect x="470" y="500" width="60" height="20" fill="var(--background)"/>
          <text x="500" y="514" textAnchor="middle" fill="#736A6A" fontSize="10" fontFamily="monospace">
            ENTRANCE
          </text>

          {zones.map((z) => {
            const meta = ZONE_META[z.id];
            const pct = occupancyPct(z);
            const col = occupancyColor(pct);
            const fillOpacity = 0.1 + (pct / 100) * 0.45;
            return (<g key={z.id}>
                <rect x={meta.x} y={meta.y} width={meta.w} height={meta.h} rx="10" fill={col} fillOpacity={fillOpacity} stroke={col} strokeOpacity="0.5" strokeWidth="1.5"/>
                <text x={meta.x + 14} y={meta.y + 26} fill="#202022" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">
                  {z.name}
                </text>
                <text x={meta.x + meta.w - 14} y={meta.y + 30} textAnchor="end" fill={col} fontSize="22" fontWeight="700" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">
                  {z.current}/{z.capacity}
                </text>
                <rect x={meta.x + 14} y={meta.y + meta.h - 18} width={meta.w - 28} height="6" rx="3" fill="rgba(246,246,246,0.06)"/>
                <rect x={meta.x + 14} y={meta.y + meta.h - 18} width={(meta.w - 28) * (pct / 100)} height="6" rx="3" fill={col}>
                  <animate attributeName="width" from="0" to={(meta.w - 28) * (pct / 100)} dur="0.5s" fill="freeze"/>
                </rect>
                <text x={meta.x + 14} y={meta.y + meta.h - 22} fill={col} fontSize="10" fontFamily="monospace">
                  {pct}% occupied
                </text>
              </g>);
        })}
        </svg>
      </div>

      {/* Editable zone occupancy controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {zones.map((z) => {
            const pct = occupancyPct(z);
            const col = occupancyColor(pct);
            return (<NeumorphCard key={z.id} className="p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">
                {z.name}
              </p>
              <p className="font-display text-2xl mt-1 leading-none" style={{ color: col }}>
                {z.current}
                <span className="text-muted-foreground text-base">/{z.capacity}</span>
              </p>
              <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }}/>
              </div>
              <div className="flex items-center justify-between gap-2 mt-3">
                <button onClick={() => adjust(z.id, -1)} disabled={z.current <= 0} aria-label={`Decrease ${z.name} occupancy`} className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                  <Minus className="h-3.5 w-3.5 text-foreground"/>
                </button>
                <span className="text-[10px] font-mono-ll text-muted-foreground">
                  {pct}%
                </span>
                <button onClick={() => adjust(z.id, +1)} disabled={z.current >= z.capacity} aria-label={`Increase ${z.name} occupancy`} className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                  <Plus className="h-3.5 w-3.5 text-foreground"/>
                </button>
              </div>
            </NeumorphCard>);
        })}
      </div>
    </GlassCard>);
}
