import { cn } from "@/lib/utils";
const STROKE = "currentColor";
/**
 * Minimal skeuomorphic SVG silhouettes that look like real gym equipment.
 * Each icon drawn with thin neon strokes so the status LED reads clearly.
 */
export function MachineIcon({ shape, className, size = 44 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 64 64",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        className: cn("text-[#F3BA60]", className),
    };
    switch (shape) {
        case "treadmill":
            return (<svg {...common}>
          {/* base frame */}
          <rect x="6" y="44" width="52" height="6" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* belt */}
          <rect x="10" y="36" width="44" height="6" rx="3" stroke={STROKE} strokeWidth="2"/>
          {/* upright console post */}
          <path d="M50 44 V20" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* console */}
          <rect x="44" y="12" width="14" height="9" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* handlebar */}
          <path d="M44 24 H56" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* belt lines */}
          <path d="M16 39 H48 M22 36 V42 M40 36 V42" stroke={STROKE} strokeWidth="1" opacity="0.5"/>
        </svg>);
        case "elliptical":
            return (<svg {...common}>
          <ellipse cx="32" cy="40" rx="22" ry="6" stroke={STROKE} strokeWidth="2"/>
          <path d="M14 40 V48 M50 40 V48" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 40 L16 18" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          <path d="M42 40 L48 18" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          <rect x="12" y="14" width="8" height="6" rx="1" stroke={STROKE} strokeWidth="2"/>
          <rect x="44" y="14" width="8" height="6" rx="1" stroke={STROKE} strokeWidth="2"/>
          <circle cx="22" cy="40" r="2" stroke={STROKE} strokeWidth="1.5"/>
          <circle cx="42" cy="40" r="2" stroke={STROKE} strokeWidth="1.5"/>
        </svg>);
        case "rowing":
            return (<svg {...common}>
          {/* rail */}
          <path d="M6 44 H58" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* seat */}
          <rect x="24" y="38" width="14" height="5" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* seat post */}
          <path d="M28 43 V48 M34 43 V48" stroke={STROKE} strokeWidth="1.5"/>
          {/* footplate */}
          <path d="M52 44 V30" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          <path d="M48 30 H56" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* handle / chain */}
          <path d="M14 44 L22 30" stroke={STROKE} strokeWidth="1.5" strokeDasharray="2 2"/>
          <circle cx="22" cy="28" r="2.5" stroke={STROKE} strokeWidth="2"/>
          {/* front support */}
          <path d="M10 44 V50" stroke={STROKE} strokeWidth="1.5"/>
        </svg>);
        case "cable":
            return (<svg {...common}>
          {/* frame towers */}
          <path d="M12 14 V50 M52 14 V50" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* top crossbar */}
          <path d="M12 16 H52" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* pulleys */}
          <circle cx="18" cy="20" r="2.5" stroke={STROKE} strokeWidth="1.5"/>
          <circle cx="46" cy="20" r="2.5" stroke={STROKE} strokeWidth="1.5"/>
          {/* cables */}
          <path d="M18 22 V34" stroke={STROKE} strokeWidth="1" strokeDasharray="2 2"/>
          <path d="M46 22 V34" stroke={STROKE} strokeWidth="1" strokeDasharray="2 2"/>
          {/* handle */}
          <rect x="24" y="32" width="16" height="4" rx="2" stroke={STROKE} strokeWidth="1.5"/>
          {/* base */}
          <path d="M8 50 H56" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
        </svg>);
        case "squat-rack":
            return (<svg {...common}>
          {/* uprights */}
          <path d="M14 12 V52 M50 12 V52" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* top frame */}
          <path d="M14 14 H50" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* safety bars */}
          <path d="M14 40 H50" stroke={STROKE} strokeWidth="1.5"/>
          {/* J-hooks */}
          <path d="M14 26 H20 M50 26 H44" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* barbell resting on hooks */}
          <rect x="10" y="24" width="44" height="2.5" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          {/* plates */}
          <rect x="8" y="20" width="5" height="10" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          <rect x="51" y="20" width="5" height="10" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          {/* base feet */}
          <path d="M10 52 H18 M46 52 H54" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
        </svg>);
        case "bench":
            return (<svg {...common}>
          {/* bench pad */}
          <rect x="10" y="30" width="40" height="6" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* legs */}
          <path d="M14 36 V50 M26 36 V50 M38 36 V50 M50 36 V50" stroke={STROKE} strokeWidth="1.5"/>
          {/* uprights (bench press) */}
          <path d="M14 30 V14 M50 30 V14" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* bar */}
          <rect x="8" y="13" width="48" height="2.5" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          {/* plates */}
          <rect x="6" y="9" width="5" height="9" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          <rect x="53" y="9" width="5" height="9" rx="1" stroke={STROKE} strokeWidth="1.5"/>
        </svg>);
        case "leg-press":
            return (<svg {...common}>
          {/* sled rails (angled) */}
          <path d="M8 50 L48 18" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 50 L52 18" stroke={STROKE} strokeWidth="1" opacity="0.5"/>
          {/* seat */}
          <rect x="8" y="44" width="14" height="6" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* footplate */}
          <rect x="42" y="14" width="12" height="8" rx="2" stroke={STROKE} strokeWidth="2"/>
          {/* loaded weight */}
          <rect x="46" y="22" width="6" height="8" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          {/* base */}
          <path d="M6 50 H58" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
        </svg>);
        case "smith":
            return (<svg {...common}>
          {/* twin guide rails */}
          <path d="M20 10 V54 M44 10 V54" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* top frame */}
          <path d="M20 12 H44" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* base */}
          <path d="M16 54 H48" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
          {/* barbell locked on rails */}
          <rect x="14" y="30" width="36" height="3" rx="1.5" stroke={STROKE} strokeWidth="2"/>
          {/* sleeves / locks */}
          <rect x="18" y="28" width="4" height="7" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          <rect x="42" y="28" width="4" height="7" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          {/* plates */}
          <rect x="10" y="26" width="5" height="11" rx="1" stroke={STROKE} strokeWidth="1.5"/>
          <rect x="49" y="26" width="5" height="11" rx="1" stroke={STROKE} strokeWidth="1.5"/>
        </svg>);
        default:
            return null;
    }
}
/** Map a machine name/category to a skeuomorphic shape */
export function shapeForMachine(name, category) {
    const n = name.toLowerCase();
    if (n.includes("treadmill"))
        return "treadmill";
    if (n.includes("elliptical"))
        return "elliptical";
    if (n.includes("row"))
        return "rowing";
    if (n.includes("cable") || n.includes("lat") || n.includes("pulldown"))
        return "cable";
    if (n.includes("squat") || n.includes("rack") || n.includes("power"))
        return "squat-rack";
    if (n.includes("bench") || n.includes("press") && !n.includes("leg"))
        return "bench";
    if (n.includes("leg press"))
        return "leg-press";
    if (n.includes("smith"))
        return "smith";
    if (category === "Cardio")
        return n.includes("row") ? "rowing" : "treadmill";
    if (category === "Free Weights")
        return "squat-rack";
    return "cable";
}
/** Status LED dot color */
export function statusColor(status) {
    switch (status) {
        case "Operational":
            return "#f3ba60";
        case "Under Maintenance":
        case "Maintenance Due":
            return "#F3BA60";
        case "Out of Order":
        case "Overdue":
            return "#736a6a";
        default:
            return "#736A6A";
    }
}
