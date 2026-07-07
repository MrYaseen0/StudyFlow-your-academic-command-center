"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Target, TrendingUp, GraduationCap } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { computeGpa, computeCourseGrade, percentageToLetter } from "@/lib/gpa";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine,
} from "recharts";
import { toast } from "sonner";

export function GradesView() {
  const courses = useStore((s) => s.courses);
  const grades = useStore((s) => s.grades);
  const targets = useStore((s) => s.targets);
  const setTarget = useStore((s) => s.setTarget);
  const addGrade = useStore((s) => s.addGrade);
  const deleteGrade = useStore((s) => s.deleteGrade);
  const updateGrade = useStore((s) => s.updateGrade);

  const { gpa, perCourse } = useMemo(
    () => computeGpa(courses, grades, targets),
    [courses, grades, targets],
  );

  // current GPA (using current grades only, target = current)
  const currentGpa = useMemo(() => {
    const tgt: Record<string, number> = {};
    courses.forEach((c) => {
      const r = computeCourseGrade(c.id, grades);
      tgt[c.id] = r.currentGrade ?? 0;
    });
    return computeGpa(courses, grades, tgt).gpa;
  }, [courses, grades]);

  const chartData = courses.map((c, i) => {
    const r = perCourse[i];
    return {
      code: c.code,
      current: r?.currentGrade ?? 0,
      projected: r?.projectedGrade ?? 0,
      color: c.color,
    };
  });

  const totalCredits = courses.reduce((s, c) => s + c.creditHours, 0);

  if (courses.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
        <GraduationCap size={26} className="mx-auto mb-2 text-ink-muted" />
        <p className="text-sm text-ink-secondary">Add courses first to calculate your GPA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
          Grades &amp; GPA
        </h2>
        <p className="text-sm text-ink-secondary mt-1">
          Enter assessment scores. Drag the target slider to model what-if outcomes.
        </p>
      </div>

      {/* GPA summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-card bg-white border border-border-soft shadow-warm p-5">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Current GPA</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              {currentGpa.toFixed(2)}
            </span>
            <span className="text-xs text-ink-muted mb-1">/ 4.0</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-2">From grades entered so far</p>
        </div>

        <div className="rounded-card border p-5" style={{ backgroundColor: "rgba(232, 160, 172, 0.1)", borderColor: "rgba(201, 116, 138, 0.2)" }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-blush-deep)" }}>Projected GPA</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)", color: "var(--color-blush-deep)" }}>
              {gpa.toFixed(2)}
            </span>
            <span className="text-xs text-ink-muted mb-1">/ 4.0</span>
          </div>
          <p className="text-[11px] text-ink-secondary mt-2">If you hit every target</p>
        </div>

        <div className="rounded-card bg-white border border-border-soft shadow-warm p-5">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Credits</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              {totalCredits}
            </span>
            <span className="text-xs text-ink-muted mb-1">hours</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-2">Across {courses.length} {courses.length === 1 ? "course" : "courses"}</p>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="rounded-card bg-white border border-border-soft shadow-warm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-blush-deep" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
            Current vs projected grade
          </h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#6B5D56" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#A69A92" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(232, 160, 172, 0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #EDE0D5",
                  background: "#FFFFFF",
                  fontSize: 12,
                  boxShadow: "0 4px 20px rgba(46, 36, 32, 0.06)",
                }}
                formatter={(v: number) => [`${v.toFixed(0)}%`, ""]}
              />
              <ReferenceLine y={60} stroke="#B8506A" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Bar dataKey="current" radius={[4, 4, 0, 0]} fill="#A69A92" name="Current" />
              <Bar dataKey="projected" radius={[4, 4, 0, 0]} name="Projected">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-5 mt-2 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#A69A92" }} /> Current</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#C9748A" }} /> Projected (target)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ backgroundColor: "#B8506A" }} /> Pass line (60%)</span>
        </div>
      </div>

      {/* Per-course grade breakdown */}
      <div className="space-y-4">
        {courses.map((c, i) => {
          const r = perCourse[i];
          const courseGrades = grades.filter((g) => g.courseId === c.id && !g.isProjected);
          const target = targets[c.id] ?? r?.currentGrade ?? 80;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-card bg-white border border-border-soft shadow-warm overflow-hidden"
            >
              <div className="p-5 border-b border-border-soft flex items-center justify-between" style={{ backgroundColor: `${c.color}08` }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <div>
                    <h3 className="text-base font-semibold leading-tight" style={{ fontFamily: "var(--font-serif)" }}>{c.name}</h3>
                    <p className="text-xs text-ink-muted">{c.code} · {c.creditHours} credits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold nums leading-none" style={{ fontFamily: "var(--font-serif)", color: c.color }}>
                    {r ? r.projectedGrade.toFixed(0) : "—"}<span className="text-sm text-ink-muted">%</span>
                  </p>
                  <p className="text-[11px] font-medium mt-1" style={{ color: c.color }}>
                    {r ? r.projectedLetter : "—"} · {r ? r.projectedGpa.toFixed(1) : "—"} GPA
                  </p>
                </div>
              </div>

              <div className="p-5">
                {/* assessments */}
                <div className="space-y-1.5 mb-4">
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-ink-muted px-1">
                    <span className="col-span-6">Assessment</span>
                    <span className="col-span-3 text-center">Grade</span>
                    <span className="col-span-2 text-center">Weight</span>
                    <span className="col-span-1"></span>
                  </div>
                  {courseGrades.length === 0 ? (
                    <p className="text-xs text-ink-muted py-3 text-center">No assessments yet. Add your first below.</p>
                  ) : (
                    courseGrades.map((g) => (
                      <div key={g.id} className="grid grid-cols-12 gap-2 items-center py-1 group">
                        <input
                          value={g.assessmentName}
                          onChange={(e) => updateGrade(g.id, { assessmentName: e.target.value })}
                          className="col-span-6 bg-transparent text-sm text-ink-primary focus:outline-none focus:bg-cream-elevated rounded px-1 py-1"
                        />
                        <input
                          type="number"
                          value={g.grade}
                          onChange={(e) => updateGrade(g.id, { grade: Number(e.target.value) || 0 })}
                          className="col-span-3 text-center text-sm nums bg-cream-base rounded-md border border-border-soft py-1 focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                        />
                        <input
                          type="number"
                          value={g.weight}
                          onChange={(e) => updateGrade(g.id, { weight: Number(e.target.value) || 0 })}
                          className="col-span-2 text-center text-sm nums bg-cream-base rounded-md border border-border-soft py-1 focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                        />
                        <button
                          onClick={() => deleteGrade(g.id)}
                          className="col-span-1 flex justify-center text-ink-muted hover:text-rose-urgent transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Delete assessment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    addGrade({ courseId: c.id, assessmentName: "New assessment", grade: 85, weight: 10 });
                    toast.success("Assessment added");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blush-deep hover:text-rose-urgent transition-colors"
                >
                  <Plus size={13} /> Add assessment
                </button>

                {/* what-if target slider */}
                <div className="mt-5 pt-4 border-t border-border-soft">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Target size={13} className="text-blush-deep" />
                      <span className="text-xs font-medium text-ink-secondary">What-if target</span>
                    </div>
                    <span className="text-sm font-semibold nums" style={{ color: c.color, fontFamily: "var(--font-serif)" }}>
                      {target.toFixed(0)}% <span className="text-[11px] text-ink-muted font-normal">({percentageToLetter(target)})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={target}
                    onChange={(e) => setTarget(c.id, Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${c.color} 0%, ${c.color} ${target}%, var(--color-border-soft) ${target}%, var(--color-border-soft) 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1">
                    <span>Entered weight: {r?.enteredWeight.toFixed(0) ?? 0}%</span>
                    <span>Remaining: {Math.max(0, 100 - (r?.enteredWeight ?? 0))}% at target</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
