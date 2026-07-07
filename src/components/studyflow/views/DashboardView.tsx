"use client";

import { motion } from "framer-motion";
import { CalendarClock, Flame, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { getUrgency, isDueToday, relativeDueLabel } from "@/lib/urgency";
import { computeGpa } from "@/lib/gpa";
import { TaskList } from "../TaskList";
import { WeeklyHeatmap } from "../WeeklyHeatmap";
import { DrawBooks } from "../Drawings";

const DAY = 86400000;

export function DashboardView() {
  const tasks = useStore((s) => s.tasks);
  const courses = useStore((s) => s.courses);
  const grades = useStore((s) => s.grades);
  const targets = useStore((s) => s.targets);
  const sessions = useStore((s) => s.sessions);
  const setView = useStore((s) => s.setView);

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY);

  const dueToday = tasks.filter((t) => t.status !== "done" && isDueToday(t.dueDate));
  const overdue = tasks.filter(
    (t) => t.status !== "done" && getUrgency(t.dueDate, t.status, now) === "overdue",
  );
  const upcomingWeek = tasks.filter((t) => {
    if (t.status === "done") return false;
    const due = new Date(t.dueDate);
    return due > now && due <= weekAhead;
  });

  // today + upcoming combined for left column (urgency-ranked)
  const leftIds = new Set([...dueToday, ...overdue, ...upcomingWeek].map((t) => t.id));
  const leftList = tasks.filter((t) => leftIds.has(t.id));

  const { gpa, perCourse } = computeGpa(courses, grades, targets);

  const totalStudyMinutes = sessions
    .filter((s) => s.mode === "focus")
    .reduce((sum, s) => sum + s.duration, 0);
  const focusHours = (totalStudyMinutes / 60).toFixed(1);

  const hasData = courses.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-card border border-dashed border-border-soft p-10 text-center bg-white/40">
        <p className="text-sm text-ink-secondary">Add a course to get started.</p>
        <button
          onClick={() => setView("courses")}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blush-deep hover:text-rose-urgent transition-colors"
        >
          Go to Courses <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT — dominant 60% (3 of 5) */}
      <div className="lg:col-span-3 space-y-5">
        {/* Due today / overdue banner */}
        {(dueToday.length > 0 || overdue.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-card p-4 border"
            style={{
              backgroundColor: overdue.length > 0 ? "rgba(184, 80, 106, 0.06)" : "rgba(217, 165, 102, 0.07)",
              borderColor: overdue.length > 0 ? "rgba(184, 80, 106, 0.2)" : "rgba(217, 165, 102, 0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: overdue.length > 0 ? "rgba(184, 80, 106, 0.12)" : "rgba(217, 165, 102, 0.14)" }}
              >
                {overdue.length > 0 ? (
                  <AlertCircle size={18} style={{ color: "var(--color-rose-urgent)" }} />
                ) : (
                  <Flame size={18} style={{ color: "#A87432" }} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)", color: overdue.length > 0 ? "var(--color-rose-urgent)" : "#A87432" }}>
                  {overdue.length > 0
                    ? `${overdue.length} overdue ${overdue.length === 1 ? "task" : "tasks"} need attention`
                    : `${dueToday.length} ${dueToday.length === 1 ? "task" : "tasks"} due today`}
                </p>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {overdue.length > 0
                    ? "Move overdue work first — these are past their deadline."
                    : "Clear today's list before starting anything new."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...overdue, ...dueToday].slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => useStore.setState({ selectedTaskId: t.id, view: "timer" })}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-white/70 px-2 py-0.5 text-[11px] text-ink-secondary hover:bg-white transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-rose-urgent)" }} />
                      {t.title.length > 28 ? t.title.slice(0, 28) + "…" : t.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section: This week's deadlines */}
        <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={17} className="text-blush-deep" strokeWidth={1.5} />
              <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                This week
              </h2>
            </div>
            <span className="text-xs text-ink-muted nums">{leftList.length} deadlines</span>
          </div>

          {leftList.length === 0 ? (
            <div className="py-10 text-center">
              <div className="flex justify-center mb-3">
                <DrawBooks size={72} />
              </div>
              <p className="text-sm font-medium text-ink-secondary" style={{ fontFamily: "var(--font-serif)" }}>
                Nothing due this week.
              </p>
              <p className="text-xs text-ink-muted mt-1">Use the quiet to get ahead — or just rest.</p>
            </div>
          ) : (
            <TaskList tasks={leftList} showCompleted={false} emptyHint="" />
          )}
        </section>
      </div>

      {/* RIGHT — 40% (2 of 5) */}
      <div className="lg:col-span-2 space-y-5">
        {/* Weekly heatmap */}
        <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={15} className="text-blush-deep" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
              Workload, next 7 days
            </h2>
          </div>
          <WeeklyHeatmap />
        </section>

        {/* GPA snapshot */}
        <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-blush-deep" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                GPA snapshot
              </h2>
            </div>
            <button
              onClick={() => setView("grades")}
              className="text-[11px] font-medium text-ink-muted hover:text-blush-deep transition-colors inline-flex items-center gap-0.5"
            >
              Details <ArrowRight size={11} />
            </button>
          </div>

          {courses.length === 0 || perCourse.length === 0 ? (
            <p className="text-xs text-ink-muted py-4 text-center">Add grades to see your GPA.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-primary)" }}>
                  {gpa.toFixed(2)}
                </span>
                <span className="text-xs text-ink-muted mb-1">/ 4.0 projected</span>
              </div>

              <div className="space-y-2">
                {perCourse.slice(0, 4).map((r, i) => {
                  const c = courses[i];
                  if (!c) return null;
                  return (
                    <div key={r.courseId} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[11px] text-ink-secondary flex-1 truncate">{c.code}</span>
                      <span className="text-[11px] nums font-medium" style={{ color: "var(--color-ink-secondary)" }}>
                        {r.currentGrade !== null ? `${r.currentGrade.toFixed(0)}%` : "—"}
                      </span>
                      <span className="text-[11px] text-ink-muted">→</span>
                      <span className="text-[11px] nums font-semibold" style={{ color: "var(--color-blush-deep)" }}>
                        {r.projectedGrade.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Focus stat */}
        <section className="rounded-card border border-border-soft p-4 flex items-center gap-3" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(143, 168, 148, 0.15)" }}>
            <Flame size={18} style={{ color: "var(--color-success-sage)" }} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              {focusHours}h
            </p>
            <p className="text-[11px] text-ink-muted mt-1">focused this semester</p>
          </div>
        </section>
      </div>
    </div>
  );
}
