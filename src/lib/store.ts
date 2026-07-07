"use client";

import { create } from "zustand";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Course,
  Goal,
  GoalStatus,
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
  goalId?: string | null;
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
  attendance: AttendanceRecord[];
  targets: Record<string, number>; // courseId -> what-if target % (local, ephemeral)
  hydrated: boolean;
  view: View;
  selectedTaskId: string | null;
  quickCaptureOpen: boolean;

  // lifecycle
  hydrate: () => Promise<void>;
  logoutClear: () => void;

  // nav
  setView: (v: View) => void;
  setSelectedTask: (id: string | null) => void;
  setQuickCapture: (open: boolean) => void;

  // courses (async create; optimistic update/delete)
  addCourse: (c: Omit<Course, "id" | "createdAt">) => Promise<Course>;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // tasks (async create; optimistic update/delete)
  addTask: (t: NewTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setTaskStatus: (id: string, status: Status) => void;
  rescheduleTask: (id: string, dueDate: string) => void;

  // grades
  addGrade: (g: Omit<GradeEntry, "id">) => Promise<GradeEntry>;
  updateGrade: (id: string, patch: Partial<GradeEntry>) => void;
  deleteGrade: (id: string) => void;
  setTarget: (courseId: string, target: number) => void;

  // pomodoro
  addSession: (s: Omit<PomodoroSession, "id" | "completedAt">) => Promise<PomodoroSession>;

  // attendance
  setAttendance: (courseId: string, date: string, status: AttendanceStatus, note?: string) => Promise<void>;
  deleteAttendance: (id: string) => void;

  // goals
  goals: Goal[];
  addGoal: (g: { title: string; description?: string; targetDate?: string | null }) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<Pick<Goal, "title" | "description" | "targetDate" | "status">>) => void;
  deleteGoal: (id: string) => void;
  assignTaskToGoal: (taskId: string, goalId: string | null) => void;
}

function rollbackToast(msg: string) {
  // lazy import to avoid bundling sonner into store
  import("sonner").then(({ toast }) => toast.error(msg));
}

