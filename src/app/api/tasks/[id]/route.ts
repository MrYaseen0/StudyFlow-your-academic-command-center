import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  courseId: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["not_started", "in_progress", "done"]).optional(),
  estimatedHours: z.number().min(0).max(200).optional(),
  notes: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await parseJson(req);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const owned = await db.task.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.courseId !== undefined) {
    const c = await db.course.findFirst({ where: { id: parsed.data.courseId, userId: user.id } });
    if (!c) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    data.courseId = parsed.data.courseId;
  }
  if (parsed.data.dueDate !== undefined) data.dueDate = new Date(parsed.data.dueDate);
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.estimatedHours !== undefined) data.estimatedHours = parsed.data.estimatedHours;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes.trim() || null;
  const task = await db.task.update({ where: { id }, data });
  return NextResponse.json({
    task: {
      id: task.id, title: task.title, courseId: task.courseId, dueDate: task.dueDate.toISOString(),
      priority: task.priority, status: task.status, estimatedHours: task.estimatedHours,
      notes: task.notes ?? undefined, createdAt: task.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const owned = await db.task.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
