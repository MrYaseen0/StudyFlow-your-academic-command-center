import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const upsertSchema = z.object({
  courseId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["present", "absent", "late", "excused"]),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const records = await db.attendance.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } });
  return NextResponse.json({ attendance: records.map((a) => ({
    id: a.id, courseId: a.courseId, date: a.date.toISOString(),
    status: a.status, note: a.note ?? undefined,
  })) });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const body = await parseJson(req);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const { courseId, date, status, note } = parsed.data;
  const course = await db.course.findFirst({ where: { id: courseId, userId: user.id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const record = await db.attendance.upsert({
    where: { userId_courseId_date: { userId: user.id, courseId, date: dateObj } },
    create: { userId: user.id, courseId, date: dateObj, status, note: note?.trim() || null },
    update: { status, note: note?.trim() || null },
  });
  return NextResponse.json({
    attendance: {
      id: record.id, courseId: record.courseId, date: record.date.toISOString(),
      status: record.status, note: record.note ?? undefined,
    },
  });
}
