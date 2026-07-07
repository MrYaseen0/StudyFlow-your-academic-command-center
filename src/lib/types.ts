// StudyFlow domain types

export type View = "dashboard" | "courses" | "planner" | "grades" | "timer" | "attendance" | "records" | "goals";

export type Priority = "high" | "medium" | "low";
export type Status = "not_started" | "in_progress" | "done";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type GoalStatus = "active" | "achieved" | "paused";

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  color: string; // hex
  creditHours: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  courseId: string;
  goalId?: string | null;
  dueDate: string; // ISO string
  priority: Priority;
  status: Status;
  estimatedHours: number;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null; // ISO or null
  status: GoalStatus;
  createdAt: string;
}

export interface GradeEntry {
  id: string;
  courseId: string;
  assessmentName: string;
  grade: number; // 0-100 percentage
  weight: number; // 0-100 percent of course
  isProjected?: boolean; // what-if entry
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  courseId: string;
  duration: number; // minutes
  completedAt: string; // ISO
  mode: "focus" | "break";
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string; // ISO (date only, midnight)
  status: AttendanceStatus;
  note?: string;
}

export type UrgencyLevel = "done" | "overdue" | "urgent" | "soon" | "calm";

export const COURSE_COLORS = [
  "#C9748A", // blush deep
  "#8FA894", // sage
  "#D9A566", // amber
  "#B8506A", // rose
  "#6B5D56", // ink secondary
  "#E8A0AC", // blush primary
  "#A69A92", // ink muted
  "#2E2420", // ink primary
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "#B8506A" },
  medium: { label: "Medium", color: "#D9A566" },
  low: { label: "Low", color: "#8FA894" },
};

export const STATUS_META: Record<Status, { label: string }> = {
  not_started: { label: "Not started" },
  in_progress: { label: "In progress" },
  done: { label: "Done" },
};
