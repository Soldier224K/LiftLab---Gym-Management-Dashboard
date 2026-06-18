import { cn } from "@/lib/utils";
/**
 * LiftLab logo — a stylized barbell where the two weight plates form the
 * letters "L" and "L" (LiftLab initials). Neon electric-blue plates, white bar.
 * Pure inline SVG, no raster images.
 */
export function Logo({ className, showWordmark = true, size = 40 }) {
    return (<div className={cn("flex items-center gap-3", className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="LiftLab logo">
        {/* Left plate — forms an "L" */}
        <path d="M14 14 H22 V44 H34 V52 H14 Z" fill="#F3BA60" stroke="#F3BA60" strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Right plate — forms an "L" (mirrored visually as a plate) */}
        <path d="M42 14 H50 V52 H30 V44 H42 Z" fill="#F3BA60" stroke="#F3BA60" strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Bar connecting the plates — thin horizontal white line */}
        <rect x="6" y="30" width="52" height="3" rx="1.5" fill="#f6f6f6"/>
        {/* Collars */}
        <rect x="24" y="28" width="2.5" height="7" rx="1" fill="#f6f6f6" opacity="0.9"/>
        <rect x="37.5" y="28" width="2.5" height="7" rx="1" fill="#f6f6f6" opacity="0.9"/>
      </svg>
      {showWordmark && (<span className="font-display text-xl font-bold tracking-tight text-foreground leading-none">
          Lift<span className="text-[var(--primary)]">Lab</span>
        </span>)}
    </div>);
}
