import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie, parseJson } from "@/lib/session";
import { rateLimit, rateLimitedResponse, POLICIES, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP (blocks distributed brute force).
  const ip = getClientIp(req);
  const ipRl = rateLimit(`login:ip:${ip}`, POLICIES.login.limit, POLICIES.login.windowMs);
  if (!ipRl.ok) return rateLimitedResponse(ipRl.resetAt);

  const body = await parseJson(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;
  const emailKey = email.toLowerCase();

  // Rate limit by email too (blocks targeted account brute force).
  const emailRl = rateLimit(`login:email:${emailKey}`, POLICIES.login.limit, POLICIES.login.windowMs);
  if (!emailRl.ok) return rateLimitedResponse(emailRl.resetAt);

  const user = await db.user.findUnique({ where: { email: emailKey } });
  // Always run a verify to avoid timing-based user enumeration, even if not found.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2a$10$012345678901234567890123456789012345678901");

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
