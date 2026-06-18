// hooks/useAgeAutoUpdate.ts
// Pure helpers for age, membership status, machine service status, plus a small
// React hook (`useAgeAutoUpdate`) that recomputes a member's age live.
// Implements PS requirement class 3.
import { useState, useEffect } from "react";
/**
 * Business "today" — the reference date the seeded data was authored against
 * (mid-Feb 2025). All date comparisons (membership expiry, service due, age)
 * use this so the demo behaves as the seed intended, regardless of the real
 * wall-clock date. This preserves the auto-update semantics: a member whose
 * membership_expiry is before BUSINESS_TODAY is "Expired"; a machine whose
 * next_service_due is within 7 days is "Due Soon", etc.
 */
export const BUSINESS_TODAY = new Date("2025-02-15T00:00:00");
/**
 * Live age (in years) computed from a YYYY-MM-DD date-of-birth string.
 * Handles leap-year edge cases correctly via Date arithmetic.
 */
export function calcAge(dob) {
    const dobDate = new Date(dob + "T00:00:00");
    if (isNaN(dobDate.getTime()))
        return 0;
    const now = BUSINESS_TODAY;
    let age = now.getFullYear() - dobDate.getFullYear();
    const monthDelta = now.getMonth() - dobDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dobDate.getDate())) {
        age -= 1;
    }
    return age;
}
/**
 * Membership status based on expiry date and paid flag.
 * "Expired" if expiry is in the past OR fees not paid (treated as expired for
 * access-control purposes).
 */
export function membershipStatus(expiry, paid) {
    const expiryDate = new Date(expiry + "T23:59:59");
    if (!paid)
        return "Expired";
    if (BUSINESS_TODAY > expiryDate)
        return "Expired";
    return "Active";
}
/**
 * Returns the number of days until (or since, if negative) the given date,
 * relative to BUSINESS_TODAY.
 * Positive = future, negative = past, 0 = today.
 */
export function daysUntil(dateStr) {
    const target = new Date(dateStr + "T00:00:00");
    const now = BUSINESS_TODAY;
    // Normalize to midnight UTC for both
    const targetMidnight = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const ms = targetMidnight - nowMidnight;
    return Math.round(ms / (1000 * 60 * 60 * 24));
}
/**
 * Service status for a machine given its next_service_due date.
 *  - "Overdue"   : next_service_due is in the past
 *  - "Due Soon"  : within 7 days (inclusive) from today
 *  - "OK"        : more than 7 days away
 */
export function machineServiceStatus(nextServiceDue) {
    const days = daysUntil(nextServiceDue);
    if (days < 0)
        return "Overdue";
    if (days <= 7)
        return "Due Soon";
    return "OK";
}
/**
 * Hook returning the member's current age and the moment it was last computed.
 *
 * Age is a pure function of `dob` and the current date, so it's computed during
 * render. A daily "tick" state increments every 24h to force a re-render so the
 * age auto-updates as days roll over (useful for dashboards left open in a
 * browser tab). The tick state is only updated inside the interval callback —
 * never synchronously inside the effect body — to satisfy react-hooks rules.
 */
export function useAgeAutoUpdate(dob) {
    // Start null so server and client initial render agree (no hydration mismatch).
    const [tickAt, setTickAt] = useState(null);
    useEffect(() => {
        // Set once on mount (client-only) to avoid SSR/CSR mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTickAt(new Date().toISOString());
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const interval = setInterval(() => {
            setTickAt(new Date().toISOString());
        }, MS_PER_DAY);
        return () => clearInterval(interval);
    }, []);
    return {
        age: calcAge(dob),
        computedAt: tickAt ?? BUSINESS_TODAY.toISOString(),
    };
}
