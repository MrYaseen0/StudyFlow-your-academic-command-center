import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, parseJson } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40),
  instructor: z.string().max(120).optional().default(""),
  color: z.string().max(20).default("#C9748A"),
  creditHours: z.number().int().min(1).max(8).default(3),
});

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ courses: courses.map((c) => ({
    id: c.id, name: c.name, code: c.code, instructor: c.instructor,
    color: c.color, creditHours: c.creditHours, createdAt: c.createdAt.toISOString(),
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
  const { name, code, instructor, color, creditHours } = parsed.data;
  const course = await db.course.create({
    data: { userId: user.id, name: name.trim(), code: code.trim().toUpperCase(), instructor: instructor.trim(), color, creditHours },
  });
  return NextResponse.json({
    course: {
      id: course.id, name: course.name, code: course.code, instructor: course.instructor,
      color: course.color, creditHours: course.creditHours, createdAt: course.createdAt.toISOString(),
    },
  });
}
