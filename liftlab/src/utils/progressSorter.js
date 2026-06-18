// utils/progressSorter.ts
// Sorts members by goal completion % using an explicit QuickSort (in-place, partition-based).
// O(n log n) average. Also exposes a progress-color gradient helper.
/**
 * Compute average goal completion % for a member.
 * Returns 0 for members with no goals.
 */
export function getMemberProgress(member) {
    if (!member.goals || member.goals.length === 0)
        return 0;
    const sum = member.goals.reduce((acc, g) => acc + g.completion_pct, 0);
    return Math.round((sum / member.goals.length) * 10) / 10; // 1 decimal
}
/**
 * In-place QuickSort partition.
 * Partitions items[lo..hi] around a pivot so that items > pivot are on the left
 * (descending order).
 */
function partition(items, lo, hi) {
    const pivot = items[Math.floor((lo + hi) / 2)].progress;
    let i = lo;
    let j = hi;
    while (i <= j) {
        // Descending: items > pivot go left
        while (items[i].progress > pivot)
            i++;
        while (items[j].progress < pivot)
            j--;
        if (i <= j) {
            const tmp = items[i];
            items[i] = items[j];
            items[j] = tmp;
            i++;
            j--;
        }
    }
    return i;
}
/**
 * Recursive QuickSort (descending by `.progress`).
 * Pure on the input reference — but mutates the array in place; we copy at the
 * top-level entry point so callers get a fresh array.
 */
function quickSortDesc(items, lo, hi) {
    if (lo >= hi)
        return;
    const p = partition(items, lo, hi);
    quickSortDesc(items, lo, p - 1);
    quickSortDesc(items, p, hi);
}
/**
 * Returns a NEW array sorted by `.progress` descending (highest progress first).
 * Implements QuickSort under the hood — does NOT use Array.sort.
 */
export function sortByProgressDesc(items) {
    const copy = items.slice();
    if (copy.length <= 1)
        return copy;
    quickSortDesc(copy, 0, copy.length - 1);
    return copy;
}
/**
 * Returns a palette color based on completion %.
 * Uses ONLY exact LiftLab palette colors — no interpolation.
 * 0-33%   -> #736a6a (brown — low)
 * 34-66%  -> #b6b1c0 (purple-gray — mid)
 * 67-100% -> #f3ba60 (orange — high)
 */
export function progressColor(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    if (clamped <= 33) return "#736a6a";
    if (clamped <= 66) return "#b6b1c0";
    return "#f3ba60";
}
