"use client";
// ============================================================
// FeesPage — Module 8 of the LiftLab gym dashboard.
// KPI row + Fee Status Table (TanStack) w/ colored left borders,
// per-row actions (Reminder / Mark Paid / View History / Receipt PDF),
// 12-month Revenue vs Collection AreaChart, Fee Cycle Reset banner.
// Dark LiftLab-themed PDF receipts (jsPDF).
// ============================================================
import { Fragment, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Wallet, TrendingUp, CalendarClock, CheckCircle2, Bell, History, Download, ChevronDown, IndianRupee, AlertTriangle, UserPlus, } from "lucide-react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper, } from "@tanstack/react-table";
import { jsPDF } from "jspdf";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, } from "recharts";
import { members as seedMembers } from "@/data/members";
import { BUSINESS_TODAY } from "@/hooks/useAgeAutoUpdate";
import { useNav } from "@/store/navStore";
import { toast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ll/GlassCard";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
const STATUS_BORDER = {
    Paid: "#f3ba60",
    Partial: "#F3BA60",
    Overdue: "#736a6a",
};
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const money = (n) => "₹" + n.toLocaleString("en-IN");
/** Deterministic receipt id from member id + epoch seconds (no Math.random). */
function makeReceiptId(memberId) {
    const now = Date.now();
    const tail = (now % 9000) + 1000; // 1000-9999
    return `RCP-${memberId.slice(-3)}-${tail}`;
}
function todayISO() {
    return BUSINESS_TODAY.toISOString().slice(0, 10);
}
// ============================================================
// Component
// ============================================================
export function FeesPage() {
    const { openMember } = useNav();
    // Local fees overrides — Mark Paid mutates these.
    // seed data never mutated; overrides layer on top.
    const [feeOverrides, setFeeOverrides] = useState({});
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sorting, setSorting] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    // Augmented members with applied overrides
    const rows = useMemo(() => seedMembers.map((m) => feeOverrides[m.id] ? { ...m, fees: feeOverrides[m.id] } : m), [feeOverrides]);
    // ---------- KPIs ----------
    const kpis = useMemo(() => {
        const totalCollected = rows.reduce((s, m) => s + m.fees.total_paid, 0);
        const pending = rows.reduce((s, m) => s + m.fees.total_due, 0);
        const overdueMembers = rows.filter((m) => m.fees.status === "Overdue");
        const overdueAmount = overdueMembers.reduce((s, m) => s + m.fees.total_due, 0);
        const now = BUSINESS_TODAY;
        const newThisMonth = rows.filter((m) => {
            const d = new Date(m.joining_date + "T00:00:00");
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        return { totalCollected, pending, overdueAmount, overdueCount: overdueMembers.length, newThisMonth };
    }, [rows]);
    // ---------- 12-month revenue vs collection (deterministic synthetic) ----------
    const revenueData = useMemo(() => {
        const monthlyRevenue = rows.reduce((s, m) => s + m.fees.monthly_fee, 0);
        const now = BUSINESS_TODAY;
        const out = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const idx = 11 - i; // 0..11
            const collection = Math.round(monthlyRevenue * (0.85 + idx * 0.01));
            out.push({
                month: MONTH_ABBR[d.getMonth()],
                revenue: monthlyRevenue,
                collection,
            });
        }
        return out;
    }, [rows]);
    // ---------- Filtered rows for table ----------
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((m) => {
            const matchesQuery = !q ||
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "All" || m.fees.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [rows, query, statusFilter]);
    // ---------- TanStack Table ----------
    const helper = createColumnHelper();
    const columns = useMemo(() => [
        {
            id: "member",
            header: "Member",
            cell: ({ row }) => {
                const m = row.original;
                const overdue = m.fees.status === "Overdue";
                return (<div className="flex items-center gap-3 min-w-[220px]">
              {overdue && (<span className="h-2 w-2 rounded-full bg-[#736a6a] pulse-dot shrink-0" aria-label="Overdue"/>)}
              <img src={m.photo} alt={m.name} className="h-9 w-9 rounded-full object-cover border border-border" loading="lazy"/>
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono-ll truncate">{m.id}</p>
              </div>
            </div>);
            },
        },
        helper.accessor("membership_type", {
            header: "Plan",
            cell: (info) => {
                const t = info.getValue();
                const v = t === "Elite" ? "blue" : t === "Pro" ? "green" : t === "Medical-Referral" ? "orange" : "grey";
                return <StatusBadge variant={v}>{t}</StatusBadge>;
            },
        }),
        {
            id: "due_date",
            header: "Due Date",
            cell: ({ row }) => (<span className="text-xs text-foreground font-mono-ll">{row.original.membership_expiry}</span>),
        },
        helper.accessor((row) => row.fees.total_paid, {
            id: "paid",
            header: "Paid",
            cell: (info) => (<span className="text-sm font-mono-ll text-[#f3ba60]">{money(info.getValue())}</span>),
        }),
        helper.accessor((row) => row.fees.total_due, {
            id: "balance",
            header: "Balance",
            cell: (info) => {
                const v = info.getValue();
                return (<span className={`text-sm font-mono-ll ${v === 0 ? "text-muted-foreground" : "text-[#F3BA60]"}`}>
              {money(v)}
            </span>);
            },
        }),
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const s = row.original.fees.status;
                return (<StatusBadge status={s} pulse={s === "Overdue"}>
              {s}
            </StatusBadge>);
            },
        },
        {
            id: "last_payment",
            header: "Last Payment",
            cell: ({ row }) => {
                const ph = row.original.fees.payment_history;
                const last = ph.length > 0 ? ph[ph.length - 1] : null;
                if (!last)
                    return <span className="text-xs text-muted-foreground">—</span>;
                return (<div className="flex flex-col">
              <span className="text-xs text-foreground font-mono-ll">{last.date}</span>
              <span className="text-[10px] text-muted-foreground">{last.mode} · {last.receipt}</span>
            </div>);
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const m = row.original;
                return (<div className="flex items-center gap-1">
              <ActionButton title="Send Reminder" onClick={() => toast({
                        title: "Reminder sent",
                        description: `Payment reminder sent to ${m.name}.`,
                    })}>
                <Bell className="h-3.5 w-3.5"/>
              </ActionButton>
              <ActionButton title="Mark Paid" accent="#F3BA60" disabled={m.fees.total_due === 0} onClick={() => markPaid(m.id)}>
                <CheckCircle2 className="h-3.5 w-3.5"/>
              </ActionButton>
              <ActionButton title="View History" onClick={() => setExpandedId((cur) => (cur === m.id ? null : m.id))}>
                <History className="h-3.5 w-3.5"/>
              </ActionButton>
              <ActionButton title="Download Receipt" onClick={() => downloadReceipt(m)}>
                <Download className="h-3.5 w-3.5"/>
              </ActionButton>
            </div>);
            },
        },
    ], [feeOverrides]);
    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getRowId: (row) => row.id,
    });
    // ---------- Actions ----------
    function markPaid(memberId) {
        const member = rows.find((m) => m.id === memberId);
        if (!member)
            return;
        const prev = feeOverrides[memberId] ?? member.fees;
        if (prev.total_due === 0)
            return;
        const receipt = makeReceiptId(memberId);
        const newEntry = {
            date: todayISO(),
            amount: prev.total_due,
            mode: "Cash",
            receipt,
        };
        const updated = {
            ...prev,
            total_paid: prev.total_paid + prev.total_due,
            total_due: 0,
            status: "Paid",
            payment_history: [...prev.payment_history, newEntry],
        };
        setFeeOverrides((cur) => ({ ...cur, [memberId]: updated }));
        toast({
            title: "Payment recorded",
            description: `${member.name} · ${money(newEntry.amount)} · ${receipt}`,
        });
    }
    function downloadReceipt(member) {
        const ph = member.fees.payment_history;
        const last = ph.length > 0 ? ph[ph.length - 1] : null;
        if (!last) {
            toast({ title: "No receipts available", description: `${member.name} has no payment history.` });
            return;
        }
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
        doc.setFont("helvetica", "bold");
        doc.text("Payment Receipt", 20, 58);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Receipt #: ${last.receipt}`, 20, 72);
        doc.text(`Member: ${member.name} (${member.id})`, 20, 80);
        doc.text(`Date: ${last.date}`, 20, 88);
        doc.text(`Mode: ${last.mode}`, 20, 96);
        doc.line(20, 104, 190, 104);
        doc.setFontSize(22);
        doc.setTextColor(0, 255, 136);
        doc.text(`Rs. ${last.amount.toLocaleString("en-IN")}`, 20, 120);
        doc.setFontSize(10);
        doc.setTextColor(122, 122, 140);
        doc.text("Payment successful. Thank you.", 20, 130);
        doc.setFontSize(9);
        doc.text("LiftLab Gym Management System · contact@liftlab.in", 20, 280);
        doc.save(`${last.receipt}.pdf`);
        toast({ title: "Receipt downloaded", description: `${last.receipt}.pdf` });
    }
    // ---------- Render ----------
    return (<div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground leading-none">
            Fees &amp; Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Revenue collection, outstanding balances, and fee-cycle automation.
          </p>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatKPI label="Total Collected" value={money(kpis.totalCollected)} icon={IndianRupee} accent="#f3ba60" sub={`Across ${rows.length} members`} delay={0.02}/>
        <StatKPI label="Pending" value={money(kpis.pending)} icon={Wallet} accent="#F3BA60" sub="Outstanding balances" delay={0.06}/>
        <StatKPI label="Overdue (>30d)" value={money(kpis.overdueAmount)} icon={AlertTriangle} accent="#736a6a" sub={`${kpis.overdueCount} members overdue`} delay={0.1}/>
        <StatKPI label="New This Month" value={String(kpis.newThisMonth)} icon={UserPlus} accent="#F3BA60" sub="New memberships enrolled" delay={0.14}/>
      </div>

      {/* Revenue chart + Fee Cycle Reset banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-xl text-foreground leading-none">Revenue vs Collection</h3>
              <p className="text-xs text-muted-foreground mt-1">Trailing 12 months · deterministic</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[#F3BA60]"/> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[#f3ba60]"/> Collection
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F3BA60" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="#F3BA60" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f3ba60" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="#f3ba60" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.06)" vertical={false}/>
                <XAxis dataKey="month" stroke="#736A6A" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#736A6A" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => "₹" + (Number(v) / 1000).toFixed(0) + "k"}/>
                <Tooltip contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid rgba(246,246,246,0.08)",
            borderRadius: 12,
            color: "#202022",
            fontSize: 12,
        }} labelStyle={{ color: "#736A6A" }} formatter={(value) => money(value)}/>
                <Area type="monotone" dataKey="revenue" stroke="#F3BA60" strokeWidth={2} fill="url(#revGrad)"/>
                <Area type="monotone" dataKey="collection" stroke="#f3ba60" strokeWidth={2} fill="url(#colGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <NeumorphCard className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg p-2 bg-[#F3BA60]/12 border border-[#F3BA60]/30 text-[#F3BA60]">
              <CalendarClock className="h-5 w-5"/>
            </div>
            <h3 className="font-display text-xl text-foreground leading-none">Fee Cycle Reset</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            On the 1st of each month, the system auto-marks new dues (simulated via date logic).
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Each member&apos;s monthly fee is added to their balance; payment_history entries and
            status flags are recomputed by the <span className="font-mono-ll text-[#F3BA60]">useAgeAutoUpdate</span> hook (PS requirement class 3).
          </p>
          <div className="mt-auto pt-4">
            <div className="rounded-lg border border-[#f3ba60]/30 bg-[#f3ba60]/8 px-3 py-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#f3ba60] shrink-0"/>
              <p className="text-xs text-foreground">
                Next reset: <span className="font-mono-ll text-[#f3ba60]">01-{MONTH_ABBR[(BUSINESS_TODAY.getMonth() + 1) % 12]}</span>
              </p>
            </div>
          </div>
        </NeumorphCard>
      </div>

      {/* Toolbar */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border flex-1 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, ID, or email…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"/>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect icon={<Filter className="h-3.5 w-3.5"/>} value={statusFilter} onChange={(v) => setStatusFilter(v)} options={["All", "Paid", "Partial", "Overdue"]}/>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs mt-3">
          <span className="px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {rows.length}
          </span>
          {statusFilter !== "All" && (<span className="px-3 py-1.5 rounded-full bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[#F3BA60]">
              {statusFilter}
            </span>)}
        </div>
      </GlassCard>

      {/* Fee Status Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto ll-scroll">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (<tr key={hg.id} className="border-b border-border">
                  {hg.headers.map((header) => (<th key={header.id} onClick={header.column.getToggleSortingHandler()} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium cursor-pointer hover:text-foreground whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted()
                    ? header.column.getIsSorted() === "asc"
                        ? " ▲"
                        : " ▼"
                    : ""}
                    </th>))}
                </tr>))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => {
            const m = row.original;
            const borderColor = STATUS_BORDER[m.fees.status];
            const isExpanded = expandedId === m.id;
            return (<Fragment key={row.id}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-b border-border hover:bg-muted/60 transition-colors" style={{ borderLeft: `3px solid ${borderColor}` }}>
                      {row.getVisibleCells().map((cell) => (<td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>))}
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (<motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="border-b border-border" style={{ borderLeft: `3px solid ${borderColor}` }}>
                          <td colSpan={row.getVisibleCells().length} className="px-6 py-4 bg-muted/40">
                            <PaymentHistoryPanel member={m} onViewProfile={() => openMember(m.id)}/>
                          </td>
                        </motion.tr>)}
                    </AnimatePresence>
                  </Fragment>);
        })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (<div className="py-12 text-center text-sm text-muted-foreground">
            No members match your filters.
          </div>)}
      </GlassCard>
    </div>);
}
// ============================================================
// Action button — small icon button used in table rows.
// ============================================================
function ActionButton({ children, title, onClick, accent = "#736A6A", disabled, }) {
    return (<button title={title} aria-label={title} onClick={onClick} disabled={disabled} className="p-1.5 rounded-md border border-border bg-muted/60 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed" style={{ color: accent }}>
      {children}
    </button>);
}
// ============================================================
// Payment History panel — shown when a row is expanded.
// payment_history is a list/stack; rendered latest-first.
// ============================================================
function PaymentHistoryPanel({ member, onViewProfile, }) {
    const ph = member.fees.payment_history;
    return (<div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Payment History · {member.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono-ll mt-0.5">
            {ph.length} entr{ph.length === 1 ? "y" : "ies"} · stack (latest first)
          </p>
        </div>
        <button onClick={onViewProfile} className="text-xs text-[#F3BA60] hover:bg-[#F3BA60]/10 px-2.5 py-1 rounded-md transition-colors">
          View Profile →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {[...ph].reverse().map((p, i) => (<div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-[#f3ba60]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#f3ba60]"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground font-mono-ll truncate">{p.receipt}</p>
                <p className="text-[10px] text-muted-foreground font-mono-ll truncate">
                  {p.date} · {p.mode}
                </p>
              </div>
            </div>
            <span className="font-display text-base text-[#f3ba60] leading-none shrink-0">
              {money(p.amount)}
            </span>
          </div>))}
      </div>
    </div>);
}
// ============================================================
// FilterSelect — small inline select dropdown (mirrors MembersListPage pattern).
// ============================================================
function FilterSelect({ icon, value, onChange, options, }) {
    return (<div className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border">
      <span className="text-muted-foreground">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm text-foreground outline-none cursor-pointer appearance-none pr-5 capitalize">
        {options.map((o) => (<option key={o} value={o} className="bg-card text-foreground">
            {o}
          </option>))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pointer-events-none absolute right-2.5"/>
    </div>);
}
