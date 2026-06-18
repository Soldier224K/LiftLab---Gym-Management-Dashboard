// utils/spaceBalancer.ts
// Gym zone occupancy definitions and helpers used by the dashboard's
// "Live Floor" panel to balance members across zones.
// Initial realistic snapshot — some zones near capacity to surface "red" alerts.
export const GYM_ZONES = [
    { id: "cardio", name: "Cardio Zone", capacity: 30, current: 26 },
    { id: "weights", name: "Free Weights", capacity: 25, current: 22 },
    { id: "machines", name: "Machines", capacity: 20, current: 9 },
    { id: "group", name: "Group Class", capacity: 40, current: 14 },
    { id: "recovery", name: "Recovery", capacity: 10, current: 4 },
];
/** Percentage occupancy (0-100) for a single zone. */
export function occupancyPct(zone) {
    if (zone.capacity <= 0)
        return 0;
    return Math.round((zone.current / zone.capacity) * 100);
}
/**
 * Occupancy color gradient:
 *  - 0-60%   -> #f3ba60 (green)
 *  - 60-85%  -> #F3BA60 (orange)  (linear from green)
 *  - 85-100% -> #736a6a (red)     (linear from orange)
 */
export function occupancyColor(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    // Palette-only discrete colors — no interpolation
    if (clamped <= 60) return "#e0dbf3";   // lavender (low)
    if (clamped <= 85) return "#f3ba60";   // orange (mid)
    return "#736a6a";                       // brown (high)
}
/**
 * Overall floor status:
 *  - "Critical"  : at least one zone >= 90% capacity
 *  - "Crowded"   : at least one zone >= 75% capacity (but none critical)
 *  - "Balanced"  : all zones < 75%
 */
export function balanceStatus(zones) {
    const pcts = zones.map(occupancyPct);
    if (pcts.some((p) => p >= 90))
        return "Critical";
    if (pcts.some((p) => p >= 75))
        return "Crowded";
    return "Balanced";
}
/**
 * Suggests moving members from the most crowded zone to the least crowded zone.
 * Returns the number of members to move (a "soft" rebalance suggestion) plus
 * the from/to zone ids. Returns null if the floor is already balanced.
 */
export function suggestRebalance(zones) {
    if (zones.length === 0)
        return null;
    const sorted = zones
        .map((z) => ({ zone: z, pct: occupancyPct(z) }))
        .sort((a, b) => b.pct - a.pct);
    const busiest = sorted[0];
    const quietest = sorted[sorted.length - 1];
    // Suggest a move only if there's a meaningful gap (>=30pp)
    if (busiest.pct - quietest.pct < 30)
        return null;
    if (busiest.pct < 75)
        return null;
    if (quietest.pct > 60)
        return null;
    const moveCount = Math.max(1, Math.round((busiest.pct - quietest.pct) / 20));
    return { from: busiest.zone.id, to: quietest.zone.id, moveCount };
}
