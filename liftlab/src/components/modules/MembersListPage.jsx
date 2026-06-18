"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, Eye, Plus, ChevronDown, } from "lucide-react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper, } from "@tanstack/react-table";
import { staff } from "@/data/staff";
import { useNav } from "@/store/navStore";
import { useAppStore } from "@/store/appStore";
import { useUI } from "@/store/uiStore";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { GlassCard } from "@/components/ll/GlassCard";
import { calcAge, membershipStatus } from "@/hooks/useAgeAutoUpdate";
import { getMemberProgress, progressColor } from "@/utils/progressSorter";
const staffName = (id) => staff.find((s) => s.id === id)?.name ?? id;
export function MembersListPage() {
    const { openMember } = useNav();
    const { openAddMember } = useUI();
    const allMembers = useAppStore((s) => s.members);
    const [query, setQuery] = useState("");
    const [memFilter, setMemFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortKey, setSortKey] = useState("joining_date");
    const [sorting, setSorting] = useState([]);
    const derivedStatus = (m) => {
        const ms = membershipStatus(m.membership_expiry, m.fees.status === "Paid");
        if (ms === "Expired")
            return "Expired";
        if (m.fees.status === "Partial")
            return "On Hold";
        return "Active";
    };
    const filtered = useMemo(() => {
        let list = allMembers.filter((m) => {
            const q = query.trim().toLowerCase();
            const matchesQuery = !q ||
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                staffName(m.trainer_id).toLowerCase().includes(q);
            const matchesMem = memFilter === "All" || m.membership_type === memFilter;
            const matchesStatus = statusFilter === "All" || derivedStatus(m) === statusFilter;
            return matchesQuery && matchesMem && matchesStatus;
        });
        list = [...list].sort((a, b) => {
            if (sortKey === "joining_date")
                return new Date(b.joining_date).getTime() - new Date(a.joining_date).getTime();
            if (sortKey === "fees")
                return b.fees.total_due - a.fees.total_due;
            return getMemberProgress(b) - getMemberProgress(a);
        });
        return list;
    }, [allMembers, query, memFilter, statusFilter, sortKey]);
    const helper = createColumnHelper();
    const columns = useMemo(() => [
        helper.accessor("id", {
            header: "ID",
            cell: (info) => (<span className="font-mono-ll text-xs text-[#F3BA60]">{info.getValue()}</span>),
        }),
        {
            id: "photo",
            header: "Member",
            cell: ({ row }) => {
                const m = row.original;
                return (<div className="flex items-center gap-3 min-w-[200px]">
              <img src={m.photo} alt={m.name} className="h-9 w-9 rounded-full object-cover border border-border" loading="lazy"/>
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
              </div>
            </div>);
            },
        },
        {
            id: "age",
            header: "Age",
            cell: ({ row }) => (<span className="text-sm text-foreground">{calcAge(row.original.dob)}</span>),
        },
        helper.accessor("membership_type", {
            header: "Membership",
            cell: (info) => {
                const t = info.getValue();
                const v = t === "Elite" ? "blue" : t === "Pro" ? "green" : t === "Medical-Referral" ? "orange" : "grey";
                return <StatusBadge variant={v}>{t}</StatusBadge>;
            },
        }),
        {
            id: "trainer",
            header: "Trainer",
            cell: ({ row }) => (<span className="text-sm text-muted-foreground">{staffName(row.original.trainer_id)}</span>),
        },
        {
            id: "progress",
            header: "Progress",
            cell: ({ row }) => {
                const p = getMemberProgress(row.original);
                return (<div className="flex items-center gap-2 min-w-[120px]">
              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: progressColor(p) }}/>
              </div>
              <span className="text-xs font-mono-ll" style={{ color: progressColor(p) }}>
                {p}%
              </span>
            </div>);
            },
        },
        {
            id: "attendance",
            header: "Attendance",
            cell: ({ row }) => {
                const a = row.original.attendance;
                const pct = a.total_sessions_scheduled > 0
                    ? Math.round((a.attended / a.total_sessions_scheduled) * 100)
                    : 0;
                return (<span className={`text-sm font-mono-ll ${pct >= 80 ? "text-[#f3ba60]" : pct >= 60 ? "text-[#F3BA60]" : "text-[#736a6a]"}`}>
              {pct}%
            </span>);
            },
        },
        {
            id: "fees",
            header: "Fees",
            cell: ({ row }) => {
                const f = row.original.fees;
                return (<StatusBadge status={f.status} pulse={f.status === "Overdue"}>
              {f.status}
            </StatusBadge>);
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (<button onClick={() => openMember(row.original.id)} className="text-[#F3BA60] hover:bg-[#F3BA60]/10 p-1.5 rounded-md transition-colors" aria-label={`View ${row.original.name}`}>
            <Eye className="h-4 w-4"/>
          </button>),
        },
    ], [openMember]);
    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });
    return (<div className="space-y-4">
      {/* Toolbar */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border flex-1 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, ID, email or trainer…" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"/>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterSelect icon={<Filter className="h-3.5 w-3.5"/>} value={memFilter} onChange={(v) => setMemFilter(v)} options={["All", "Basic", "Pro", "Elite", "Medical-Referral"]}/>
            <FilterSelect icon={<Filter className="h-3.5 w-3.5"/>} value={statusFilter} onChange={(v) => setStatusFilter(v)} options={["All", "Active", "On Hold", "Expired"]}/>
            <FilterSelect icon={<ArrowUpDown className="h-3.5 w-3.5"/>} value={sortKey} onChange={(v) => setSortKey(v)} options={["joining_date", "fees", "progress"]} labels={{ joining_date: "Joining Date", fees: "Fees Pending", progress: "Progress %" }}/>
            <button onClick={openAddMember} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4"/> Add Member
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {allMembers.length}
        </span>
        {statusFilter !== "All" && (<span className="px-3 py-1.5 rounded-full bg-[#F3BA60]/10 border border-[#F3BA60]/30 text-[#F3BA60]">
            {statusFilter}
          </span>)}
        {memFilter !== "All" && (<span className="px-3 py-1.5 rounded-full bg-[#f3ba60]/10 border border-[#f3ba60]/30 text-[#f3ba60]">
            {memFilter}
          </span>)}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto ll-scroll">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (<tr key={hg.id} className="border-b border-border">
                  {hg.headers.map((header) => (<th key={header.id} onClick={header.column.getToggleSortingHandler()} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium cursor-pointer hover:text-foreground whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? " ▲" : " ▼") : ""}
                    </th>))}
                </tr>))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (<motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-b border-border hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => openMember(row.original.id)}>
                  {row.getVisibleCells().map((cell) => (<td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>))}
                </motion.tr>))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (<div className="py-12 text-center text-sm text-muted-foreground">
            No members match your filters.
          </div>)}
      </GlassCard>
    </div>);
}
function FilterSelect({ icon, value, onChange, options, labels, }) {
    return (<div className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border">
      <span className="text-muted-foreground">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm text-foreground outline-none cursor-pointer appearance-none pr-5 capitalize">
        {options.map((o) => (<option key={o} value={o} className="bg-card text-foreground">
            {labels?.[o] ?? o}
          </option>))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pointer-events-none absolute right-2.5"/>
    </div>);
}
