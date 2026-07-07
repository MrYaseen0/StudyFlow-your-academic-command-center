import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  courseId: z.string().min(1),
  goalId: z.string().nullable().optional(),
  dueDate: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  status: z.enum(["not_started", "in_progress", "done"]).default("not_started"),
  estimatedHours: z.number().min(0).max(200).default(1),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const tasks = await db.task.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ tasks: tasks.map((t) => ({
    id: t.id, title: t.title, courseId: t.courseId, goalId: t.goalId ?? undefined,
    dueDate: t.dueDate.toISOString(),
    priority: t.priority, status: t.status, estimatedHours: t.estimatedHours,
    notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(),
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
  const { title, courseId, goalId, dueDate, priority, status, estimatedHours, notes } = parsed.data;
  // authorize course belongs to user
  const course = await db.course.findFirst({ where: { id: courseId, userId: user.id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  // authorize goal belongs to user (if provided)
  let verifiedGoalId: string | null = null;
  if (goalId) {
    const goal = await db.goal.findFirst({ where: { id: goalId, userId: user.id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    verifiedGoalId = goalId;
  }
  const task = await db.task.create({
    data: {
      userId: user.id, courseId, goalId: verifiedGoalId, title: title.trim(),
      dueDate: new Date(dueDate), priority, status, estimatedHours,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json({
    task: {
      id: task.id, title: task.title, courseId: task.courseId, goalId: task.goalId ?? undefined,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority, status: task.status, estimatedHours: task.estimatedHours,
      notes: task.notes ?? undefined, createdAt: task.createdAt.toISOString(),
    },
  });
}
