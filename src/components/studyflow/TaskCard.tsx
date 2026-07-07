"use client";

import { motion } from "framer-motion";
import { Clock, MoreHorizontal, Pencil, Trash2, Play, Pause, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { getUrgency, URGENCY_META, relativeDueLabel, isDueToday } from "@/lib/urgency";
import { PRIORITY_META } from "@/lib/types";
import type { Task } from "@/lib/types";
import { CourseTag } from "./CourseTag";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onEdit, compact }: TaskCardProps) {
  const toggleTask = useStore((s) => s.toggleTask);
  const setTaskStatus = useStore((s) => s.setTaskStatus);
  const deleteTask = useStore((s) => s.deleteTask);
  const setView = useStore((s) => s.setView);
  const setSelectedTask = useStore((s) => s.setSelectedTask);
  const [menuOpen, setMenuOpen] = useState(false);

  const urgency = getUrgency(task.dueDate, task.status);
  const meta = URGENCY_META[urgency];
  const isDone = task.status === "done";
  const priority = PRIORITY_META[task.priority];

  const handleStartTimer = () => {
    setSelectedTask(task.id);
    setView("timer");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-card bg-white border",
        isDone && "opacity-60",
      )}
      style={{ borderColor: "var(--color-border-soft)" }}
    >
      {/* urgency accent bar — animates color */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1"
        animate={{ backgroundColor: meta.dot }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      <div className={cn("flex items-start gap-3", compact ? "p-3 pl-4" : "p-4 pl-5")}>
        {/* custom checkbox */}
        <button
          onClick={() => toggleTask(task.id)}
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
          className="mt-0.5 flex-shrink-0 rounded-md w-5 h-5 border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: isDone ? "var(--color-success-sage)" : meta.dot,
            backgroundColor: isDone ? "var(--color-success-sage)" : "transparent",
          }}
        >
          <motion.span
            initial={false}
            animate={{ scale: isDone ? 1 : 0, opacity: isDone ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "backOut" }}
          >
            <Check size={13} strokeWidth={3} color="#ffffff" />
          </motion.span>
        </button>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <motion.h3
              animate={{ textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--color-ink-muted)" : "var(--color-ink-primary)" }}
              transition={{ duration: 0.3 }}
              className={cn("font-medium leading-snug", compact ? "text-sm" : "text-[15px]")}
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {task.title}
            </motion.h3>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="rounded-md p-1 text-ink-muted hover:bg-cream-elevated hover:text-ink-secondary transition-colors"
                aria-label="Task options"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-40 rounded-card bg-white border border-border-soft shadow-warm-lg overflow-hidden">
                  <button
                    onMouseDown={() => { onEdit?.(task); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-cream-elevated transition-colors text-left"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  {!isDone && (
                    <button
                      onMouseDown={handleStartTimer}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-cream-elevated transition-colors text-left"
                    >
                      <Play size={14} /> Focus on this
                    </button>
                  )}
                  <button
                    onMouseDown={() => setTaskStatus(task.id, isDone ? "not_started" : "done")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-cream-elevated transition-colors text-left"
                  >
                    <Check size={14} /> {isDone ? "Reopen" : "Mark done"}
                  </button>
                  <button
                    onMouseDown={() => { deleteTask(task.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-rose-urgent/10 transition-colors text-left"
                    style={{ color: "var(--color-rose-urgent)" }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <CourseTag courseId={task.courseId} />
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: priority.color }}
            >
              <span className="rounded-full" style={{ backgroundColor: priority.color, width: 6, height: 6 }} />
              {priority.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] nums",
                isDueToday(task.dueDate) && !isDone && "font-semibold",
              )}
              style={{ color: isDone ? "var(--color-ink-muted)" : meta.text }}
            >
              <Clock size={11} />
              {relativeDueLabel(task.dueDate)}
            </span>
            {task.estimatedHours > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted nums">
                ~{task.estimatedHours}h
              </span>
            )}
            {task.status === "in_progress" && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-pill bg-amber-warning/15" style={{ color: "#A87432" }}>
                <Pause size={10} /> In progress
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
