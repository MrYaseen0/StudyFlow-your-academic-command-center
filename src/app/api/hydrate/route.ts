import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const [courses, tasks, grades, sessions, attendance] = await Promise.all([
    db.course.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.task.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.gradeEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.pomodoroSession.findMany({ where: { userId: user.id }, orderBy: { completedAt: "desc" } }),
    db.attendance.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
  ]);

  return NextResponse.json({
    courses: courses.map(serializeCourse),
    tasks: tasks.map(serializeTask),
    grades: grades.map(serializeGrade),
    sessions: sessions.map(serializeSession),
    attendance: attendance.map(serializeAttendance),
  });
}

function serializeCourse(c: any) {
  return {
    id: c.id, name: c.name, code: c.code, instructor: c.instructor,
    color: c.color, creditHours: c.creditHours, createdAt: c.createdAt.toISOString(),
  };
}
function serializeTask(t: any) {
  return {
    id: t.id, title: t.title, courseId: t.courseId, dueDate: t.dueDate.toISOString(),
    priority: t.priority, status: t.status, estimatedHours: t.estimatedHours,
    notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(),
  };
}
function serializeGrade(g: any) {
  return { id: g.id, courseId: g.courseId, assessmentName: g.assessmentName, grade: g.grade, weight: g.weight };
}
function serializeSession(s: any) {
  return {
    id: s.id, taskId: s.taskId ?? undefined, courseId: s.courseId ?? undefined,
    duration: s.duration, mode: s.mode, completedAt: s.completedAt.toISOString(),
  };
}
function serializeAttendance(a: any) {
  return {
    id: a.id, courseId: a.courseId, date: a.date.toISOString(),
    status: a.status, note: a.note ?? undefined,
  };
}
