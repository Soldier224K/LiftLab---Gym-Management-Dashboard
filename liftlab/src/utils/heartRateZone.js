// utils/heartRateZone.ts
// Heart-rate zone definitions and helpers, including a medical-aware plan safety check.
export const HR_ZONES = [
    { zone: 1, name: "Recovery", min: 50, max: 60, color: "#b6b1c0" },
    { zone: 2, name: "Fat Burn", min: 60, max: 70, color: "#e0dbf3" },
    { zone: 3, name: "Aerobic", min: 70, max: 80, color: "#f3ba60" },
    { zone: 4, name: "Threshold", min: 80, max: 90, color: "#736a6a" },
    { zone: 5, name: "VO2 Max", min: 90, max: 100, color: "#202022" },
];
/** Maximum heart rate estimate using the classic 220 - age formula. */
export function maxHR(age) {
    return 220 - age;
}
/** Returns the HR zone whose [min, max] range contains the given percentage of max HR. */
export function zoneForPct(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    for (const z of HR_ZONES) {
        if (clamped >= z.min && clamped < z.max)
            return z;
    }
    // pct === 100 lands in zone 5
    return HR_ZONES[HR_ZONES.length - 1];
}
/** Returns the HR zone for an absolute heart-rate reading given the member's age. */
export function zoneForHR(hr, age) {
    const max = maxHR(age);
    return zoneForPct((hr / max) * 100);
}
/**
 * Approximate exercise duration (minutes) used for the safety calculation.
 * The spec says each exercise is approximated as 4 minutes.
 */
const MINUTES_PER_EXERCISE = 4;
/** Threshold for medical-flagged members — alert if >20 min in Zone 5. */
const ZONE5_MEDICAL_THRESHOLD_MIN = 20;
/**
 * Determines whether a workout plan is safe for a given member.
 *
 * - For medical-flagged members (e.g. cardiac/asthma), alert if the plan would put
 *   them in Zone 5 for more than 20 minutes. Each exercise is approximated as 4 min.
 * - For non-flagged members, the plan is considered safe regardless of zone 5 time
 *   (athletes can train VO2 Max freely), but we still flag if >60 min in zone 5
 *   as a soft warning.
 */
export function isSafePlan(exercises, medicalFlagged) {
    const zone5Minutes = exercises
        .filter((e) => e.hr_zone === 5)
        .length * MINUTES_PER_EXERCISE;
    if (medicalFlagged) {
        if (zone5Minutes > ZONE5_MEDICAL_THRESHOLD_MIN) {
            return {
                safe: false,
                reason: `Medical-flagged member: ${zone5Minutes} min in Zone 5 exceeds ${ZONE5_MEDICAL_THRESHOLD_MIN}-min limit. Reduce VO2-Max work or switch to Zone 4.`,
            };
        }
        if (zone5Minutes > 0) {
            return {
                safe: true,
                reason: `Medical-flagged member: ${zone5Minutes} min in Zone 5 within safe limit (${ZONE5_MEDICAL_THRESHOLD_MIN} min). Monitor HR closely.`,
            };
        }
        return {
            safe: true,
            reason: "Plan stays below Zone 5 — safe for medical-flagged member.",
        };
    }
    if (zone5Minutes > 60) {
        return {
            safe: false,
            reason: `Non-medical member: ${zone5Minutes} min in Zone 5 exceeds 60-min limit — excessive VO2-Max work, risk overtraining.`,
        };
    }
    return {
        safe: true,
        reason: `Plan within safe limits. ${zone5Minutes} min in Zone 5.`,
    };
}
