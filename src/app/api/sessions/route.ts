import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  taskId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  duration: z.number().int().min(1).max(600),
  mode: z.enum(["focus", "break"]).default("focus"),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const sessions = await db.pomodoroSession.findMany({ where: { userId: user.id }, orderBy: { completedAt: "desc" } });
  return NextResponse.json({ sessions: sessions.map((s) => ({
    id: s.id, taskId: s.taskId ?? undefined, courseId: s.courseId ?? undefined,
    duration: s.duration, mode: s.mode, completedAt: s.completedAt.toISOString(),
  })) });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const body = await parseJson(req);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const { taskId, courseId, duration, mode } = parsed.data;
  // optional ownership checks
  if (courseId) {
    const c = await db.course.findFirst({ where: { id: courseId, userId: user.id } });
    if (!c) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (taskId) {
    const t = await db.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!t) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const s = await db.pomodoroSession.create({
    data: { userId: user.id, taskId: taskId ?? null, courseId: courseId ?? null, duration, mode },
  });
  return NextResponse.json({
    session: {
      id: s.id, taskId: s.taskId ?? undefined, courseId: s.courseId ?? undefined,
      duration: s.duration, mode: s.mode, completedAt: s.completedAt.toISOString(),
    },
  });
}
