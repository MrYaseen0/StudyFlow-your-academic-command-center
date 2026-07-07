import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE, createToken } from "@/lib/auth";
import type { NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Read+verify the session cookie. Returns the user row or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true },
  });
  return user ?? null;
}

/** Require auth — returns user or a 401 Response. */
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Parse JSON body safely. */
export async function parseJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
