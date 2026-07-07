import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie, parseJson } from "@/lib/session";
import { rateLimit, rateLimitedResponse, POLICIES, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

// Stronger password policy: min 8 chars, at least one letter and one number.
// Blocks trivial passwords without being annoying.
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per hour per IP (blocks account spam).
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, POLICIES.register.limit, POLICIES.register.windowMs);
  if (!rl.ok) return rateLimitedResponse(rl.resetAt);

  const body = await parseJson(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), passwordHash },
    select: { id: true, email: true, name: true },
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ user });
}
