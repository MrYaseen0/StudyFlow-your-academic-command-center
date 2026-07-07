"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "focus" | "break";

const PRESETS = { focus: 25, break: 5 };
const LONG_BREAK = 15;

export function TimerView() {
  const tasks = useStore((s) => s.tasks);
  const courses = useStore((s) => s.courses);
  const sessions = useStore((s) => s.sessions);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const setSelectedTask = useStore((s) => s.setSelectedTask);
  const addSession = useStore((s) => s.addSession);
  const updateTask = useStore((s) => s.updateTask);

  const [mode, setMode] = useState<Mode>("focus");
  const [duration, setDuration] = useState(PRESETS.focus * 60); // seconds
  const [remaining, setRemaining] = useState(PRESETS.focus * 60);
  const [running, setRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? activeTasks[0] ?? null;
  const selectedCourse = selectedTask ? courses.find((c) => c.id === selectedTask.courseId) : null;

  // tick — chained timeout so each tick reads fresh state
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  // completion — a state-machine transition triggered when the external timer
  // reaches zero (logs a session, advances mode). The set-state-in-effect rule
  // false-positives here; this is the sanctioned "react to external system" case.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!running || remaining > 0) return;
    setRunning(false);
    if (mode === "focus") {
      if (selectedTask) {
        addSession({
          taskId: selectedTask.id,
          courseId: selectedTask.courseId,
          duration: Math.round(duration / 60),
          mode: "focus",
        }).then(() => {
          toast.success(`Focus session logged for "${selectedTask.title}"`);
        }).catch(() => {
          toast.error("Couldn't log session");
        });
        setCompletedRounds((n) => n + 1);
        const isLong = (completedRounds + 1) % 4 === 0;
        const nextDur = isLong ? LONG_BREAK * 60 : PRESETS.break * 60;
        setMode("break");
        setDuration(nextDur);
        setRemaining(nextDur);
      } else {
        toast("Pick a task to log your session");
      }
    } else {
      toast("Break done — back to focus");
      setMode("focus");
      setDuration(PRESETS.focus * 60);
      setRemaining(PRESETS.focus * 60);
    }
  }, [running, remaining, mode, selectedTask, completedRounds, duration, addSession]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleStart = () => {
    if (mode === "focus" && !selectedTask) {
      toast.error("Pick a task to focus on first");
      return;
    }
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setRemaining(duration);
  };

  const switchMode = (m: Mode) => {
    const d = m === "focus" ? PRESETS.focus * 60 : PRESETS.break * 60;
    setMode(m);
    setRunning(false);
    setDuration(d);
    setRemaining(d);
  };

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const progress = 1 - remaining / duration;
  const accent = mode === "focus" ? "#C9748A" : "#8FA894";

  // session history for selected task
  const taskSessions = selectedTask
    ? sessions.filter((s) => s.taskId === selectedTask.id && s.mode === "focus")
    : [];
  const taskFocusMin = taskSessions.reduce((s, x) => s + x.duration, 0);

  // recent sessions overall
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 6);

  const RADIUS = 130;
  const CIRC = 2 * Math.PI * RADIUS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
          Focus
        </h2>
        <p className="text-sm text-ink-secondary mt-1">
          Link sessions to a task — every minute counts toward your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timer */}
        <div className="lg:col-span-3 rounded-card bg-white border border-border-soft shadow-warm p-6 sm:p-8">
          {/* mode toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-pill p-1" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
              <button
                onClick={() => switchMode("focus")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-sm font-medium transition-all",
                  mode === "focus" ? "bg-white text-blush-deep shadow-warm" : "text-ink-muted hover:text-ink-secondary",
                )}
              >
                <Brain size={14} /> Focus
              </button>
              <button
                onClick={() => switchMode("break")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-sm font-medium transition-all",
                  mode === "break" ? "bg-white text-success-sage shadow-warm" : "text-ink-muted hover:text-ink-secondary",
                )}
              >
                <Coffee size={14} /> Break
              </button>
            </div>
          </div>

          {/* circular timer */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
                <circle cx="150" cy="150" r={RADIUS} fill="none" stroke="var(--color-cream-elevated)" strokeWidth="10" />
                <motion.circle
                  cx="150"
                  cy="150"
                  r={RADIUS}
                  fill="none"
                  stroke={accent}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] uppercase tracking-widest text-ink-muted">
                  {mode === "focus" ? "Focusing" : "On break"}
                </span>
                <span
                  className="text-6xl font-semibold nums leading-none mt-1"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-primary)" }}
                >
                  {mm}:{ss}
                </span>
                <span className="text-xs text-ink-muted mt-2 nums">
                  Round {completedRounds + (mode === "focus" ? 1 : 0)} · {Math.round(duration / 60)} min
                </span>
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={handleReset}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-border-soft text-ink-secondary hover:bg-cream-elevated transition-colors"
              aria-label="Reset"
            >
              <RotateCcw size={17} />
            </button>
            <button
              onClick={handleStart}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-warm-lg transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: accent }}
              aria-label={running ? "Pause" : "Start"}
            >
              {running ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
            </button>
            <div className="w-11 h-11 flex items-center justify-center text-xs text-ink-muted nums">
              {completedRounds} done
            </div>
          </div>
        </div>

        {/* Task selector + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Task selector */}
          <div className="rounded-card bg-white border border-border-soft shadow-warm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
              Focusing on
            </p>
            {activeTasks.length === 0 ? (
              <div className="text-center py-6">
                <Check size={20} className="mx-auto mb-2 text-success-sage" />
                <p className="text-sm text-ink-secondary" style={{ fontFamily: "var(--font-serif)" }}>No active tasks.</p>
                <p className="text-xs text-ink-muted mt-1">Add one to start logging focus.</p>
              </div>
            ) : (
              <>
                <select
                  value={selectedTask?.id ?? ""}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full rounded-md border border-border-soft bg-cream-base px-3 py-2.5 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                >
                  {activeTasks.map((t) => {
                    const c = courses.find((x) => x.id === t.courseId);
                    return (
                      <option key={t.id} value={t.id}>
                        {c?.code ?? "?"} — {t.title}
                      </option>
                    );
                  })}
                </select>
                {selectedTask && selectedCourse && (
                  <div className="mt-3 pt-3 border-t border-border-soft space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Course</span>
                      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: selectedCourse.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                        {selectedCourse.code}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Logged focus</span>
                      <span className="nums font-semibold text-ink-primary">{(taskFocusMin / 60).toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Estimated</span>
                      <span className="nums text-ink-secondary">{selectedTask.estimatedHours}h</span>
                    </div>
                    {taskFocusMin > 0 && (
                      <button
                        onClick={() => {
                          if (selectedTask) {
                            updateTask(selectedTask.id, { status: "done" });
                            toast.success("Marked as done");
                          }
                        }}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium text-success-sage hover:bg-success-sage/10 transition-colors"
                      >
                        <Check size={13} /> Mark task complete
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent sessions */}
          <div className="rounded-card bg-white border border-border-soft shadow-warm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
              Recent sessions
            </p>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-ink-muted py-4 text-center">No sessions yet. Hit start to begin.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-warm">
                <AnimatePresence initial={false}>
                  {recentSessions.map((s) => {
                    const task = tasks.find((t) => t.id === s.taskId);
                    const course = courses.find((c) => c.id === s.courseId);
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5 py-2 border-b border-border-soft last:border-0"
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: course?.color ?? "var(--color-ink-muted)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-ink-primary truncate">
                            {task?.title ?? "Deleted task"}
                          </p>
                          <p className="text-[10px] text-ink-muted">
                            {new Date(s.completedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-xs nums font-semibold text-ink-secondary">{s.duration}m</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
