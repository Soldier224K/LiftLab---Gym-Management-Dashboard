import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NeumorphCard } from "./NeumorphCard";

/**
 * Neumorphic KPI stat card with animated value reveal.
 * Numbers use JetBrains Mono (tabular figures) for a premium data feel.
 * Supports a `cardColor` prop to rotate through the LiftLab palette:
 *   #E0DBF3 (lavender), #F3BA60 (orange), #B6B1C0 (purple-gray), #736A6A (brown)
 * Text color auto-adapts: dark on light cards, light on dark cards.
 */
export function StatKPI({ label, value, sub, icon: Icon, accent = "#202022", cardColor, trend, delay = 0 }) {
  // Determine if card background is dark → use light text
  const isDarkCard = cardColor && ["#736A6A", "#202022"].includes(cardColor.toUpperCase());
  const textColor = isDarkCard ? "#f6f6f6" : "#202022";
  const subColor = isDarkCard ? "rgba(246,246,246,0.7)" : "#736A6A";

  return (
    <NeumorphCard
      className="p-4 relative overflow-hidden"
      style={cardColor ? { backgroundColor: cardColor, borderColor: "transparent" } : undefined}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] font-medium" style={{ color: subColor }}>
            {label}
          </p>
          <p
            className="font-mono-ll text-3xl md:text-[2.5rem] leading-none mt-2 font-semibold tabular-nums tracking-tight"
            style={{ color: textColor, fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1.5" style={{ color: subColor }}>
              {sub}
            </p>
          )}
          {trend && (
            <p className={cn("text-[11px] font-mono-ll mt-1.5", trend.up ? "text-[#f3ba60]" : "text-[#736a6a]")}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="shrink-0 rounded-xl p-2"
            style={{
              backgroundColor: isDarkCard ? "rgba(246,246,246,0.15)" : "rgba(32,32,34,0.08)",
              color: textColor,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </motion.div>
      <div
        className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-[0.10] blur-2xl"
        style={{ backgroundColor: isDarkCard ? "#F3BA60" : accent }}
      />
    </NeumorphCard>
  );
}
