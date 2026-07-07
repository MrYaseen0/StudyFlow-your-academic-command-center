"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BookOpen, CalendarDays, GraduationCap, Timer, ClipboardCheck, FileText, LogOut, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import type { View } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QuickCaptureButton } from "./QuickCaptureButton";
import { DrawClock } from "./Drawings";
import { useAuth } from "./AuthContext";
import { useEffect } from "react";

const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "goals", label: "Goals", icon: Target },
  { id: "planner", label: "Planner", icon: CalendarDays },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "grades", label: "Grades", icon: GraduationCap },
  { id: "timer", label: "Focus", icon: Timer },
  { id: "records", label: "Records", icon: FileText },
];

export function DashboardShell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const tasks = useStore((s) => s.tasks);
  const { user } = useAuth();

  const activeCount = tasks.filter((t) => t.status !== "done").length;

  // keyboard: press "c" to quick capture
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        useStore.setState({ quickCaptureOpen: true });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-cream-base/80 border-b border-border-soft">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}
            >
              <span className="text-white font-serif font-semibold text-sm">S</span>
            </div>
            <div className="leading-none">
              <h1 className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.01em" }}>
                StudyFlow
              </h1>
              <p className="text-[10px] text-ink-muted mt-0.5 hidden sm:block">your academic command center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-secondary nums">
              <span className="w-1.5 h-1.5 rounded-full bg-blush-deep" />
              {activeCount} active {activeCount === 1 ? "task" : "tasks"}
            </span>
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-pill px-2.5 py-1" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                    style={{ backgroundColor: "var(--color-blush-deep)", fontFamily: "var(--font-serif)" }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs font-medium text-ink-secondary max-w-[120px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-cream-elevated hover:text-rose-urgent transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body: nav + main */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-6 py-6 pb-24 md:pb-6">
        {/* Desktop sidebar nav */}
        <nav className="hidden md:flex flex-col w-56 flex-shrink-0 sticky top-[72px] self-start h-[calc(100vh-96px)]">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                    active ? "text-ink-primary" : "text-ink-secondary hover:text-ink-primary hover:bg-cream-elevated",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: "rgba(232, 160, 172, 0.18)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                      style={{ backgroundColor: "var(--color-blush-deep)" }}
                    />
                  )}
                  <Icon size={17} strokeWidth={1.5} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-xl p-4 relative overflow-hidden" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
            <div className="absolute -right-2 -bottom-2 opacity-15 pointer-events-none">
              <DrawClock size={64} />
            </div>
            <div className="relative">
              <p className="text-[11px] font-semibold text-ink-secondary mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Quick tip
              </p>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Press <kbd className="px-1 py-0.5 rounded bg-white border border-border-soft text-[10px] font-mono">C</kbd> anywhere to capture a task in seconds.
              </p>
            </div>
          </div>
        </nav>

        {/* Main content with page transitions */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-cream-base/95 backdrop-blur-md border-t border-border-soft">
        <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  active ? "text-blush-deep" : "text-ink-muted",
                )}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick capture FAB */}
      <QuickCaptureButton />

      {/* Footer */}
      <footer className="mt-auto border-t border-border-soft bg-cream-elevated/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span>StudyFlow — track, prioritize, execute, review.</span>
          <span className="nums">Data stored locally on this device.</span>
        </div>
      </footer>
    </div>
  );
}
