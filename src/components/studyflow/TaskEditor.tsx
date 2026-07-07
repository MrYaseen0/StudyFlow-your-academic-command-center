"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { COURSE_COLORS, type Priority, type Status, type Task } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskEditorProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
  defaultDueDate?: string;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "#B8506A" },
  { value: "medium", label: "Medium", color: "#D9A566" },
  { value: "low", label: "Low", color: "#8FA894" },
];

const STATUSES: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function TaskEditor({ task, open, onOpenChange, defaultCourseId, defaultDueDate }: TaskEditorProps) {
  const courses = useStore((s) => s.courses);
  const goals = useStore((s) => s.goals);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);

  const [title, setTitle] = useState(() => task?.title ?? "");
  const [courseId, setCourseId] = useState(() => task?.courseId ?? defaultCourseId ?? courses[0]?.id ?? "");
  const [goalId, setGoalId] = useState<string>(() => task?.goalId ?? "");
  const [dueDate, setDueDate] = useState(() =>
    task ? toLocalInput(task.dueDate) : toLocalInput(defaultDueDate ?? new Date(Date.now() + 3 * 86400000).toISOString()),
  );
  const [priority, setPriority] = useState<Priority>(() => task?.priority ?? "medium");
  const [status, setStatus] = useState<Status>(() => task?.status ?? "not_started");
  const [estimatedHours, setEstimatedHours] = useState(() => task?.estimatedHours ?? 1);
  const [notes, setNotes] = useState(() => task?.notes ?? "");

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Add a title first");
      return;
    }
    if (!courseId) {
      toast.error("Pick a course");
      return;
    }
    if (!dueDate) {
      toast.error("Set a due date");
      return;
    }
    const iso = new Date(dueDate).toISOString();
    const resolvedGoalId = goalId || null;
    try {
      if (task) {
        updateTask(task.id, {
          title: title.trim(),
          courseId,
          goalId: resolvedGoalId,
          dueDate: iso,
          priority,
          status,
          estimatedHours,
          notes: notes.trim() || undefined,
        });
        toast.success("Task updated");
      } else {
        await addTask({
          title: title.trim(),
          courseId,
          goalId: resolvedGoalId,
          dueDate: iso,
          priority,
          status,
          estimatedHours,
          notes: notes.trim() || undefined,
        });
        toast.success("Task added");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-card border-border-soft bg-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>
            {task ? "Edit task" : "New task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab report: enzyme kinetics"
              autoFocus
              className="bg-cream-base border-border-soft"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-course">Course</Label>
              <select
                id="t-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-9 rounded-md border border-border-soft bg-cream-base px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
              >
                {courses.length === 0 && <option value="">No courses yet</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input
                id="t-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-cream-base border-border-soft nums"
              />
            </div>
          </div>

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="t-goal">Link to goal <span className="text-ink-muted font-normal">(optional)</span></Label>
              <select
                id="t-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full h-9 rounded-md border border-border-soft bg-cream-base px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
              >
                <option value="">No goal</option>
                {goals.filter((g) => g.status !== "achieved").map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-xs font-medium transition-all",
                    priority === p.value ? "border-transparent" : "border-border-soft bg-cream-base text-ink-secondary hover:bg-cream-elevated",
                  )}
                  style={priority === p.value ? { backgroundColor: `${p.color}1a`, color: p.color } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-status">Status</Label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full h-9 rounded-md border border-border-soft bg-cream-base px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-hours">Estimated hours</Label>
              <Input
                id="t-hours"
                type="number"
                min={0}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value) || 0)}
                className="bg-cream-base border-border-soft nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-notes">Notes <span className="text-ink-muted font-normal">(optional)</span></Label>
            <Textarea
              id="t-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you need to remember…"
              rows={2}
              className="bg-cream-base border-border-soft resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-ink-secondary hover:bg-cream-elevated">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blush-deep hover:bg-rose-urgent text-white"
          >
            {task ? "Save changes" : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
