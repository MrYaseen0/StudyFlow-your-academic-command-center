"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, Pencil, Check, Loader2, X, CalendarClock, Trophy, Link2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type { Goal, GoalStatus, Task } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CourseTag } from "../CourseTag";
import { getUrgency, URGENCY_META, relativeDueLabel } from "@/lib/urgency";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_META: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#C9748A", bg: "rgba(232, 160, 172, 0.14)" },
  achieved: { label: "Achieved", color: "#6B8A6F", bg: "rgba(143, 168, 148, 0.16)" },
  paused: { label: "Paused", color: "#A69A92", bg: "rgba(166, 154, 146, 0.14)" },
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function GoalsView() {
  const goals = useStore((s) => s.goals);
  const tasks = useStore((s) => s.tasks);
  const courses = useStore((s) => s.courses);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const toggleTask = useStore((s) => s.toggleTask);
  const assignTaskToGoal = useStore((s) => s.assignTaskToGoal);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);

  // per-goal progress
  const goalProgress = goals.map((g) => {
    const goalTasks = tasks.filter((t) => t.goalId === g.id);
    const done = goalTasks.filter((t) => t.status === "done").length;
    const total = goalTasks.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { goal: g, tasks: goalTasks, done, total, pct };
  });

  const activeGoals = goalProgress.filter((g) => g.goal.status === "active");
  const achievedGoals = goalProgress.filter((g) => g.goal.status === "achieved");
  const pausedGoals = goalProgress.filter((g) => g.goal.status === "paused");

  const unassignedTasks = tasks.filter((t) => !t.goalId && t.status !== "done");

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
            Goals
          </h2>
          <p className="text-sm text-ink-secondary mt-1">
            Set learning goals, then assign tasks to each — every completed task moves you closer.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setEditorOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-blush-deep)" }}
        >
          <Plus size={15} /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
          <Target size={26} className="mx-auto mb-2 text-ink-muted" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-secondary" style={{ fontFamily: "var(--font-serif)" }}>
            No goals yet
          </p>
          <p className="text-xs text-ink-muted mt-1 mb-4">
            Set a learning goal — like "Master organic chemistry reactions" — then assign tasks to it.
          </p>
          <button
            onClick={() => { setEditing(null); setEditorOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-blush-deep)" }}
          >
            <Plus size={15} /> Set your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active goals */}
          {activeGoals.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Active goals</h3>
              {activeGoals.map(({ goal, tasks: gt, done, total, pct }) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  tasks={gt}
                  done={done}
                  total={total}
                  pct={pct}
                  onEdit={() => { setEditing(goal); setEditorOpen(true); }}
                  onDelete={() => { deleteGoal(goal.id); toast.success("Goal deleted"); }}
                  onToggleTask={toggleTask}
                  onMarkAchieved={() => { updateGoal(goal.id, { status: "achieved" }); toast.success("Goal achieved! 🎉"); }}
                  onToggleLink={() => setLinkingGoalId(linkingGoalId === goal.id ? null : goal.id)}
                  linkingOpen={linkingGoalId === goal.id}
                  unassignedTasks={unassignedTasks}
                  onAssign={(taskId) => { assignTaskToGoal(taskId, goal.id); toast.success("Task assigned to goal"); }}
                />
              ))}
            </section>
          )}

          {pausedGoals.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Paused</h3>
              {pausedGoals.map(({ goal, tasks: gt, done, total, pct }) => (
                <GoalCard
                  key={goal.id} goal={goal} tasks={gt} done={done} total={total} pct={pct}
                  onEdit={() => { setEditing(goal); setEditorOpen(true); }}
                  onDelete={() => { deleteGoal(goal.id); toast.success("Goal deleted"); }}
                  onToggleTask={toggleTask}
                  onMarkAchieved={() => { updateGoal(goal.id, { status: "achieved" }); toast.success("Goal achieved! 🎉"); }}
                  onToggleLink={() => setLinkingGoalId(linkingGoalId === goal.id ? null : goal.id)}
                  linkingOpen={linkingGoalId === goal.id}
                  unassignedTasks={unassignedTasks}
                  onAssign={(taskId) => { assignTaskToGoal(taskId, goal.id); toast.success("Task assigned to goal"); }}
                />
              ))}
            </section>
          )}

          {achievedGoals.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--color-success-sage)" }}>
                <Trophy size={12} /> Achieved
              </h3>
              {achievedGoals.map(({ goal, tasks: gt, done, total, pct }) => (
                <GoalCard
                  key={goal.id} goal={goal} tasks={gt} done={done} total={total} pct={pct}
                  onEdit={() => { setEditing(goal); setEditorOpen(true); }}
                  onDelete={() => { deleteGoal(goal.id); toast.success("Goal deleted"); }}
                  onToggleTask={toggleTask}
                  onMarkAchieved={() => {}}
                  onToggleLink={() => {}}
                  linkingOpen={false}
                  unassignedTasks={[]}
                  onAssign={() => {}}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {editorOpen && (
        <GoalEditor
          goal={editing}
          open={editorOpen}
          busy={busy}
          onBusyChange={setBusy}
          onOpenChange={(o) => { if (!o) { setEditorOpen(false); setEditing(null); } }}
          onSave={async (title, description, targetDate) => {
            setBusy(true);
            try {
              if (editing) {
                updateGoal(editing.id, { title, description: description || undefined, targetDate: targetDate ? new Date(targetDate).toISOString() : null });
                toast.success("Goal updated");
              } else {
                await addGoal({ title, description: description || undefined, targetDate: targetDate ? new Date(targetDate).toISOString() : null });
                toast.success("Goal created");
              }
              setEditorOpen(false);
              setEditing(null);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to save goal");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ---------- Goal card ----------
function GoalCard({
  goal, tasks, done, total, pct,
  onEdit, onDelete, onToggleTask, onMarkAchieved, onToggleLink, linkingOpen, unassignedTasks, onAssign,
}: {
  goal: Goal; tasks: Task[]; done: number; total: number; pct: number;
  onEdit: () => void; onDelete: () => void; onToggleTask: (id: string) => void; onMarkAchieved: () => void;
  onToggleLink: () => void; linkingOpen: boolean; unassignedTasks: Task[]; onAssign: (taskId: string) => void;
}) {
  const meta = STATUS_META[goal.status];
  const isAchieved = goal.status === "achieved";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card bg-white border border-border-soft shadow-warm overflow-hidden"
    >
      {/* header */}
      <div className="p-5 border-b border-border-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
              {goal.targetDate && (
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-muted nums">
                  <CalendarClock size={10} />
                  {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isAchieved && (
              <button onClick={onMarkAchieved} title="Mark as achieved" className="rounded-md p-1.5 text-ink-muted hover:bg-success-sage/10 transition-colors" style={{ color: undefined }}>
                <Trophy size={13} />
              </button>
            )}
            <button onClick={onEdit} title="Edit" className="rounded-md p-1.5 text-ink-muted hover:bg-cream-elevated hover:text-ink-secondary transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} title="Delete" className="rounded-md p-1.5 text-ink-muted hover:bg-rose-urgent/10 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ backgroundColor: isAchieved ? "var(--color-success-sage)" : "var(--color-blush-deep)" }}
            />
          </div>
          <span className="text-xs font-semibold nums w-16 text-right" style={{ color: isAchieved ? "var(--color-success-sage)" : "var(--color-ink-secondary)" }}>
            {done}/{total} done
          </span>
        </div>
      </div>

      {/* task list (the to-do list covering this goal) */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tasks for this goal</p>
          {!isAchieved && (
            <button onClick={onToggleLink} className="inline-flex items-center gap-1 text-[11px] font-medium text-blush-deep hover:text-rose-urgent transition-colors">
              <Link2 size={11} /> {linkingOpen ? "Cancel" : "Assign task"}
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-ink-muted py-3 text-center">
            No tasks yet. {isAchieved ? "" : "Click \"Assign task\" to link one."}
          </p>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {tasks.map((t) => (
                <GoalTaskRow key={t.id} task={t} onToggle={() => onToggleTask(t.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* assign-task panel */}
        <AnimatePresence>
          {linkingOpen && unassignedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border-soft overflow-hidden"
            >
              <p className="text-[10px] uppercase tracking-wide text-ink-muted mb-2">Pick a task to assign</p>
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-warm">
                {unassignedTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onAssign(t.id)}
                    className="w-full flex items-center gap-2 rounded-md p-2 text-left hover:bg-cream-elevated transition-colors group"
                  >
                    <Plus size={12} className="text-ink-muted group-hover:text-blush-deep flex-shrink-0" />
                    <span className="text-xs text-ink-primary flex-1 truncate">{t.title}</span>
                    <CourseTag courseId={t.courseId} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {linkingOpen && unassignedTasks.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-3 pt-3 border-t border-border-soft text-[11px] text-ink-muted text-center"
            >
              No unassigned tasks available. Add tasks from the dashboard first.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function GoalTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const urgency = getUrgency(task.dueDate, task.status);
  const meta = URGENCY_META[urgency];
  const isDone = task.status === "done";
  return (
    <div className="flex items-center gap-2.5 py-1.5 group">
      <button
        onClick={onToggle}
        aria-label={isDone ? "Mark not done" : "Mark done"}
        className="flex-shrink-0 rounded-md w-5 h-5 border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: isDone ? "var(--color-success-sage)" : meta.dot,
          backgroundColor: isDone ? "var(--color-success-sage)" : "transparent",
        }}
      >
        {isDone && <Check size={12} strokeWidth={3} color="#fff" />}
      </button>
      <span
        className={cn("text-xs flex-1 truncate", isDone && "line-through text-ink-muted")}
        style={!isDone ? { color: "var(--color-ink-primary)" } : undefined}
      >
        {task.title}
      </span>
      {!isDone && (
        <span className="text-[10px] nums flex-shrink-0" style={{ color: meta.text }}>{relativeDueLabel(task.dueDate)}</span>
      )}
    </div>
  );
}

// ---------- Goal editor dialog ----------
function GoalEditor({
  goal, open, busy, onBusyChange, onOpenChange, onSave,
}: {
  goal: Goal | null; open: boolean; busy: boolean;
  onBusyChange: (b: boolean) => void;
  onOpenChange: (o: boolean) => void;
  onSave: (title: string, description: string, targetDate: string) => void;
}) {
  const [title, setTitle] = useState(() => goal?.title ?? "");
  const [description, setDescription] = useState(() => goal?.description ?? "");
  const [targetDate, setTargetDate] = useState(() => toLocalInput(goal?.targetDate ?? null));

  const handleSave = () => {
    if (!title.trim()) { toast.error("Add a goal title"); return; }
    onSave(title.trim(), description.trim(), targetDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-card border-border-soft bg-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>
            {goal ? "Edit goal" : "New goal"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="g-title">Goal</Label>
            <Input
              id="g-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master organic chemistry reactions"
              autoFocus
              className="bg-cream-base border-border-soft"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-desc">Description <span className="text-ink-muted font-normal">(optional)</span></Label>
            <Textarea
              id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like?"
              rows={2} className="bg-cream-base border-border-soft resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-date">Target date <span className="text-ink-muted font-normal">(optional)</span></Label>
            <Input
              id="g-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="bg-cream-base border-border-soft nums"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-ink-secondary hover:bg-cream-elevated">Cancel</Button>
          <Button onClick={handleSave} disabled={busy} className="bg-blush-deep hover:bg-rose-urgent text-white">
            {busy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : goal ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
