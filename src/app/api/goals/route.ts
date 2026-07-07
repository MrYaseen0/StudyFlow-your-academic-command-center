import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  targetDate: z.string().nullable().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const goals = await db.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ goals: goals.map((g) => ({
    id: g.id, title: g.title, description: g.description ?? undefined,
    targetDate: g.targetDate?.toISOString() ?? null, status: g.status,
    createdAt: g.createdAt.toISOString(),
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
  const { title, description, targetDate } = parsed.data;
  const g = await db.goal.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });
  return NextResponse.json({
    goal: {
      id: g.id, title: g.title, description: g.description ?? undefined,
      targetDate: g.targetDate?.toISOString() ?? null, status: g.status,
      createdAt: g.createdAt.toISOString(),
    },
  });
}
