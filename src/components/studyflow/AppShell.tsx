"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { useStore } from "@/lib/store";
import { AuthScreen } from "./AuthScreen";
import { DashboardShell } from "./DashboardShell";
import { OnboardingFlow } from "./OnboardingFlow";
import { DashboardView } from "./views/DashboardView";
import { CoursesView } from "./views/CoursesView";
import { PlannerView } from "./views/PlannerView";
import { GradesView } from "./views/GradesView";
import { TimerView } from "./views/TimerView";
import { AttendanceView } from "./views/AttendanceView";
import { RecordsView } from "./views/RecordsView";
import { GoalsView } from "./views/GoalsView";
import { Loader2 } from "lucide-react";

function AppInner() {
  const { user, loading, logout } = useAuth();
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const logoutClear = useStore((s) => s.logoutClear);
  const courses = useStore((s) => s.courses);

  // hydrate data once the user is authenticated
  useEffect(() => {
    if (user && !hydrated) {
      hydrate();
    }
    if (!user && hydrated) {
      logoutClear();
    }
  }, [user, hydrated, hydrate, logoutClear]);

  // while session is being restored
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
            <span className="text-white font-serif font-semibold">S</span>
          </div>
          <Loader2 size={18} className="animate-spin text-ink-muted" />
        </div>
      </div>
    );
  }

  // not authenticated → auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // authenticated but data not yet loaded
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  // authenticated + hydrated but no courses → onboarding (first run)
  if (courses.length === 0) {
    return <OnboardingFlow />;
  }

  // main app — logout is wired into the shell header
  return (
    <DashboardShell onLogout={logout}>
      <ViewRouter />
    </DashboardShell>
  );
}

function ViewRouter() {
  const view = useStore((s) => s.view);
  return (
    <>
      {view === "dashboard" && <DashboardView />}
      {view === "courses" && <CoursesView />}
      {view === "goals" && <GoalsView />}
      {view === "planner" && <PlannerView />}
      {view === "attendance" && <AttendanceView />}
      {view === "grades" && <GradesView />}
      {view === "timer" && <TimerView />}
      {view === "records" && <RecordsView />}
    </>
  );
}

export function AppShell() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