export const useStore = create<StoreState>()((set, get) => ({
  courses: [],
  tasks: [],
  grades: [],
  sessions: [],
  attendance: [],
  goals: [],
  targets: {},
  hydrated: false,
  view: "dashboard",
  selectedTaskId: null,
  quickCaptureOpen: false,

  hydrate: async () => {
    try {
      const res = await fetch("/api/hydrate");
      if (!res.ok) throw new Error("hydrate failed");
      const data = await res.json();
      set({
        courses: data.courses ?? [],
        tasks: data.tasks ?? [],
        grades: data.grades ?? [],
        sessions: data.sessions ?? [],
        attendance: data.attendance ?? [],
        goals: data.goals ?? [],
        hydrated: true,
        view: "dashboard",
      });
    } catch {
      set({ hydrated: true });
    }
  },

  logoutClear: () =>
    set({
      courses: [],
      tasks: [],
      grades: [],
      sessions: [],
      attendance: [],
      goals: [],
      targets: {},
      hydrated: false,
      view: "dashboard",
      selectedTaskId: null,
      quickCaptureOpen: false,
    }),

  setView: (v) => set({ view: v, selectedTaskId: null }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setQuickCapture: (open) => set({ quickCaptureOpen: open }),

  // ---------- courses ----------
  addCourse: async (c) => {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(c),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to add course");
    const course = data.course as Course;
    set((s) => ({ courses: [...s.courses, course] }));
    return course;
  },
  updateCourse: (id, patch) => {
    const prev = get().courses;
    set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {
      set({ courses: prev });
      rollbackToast("Couldn't save course — reverted");
    });
  },
  deleteCourse: (id) => {
    const prev = get();
    set((s) => ({
      courses: s.courses.filter((c) => c.id !== id),
      tasks: s.tasks.filter((t) => t.courseId !== id),
      grades: s.grades.filter((g) => g.courseId !== id),
      attendance: s.attendance.filter((a) => a.courseId !== id),
      targets: Object.fromEntries(Object.entries(s.targets).filter(([k]) => k !== id)),
    }));
    fetch(`/api/courses/${id}`, { method: "DELETE" }).catch(() => {
      set({ courses: prev.courses, tasks: prev.tasks, grades: prev.grades, attendance: prev.attendance });
      rollbackToast("Couldn't delete course — reverted");
    });
  },

  // ---------- tasks ----------
  addTask: async (t) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(t),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to add task");
    const task = data.task as Task;
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },
  updateTask: (id, patch) => {
    const prev = get().tasks;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {
      set({ tasks: prev });
      rollbackToast("Couldn't save task — reverted");
    });
  },
  deleteTask: (id) => {
    const prev = get().tasks;
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {
      set({ tasks: prev });
      rollbackToast("Couldn't delete task — reverted");
    });
  },
  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = task.status === "done" ? "not_started" : "done";
    get().updateTask(id, { status: next });
  },
  setTaskStatus: (id, status) => get().updateTask(id, { status }),
  rescheduleTask: (id, dueDate) => get().updateTask(id, { dueDate }),

  // ---------- grades ----------
  addGrade: async (g) => {
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(g),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to add grade");
    const grade = data.grade as GradeEntry;
    set((s) => ({ grades: [...s.grades, grade] }));
    return grade;
  },
  updateGrade: (id, patch) => {
    const prev = get().grades;
    set((s) => ({ grades: s.grades.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    fetch(`/api/grades/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {
      set({ grades: prev });
      rollbackToast("Couldn't save grade — reverted");
    });
  },
  deleteGrade: (id) => {
    const prev = get().grades;
    set((s) => ({ grades: s.grades.filter((g) => g.id !== id) }));
    fetch(`/api/grades/${id}`, { method: "DELETE" }).catch(() => {
      set({ grades: prev });
      rollbackToast("Couldn't delete grade — reverted");
    });
  },
  setTarget: (courseId, target) =>
    set((s) => ({ targets: { ...s.targets, [courseId]: target } })),

  // ---------- pomodoro ----------
  addSession: async (s) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to log session");
    const session = data.session as PomodoroSession;
    set((st) => ({ sessions: [session, ...st.sessions] }));
    return session;
  },

  // ---------- attendance ----------
  setAttendance: async (courseId, date, status, note) => {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, date, status, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to save attendance");
    const rec = data.attendance as AttendanceRecord;
    set((s) => {
      const others = s.attendance.filter(
        (a) => !(a.courseId === courseId && a.date === rec.date),
      );
      return { attendance: [rec, ...others] };
    });
  },
  deleteAttendance: (id) => {
    const prev = get().attendance;
    set((s) => ({ attendance: s.attendance.filter((a) => a.id !== id) }));
    fetch(`/api/attendance/${id}`, { method: "DELETE" }).catch(() => {
      set({ attendance: prev });
      rollbackToast("Couldn't remove attendance — reverted");
    });
  },

  // ---------- goals ----------
  addGoal: async (g) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(g),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to add goal");
    const goal = data.goal as Goal;
    set((s) => ({ goals: [goal, ...s.goals] }));
    return goal;
  },
  updateGoal: (id, patch) => {
    const prev = get().goals;
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {
      set({ goals: prev });
      rollbackToast("Couldn't save goal — reverted");
    });
  },
  deleteGoal: (id) => {
    const prevGoals = get().goals;
    const prevTasks = get().tasks;
    set((s) => ({
      goals: s.goals.filter((g) => g.id !== id),
      // unlink tasks from the deleted goal (DB does SetNull; mirror locally)
      tasks: s.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
    }));
    fetch(`/api/goals/${id}`, { method: "DELETE" }).catch(() => {
      set({ goals: prevGoals, tasks: prevTasks });
      rollbackToast("Couldn't delete goal — reverted");
    });
  },
  assignTaskToGoal: (taskId, goalId) => {
    // optimistic; uses updateTask under the hood (which handles rollback)
    get().updateTask(taskId, { goalId });
  },
}));
