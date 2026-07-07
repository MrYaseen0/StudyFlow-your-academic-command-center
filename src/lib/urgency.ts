import type { Priority, Status, Task, UrgencyLevel } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function getUrgency(
  dueDate: string,
  status: Status,
  now: Date = new Date(),
): UrgencyLevel {
  if (status === "done") return "done";
  const due = new Date(dueDate).getTime();
  const diff = due - now.getTime();
  if (diff < 0) return "overdue";
  if (diff < 48 * HOUR) return "urgent";
  if (diff < 7 * DAY) return "soon";
  return "calm";
}

export const URGENCY_META: Record<
  UrgencyLevel,
  { label: string; dot: string; bg: string; text: string; ring: string; border: string }
> = {
  done: {
    label: "Done",
    dot: "#8FA894",
    bg: "rgba(143, 168, 148, 0.12)",
    text: "#6B5D56",
    ring: "rgba(143, 168, 148, 0.3)",
    border: "rgba(143, 168, 148, 0.25)",
  },
  overdue: {
    label: "Overdue",
    dot: "#B8506A",
    bg: "rgba(184, 80, 106, 0.08)",
    text: "#B8506A",
    ring: "rgba(184, 80, 106, 0.25)",
    border: "rgba(184, 80, 106, 0.2)",
  },
  urgent: {
    label: "Due < 48h",
    dot: "#B8506A",
    bg: "rgba(184, 80, 106, 0.07)",
    text: "#B8506A",
    ring: "rgba(184, 80, 106, 0.22)",
    border: "rgba(184, 80, 106, 0.18)",
  },
  soon: {
    label: "This week",
    dot: "#D9A566",
    bg: "rgba(217, 165, 102, 0.08)",
    text: "#A87432",
    ring: "rgba(217, 165, 102, 0.25)",
    border: "rgba(217, 165, 102, 0.2)",
  },
  calm: {
    label: "Upcoming",
    dot: "#A69A92",
    bg: "rgba(166, 154, 146, 0.05)",
    text: "#6B5D56",
    ring: "rgba(166, 154, 146, 0.2)",
    border: "rgba(166, 154, 146, 0.18)",
  },
};

export function relativeDueLabel(dueDate: string, now: Date = new Date()): string {
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / DAY);
  const hours = Math.floor((absDiff % DAY) / HOUR);

  if (diff < 0) {
    if (days === 0) return hours <= 1 ? "Overdue" : `${hours}h overdue`;
    return `${days}d ${hours}h overdue`;
  }
  if (days === 0) {
    if (hours <= 1) return "Due now";
    return `Due in ${hours}h`;
  }
  if (days === 1) return "Due tomorrow";
  if (days < 7) return `Due in ${days}d`;
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isDueToday(dueDate: string, now: Date = new Date()): boolean {
  return isSameDay(new Date(dueDate), now);
}

export function sortByUrgency(tasks: Task[], now: Date = new Date()): Task[] {
  const order: Record<UrgencyLevel, number> = {
    overdue: 0,
    urgent: 1,
    soon: 2,
    calm: 3,
    done: 4,
  };
  return [...tasks].sort((a, b) => {
    const ua = getUrgency(a.dueDate, a.status, now);
    const ub = getUrgency(b.dueDate, b.status, now);
    if (ua !== ub) return order[ua] - order[ub];
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function priorityRank(p: Priority): number {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}
