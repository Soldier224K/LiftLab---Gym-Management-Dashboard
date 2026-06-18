"use client";
import { create } from "zustand";
export const useUI = create((set) => ({
    openModal: null,
    openAddMember: () => set({ openModal: "addMember" }),
    openSettings: () => set({ openModal: "settings" }),
    closeModal: () => set({ openModal: null }),
}));
