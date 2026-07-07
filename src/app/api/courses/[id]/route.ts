import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().min(1).max(40).optional(),
  instructor: z.string().max(120).optional(),
  color: z.string().max(20).optional(),
  creditHours: z.number().int().min(1).max(8).optional(),
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
  const owned = await db.course.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof data.code === "string") data.code = (data.code as string).toUpperCase();
  if (typeof data.name === "string") data.name = (data.name as string).trim();
  if (typeof data.instructor === "string") data.instructor = (data.instructor as string).trim();
  const course = await db.course.update({ where: { id }, data });
  return NextResponse.json({
    course: {
      id: course.id, name: course.name, code: course.code, instructor: course.instructor,
      color: course.color, creditHours: course.creditHours, createdAt: course.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const owned = await db.course.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
