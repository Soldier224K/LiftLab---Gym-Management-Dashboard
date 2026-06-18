# LiftLab — Gym Management Dashboard

**Train Smart. Track Everything.**

A full-featured gym management dashboard built with Next.js 16, React, and JavaScript. Frontend-only — all data is seeded in JS files, no backend required.

---

## Quick Start

```bash
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open **http://localhost:3000**.

### Requirements
- Node.js 18+ (or Bun)
- No database setup needed — all data is in-memory

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | JavaScript (JSX) — no TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (New York style, 48 components) |
| State | Zustand 5 (3 stores) |
| Animation | Framer Motion 12 |
| Charts | Recharts 2 |
| Tables | @tanstack/react-table 8 |
| Dates | date-fns 4 |
| PDF | jsPDF 4 |
| Theme | next-themes |
| Fonts | Sora, Inter, JetBrains Mono |

---

## Functionality — 9 Modules

### 1. Dashboard
- 6 KPI cards: Active Members, Classes Today, Machines Operational, Revenue (MTD), Pending Fees, Staff On Duty
- **Progress Sorter** — bar chart ranking top 10 members by goal completion % (QuickSort). Click a bar to open that member's profile
- **Sensor Queue** — live FIFO feed of wearable sensor data (heart rate, calories, zone), updates every 3 seconds, shows last 12 entries
- **Today's Classes** — horizontal scroll of today's scheduled classes with enrollment/capacity status
- **Gym Space Balancer** — SVG floor plan with live occupancy per zone (Cardio, Free Weights, Machines, Group Class, Recovery)

### 2. Members

#### Members List
- Table with 15 members showing ID, photo, name, age, membership type, trainer, progress %, attendance %, fees status
- Search by name, ID, email, or trainer
- Filter by membership type (Basic, Pro, Elite, Medical-Referral) and status (Active, On Hold, Expired)
- Sort by joining date, fees pending, or progress %
- Click any row to open the full profile
- **Add Member button** — opens a modal form that adds a new member to the list instantly

#### Member Profile (8 tabs)
1. **Overview** — KPI pills (weight, body fat, streak, attendance), goals with progress rings, today's workout
2. **Workout Plan** — 7-day weekly split with expandable days, each exercise shows sets/reps/rest/HR zone. **Undo/Redo buttons** for workout changes (Stack-based). **HR Zone Planner** sidebar showing Max HR, 5 zones with bpm ranges, and a safety check that alerts if Zone 5 time exceeds 20 minutes for medical-flagged members
3. **Nutrition** — daily calorie gauge (RadialBar chart), macro split (protein/carbs/fat), 7-day meal plan accordion, supplement stack
4. **Progress** — weight and body fat line charts over time, strength 1RM cards (bench/squat/deadlift), body measurements
5. **Attendance** — GitHub-style 365-day heatmap, monthly summary cards with attendance rates
6. **Fees** — payment history timeline, outstanding balance banner, **Download Receipt** button (generates a PDF via jsPDF)
7. **Medical** — conditions, allergies, physician info, medical reports, training clearance status
8. **Documents** — membership agreement and document list

### 3. Staff

#### Staff List
- 8 staff cards with photo, name, role, members-assigned count, on-duty status
- Filter by role (Head Trainer, Personal Trainer, Nutritionist, Physiotherapist, Front Desk, Manager)
- Search by name or ID
- **Trainer ID Checker** — floating widget; type a trainer ID (e.g., STF-002) and it instantly shows ✓ VERIFIED with photo, role, today's classes, member count, or ✗ NOT FOUND. Uses a Hash Map for O(1) lookup

#### Staff Profile (5 tabs)
1. **Profile** — bio, qualifications, certifications with expiry alerts
2. **Members** — grid of assigned members with progress bars
3. **Attendance & Hours** — monthly log, BarChart comparing logged vs actual hours, late arrival count
4. **Salary** — monthly breakdown (base + incentive − deductions), YTD total, **Download Payslip** (PDF)
5. **Research** — papers list (nutritionist only)

### 4. Schedule
- **3 views:** Day, Week, Month (toggle)
- Week view: 7-column grid (Mon–Sun) with hourly time slots (5 AM–10 PM), class cards positioned by time
- Month view: calendar grid with class-count heat coloring per day
- **Add Class** modal — form with name, trainer (verified via Hash Map), type, room, capacity, time, days, level, color
- **Export PDF** — weekly schedule as a downloadable PDF
- Trainer verification: if you enter an invalid trainer ID, the form shows an inline error and disables submit

### 5. Machines & Space
- 5 KPIs: Total Machines, Operational, Under Maintenance, Out of Order, Overdue Service
- Filter tabs by status
- Grid of 27 machines with **skeuomorphic SVG icons** (treadmill, elliptical, rowing, cable, squat rack, bench, leg press, Smith machine)
- Status LED dot per machine (operational, maintenance, out of order)
- **Maintenance alerts** — cards with overdue service get a pulsing orange border and "OVERDUE by X days" badge
- Click a machine → detail modal with maintenance log timeline, reported issues, next service countdown
- **Log Maintenance** form — adds a new maintenance entry and recalculates the next service due date
- **Gym Space Balancer** — editable SVG floor plan with +/- buttons to adjust zone occupancy; colors update live

### 6. Nutrition
- **Two sub-views:** Plans Library | Member Nutrition
- Plans Library: cards for each member's nutrition plan, filter by nutritionist, goal type, calorie range
- Member Nutrition view: searchable member dropdown, then shows:
  - Daily calorie gauge vs target (RadialBar chart)
  - Macro tracker (protein, carbs, fat) as progress bars
  - 7-day meal plan accordion
  - Today's log entry form — add a meal, deducts from daily calorie budget
  - Weekly calorie trend (LineChart)
  - Prescribed supplement stack with capsule/pill SVG icons

### 7. Supplements & Products
- Collapsible **Sponsor Management** table (brand, deal type, discount, expiry, contact)
- 9 category filter chips (Whey Protein, Creatine, BCAA, Pre-Workout, Fat Burner, Vitamins, Accessories, Apparel)
- Product grid of 18 products with image, name, brand, price, sizes, stock status
- **Low stock alerts** — products with <5 units show a pulsing badge
- Click a product → detail modal with macro PieChart, science notes, all sizes/prices, recommended-for tags
- Stock management panel with restock buttons and a sales BarChart by category

### 8. Fees & Finance
- 4 KPIs: Total Collected, Pending, Overdue (>30 days), New This Month
- 12-month Revenue vs Collection AreaChart
- Fee status table with color-coded left borders (orange=partial, brown=overdue)
- Per-row actions:
  - **Send Reminder** — toast notification
  - **Mark Paid** — updates the member's fee status in local state, adds a payment history entry
  - **View History** — expandable row showing all past payments
  - **Download Receipt** — generates a PDF receipt via jsPDF
- Fee Cycle Reset banner explaining the monthly auto-billing logic

### 9. Reports
- 5 report types as cards: Member Progress, Monthly Revenue, Staff Attendance, Machine Maintenance, Class Utilization
- Click any card → A4-style preview modal with charts and data tables
- **Export PDF** button in each preview — generates a branded PDF via jsPDF

---

## DSA Implementations

| Structure | Where | What it does |
|-----------|-------|-------------|
| **Stack** | `useWorkoutHistory.js` | Undo/redo for workout plan changes. `push`, `undo`, `redo`. Pushing a new change clears the redo stack |
| **Queue (FIFO)** | `useSensorQueue.js` | Live sensor data feed. Enqueues a new reading every 3s, dequeues the oldest when over 12 entries |
| **QuickSort** | `progressSorter.js` | Sorts members by goal completion % (descending). In-place partition-based, O(n log n) |
| **Hash Map** | `StaffListPage.jsx`, `SchedulePage.jsx` | Trainer ID verification. `Object.fromEntries(staff.map(...))` built once with useMemo, O(1) lookup |

---

## Dynamic Features

### Add Member (working)
- Click "+ Add" in the top bar or "Add Member" on the Members page
- Fill the form (name, email, contact required; DOB, gender, blood group, height, weight, membership type, trainer, emergency contact optional)
- Submit → new member appears at the top of the members list immediately, toast confirms, form resets

### Settings (working)
- Click the gear icon in the sidebar or the profile avatar in the top bar
- Toggle: theme (light/dark), compact mode, gym space widget, sensor feed, currency (INR/USD)
- All settings persist to localStorage — survive page reloads

### Notifications (dynamic)
- Bell icon in the top bar shows unread count
- Click to open a dropdown with all notifications
- Each notification has a dismiss (X) button on hover
- "Clear" button to dismiss all
- **Dismissed notifications never reappear** — state persists to localStorage
- "All caught up" empty state when nothing is unread

### Theme Toggle
- Sun/moon icon in the top bar
- Switches between light and dark themes instantly
- Theme persists to localStorage
- No flash of unstyled content (pre-hydration script sets the theme class before React loads)

---

## State Management

Three Zustand stores:

| Store | File | Purpose | Persisted? |
|-------|------|---------|-----------|
| `navStore` | `navStore.js` | Active module + selected member/staff IDs | No |
| `appStore` | `appStore.js` | Members CRUD, notifications, settings | Notifications + settings only |
| `uiStore` | `uiStore.js` | Which modal is open (Add Member, Settings) | No |

---

## Seed Data

All data is in `src/data/` as plain JS arrays:

| File | Records | Description |
|------|---------|-------------|
| `members.js` | 15 | Full member profiles with goals, workout plans, nutrition, attendance, fees, medical |
| `staff.js` | 8 | Trainers, nutritionist, physiotherapist, front desk, manager |
| `classes.js` | 12 | Group, personal, open, specialty classes across the week |
| `machines.js` | 27 | Cardio, free weights, cable, racks, benches, leg press, Smith |
| `supplements.js` | 18 | Whey, creatine, BCAA, pre-workout, fat burner, vitamins, accessories, apparel + 6 sponsors |

---

## Scripts

```bash
bun run dev        # Start dev server on port 3000
bun run build      # Production build (standalone output)
bun run lint       # ESLint check
bun run db:push    # Push Prisma schema to SQLite (not required for LiftLab features)
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.jsx          # Root layout (fonts, ThemeProvider)
│   ├── page.jsx            # SPA shell (module switcher)
│   └── globals.css         # Design system
├── components/
│   ├── layout/             # Sidebar, Topbar
│   ├── ll/                 # Custom UI primitives (Logo, StatKPI, MachineIcon, etc.)
│   ├── modals/             # AddMemberModal, SettingsModal
│   ├── modules/            # 9 dashboard modules
│   └── ui/                 # 48 shadcn/ui components
├── data/                   # Seed data (members, staff, classes, machines, supplements)
├── hooks/                  # useSensorQueue, useWorkoutHistory, useAgeAutoUpdate, etc.
├── store/                  # Zustand stores (navStore, appStore, uiStore)
├── utils/                  # progressSorter, heartRateZone, spaceBalancer, format
└── lib/                    # cn() utility, Prisma client
```

---

## Notes

- **No backend required** — all data is in-memory JS. Refreshing the page resets members to seed data (notifications and settings persist).
- **Port 3000 only** — the dev server runs on port 3000.
- **BUSINESS_TODAY** — date-dependent features (membership expiry, machine service due) use a pinned reference date of 2025-02-15 so the demo behaves consistently regardless of the real system clock.
