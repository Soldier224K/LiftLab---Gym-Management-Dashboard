// hooks/useMaintenanceAlert.ts
// Memoised helper that surfaces overdue / due-soon machines from a list.
import { useMemo } from "react";
import { daysUntil } from "@/hooks/useAgeAutoUpdate";
const DUE_SOON_WINDOW_DAYS = 7;
/**
 * Returns counts and a sorted list of machines needing maintenance attention.
 *  - overdue    : next_service_due is in the past
 *  - dueSoon    : within DUE_SOON_WINDOW_DAYS days from today (inclusive)
 *  - alertMachines: union of the two, earliest due first
 */
export function useMaintenanceAlert(machines) {
    return useMemo(() => {
        const alertMachines = machines
            .filter((m) => {
            const days = daysUntil(m.next_service_due);
            return days <= DUE_SOON_WINDOW_DAYS; // overdue (negative) + within 7 days
        })
            .sort((a, b) => {
            const da = daysUntil(a.next_service_due);
            const db = daysUntil(b.next_service_due);
            return da - db; // earliest/most-overdue first
        });
        const overdueCount = machines.filter((m) => daysUntil(m.next_service_due) < 0).length;
        const dueSoonCount = machines.filter((m) => {
            const d = daysUntil(m.next_service_due);
            return d >= 0 && d <= DUE_SOON_WINDOW_DAYS;
        }).length;
        return {
            overdueCount,
            dueSoonCount,
            alertMachines,
            hasAlerts: alertMachines.length > 0,
        };
    }, [machines]);
}
