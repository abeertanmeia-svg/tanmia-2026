import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { clientIp, hitLimit, tooManyResponse } from "@/lib/rate-limit";
import { GOVERNORATES } from "@/lib/sections";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();

  // At most 5 new accounts per IP per hour.
  const rl = await hitLimit(`register:ip:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (rl.limited) return tooManyResponse(rl.retryAfterSec);

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const school = String(body?.school ?? "").trim() || null;
  const gov = String(body?.governorate ?? "").trim();
  const governorate = GOVERNORATES.includes(gov) ? gov : null;

  if (!name || !email || !password) {
    return Response.json({ error: "جميع الحقول الأساسية مطلوبة" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "صيغة البريد الإلكتروني غير صحيحة" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    return Response.json({ error: "هذا البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
  }
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(password), school, governorate })
    .returning({ id: users.id, name: users.name, role: users.role });
  await createSession(user.id);
  return Response.json({ ok: true, user }, { status: 201 });
}
