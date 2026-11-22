import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { clearLimit, clientIp, hitLimit, tooManyResponse } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const WINDOW = 15 * 60 * 1000;

export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) {
    return Response.json({ error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" }, { status: 400 });
  }

  // Limit per IP (30 tries / 15 min) and per account (8 tries / 15 min).
  const byIp = await hitLimit(`login:ip:${clientIp(req)}`, 30, WINDOW);
  const byEmail = await hitLimit(`login:email:${email}`, 8, WINDOW);
  if (byIp.limited || byEmail.limited) {
    return tooManyResponse(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec));
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
  }
  await clearLimit(`login:email:${email}`);
  await createSession(user.id);
  return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
