import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  courseId: z.string().min(1),
  assessmentName: z.string().min(1).max(120),
  grade: z.number().min(0).max(100),
  weight: z.number().min(0).max(100),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const grades = await db.gradeEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ grades: grades.map((g) => ({
    id: g.id, courseId: g.courseId, assessmentName: g.assessmentName, grade: g.grade, weight: g.weight,
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
  const { courseId, assessmentName, grade, weight } = parsed.data;
  const course = await db.course.findFirst({ where: { id: courseId, userId: user.id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const g = await db.gradeEntry.create({
    data: { userId: user.id, courseId, assessmentName: assessmentName.trim(), grade, weight },
  });
  return NextResponse.json({ grade: { id: g.id, courseId: g.courseId, assessmentName: g.assessmentName, grade: g.grade, weight: g.weight } });
}
