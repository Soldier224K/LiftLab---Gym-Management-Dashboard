// utils/format.js — premium number formatting for LiftLab.
// Uses Indian numbering system (lakh/crore) for INR and clean grouping for stats.

/**
 * Format a number as Indian currency (₹ with lakh/crore grouping).
 *   482000 -> "₹4,82,000"
 *   6500   -> "₹6,500"
 */
export function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

/**
 * Compact Indian currency for tight spaces (K/L/Cr suffix).
 *   482000 -> "₹4.82L"
 *   6500   -> "₹6.5K"
 *   1200000 -> "₹1.2Cr"
 */
export function inrCompact(n) {
  const v = Number(n || 0);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2).replace(/\.00$/, "") + "Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2).replace(/\.00$/, "") + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + v;
}

/**
 * Plain number with Indian grouping.
 *   247 -> "247"
 *   12345 -> "12,345"
 */
export function num(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

/**
 * Percentage with 1 decimal (or 0 if whole).
 *   88 -> "88%"
 *   88.5 -> "88.5%"
 */
export function pct(n) {
  const v = Number(n || 0);
  return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "%";
}

/**
 * Pad a number with leading zeros (for IDs, counts).
 *   7, 3 -> "007"
 */
export function pad(n, len = 2) {
  return String(n).padStart(len, "0");
}
