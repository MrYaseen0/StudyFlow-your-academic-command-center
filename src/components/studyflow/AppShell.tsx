"use client";

import { useStore } from "@/lib/store";
import { DashboardShell } from "./DashboardShell";
import { OnboardingFlow } from "./OnboardingFlow";
import { DashboardView } from "./views/DashboardView";
import { CoursesView } from "./views/CoursesView";
import { PlannerView } from "./views/PlannerView";
import { GradesView } from "./views/GradesView";
import { TimerView } from "./views/TimerView";
import { useEffect, useState } from "react";

export function AppShell() {
  const onboarded = useStore((s) => s.onboarded);
  const view = useStore((s) => s.view);
  // avoid hydration mismatch from persisted store — canonical Next.js pattern
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-base">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
          <span className="text-white font-serif font-semibold text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardingFlow />;
  }

  return (
    <DashboardShell>
      {view === "dashboard" && <DashboardView />}
      {view === "courses" && <CoursesView />}
      {view === "planner" && <PlannerView />}
      {view === "grades" && <GradesView />}
      {view === "timer" && <TimerView />}
    </DashboardShell>
  );
}
