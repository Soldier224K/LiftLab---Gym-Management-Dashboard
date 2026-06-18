"use client";
import { GYM_ZONES, occupancyPct, occupancyColor } from "@/utils/spaceBalancer";
const ZONE_META = {
    // grid coordinates on a 1000x520 viewBox
    cardio: { x: 30, y: 30, w: 380, h: 220, icon: "Cardio" },
    weights: { x: 430, y: 30, w: 280, h: 220, icon: "Weights" },
    machines: { x: 730, y: 30, w: 240, h: 220, icon: "Machines" },
    group: { x: 30, y: 270, w: 520, h: 220, icon: "Group" },
    recovery: { x: 570, y: 270, w: 400, h: 220, icon: "Recovery" },
};
/** SVG floor plan of the gym with live occupancy fills. */
export function ZoneFloorPlan() {
    return (<div className="w-full overflow-x-auto hide-scrollbar">
      <svg viewBox="0 0 1000 520" className="w-full min-w-[640px] h-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gym floor plan with live occupancy">
        <defs>
          <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(246,246,246,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="1000" height="520" fill="var(--background)"/>
        <rect width="1000" height="520" fill="url(#floorGrid)"/>
        {/* outer wall */}
        <rect x="20" y="20" width="960" height="480" fill="none" stroke="rgba(246,246,246,0.12)" strokeWidth="2" rx="8"/>

        {/* Entrance */}
        <rect x="470" y="500" width="60" height="20" fill="var(--background)"/>
        <text x="500" y="514" textAnchor="middle" fill="#736A6A" fontSize="10" fontFamily="monospace">
          ENTRANCE
        </text>

        {GYM_ZONES.map((z) => {
            const m = ZONE_META[z.id];
            const pct = occupancyPct(z);
            const col = occupancyColor(pct);
            const fillOpacity = 0.10 + (pct / 100) * 0.45;
            return (<g key={z.id}>
              {/* zone box */}
              <rect x={m.x} y={m.y} width={m.w} height={m.h} rx="10" fill={col} fillOpacity={fillOpacity} stroke={col} strokeOpacity="0.5" strokeWidth="1.5"/>
              {/* zone label */}
              <text x={m.x + 14} y={m.y + 26} fill="#202022" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">
                {z.name}
              </text>
              {/* occupancy big number */}
              <text x={m.x + m.w - 14} y={m.y + 30} textAnchor="end" fill={col} fontSize="22" fontWeight="700" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">
                {z.current}/{z.capacity}
              </text>
              {/* occupancy bar */}
              <rect x={m.x + 14} y={m.y + m.h - 18} width={m.w - 28} height="6" rx="3" fill="rgba(246,246,246,0.06)"/>
              <rect x={m.x + 14} y={m.y + m.h - 18} width={(m.w - 28) * (pct / 100)} height="6" rx="3" fill={col}>
                <animate attributeName="width" from="0" to={(m.w - 28) * (pct / 100)} dur="0.8s" fill="freeze"/>
              </rect>
              {/* pct label */}
              <text x={m.x + 14} y={m.y + m.h - 22} fill={col} fontSize="10" fontFamily="monospace">
                {pct}% occupied
              </text>
            </g>);
        })}
      </svg>
    </div>);
}
