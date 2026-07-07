import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  status: z.enum(["active", "achieved", "paused"]).optional(),
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
  const owned = await db.goal.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.description !== undefined) data.description = parsed.data.description?.trim() || null;
  if (parsed.data.targetDate !== undefined) data.targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  const g = await db.goal.update({ where: { id }, data });
  return NextResponse.json({
    goal: {
      id: g.id, title: g.title, description: g.description ?? undefined,
      targetDate: g.targetDate?.toISOString() ?? null, status: g.status,
      createdAt: g.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const owned = await db.goal.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
