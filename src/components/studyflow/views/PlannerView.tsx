"use client";

import { motion } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, CalendarDays, GripVertical, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { isSameDay, getUrgency, URGENCY_META, relativeDueLabel } from "@/lib/urgency";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function DraggableTask({ task, courseId }: { task: Task; courseId: string }) {
  const courses = useStore((s) => s.courses);
  const course = courses.find((c) => c.id === courseId);
  const urgency = getUrgency(task.dueDate, task.status);
  const meta = URGENCY_META[urgency];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const time = new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-lg bg-white border p-2.5 cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "opacity-30",
      )}
      style={{ borderColor: "var(--color-border-soft)", borderLeft: `3px solid ${meta.dot}` }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium text-ink-primary leading-snug line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>
          {task.title}
        </p>
        <GripVertical size={11} className="text-ink-muted opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: course?.color }} />
        <span className="text-[10px] text-ink-muted nums">{time}</span>
        {task.estimatedHours > 0 && (
          <span className="text-[10px] text-ink-muted nums ml-auto">{task.estimatedHours}h</span>
        )}
      </div>
    </div>
  );
}

function DayColumn({ day, tasks, isToday }: { day: Date; tasks: Task[]; isToday: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-card border min-h-[260px] p-2 transition-colors flex flex-col",
        isOver && "border-blush-deep bg-blush-soft/30",
      )}
      style={{
        borderColor: isToday ? "var(--color-blush-deep)" : "var(--color-border-soft)",
        backgroundColor: isOver ? "rgba(232, 160, 172, 0.08)" : "rgba(253, 248, 243, 0.5)",
      }}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink-muted">
            {DAY_LABELS[(day.getDay() + 6) % 7]}
          </p>
          <p className={cn("text-sm font-semibold nums", isToday && "text-blush-deep")} style={{ fontFamily: "var(--font-serif)" }}>
            {day.getDate()}
          </p>
        </div>
        {tasks.length > 0 && (
          <span className="text-[10px] font-medium text-ink-muted nums">{tasks.length}</span>
        )}
      </div>
      <div className="space-y-1.5 flex-1">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-[10px] text-ink-muted/50">drop here</span>
          </div>
        ) : (
          tasks.map((t) => <DraggableTask key={t.id} task={t} courseId={t.courseId} />)
        )}
      </div>
    </div>
  );
}

export function PlannerView() {
  const tasks = useStore((s) => s.tasks);
  const courses = useStore((s) => s.courses);
  const rescheduleTask = useStore((s) => s.rescheduleTask);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    days.forEach((d) => {
      map[d.toISOString()] = tasks.filter(
        (t) => isSameDay(new Date(t.dueDate), d),
      ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
    return map;
  }, [tasks, days]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const targetDayIso = over.id as string;
    const targetDay = new Date(targetDayIso);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const oldDate = new Date(task.dueDate);
    if (isSameDay(oldDate, targetDay)) return; // same day, no-op
    // preserve time of day
    const newDate = new Date(targetDay);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
    rescheduleTask(taskId, newDate.toISOString());
    toast.success(`Moved to ${newDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`);
  };

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const isThisWeek = isSameDay(weekStart, startOfWeek(new Date()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
            Weekly planner
          </h2>
          <p className="text-sm text-ink-secondary mt-1">
            Drag tasks between days to reschedule. Time of day is preserved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="w-8 h-8 rounded-md border border-border-soft bg-white flex items-center justify-center text-ink-secondary hover:bg-cream-elevated transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-soft bg-white text-xs font-medium text-ink-secondary nums">
            <CalendarDays size={13} className="text-blush-deep" />
            {weekLabel}
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="w-8 h-8 rounded-md border border-border-soft bg-white flex items-center justify-center text-ink-secondary hover:bg-cream-elevated transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={15} />
          </button>
          {!isThisWeek && (
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="text-xs font-medium text-blush-deep hover:text-rose-urgent px-2"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
          <CalendarDays size={24} className="mx-auto mb-2 text-ink-muted" />
          <p className="text-sm text-ink-secondary">No tasks to plan yet.</p>
          <p className="text-xs text-ink-muted mt-1">Add tasks from the dashboard or quick capture.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {days.map((d) => (
              <DayColumn
                key={d.toISOString()}
                day={d}
                tasks={tasksByDay[d.toISOString()] ?? []}
                isToday={isSameDay(d, today)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rounded-lg bg-white border border-border-soft p-2.5 shadow-warm-lg rotate-2 cursor-grabbing" style={{ borderLeft: `3px solid ${URGENCY_META[getUrgency(activeTask.dueDate, activeTask.status)].dot}` }}>
                <p className="text-xs font-medium text-ink-primary leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                  {activeTask.title}
                </p>
                <p className="text-[10px] text-ink-muted mt-1">{relativeDueLabel(activeTask.dueDate)}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Mobile hint */}
      <p className="lg:hidden text-[11px] text-ink-muted text-center">
        Tip: drag a task card into another day to reschedule it.
      </p>
    </div>
  );
}
