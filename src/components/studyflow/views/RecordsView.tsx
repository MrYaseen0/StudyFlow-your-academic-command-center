"use client";

import { motion } from "framer-motion";
import { GraduationCap, Clock, ClipboardCheck, Award, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeGpa, computeCourseGrade, percentageToLetter } from "@/lib/gpa";
import { DrawCap } from "../Drawings";

function dateKey(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function RecordsView() {
  const courses = useStore((s) => s.courses);
  const grades = useStore((s) => s.grades);
  const targets = useStore((s) => s.targets);
  const attendance = useStore((s) => s.attendance);
  const sessions = useStore((s) => s.sessions);
  const tasks = useStore((s) => s.tasks);

  const { gpa, perCourse } = computeGpa(courses, grades, targets);
  const totalCredits = courses.reduce((s, c) => s + c.creditHours, 0);

  // overall attendance
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attPct = totalAtt === 0 ? null : Math.round((presentAtt / totalAtt) * 100);

  // focus hours
  const focusMin = sessions.filter((s) => s.mode === "focus").reduce((s, x) => s + x.duration, 0);
  const focusHours = (focusMin / 60).toFixed(1);

  // tasks completed
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;

  if (courses.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
        <DrawCap size={56} className="mx-auto mb-3 opacity-60" />
        <p className="text-sm text-ink-secondary">Add courses to build your academic record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
          Records
        </h2>
        <p className="text-sm text-ink-secondary mt-1">
          Your consolidated academic transcript — grades, attendance, and focus, all in one place.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={GraduationCap} label="Projected GPA" value={gpa.toFixed(2)} sub="/ 4.0" color="#C9748A" />
        <SummaryCard icon={Award} label="Credits" value={String(totalCredits)} sub="hours" color="#8FA894" />
        <SummaryCard icon={ClipboardCheck} label="Attendance" value={attPct === null ? "—" : `${attPct}%`} sub={`${totalAtt} classes`} color="#D9A566" />
        <SummaryCard icon={Clock} label="Focus logged" value={`${focusHours}h`} sub={`${completedTasks}/${totalTasks} tasks done`} color="#B8506A" />
      </div>

      {/* Transcript table */}
      <section className="rounded-card bg-white border border-border-soft shadow-warm overflow-hidden">
        <div className="px-5 py-3 border-b border-border-soft flex items-center gap-2" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
          <TrendingUp size={15} className="text-blush-deep" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
            Course transcript
          </h3>
        </div>
        <div className="overflow-x-auto scrollbar-warm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-muted">
                <th className="text-left font-medium px-5 py-2.5">Course</th>
                <th className="text-center font-medium px-2 py-2.5">Credits</th>
                <th className="text-center font-medium px-2 py-2.5">Current</th>
                <th className="text-center font-medium px-2 py-2.5">Projected</th>
                <th className="text-center font-medium px-2 py-2.5">Grade</th>
                <th className="text-center font-medium px-2 py-2.5">GPA</th>
                <th className="text-center font-medium px-2 py-2.5">Att.</th>
                <th className="text-center font-medium px-5 py-2.5">Focus</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const r = perCourse[i];
                const cAtt = attendance.filter((a) => a.courseId === c.id);
                const cPresent = cAtt.filter((a) => a.status === "present" || a.status === "late").length;
                const cAttPct = cAtt.length === 0 ? null : Math.round((cPresent / cAtt.length) * 100);
                const cFocus = sessions.filter((s) => s.courseId === c.id && s.mode === "focus").reduce((s, x) => s + x.duration, 0);
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-border-soft hover:bg-cream-elevated/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-primary truncate" style={{ fontFamily: "var(--font-serif)" }}>{c.name}</p>
                          <p className="text-[11px] text-ink-muted">{c.code}{c.instructor ? ` · ${c.instructor}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-2 py-3 nums text-ink-secondary">{c.creditHours}</td>
                    <td className="text-center px-2 py-3 nums text-ink-secondary">{r?.currentGrade !== null && r?.currentGrade !== undefined ? `${r.currentGrade.toFixed(0)}%` : "—"}</td>
                    <td className="text-center px-2 py-3 nums font-semibold" style={{ color: c.color }}>{r ? `${r.projectedGrade.toFixed(0)}%` : "—"}</td>
                    <td className="text-center px-2 py-3">
                      {r && <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold" style={{ backgroundColor: `${c.color}1a`, color: c.color, fontFamily: "var(--font-serif)" }}>{r.projectedLetter}</span>}
                    </td>
                    <td className="text-center px-2 py-3 nums font-medium text-ink-primary">{r ? r.projectedGpa.toFixed(1) : "—"}</td>
                    <td className="text-center px-2 py-3 nums">
                      {cAttPct === null
                        ? <span className="text-ink-muted">—</span>
                        : <span style={{ color: cAttPct >= 75 ? "var(--color-success-sage)" : cAttPct >= 50 ? "var(--color-amber-warning)" : "var(--color-rose-urgent)" }} className="font-medium">{cAttPct}%</span>}
                    </td>
                    <td className="text-center px-5 py-3 nums text-ink-secondary">{cFocus > 0 ? `${(cFocus / 60).toFixed(1)}h` : "—"}</td>
                  </motion.tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-soft" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
                <td className="px-5 py-3 text-sm font-semibold text-ink-primary" style={{ fontFamily: "var(--font-serif)" }}>Overall</td>
                <td className="text-center px-2 py-3 nums font-semibold text-ink-primary">{totalCredits}</td>
                <td className="text-center px-2 py-3"></td>
                <td className="text-center px-2 py-3"></td>
                <td className="text-center px-2 py-3"></td>
                <td className="text-center px-2 py-3 nums font-bold text-blush-deep" style={{ fontFamily: "var(--font-serif)" }}>{gpa.toFixed(2)}</td>
                <td className="text-center px-2 py-3 nums font-semibold" style={{ color: attPct !== null && attPct >= 75 ? "var(--color-success-sage)" : "var(--color-ink-secondary)" }}>{attPct === null ? "—" : `${attPct}%`}</td>
                <td className="text-center px-5 py-3 nums font-semibold text-ink-primary">{focusHours}h</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <p className="text-[11px] text-ink-muted text-center">
        Records are private to your account. Only you can view this transcript.
      </p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }: { icon: typeof Clock; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-card bg-white border border-border-soft shadow-warm p-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}1a` }}>
        <Icon size={15} style={{ color }} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="flex items-end gap-1 mt-0.5">
        <span className="text-xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)" }}>{value}</span>
        <span className="text-[10px] text-ink-muted mb-0.5">{sub}</span>
      </div>
    </div>
  );
}
