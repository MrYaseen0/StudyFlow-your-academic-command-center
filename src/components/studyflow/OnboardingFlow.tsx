"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, Sparkles, GraduationCap, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { COURSE_COLORS, type Course, type Task } from "@/lib/types";
import { getSampleData } from "@/lib/sample-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DraftCourse {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  color: string;
  instructor: string;
}
interface DraftTask {
  id: string;
  title: string;
  courseId: string;
  dueInDays: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function toLocalInput(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 0, 0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function OnboardingFlow() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const addCourse = useStore((s) => s.addCourse);
  const addTask = useStore((s) => s.addTask);
  const addGrade = useStore((s) => s.addGrade);
  const setTarget = useStore((s) => s.setTarget);

  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<DraftCourse[]>([
    { id: uid(), name: "", code: "", creditHours: 3, color: COURSE_COLORS[0], instructor: "" },
  ]);
  const [tasks, setTasks] = useState<DraftTask[]>([]);

  const validCourses = courses.filter((c) => c.name.trim() && c.code.trim());

  const loadSample = () => {
    const data = getSampleData();
    const courseMap: Record<string, string> = {};
    data.courses.forEach((c) => {
      const newId = addCourse({
        name: c.name, code: c.code, instructor: c.instructor,
        color: c.color, creditHours: c.creditHours,
      });
      courseMap[c.id] = newId;
    });
    data.tasks.forEach((t) => {
      const cid = courseMap[t.courseId];
      if (cid) addTask({
        title: t.title, courseId: cid, dueDate: t.dueDate,
        priority: t.priority, status: t.status, estimatedHours: t.estimatedHours,
      });
    });
    data.grades.forEach((g) => {
      const cid = courseMap[g.courseId];
      if (cid) addGrade({ courseId: cid, assessmentName: g.assessmentName, grade: g.grade, weight: g.weight });
    });
    completeOnboarding(data.courses, data.tasks);
    toast.success("Sample semester loaded — welcome to StudyFlow");
  };

  const finish = () => {
    // commit courses + tasks to store
    const courseMap: Record<string, string> = {};
    validCourses.forEach((c) => {
      const newId = addCourse({
        name: c.name.trim(),
        code: c.code.trim().toUpperCase(),
        instructor: c.instructor.trim(),
        color: c.color,
        creditHours: c.creditHours,
      });
      courseMap[c.id] = newId;
    });
    const committedCourses: Course[] = validCourses.map((c) => ({
      id: courseMap[c.id],
      name: c.name.trim(),
      code: c.code.trim().toUpperCase(),
      instructor: c.instructor.trim(),
      color: c.color,
      creditHours: c.creditHours,
      createdAt: new Date().toISOString(),
    }));
    const committedTasks: Task[] = [];
    tasks.filter((t) => t.title.trim() && courseMap[t.courseId]).forEach((t) => {
      const cid = courseMap[t.courseId];
      const due = new Date();
      due.setDate(due.getDate() + t.dueInDays);
      due.setHours(23, 0, 0, 0);
      const id = addTask({ title: t.title.trim(), courseId: cid, dueDate: due.toISOString() });
      committedTasks.push({
        id, title: t.title.trim(), courseId: cid, dueDate: due.toISOString(),
        priority: "medium", status: "not_started", estimatedHours: 1, createdAt: new Date().toISOString(),
      });
    });
    completeOnboarding(committedCourses, committedTasks);
    toast.success("You're all set — welcome to StudyFlow");
  };

  const addCourseRow = () => {
    setCourses((cs) => [
      ...cs,
      { id: uid(), name: "", code: "", creditHours: 3, color: COURSE_COLORS[cs.length % COURSE_COLORS.length], instructor: "" },
    ]);
  };
  const updateCourseRow = (id: string, patch: Partial<DraftCourse>) => {
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const removeCourseRow = (id: string) => {
    setCourses((cs) => cs.filter((c) => c.id !== id));
    setTasks((ts) => ts.filter((t) => t.courseId !== id));
  };

  const addTaskRow = () => {
    if (validCourses.length === 0) return;
    setTasks((ts) => [
      ...ts,
      { id: uid(), title: "", courseId: validCourses[0].id, dueInDays: 3 },
    ]);
  };
  const updateTaskRow = (id: string, patch: Partial<DraftTask>) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTaskRow = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-base bg-grid-cream">
      {/* header */}
      <header className="px-6 py-5 flex items-center gap-2.5 max-w-3xl mx-auto w-full">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
          <span className="text-white font-serif font-semibold">S</span>
        </div>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>StudyFlow</h1>
      </header>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-2xl">
          {/* progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: step >= i ? 32 : 12,
                  backgroundColor: step >= i ? "var(--color-blush-deep)" : "var(--color-border-soft)",
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
                  <GraduationCap size={28} color="#ffffff" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
                  Let's set up your semester
                </h2>
                <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
                  Two quick steps: add your courses, then your first deadlines. Takes about a minute — or load a sample semester to explore first.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-card p-5 border-2 text-left transition-all hover:shadow-warm"
                    style={{ borderColor: "var(--color-blush-deep)", backgroundColor: "rgba(232, 160, 172, 0.06)" }}
                  >
                    <Plus size={18} className="text-blush-deep mb-2" />
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Start blank</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">Add your own courses</p>
                  </button>
                  <button
                    onClick={loadSample}
                    className="rounded-card p-5 border-2 text-left transition-all hover:shadow-warm"
                    style={{ borderColor: "var(--color-border-soft)", backgroundColor: "var(--color-white)" }}
                  >
                    <Sparkles size={18} className="text-success-sage mb-2" />
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Sample semester</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">Explore with demo data</p>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-card bg-white border border-border-soft shadow-warm p-6"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold nums" style={{ backgroundColor: "var(--color-blush-deep)" }}>1</div>
                  <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Your courses</h2>
                </div>
                <p className="text-xs text-ink-muted mb-5 ml-9">Add the courses you're taking this semester.</p>

                <div className="space-y-2.5">
                  {courses.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 group">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <input
                        value={c.name}
                        onChange={(e) => updateCourseRow(c.id, { name: e.target.value })}
                        placeholder="Course name"
                        className="flex-1 min-w-0 bg-cream-base rounded-md border border-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                      />
                      <input
                        value={c.code}
                        onChange={(e) => updateCourseRow(c.id, { code: e.target.value })}
                        placeholder="CODE 101"
                        className="w-24 bg-cream-base rounded-md border border-border-soft px-2 py-2 text-sm uppercase nums focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                      />
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={c.creditHours}
                        onChange={(e) => updateCourseRow(c.id, { creditHours: Number(e.target.value) || 1 })}
                        className="w-14 bg-cream-base rounded-md border border-border-soft px-2 py-2 text-sm text-center nums focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                        title="Credit hours"
                      />
                      {courses.length > 1 && (
                        <button
                          onClick={() => removeCourseRow(c.id)}
                          className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-rose-urgent transition-colors"
                          aria-label="Remove course"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCourseRow}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blush-deep hover:text-rose-urgent transition-colors"
                >
                  <Plus size={13} /> Add another course
                </button>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border-soft">
                  <button onClick={() => setStep(0)} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary transition-colors">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={validCourses.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "var(--color-blush-deep)" }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-card bg-white border border-border-soft shadow-warm p-6"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold nums" style={{ backgroundColor: "var(--color-blush-deep)" }}>2</div>
                  <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>First deadlines</h2>
                </div>
                <p className="text-xs text-ink-muted mb-5 ml-9">Add anything already on your radar. You can skip this and add later.</p>

                <div className="space-y-2.5">
                  {tasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border-soft p-6 text-center">
                      <ClipboardList size={20} className="mx-auto mb-2 text-ink-muted" />
                      <p className="text-xs text-ink-secondary">Nothing yet — add your first deadline below.</p>
                    </div>
                  ) : (
                    tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 group">
                        <input
                          value={t.title}
                          onChange={(e) => updateTaskRow(t.id, { title: e.target.value })}
                          placeholder="e.g. Problem set 4"
                          className="flex-1 min-w-0 bg-cream-base rounded-md border border-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                          autoFocus
                        />
                        <select
                          value={t.courseId}
                          onChange={(e) => updateTaskRow(t.id, { courseId: e.target.value })}
                          className="w-28 bg-cream-base rounded-md border border-border-soft px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                        >
                          {validCourses.map((c) => (
                            <option key={c.id} value={c.id}>{c.code}</option>
                          ))}
                        </select>
                        <select
                          value={t.dueInDays}
                          onChange={(e) => updateTaskRow(t.id, { dueInDays: Number(e.target.value) })}
                          className="w-24 bg-cream-base rounded-md border border-border-soft px-2 py-2 text-xs nums focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                          title="Due in"
                        >
                          <option value={0}>Today</option>
                          <option value={1}>Tomorrow</option>
                          <option value={3}>In 3 days</option>
                          <option value={7}>In a week</option>
                          <option value={14}>In 2 weeks</option>
                        </select>
                        <button
                          onClick={() => removeTaskRow(t.id)}
                          className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-rose-urgent transition-colors"
                          aria-label="Remove task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={addTaskRow}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blush-deep hover:text-rose-urgent transition-colors"
                >
                  <Plus size={13} /> Add another deadline
                </button>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border-soft">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary transition-colors">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <button
                    onClick={finish}
                    className="inline-flex items-center gap-1.5 rounded-pill px-5 py-2 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "var(--color-blush-deep)" }}
                  >
                    <Check size={14} /> Enter StudyFlow
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="text-center pb-6 text-[11px] text-ink-muted">
        Data stays on your device. No account needed.
      </footer>
    </div>
  );
}
