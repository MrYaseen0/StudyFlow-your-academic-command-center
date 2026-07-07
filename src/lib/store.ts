"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Course,
  GradeEntry,
  PomodoroSession,
  Priority,
  Status,
  Task,
  View,
} from "./types";

export interface NewTaskInput {
  title: string;
  courseId: string;
  dueDate: string;
  priority?: Priority;
  status?: Status;
  estimatedHours?: number;
  notes?: string;
}

interface StoreState {
  courses: Course[];
  tasks: Task[];
  grades: GradeEntry[];
  sessions: PomodoroSession[];
  targets: Record<string, number>; // courseId -> what-if target %
  onboarded: boolean;
  view: View;
  selectedTaskId: string | null;
  quickCaptureOpen: boolean;

  // nav
  setView: (v: View) => void;
  setSelectedTask: (id: string | null) => void;
  setQuickCapture: (open: boolean) => void;

  // onboarding
  completeOnboarding: (courses: Course[], tasks: Task[]) => void;
  resetAll: () => void;

  // courses
  addCourse: (c: Omit<Course, "id" | "createdAt">) => string;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // tasks
  addTask: (t: NewTaskInput) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setTaskStatus: (id: string, status: Status) => void;
  rescheduleTask: (id: string, dueDate: string) => void;

  // grades
  addGrade: (g: Omit<GradeEntry, "id">) => void;
  updateGrade: (id: string, patch: Partial<GradeEntry>) => void;
  deleteGrade: (id: string) => void;
  setTarget: (courseId: string, target: number) => void;

  // pomodoro
  addSession: (s: Omit<PomodoroSession, "id" | "completedAt">) => void;
}

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      courses: [],
      tasks: [],
      grades: [],
      sessions: [],
      targets: {},
      onboarded: false,
      view: "dashboard",
      selectedTaskId: null,
      quickCaptureOpen: false,

      setView: (v) => set({ view: v, selectedTaskId: null }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      setQuickCapture: (open) => set({ quickCaptureOpen: open }),

      completeOnboarding: (courses, tasks) =>
        set({ courses, tasks, onboarded: true, view: "dashboard" }),

      resetAll: () =>
        set({
          courses: [],
          tasks: [],
          grades: [],
          sessions: [],
          targets: {},
          onboarded: false,
          view: "dashboard",
          selectedTaskId: null,
          quickCaptureOpen: false,
        }),

      addCourse: (c) => {
        const id = uid();
        const course: Course = { ...c, id, createdAt: new Date().toISOString() };
        set((s) => ({ courses: [...s.courses, course] }));
        return id;
      },
      updateCourse: (id, patch) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      deleteCourse: (id) =>
        set((s) => ({
          courses: s.courses.filter((c) => c.id !== id),
          tasks: s.tasks.filter((t) => t.courseId !== id),
          grades: s.grades.filter((g) => g.courseId !== id),
          targets: Object.fromEntries(
            Object.entries(s.targets).filter(([k]) => k !== id),
          ),
        })),

      addTask: (t) => {
        const id = uid();
        const task: Task = {
          id,
          title: t.title,
          courseId: t.courseId,
          dueDate: t.dueDate,
          priority: t.priority ?? "medium",
          status: t.status ?? "not_started",
          estimatedHours: t.estimatedHours ?? 1,
          notes: t.notes,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return id;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === "done" ? "not_started" : "done" }
              : t,
          ),
        })),
      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
      rescheduleTask: (id, dueDate) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, dueDate } : t)),
        })),

      addGrade: (g) =>
        set((s) => ({ grades: [...s.grades, { ...g, id: uid() }] })),
      updateGrade: (id, patch) =>
        set((s) => ({
          grades: s.grades.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGrade: (id) =>
        set((s) => ({ grades: s.grades.filter((g) => g.id !== id) })),
      setTarget: (courseId, target) =>
        set((s) => ({ targets: { ...s.targets, [courseId]: target } })),

      addSession: (s) =>
        set((st) => ({
          sessions: [
            ...st.sessions,
            { ...s, id: uid(), completedAt: new Date().toISOString() },
          ],
        })),
    }),
    {
      name: "studyflow-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        courses: s.courses,
        tasks: s.tasks,
        grades: s.grades,
        sessions: s.sessions,
        targets: s.targets,
        onboarded: s.onboarded,
        view: s.view,
      }),
    },
  ),
);
