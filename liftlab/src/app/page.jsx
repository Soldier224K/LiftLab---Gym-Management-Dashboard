"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNav } from "@/store/navStore";
import { useUI } from "@/store/uiStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardPage } from "@/components/modules/DashboardPage";
import { MembersListPage } from "@/components/modules/MembersListPage";
import { MemberProfilePage } from "@/components/modules/MemberProfilePage";
import { StaffListPage } from "@/components/modules/StaffListPage";
import { StaffProfilePage } from "@/components/modules/StaffProfilePage";
import { SchedulePage } from "@/components/modules/SchedulePage";
import { MachinesPage } from "@/components/modules/MachinesPage";
import { NutritionPage } from "@/components/modules/NutritionPage";
import { SupplementsPage } from "@/components/modules/SupplementsPage";
import { FeesPage } from "@/components/modules/FeesPage";
import { ReportsPage } from "@/components/modules/ReportsPage";
import { AddMemberModal } from "@/components/modals/AddMemberModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
export default function Home() {
    const { active, selectedMemberId, selectedStaffId } = useNav();
    const { openModal, closeModal } = useUI();
    useEffect(() => {
        const el = document.getElementById("ll-main");
        if (el)
            el.scrollTo({ top: 0, behavior: "smooth" });
    }, [active, selectedMemberId, selectedStaffId]);
    const renderModule = () => {
        switch (active) {
            case "dashboard":
                return <DashboardPage />;
            case "members":
                return selectedMemberId ? (<MemberProfilePage id={selectedMemberId}/>) : (<MembersListPage />);
            case "staff":
                return selectedStaffId ? (<StaffProfilePage id={selectedStaffId}/>) : (<StaffListPage />);
            case "schedule":
                return <SchedulePage />;
            case "machines":
                return <MachinesPage />;
            case "nutrition":
                return <NutritionPage />;
            case "supplements":
                return <SupplementsPage />;
            case "fees":
                return <FeesPage />;
            case "reports":
                return <ReportsPage />;
            default:
                return <DashboardPage />;
        }
    };
    return (<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Ambient gradient backdrop for premium depth */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)]/8 blur-3xl"/>
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-[#B6B1C0]/8 blur-3xl"/>
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-[#f3ba60]/6 blur-3xl"/>
      </div>

      {/* Sidebar (desktop) */}
      <div className="hidden lg:flex relative z-10">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />
        <main id="ll-main" className="flex-1 overflow-y-auto ll-scroll">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 px-4 md:px-8 py-6 max-w-[1600px] w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div key={`${active}-${selectedMemberId ?? ""}-${selectedStaffId ?? ""}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Global modals */}
      <AddMemberModal open={openModal === "addMember"} onOpenChange={(v) => !v && closeModal()}/>
      <SettingsModal open={openModal === "settings"} onOpenChange={(v) => !v && closeModal()}/>
    </div>);
}
