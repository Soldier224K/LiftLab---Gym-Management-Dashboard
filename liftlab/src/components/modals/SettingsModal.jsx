"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useAppStore } from "@/store/appStore";
import { ThemeToggle } from "@/components/ll/ThemeToggle";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Sun, Moon, Activity, LayoutGrid, Coins, Info, } from "lucide-react";
export function SettingsModal({ open, onOpenChange }) {
    const settings = useAppStore((s) => s.settings);
    const updateSettings = useAppStore((s) => s.updateSettings);
    const { theme, setTheme } = useTheme();
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong p-0 overflow-hidden max-w-lg">
        <div className="specular relative">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="h-8 w-8 rounded-lg bg-[var(--primary)]/12 flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 text-[var(--primary)]"/>
              </span>
              Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Customize your LiftLab workspace preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto ll-scroll">
            {/* Appearance */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Appearance
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="h-4 w-4 text-[var(--primary)]"/> : <Sun className="h-4 w-4 text-[#F3BA60]"/>}
                    <div>
                      <p className="text-sm font-medium">Theme</p>
                      <p className="text-xs text-muted-foreground">Switch between light and dark</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-4 w-4 text-[var(--primary)]"/>
                    <div>
                      <p className="text-sm font-medium">Compact mode</p>
                      <p className="text-xs text-muted-foreground">Reduce padding and spacing</p>
                    </div>
                  </div>
                  <Switch checked={settings.compactMode} onCheckedChange={(v) => updateSettings({ compactMode: v })}/>
                </div>
              </div>
            </section>

            {/* Dashboard */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Dashboard
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-4 w-4 text-[var(--primary)]"/>
                    <div>
                      <p className="text-sm font-medium">Gym Space Balancer widget</p>
                      <p className="text-xs text-muted-foreground">Show the live floor plan on the dashboard</p>
                    </div>
                  </div>
                  <Switch checked={settings.showFloorWidget} onCheckedChange={(v) => updateSettings({ showFloorWidget: v })}/>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-[#f3ba60]"/>
                    <div>
                      <p className="text-sm font-medium">Live sensor feed</p>
                      <p className="text-xs text-muted-foreground">Stream wearable sensor data on the dashboard</p>
                    </div>
                  </div>
                  <Switch checked={settings.sensorFeed} onCheckedChange={(v) => updateSettings({ sensorFeed: v })}/>
                </div>
              </div>
            </section>

            {/* Localization */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Localization
              </h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                <div className="flex items-center gap-3">
                  <Coins className="h-4 w-4 text-[#F3BA60]"/>
                  <div>
                    <p className="text-sm font-medium">Currency</p>
                    <p className="text-xs text-muted-foreground">Display format for all amounts</p>
                  </div>
                </div>
                <Select value={settings.currency} onValueChange={(v) => updateSettings({ currency: v })}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ INR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* About */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                About
              </h4>
              <div className="p-4 rounded-lg bg-background/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-[var(--primary)]"/>
                  <p className="text-sm font-medium">LiftLab v1.0</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Premium gym management dashboard. Train Smart. Track Everything.
                  Built with Next.js, TypeScript, Tailwind CSS & liquid glass design.
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 font-mono-ll">
                  ITM Skills University · Capstone Project
                </p>
              </div>
            </section>
          </div>

          <div className="p-6 pt-4 border-t border-border flex justify-end">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
              Done
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
