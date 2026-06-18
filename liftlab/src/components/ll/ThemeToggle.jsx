"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);
    const isDark = theme === "dark";
    return (<button onClick={() => setTheme(isDark ? "light" : "dark")} className="relative h-9 w-9 rounded-lg border border-border bg-background/40 hover:bg-accent flex items-center justify-center transition-colors overflow-hidden" aria-label="Toggle theme" title={isDark ? "Switch to light" : "Switch to dark"}>
      <AnimatePresence mode="wait" initial={false}>
        {mounted && isDark ? (<motion.span key="moon" initial={{ y: -16, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 16, opacity: 0, rotate: 90 }} transition={{ duration: 0.22 }} className="text-[#F3BA60]">
            <Moon className="h-[18px] w-[18px]"/>
          </motion.span>) : (<motion.span key="sun" initial={{ y: -16, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 16, opacity: 0, rotate: 90 }} transition={{ duration: 0.22 }} className="text-[#F3BA60]">
            <Sun className="h-[18px] w-[18px]"/>
          </motion.span>)}
      </AnimatePresence>
    </button>);
}
