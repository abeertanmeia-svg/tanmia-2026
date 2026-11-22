import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { GOVERNORATES } from "@/lib/sections";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 100);
  const school = String(body.school ?? "").trim().slice(0, 200) || null;
  const gov = String(body.governorate ?? "").trim();
  const governorate = GOVERNORATES.includes(gov) ? gov : null;
  if (name.length < 2) return Response.json({ error: "الاسم قصير جداً" }, { status: 400 });
  await db.update(users).set({ name, school, governorate }).where(eq(users.id, user.id));
  return Response.json({ ok: true, user: { ...user, name, school, governorate } });
}
