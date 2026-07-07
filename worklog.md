---
Task ID: 1
Agent: main (Z.ai Code)
Task: Build StudyFlow — a single-page academic command center (Next.js 16 + TS + Tailwind 4) implementing the exact design system and full feature scope from the project brief.

Work Log:
- Explored project scaffold: Next.js 16, Tailwind CSS 4 (@theme in globals.css), all needed deps present (framer-motion, zustand, recharts, dnd-kit, lucide-react, date-fns, sonner).
- Wrote design system in src/app/globals.css: exact cream/blush/ink/rose/amber/sage hex tokens in @theme + :root, warm shadow, 16px card radius, custom scrollbar, Fraunces/Inter/JetBrains Mono font tokens.
- Updated layout.tsx: loaded Fraunces (serif), Inter (sans), JetBrains Mono via next/font; moved font variable classes to <html> so tokens resolve at :root.
- Built domain layer: lib/types.ts, lib/store.ts (Zustand + localStorage persist), lib/urgency.ts (urgency levels + relative labels), lib/gpa.ts (4.0 scale + what-if projection), lib/sample-data.ts (demo semester).
- Built components under src/components/studyflow/:
  - AppShell (onboarding vs main app, hydration guard)
  - DashboardShell (sticky header, left sidebar nav desktop / bottom nav mobile, page transitions, sticky footer, quick-capture FAB)
  - CourseTag, UrgencyBadge, TaskCard (checkbox fill + strikethrough + slide-out completion, animated urgency accent), TaskList (AnimatePresence), TaskEditor (dialog), CourseEditor (dialog)
  - WeeklyHeatmap (7-day density, hover scale + tooltip)
  - QuickCaptureButton (spring-expand FAB → compact form, Enter to save)
  - views/DashboardView (asymmetric 60/40 grid, due-today/overdue banner, urgency-ranked list, heatmap, GPA snapshot, focus stat)
  - views/CoursesView (cards + add/edit/delete)
  - views/PlannerView (dnd-kit drag-to-reschedule, week nav, time preserved)
  - views/GradesView (GPA cards, Recharts bar chart current-vs-projected, per-course assessment editor, what-if target sliders)
  - views/TimerView (circular Pomodoro, focus/break, task linking, session history, JetBrains Mono digits)
  - OnboardingFlow (3-step: courses → deadlines → enter; plus "load sample semester" shortcut)
- Fixed lint: replaced setState-in-effect patterns in editors with lazy useState initializers (components mount fresh); restructured timer to chained setTimeout + completion effect with justified rule disable; removed manual useMemo (React Compiler handles it).
- Fixed font loading: next/font vars were on <body> but @theme tokens resolve at :root → moved to <html> + explicit :root font var definitions.

Verification (Agent Browser + VLM):
- Onboarding renders; "Sample semester" loads dashboard with 5 courses, 9 tasks, 13 grades.
- Dashboard: asymmetric grid, urgency-ranked task list, weekly heatmap (density + tooltips), GPA snapshot, due-today banner — all render. No console errors.
- Task completion: clicking checkbox slides task out of active list (400ms), heatmap updates live.
- All 5 views render correctly (Dashboard, Courses, Planner, Grades, Focus).
- Pomodoro: Start→Pause toggle works, task selector populated.
- Quick Capture: FAB expands to form, Enter saves, task appears in list + toast "Captured".
- Planner drag-to-reschedule: dragged Quiz 3 from Wed→Thu; localStorage confirms new due date with 10 AM time preserved.
- VLM confirms: serif headings (Fraunces), cream background, blush accents (no purple/blue), asymmetric grid, monospace timer digits, mobile bottom-nav + stacked layout. No visual defects.
- Lint: 0 errors. Dev log: clean, no runtime errors.

Stage Summary:
- StudyFlow is fully functional and visually matches the spec's design system (cream/blush palette, Fraunces serif headings, Inter body, JetBrains Mono timer, 16px cards, warm shadow, asymmetric dashboard).
- All 8 feature areas implemented: Smart Dashboard, Course Manager, Task Tracker with urgency escalation, Countdown/Urgency system, Pomodoro with task linking, GPA calculator with what-if projections, Weekly Planner with drag-to-reschedule, Quick Capture.
- State persists to localStorage; onboarding flow seeds the dashboard with no empty-state dead-ends.
- Single / route (per environment constraint) using view-switching via Zustand store instead of React Router.
- Browser-verified interactive and responsive.
