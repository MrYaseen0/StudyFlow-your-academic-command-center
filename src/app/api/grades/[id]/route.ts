import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  assessmentName: z.string().min(1).max(120).optional(),
  grade: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(100).optional(),
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
  const owned = await db.gradeEntry.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (parsed.data.assessmentName !== undefined) data.assessmentName = parsed.data.assessmentName.trim();
  if (parsed.data.grade !== undefined) data.grade = parsed.data.grade;
  if (parsed.data.weight !== undefined) data.weight = parsed.data.weight;
  const g = await db.gradeEntry.update({ where: { id }, data });
  return NextResponse.json({ grade: { id: g.id, courseId: g.courseId, assessmentName: g.assessmentName, grade: g.grade, weight: g.weight } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const owned = await db.gradeEntry.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.gradeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
