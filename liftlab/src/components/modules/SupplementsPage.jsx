"use client";
// ============================================================
// SupplementsPage — Module 7 of the LiftLab gym dashboard.
// Jeff-Nippard-inspired clean product layout (dark bg, dominant
// product image, science badge). Sections:
//   1. Sponsor Management — collapsible table of brand partnerships.
//   2. Category filter chips with per-category counts.
//   3. Product grid (Claymorphism) — image, name, brand, category
//      badge, science badge, price, sizes, stock status (with pulse
//      dot for low stock), member discount badge.
//   4. Detail modal — PieChart of macros, science notes, all sizes
//      with prices, recommended_for tags, action buttons.
//   5. Stock Management — Low Stock alert panel + Sales BarChart.
//
// Data structures (inline notes for review):
//  - `supplements` is the seed array (Supplement[]) imported from @/data/supplements.
//  - `sponsors` is the seed array (Sponsor[]) — we look one up by brand
//    via a HASH MAP (`sponsorByBrand`) for O(1) access.
//  - Per-category macronutrient breakdowns are deterministic synthetic
//    values derived from category + id hash (no Math.random). The seed
//    data doesn't carry nutrition_per_serving, so we synthesise it for
//    the PieChart in the detail modal.
// ============================================================
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Boxes, AlertTriangle, CheckCircle2, Percent, Handshake, ChevronDown, ShoppingCart, Tag, FlaskConical, TrendingUp, Plus, PackageOpen, DollarSign, } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, } from "recharts";
import { supplements, sponsors, } from "@/data/supplements";
import { toast } from "@/hooks/use-toast";
import { daysUntil } from "@/hooks/useAgeAutoUpdate";
import { GlassCard } from "@/components/ll/GlassCard";
import { NeumorphCard } from "@/components/ll/NeumorphCard";
import { ClayCard } from "@/components/ll/ClayCard";
import { StatKPI } from "@/components/ll/StatKPI";
import { StatusBadge } from "@/components/ll/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, } from "@/components/ui/collapsible";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
const CATEGORY_FILTERS = [
    "All",
    "Whey Protein",
    "Creatine",
    "BCAA",
    "Pre-Workout",
    "Fat Burner",
    "Vitamins",
    "Accessories",
    "Apparel",
];
const CATEGORY_ACCENT = {
    "Whey Protein": "#F3BA60",
    Creatine: "#f3ba60",
    BCAA: "#B6B1C0",
    "Pre-Workout": "#F3BA60",
    "Fat Burner": "#736a6a",
    Vitamins: "#f3ba60",
    Accessories: "#736A6A",
    Apparel: "#F3BA60",
};
// Deterministic synthetic macronutrient profile per category.
// (The seed data doesn't carry nutrition_per_serving — these are
// realistic per-serving values used only for the detail PieChart.)
const CATEGORY_MACROS = {
    "Whey Protein": { calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, sugar_g: 1 },
    Creatine: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 },
    BCAA: { calories: 10, protein_g: 5, carbs_g: 0, fat_g: 0, sugar_g: 0 },
    "Pre-Workout": { calories: 15, protein_g: 0, carbs_g: 3, fat_g: 0, sugar_g: 0 },
    "Fat Burner": { calories: 5, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 },
    Vitamins: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 },
    Accessories: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 },
    Apparel: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 },
};
const MACRO_COLORS = {
    protein_g: "#F3BA60",
    carbs_g: "#f3ba60",
    fat_g: "#F3BA60",
    sugar_g: "#736a6a",
};
// HASH MAP for sponsor lookup by brand — O(1) access.
const sponsorByBrand = Object.fromEntries(sponsors.map((s) => [s.brand, s]));
// ---------- Helpers (deterministic — no Math.random) ----------
/** Deterministic 0..N-1 hash from a string. */
function hashStr(s, mod) {
    let h = 7;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h % mod;
}
/** Deterministic synthetic "units sold this month" per product. */
function unitsSold(s) {
    // 5..35 range, deterministic per id.
    return hashStr(s.id, 31) + 5;
}
/** Stock status derived from stock_count. */
function stockStatus(s) {
    if (s.stock_count === 0)
        return { label: "Out of Stock", variant: "red", pulse: false };
    if (s.stock_count < 5)
        return { label: "Low Stock", variant: "orange", pulse: true };
    return { label: "In Stock", variant: "green", pulse: false };
}
function inr(n) {
    return "₹" + n.toLocaleString("en-IN");
}
// ============================================================
// Page
// ============================================================
export function SupplementsPage() {
    const [category, setCategory] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const [sponsorsOpen, setSponsorsOpen] = useState(true);
    // KPIs
    const total = supplements.length;
    const inStock = supplements.filter((s) => s.stock_count >= 5).length;
    const lowStock = supplements.filter((s) => s.stock_count > 0 && s.stock_count < 5).length;
    const outOfStock = supplements.filter((s) => s.stock_count === 0).length;
    const avgDiscount = Math.round(supplements.reduce((a, s) => a + s.member_discount_pct, 0) / total);
    // Filtered grid
    const filtered = useMemo(() => category === "All"
        ? supplements
        : supplements.filter((s) => s.category === category), [category]);
    // Per-category counts
    const categoryCounts = useMemo(() => {
        const map = {};
        map["All"] = total;
        CATEGORY_FILTERS.slice(1).forEach((c) => {
            map[c] = supplements.filter((s) => s.category === c).length;
        });
        return map;
    }, [total]);
    const selected = useMemo(() => supplements.find((s) => s.id === selectedId) ?? null, [selectedId]);
    // Low stock list (for the Stock Management alert panel)
    const lowStockList = useMemo(() => supplements.filter((s) => s.stock_count < 5), []);
    return (<div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Supplements & Merch
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} products across 8 categories ·{" "}
            <span className="text-[#F3BA60]">{sponsors.length} brand partners</span>
            {lowStock > 0 && (<span className="text-[#F3BA60]"> · {lowStock} low-stock</span>)}
          </p>
        </div>
        {lowStock > 0 && (<StatusBadge variant="orange" pulse>
            <AlertTriangle className="h-3 w-3"/>
            {lowStock} restock alert{lowStock > 1 ? "s" : ""}
          </StatusBadge>)}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatKPI label="Total Products" value={total} sub={`${sponsors.length} brand partners`} accent="#F3BA60" icon={Boxes} delay={0}/>
        <StatKPI label="In Stock" value={inStock} sub={`${Math.round((inStock / total) * 100)}% of catalog`} accent="#f3ba60" icon={CheckCircle2} delay={0.05}/>
        <StatKPI label="Low Stock" value={lowStock} sub="< 5 units left" accent="#F3BA60" icon={AlertTriangle} delay={0.1}/>
        <StatKPI label="Out of Stock" value={outOfStock} sub="Needs reorder" accent="#736a6a" icon={PackageOpen} delay={0.15}/>
        <StatKPI label="Avg Member Off" value={`${avgDiscount}%`} sub="Across all products" accent="#B6B1C0" icon={Percent} delay={0.2}/>
      </div>

      {/* Sponsor Management (collapsible) */}
      <Collapsible open={sponsorsOpen} onOpenChange={setSponsorsOpen}>
        <GlassCard className="p-0 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#B6B1C0]/15 border border-[#B6B1C0]/30 flex items-center justify-center">
                  <Handshake className="h-4 w-4 text-[#B6B1C0]"/>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-foreground leading-none">
                    Sponsor Management
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {sponsors.length} active brand partnerships ·{" "}
                    {sponsors.filter((s) => daysUntil(s.expiry) <= 60 && daysUntil(s.expiry) >= 0).length}{" "}
                    expiring within 60d
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${sponsorsOpen ? "rotate-180" : ""}`}/>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border p-4">
              <SponsorsTable />
            </div>
          </CollapsibleContent>
        </GlassCard>
      </Collapsible>

      {/* Category filter chips */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((c) => {
            const active = category === c;
            const accent = c === "All" ? "#F3BA60" : CATEGORY_ACCENT[c];
            return (<button key={c} onClick={() => setCategory(c)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active
                    ? "bg-muted text-foreground border-border"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"}`} style={active ? { borderColor: `${accent}40`, color: accent } : undefined}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }}/>
                {c}
                <span className="font-mono-ll text-[10px] opacity-70">
                  {categoryCounts[c] ?? 0}
                </span>
              </button>);
        })}
        </div>
      </GlassCard>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((s, i) => (<motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}>
            <ProductCard product={s} onClick={() => setSelectedId(s.id)}/>
          </motion.div>))}
      </div>

      {filtered.length === 0 && (<div className="py-16 text-center text-sm text-muted-foreground">
          No products in this category.
        </div>)}

      {/* Stock Management */}
      <StockManagement lowStockList={lowStockList}/>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (<ProductDetailDialog product={selected} onOpenChange={(v) => !v && setSelectedId(null)}/>)}
      </AnimatePresence>
    </div>);
}
// ============================================================
// Sponsors Table
// ============================================================
function SponsorsTable() {
    return (<div className="overflow-x-auto ll-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="text-left font-medium py-2 pr-4">Brand</th>
            <th className="text-left font-medium py-2 pr-4">Deal Type</th>
            <th className="text-left font-medium py-2 pr-4">Discount</th>
            <th className="text-left font-medium py-2 pr-4">Expiry</th>
            <th className="text-left font-medium py-2 pr-4">Contact</th>
          </tr>
        </thead>
        <tbody>
          {sponsors.map((sp) => {
            const days = daysUntil(sp.expiry);
            const expiringSoon = days >= 0 && days <= 60;
            const expired = days < 0;
            return (<tr key={sp.brand} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <img src={sp.logo_url} alt="" loading="lazy" className="h-7 w-7 rounded-md object-cover bg-muted"/>
                    <span className="text-foreground font-medium">{sp.brand}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <StatusBadge variant="blue">{sp.deal_type}</StatusBadge>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="font-mono-ll text-[#f3ba60]">
                    {sp.discount_offered}% off
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-ll text-xs" style={{
                    color: expired ? "#736a6a" : expiringSoon ? "#F3BA60" : "#202022",
                }}>
                      {sp.expiry}
                    </span>
                    {expiringSoon && (<StatusBadge variant="orange" pulse>
                        {days}d left
                      </StatusBadge>)}
                    {expired && <StatusBadge variant="red">Expired</StatusBadge>}
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="font-mono-ll text-[10px] text-muted-foreground">
                    {sp.contact}
                  </span>
                </td>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
// ============================================================
// Product Card (Claymorphism)
// ============================================================
function ProductCard({ product: s, onClick, }) {
    const accent = CATEGORY_ACCENT[s.category];
    const stock = stockStatus(s);
    const firstSize = s.sizes[0];
    const firstPrice = s.price_inr[firstSize] ?? 0;
    const sponsor = sponsorByBrand[s.brand];
    const isLowStock = s.stock_count > 0 && s.stock_count < 5;
    const isOutOfStock = s.stock_count === 0;
    const hasMacros = s.category !== "Accessories" &&
        s.category !== "Apparel" &&
        s.category !== "Vitamins" &&
        s.category !== "Creatine";
    return (<ClayCard className={`p-0 overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform relative ${isLowStock ? "pulse-border" : ""}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
            }
        }}>
      {/* Product image (dominant) */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden">
        <img src={s.image} alt={s.name} loading="lazy" className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${isOutOfStock ? "grayscale opacity-60" : ""}`}/>
        {/* Category badge — top-left */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-sm" style={{
            backgroundColor: `${accent}20`,
            borderColor: `${accent}40`,
            color: accent,
        }}>
            {s.category}
          </span>
        </div>
        {/* Science badge — top-right (only if has macros / science notes) */}
        {hasMacros && (<div className="absolute top-2 right-2">
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm bg-[#f3ba60]/15 border-[#f3ba60]/40 text-[#f3ba60] cursor-help">
                  <FlaskConical className="h-2.5 w-2.5"/>
                  SCIENCE-BACKED
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card border border-border text-foreground text-xs max-w-[240px]">
                {s.science_notes}
              </TooltipContent>
            </UITooltip>
          </div>)}
        {/* Stock status — bottom-left */}
        <div className="absolute bottom-2 left-2">
          <StatusBadge variant={stock.variant} pulse={stock.pulse}>
            {isLowStock ? `Low Stock · ${s.stock_count} left` : stock.label}
          </StatusBadge>
        </div>
        {/* Member discount badge — bottom-right */}
        {s.member_discount_pct > 0 && (<div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm bg-[#B6B1C0]/15 border-[#B6B1C0]/40 text-[#B6B1C0]">
              <Percent className="h-2.5 w-2.5"/>
              {s.member_discount_pct}% off
            </span>
          </div>)}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {s.brand}
            </p>
            <h3 className="font-display text-lg text-foreground leading-tight mt-0.5 line-clamp-2">
              {s.name}
            </h3>
          </div>
          <span className="font-mono-ll text-[10px] text-[#F3BA60] shrink-0">
            {s.id}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[#F3BA60] text-[10px]">★</span>
          <span className="font-mono-ll text-[10px] text-muted-foreground">
            {s.rating.toFixed(1)} · {sponsor?.deal_type ?? "Retail"}
          </span>
        </div>

        {/* Sizes chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {s.sizes.map((sz) => (<span key={sz} className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px] font-mono-ll text-muted-foreground">
              {sz}
            </span>))}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              from
            </p>
            <p className="font-display text-2xl text-foreground leading-none mt-0.5">
              {inr(firstPrice)}
            </p>
          </div>
          <button onClick={(e) => {
            e.stopPropagation();
            toast({
                title: "Added to cart (demo)",
                description: `${s.name} · ${firstSize}`,
            });
        }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F3BA60]/12 border border-[#F3BA60]/30 text-[#F3BA60] text-[11px] font-medium hover:bg-[#F3BA60]/20 transition-colors">
            <ShoppingCart className="h-3 w-3"/>
            Add
          </button>
        </div>
      </div>
    </ClayCard>);
}
// ============================================================
// Product Detail Dialog — PieChart of macros + science + sizes + actions
// ============================================================
function ProductDetailDialog({ product: s, onOpenChange, }) {
    const accent = CATEGORY_ACCENT[s.category];
    const stock = stockStatus(s);
    const sponsor = sponsorByBrand[s.brand];
    const macros = CATEGORY_MACROS[s.category];
    const hasMacroData = macros.protein_g + macros.carbs_g + macros.fat_g + macros.sugar_g > 0;
    // PieChart data
    const macroData = hasMacroData
        ? [
            { name: "Protein", value: macros.protein_g, color: MACRO_COLORS.protein_g },
            { name: "Carbs", value: macros.carbs_g, color: MACRO_COLORS.carbs_g },
            { name: "Fat", value: macros.fat_g, color: MACRO_COLORS.fat_g },
            { name: "Sugar", value: macros.sugar_g, color: MACRO_COLORS.sugar_g },
        ].filter((d) => d.value > 0)
        : [];
    return (<Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[92vh] overflow-y-auto ll-scroll">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-xl overflow-hidden border shrink-0 h-24 w-24" style={{ borderColor: `${accent}30` }}>
              <img src={s.image} alt={s.name} className="h-full w-full object-cover"/>
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-3xl text-foreground leading-none">
                {s.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 font-mono-ll">
                {s.id} · {s.brand} · {s.category}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge variant={stock.variant} pulse={stock.pulse}>
                  {stock.label}
                  {s.stock_count > 0 && s.stock_count < 5 && ` · ${s.stock_count} left`}
                </StatusBadge>
                {s.member_discount_pct > 0 && (<StatusBadge variant="blue">
                    {s.member_discount_pct}% member off
                  </StatusBadge>)}
                {sponsor && (<StatusBadge variant="grey">
                    <Handshake className="h-3 w-3"/>
                    {sponsor.deal_type}
                  </StatusBadge>)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-foreground/90 mt-2">{s.description}</p>

        {/* Macros + Science notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Macros PieChart */}
          <NeumorphCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-[#f3ba60]"/>
              <h4 className="text-sm font-semibold text-foreground">
                Nutrition / Serving
              </h4>
            </div>
            {hasMacroData ? (<>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                        {macroData.map((d) => (<Cell key={d.name} fill={d.color}/>))}
                      </Pie>
                      <Tooltip contentStyle={{
                background: "rgba(32,32,34,0.95)",
                border: "1px solid rgba(246,246,246,0.10)",
                borderRadius: 12,
                fontSize: 12,
            }} formatter={(v, n) => [`${v}g`, n]}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="text-center">
                    <p className="font-display text-2xl text-[#F3BA60] leading-none">
                      {macros.calories}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      kcal
                    </p>
                  </div>
                  <div className="h-8 w-px bg-muted"/>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    {macroData.map((d) => (<div key={d.name} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}/>
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-mono-ll text-foreground">{d.value}g</span>
                      </div>))}
                  </div>
                </div>
              </>) : (<div className="h-44 flex flex-col items-center justify-center text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2"/>
                <p className="text-xs text-muted-foreground">
                  No macronutrient data — this is a {s.category.toLowerCase()} item.
                </p>
              </div>)}
          </NeumorphCard>

          {/* Science notes */}
          <NeumorphCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-[#F3BA60]"/>
              <h4 className="text-sm font-semibold text-foreground">Science Notes</h4>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {s.science_notes}
            </p>
            {s.recommended_for.length > 0 && (<div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Recommended For
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {s.recommended_for.map((r) => (<span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#f3ba60]/10 border border-[#f3ba60]/30 text-[#f3ba60]">
                      <Tag className="h-2.5 w-2.5"/>
                      {r}
                    </span>))}
                </div>
              </div>)}
          </NeumorphCard>
        </div>

        {/* Sizes & prices table */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Boxes className="h-4 w-4 text-[#F3BA60]"/>
            <h4 className="text-sm font-semibold text-foreground">
              Sizes & Prices
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono-ll">
              {s.sizes.length} variant{s.sizes.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {s.sizes.map((sz) => {
            const price = s.price_inr[sz] ?? 0;
            const memberPrice = s.member_discount_pct > 0
                ? Math.round(price * (1 - s.member_discount_pct / 100))
                : price;
            return (<NeumorphCard key={sz} inset className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {sz}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display text-xl text-foreground leading-none">
                      {inr(price)}
                    </span>
                    {s.member_discount_pct > 0 && (<span className="font-mono-ll text-[10px] text-[#B6B1C0]">
                        {inr(memberPrice)} for members
                      </span>)}
                  </div>
                </NeumorphCard>);
        })}
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="mt-2">
          <button onClick={() => toast({
            title: "Update Price (demo)",
            description: `Price update workflow for ${s.name}`,
        })} className="px-3 py-2 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted">
            <DollarSign className="h-3.5 w-3.5 inline mr-1"/>
            Update Price
          </button>
          <button onClick={() => toast({
            title: "Add Stock (demo)",
            description: `Restock workflow for ${s.name} · current ${s.stock_count}`,
        })} className="px-3 py-2 rounded-lg bg-[#F3BA60]/12 border border-[#F3BA60]/30 text-[#F3BA60] text-xs font-medium hover:bg-[#F3BA60]/20">
            <Plus className="h-3.5 w-3.5 inline mr-1"/>
            Add Stock
          </button>
          <button onClick={() => toast({
            title: "Added to cart (demo)",
            description: `${s.name} · ${s.sizes[0]}`,
        })} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
            <ShoppingCart className="h-3.5 w-3.5 inline mr-1"/>
            Add to Cart
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
// ============================================================
// Stock Management — Low Stock alert + Sales BarChart
// ============================================================
function StockManagement({ lowStockList, }) {
    // Sales log summary — units sold per category (deterministic synthetic).
    const salesByCategory = useMemo(() => {
        const map = {};
        supplements.forEach((s) => {
            map[s.category] = (map[s.category] ?? 0) + unitsSold(s);
        });
        return Object.keys(map).map((cat) => ({
            category: cat.length > 10 ? cat.slice(0, 9) + "…" : cat,
            fullCat: cat,
            units: map[cat],
            fill: CATEGORY_ACCENT[cat],
        }));
    }, []);
    const totalUnits = salesByCategory.reduce((a, d) => a + d.units, 0);
    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Low Stock alert panel */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F3BA60]/15 border border-[#F3BA60]/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-[#F3BA60]"/>
            </div>
            <div>
              <h3 className="font-display text-xl text-foreground leading-none">
                Low Stock Alerts
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {lowStockList.length} product{lowStockList.length === 1 ? "" : "s"} need restock
              </p>
            </div>
          </div>
          <StatusBadge variant="orange" pulse>
            {lowStockList.length} alert{lowStockList.length === 1 ? "" : "s"}
          </StatusBadge>
        </div>
        {lowStockList.length === 0 ? (<div className="py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-[#f3ba60] mx-auto mb-2"/>
            <p className="text-sm text-foreground">All products well stocked</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              No restock alerts at this time.
            </p>
          </div>) : (<div className="space-y-2 max-h-80 overflow-y-auto ll-scroll">
            {lowStockList.map((s) => {
                const isOut = s.stock_count === 0;
                return (<div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/60 border border-[#F3BA60]/15">
                  <img src={s.image} alt="" loading="lazy" className="h-10 w-10 rounded-md object-cover shrink-0"/>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono-ll">
                      {s.id} · {s.brand}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg leading-none" style={{ color: isOut ? "#736a6a" : "#F3BA60" }}>
                      {s.stock_count}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      left
                    </p>
                  </div>
                  <button onClick={() => toast({
                        title: "Restock initiated (demo)",
                        description: `${s.name} · reorder +20 units`,
                    })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f3ba60]/12 border border-[#f3ba60]/30 text-[#f3ba60] text-[11px] font-medium hover:bg-[#f3ba60]/20 transition-colors shrink-0">
                    <Plus className="h-3 w-3"/>
                    Restock
                  </button>
                </div>);
            })}
          </div>)}
      </GlassCard>

      {/* Sales log summary BarChart */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F3BA60]/15 border border-[#F3BA60]/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#F3BA60]"/>
            </div>
            <div>
              <h3 className="font-display text-xl text-foreground leading-none">
                Sales Log · This Month
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {totalUnits} units sold across all categories
              </p>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByCategory} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,246,246,0.05)" vertical={false}/>
              <XAxis dataKey="category" tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={{ stroke: "rgba(246,246,246,0.08)" }} tickLine={false}/>
              <YAxis tick={{ fill: "#736A6A", fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{ fill: "rgba(246,246,246,0.03)" }} contentStyle={{
            background: "rgba(32,32,34,0.95)",
            border: "1px solid rgba(246,246,246,0.10)",
            borderRadius: 12,
            fontSize: 12,
        }} formatter={(v, _n, p) => [
            `${v} units`,
            p?.payload?.fullCat ?? "",
        ]}/>
              <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                {salesByCategory.map((d) => (<Cell key={d.fullCat} fill={d.fill}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>);
}
