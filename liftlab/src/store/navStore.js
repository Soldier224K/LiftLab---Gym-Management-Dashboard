"use client";
import { create } from "zustand";
export const useNav = create((set) => ({
    active: "dashboard",
    selectedMemberId: null,
    selectedStaffId: null,
    set: (key) => set({ active: key, selectedMemberId: null, selectedStaffId: null }),
    openMember: (id) => set({ active: "members", selectedMemberId: id }),
    openStaff: (id) => set({ active: "staff", selectedStaffId: id }),
    backToMembers: () => set({ selectedMemberId: null }),
    backToStaff: () => set({ selectedStaffId: null }),
}));
