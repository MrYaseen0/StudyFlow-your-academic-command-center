"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { sortByUrgency } from "@/lib/urgency";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { TaskEditor } from "./TaskEditor";
import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  emptyHint?: string;
  showCompleted?: boolean;
  compact?: boolean;
}

export function TaskList({ tasks, emptyHint, showCompleted = true, compact }: TaskListProps) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const active = sortByUrgency(tasks.filter((t) => t.status !== "done"));
  const completed = tasks.filter((t) => t.status === "done");

  if (tasks.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border-soft p-8 text-center">
        <p className="text-sm text-ink-muted">{emptyHint ?? "Nothing here yet."}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {active.map((t) => (
            <TaskCard key={t.id} task={t} compact={compact} onEdit={setEditing} />
          ))}
        </AnimatePresence>
        {active.length === 0 && completed.length > 0 && (
          <div className="rounded-card border border-dashed border-border-soft p-8 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: "var(--color-success-sage)" }} />
            <p className="text-sm text-ink-secondary font-medium">All caught up.</p>
            <p className="text-xs text-ink-muted mt-0.5">Active tasks will appear here as you add them.</p>
          </div>
        )}
      </div>

      {showCompleted && completed.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors"
          >
            <motion.span animate={{ rotate: completedOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.span>
            Completed ({completed.length})
          </button>
          <AnimatePresence initial={false}>
            {completedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={cn("overflow-hidden")}
              >
                <div className="space-y-2 pt-3">
                  {completed.map((t) => (
                    <TaskCard key={t.id} task={t} compact={compact} onEdit={setEditing} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {editing && (
        <TaskEditor task={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </div>
  );
}
