"use client";
import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { members as seedMembers } from "@/data/members";
import { staff } from "@/data/staff";
import { membershipStatus } from "@/hooks/useAgeAutoUpdate";
function buildInitialNotifications() {
    const now = Date.now();
    const notes = [];
    const overdueFees = seedMembers.filter((m) => m.fees.status === "Overdue");
    overdueFees.slice(0, 2).forEach((m, i) => {
        notes.push({
            id: `fee-${m.id}`,
            title: `Overdue fees: ${m.name}`,
            desc: `${m.id} · ₹${m.fees.total_due.toLocaleString("en-IN")} pending`,
            color: "#736a6a",
            category: "fee",
            createdAt: now - (i + 1) * 3600_000,
            read: false,
        });
    });
    const expired = seedMembers.filter((m) => membershipStatus(m.membership_expiry, m.fees.status === "Paid") === "Expired");
    expired.slice(0, 2).forEach((m, i) => {
        notes.push({
            id: `mem-${m.id}`,
            title: `Membership expired: ${m.name}`,
            desc: `${m.id} · expired ${m.membership_expiry}`,
            color: "#F3BA60",
            category: "membership",
            createdAt: now - (i + 3) * 3600_000,
            read: false,
        });
    });
    const medical = seedMembers.filter((m) => m.medical.conditions.length > 0);
    medical.slice(0, 1).forEach((m) => {
        notes.push({
            id: `med-${m.id}`,
            title: `Medical review: ${m.name}`,
            desc: `${m.id} · ${m.medical.conditions.join(", ")}`,
            color: "#F3BA60",
            category: "medical",
            createdAt: now - 6 * 3600_000,
            read: false,
        });
    });
    notes.push({
        id: `sys-welcome`,
        title: `Welcome back, Admin`,
        desc: `${staff.filter((s) => s.role.includes("Trainer") || s.role === "Manager").length} staff on duty · ${seedMembers.length} members tracked`,
        color: "#f3ba60",
        category: "system",
        createdAt: now - 24 * 3600_000,
        read: false,
    });
    return notes;
}
export const useAppStore = create()(persist((set, get) => ({
    members: seedMembers,
    addMember: (m) => set((s) => ({ members: [m, ...s.members] })),
    updateMember: (id, patch) => set((s) => ({
        members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
    markFeesPaid: (id) => set((s) => ({
        members: s.members.map((m) => {
            if (m.id !== id)
                return m;
            const today = new Date().toISOString().slice(0, 10);
            return {
                ...m,
                fees: {
                    ...m.fees,
                    status: "Paid",
                    total_due: 0,
                    payment_history: [
                        ...m.fees.payment_history,
                        {
                            date: today,
                            amount: m.fees.total_due || m.fees.monthly_fee,
                            mode: "Cash",
                            receipt: `RCP-${Date.now().toString().slice(-6)}`,
                        },
                    ],
                },
            };
        }),
    })),
    notifications: buildInitialNotifications(),
    markRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    })),
    dismiss: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, dismissed: true, read: true } : n),
    })),
    markAllRead: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
    clearAll: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, dismissed: true, read: true })),
    })),
    settings: {
        compactMode: false,
        showFloorWidget: true,
        sensorFeed: true,
        currency: "INR",
    },
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    _hydrated: false,
}), {
    name: "liftlab-store",
    storage: createJSONStorage(() => localStorage),
    // Skip automatic hydration to avoid SSR getServerSnapshot loops.
    // We manually rehydrate on the client (see useHydrateStore below).
    skipHydration: true,
    // Only persist notifications + settings (members re-seed each load)
    partialize: (state) => ({
        notifications: state.notifications,
        settings: state.settings,
    }),
    merge: (persisted, current) => {
        const p = persisted || {};
        const restoredNotes = (p.notifications ?? []).filter((n) => !n.dismissed);
        return {
            ...current,
            settings: p.settings ?? current.settings,
            members: current.members,
            notifications: restoredNotes.length > 0
                ? restoredNotes
                : current.notifications,
        };
    },
}));
// Manually rehydrate on the client only (avoids SSR loops).
if (typeof window !== "undefined") {
    useAppStore.persist.rehydrate();
}
// Selectors — return the raw array (stable store reference) and let
// components derive filtered views with useMemo. Returning a freshly
// filtered array from the selector causes infinite re-render loops
// with Zustand v5's default Object.is equality.
export const useNotifications = () => useAppStore((s) => s.notifications);
export const useUnreadCount = () => useAppStore((s) => s.notifications.filter((n) => !n.read && !n.dismissed).length);
export const useVisibleNotifications = () => {
    const notes = useNotifications();
    return useMemo(() => notes.filter((n) => !n.dismissed), [notes]);
};
