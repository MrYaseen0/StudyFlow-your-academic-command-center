"use client";

import { motion } from "framer-motion";
import { Check, X, Clock, FileText, CalendarCheck, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type { AttendanceStatus } from "@/lib/types";
import { toast } from "sonner";
import { DrawCap } from "../Drawings";

const STATUS_META: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: typeof Check }> = {
  present: { label: "Present", color: "#6B8A6F", bg: "rgba(143, 168, 148, 0.16)", icon: Check },
  absent: { label: "Absent", color: "#B8506A", bg: "rgba(184, 80, 106, 0.14)", icon: X },
  late: { label: "Late", color: "#A87432", bg: "rgba(217, 165, 102, 0.16)", icon: Clock },
  excused: { label: "Excused", color: "#6B5D56", bg: "rgba(166, 154, 146, 0.16)", icon: FileText },
};

function dateKey(d: Date): string {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AttendanceView() {
  const courses = useStore((s) => s.courses);
  const attendance = useStore((s) => s.attendance);
  const setAttendance = useStore((s) => s.setAttendance);
  const [busy, setBusy] = useState<string | null>(null); // courseId being saved
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);

  // attendance lookup by `${courseId}|${dateKey}`
  const attMap = new Map<string, { status: AttendanceStatus; id: string }>();
  attendance.forEach((a) => {
    attMap.set(`${a.courseId}|${dateKey(new Date(a.date))}`, { status: a.status, id: a.id });
  });

  const handleCheckIn = async (courseId: string, status: AttendanceStatus) => {
    setBusy(courseId);
    try {
      await setAttendance(courseId, today.toISOString(), status);
      toast.success(`Marked ${STATUS_META[status].label.toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(null);
    }
  };

  // per-course attendance summary (all-time)
  const courseSummary = courses.map((c) => {
    const recs = attendance.filter((a) => a.courseId === c.id);
    const total = recs.length;
    const present = recs.filter((a) => a.status === "present" || a.status === "late").length;
    const pct = total === 0 ? null : Math.round((present / total) * 100);
    return { course: c, total, pct, recs };
  });

  // this week's grid (7 days x courses) for the weekly view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const isThisWeek = isSameDay(weekStart, startOfWeek(new Date()));

  // today's check-in status per course
  const todayCheckedIn = courses.filter((c) => attMap.has(`${c.id}|${todayKey}`)).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
          Attendance
        </h2>
        <p className="text-sm text-ink-secondary mt-1">
          Check in to each class you attend today. Your record stays with your account.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
          <DrawCap size={56} className="mx-auto mb-3 opacity-60" />
          <p className="text-sm text-ink-secondary">Add a course to start tracking attendance.</p>
        </div>
      ) : (
        <>
          {/* Today's check-in — the "taking class" feature */}
          <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CalendarCheck size={17} className="text-blush-deep" strokeWidth={1.5} />
                <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                  Today's check-in
                </h3>
              </div>
              <span className="text-xs text-ink-muted nums">
                {today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              {todayCheckedIn === courses.length
                ? "All classes checked in for today."
                : `${todayCheckedIn}/${courses.length} classes checked in.`}
            </p>

            <div className="space-y-2.5">
              {courses.map((c) => {
                const todayRec = attMap.get(`${c.id}|${todayKey}`);
                const isSaving = busy === c.id;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-primary truncate" style={{ fontFamily: "var(--font-serif)" }}>{c.name}</p>
                      <p className="text-[11px] text-ink-muted">{c.code}</p>
                    </div>
                    {todayRec ? (
                      (() => {
                        const M = STATUS_META[todayRec.status];
                        const Icon = M.icon;
                        return (
                          <span
                            className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium"
                            style={{ backgroundColor: M.bg, color: M.color }}
                          >
                            <Icon size={11} />
                            {M.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-[11px] text-ink-muted">Not marked</span>
                    )}
                    <div className="flex items-center gap-1">
                      {(Object.keys(STATUS_META) as AttendanceStatus[]).map((st) => {
                        const meta = STATUS_META[st];
                        const active = todayRec?.status === st;
                        return (
                          <button
                            key={st}
                            onClick={() => handleCheckIn(c.id, st)}
                            disabled={isSaving}
                            title={meta.label}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105"
                            style={active
                              ? { backgroundColor: meta.color, color: "#fff" }
                              : { backgroundColor: meta.bg, color: meta.color }}
                          >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <meta.icon size={13} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Per-course summary */}
          <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              Attendance rate by course
            </h3>
            <div className="space-y-3">
              {courseSummary.map(({ course, total, pct }) => (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                  <span className="text-xs text-ink-secondary w-24 truncate">{course.code}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: pct === null ? "0%" : `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: pct === null ? "var(--color-ink-muted)" : pct >= 75 ? "var(--color-success-sage)" : pct >= 50 ? "var(--color-amber-warning)" : "var(--color-rose-urgent)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold nums w-12 text-right" style={{ color: "var(--color-ink-secondary)" }}>
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                  <span className="text-[10px] text-ink-muted w-16 text-right nums">{total} {total === 1 ? "class" : "classes"}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Weekly grid */}
          <section className="rounded-card bg-white border border-border-soft shadow-warm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                This week
              </h3>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-7 h-7 rounded-md border border-border-soft flex items-center justify-center text-ink-secondary hover:bg-cream-elevated transition-colors" aria-label="Previous week"><ChevronLeft size={13} /></button>
                <span className="text-[11px] text-ink-secondary nums px-1.5">{weekLabel}</span>
                <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-7 h-7 rounded-md border border-border-soft flex items-center justify-center text-ink-secondary hover:bg-cream-elevated transition-colors" aria-label="Next week"><ChevronRight size={13} /></button>
                {!isThisWeek && <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-[11px] font-medium text-blush-deep px-1.5">Today</button>}
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-warm">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] uppercase tracking-wide text-ink-muted font-medium pb-2 pr-2 sticky left-0 bg-white">Course</th>
                    {weekDays.map((d, i) => (
                      <th key={i} className="text-center text-[10px] uppercase tracking-wide font-medium pb-2 px-1" style={{ color: isSameDay(d, today) ? "var(--color-blush-deep)" : "var(--color-ink-muted)" }}>
                        {["S", "M", "T", "W", "T", "F", "S"][d.getDay()]}<br />
                        <span className="nums">{d.getDate()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 pr-2 sticky left-0 bg-white">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-secondary font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.code}
                        </span>
                      </td>
                      {weekDays.map((d, i) => {
                        const rec = attMap.get(`${c.id}|${dateKey(d)}`);
                        const meta = rec ? STATUS_META[rec.status] : null;
                        const CellIcon = meta?.icon;
                        return (
                          <td key={i} className="text-center py-1.5 px-1">
                            {meta && CellIcon ? (
                              <span
                                className="inline-flex w-6 h-6 rounded-md items-center justify-center mx-auto"
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                                title={meta.label}
                              >
                                <CellIcon size={11} />
                              </span>
                            ) : (
                              <span className="text-ink-muted/30">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
