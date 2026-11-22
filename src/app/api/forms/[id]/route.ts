import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "غير مصرح" }, { status: 403 });
  const id = Number((await ctx.params).id);
  const body = await req.json().catch(() => ({}));
  const status = body.status === "reviewed" ? "reviewed" : body.status === "new" ? "new" : undefined;
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : undefined;
  await db.update(formSubmissions).set({ ...(status && { status }), ...(note !== undefined && { note }) }).where(eq(formSubmissions.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "غير مصرح" }, { status: 403 });
  const id = Number((await ctx.params).id);
  await db.delete(formSubmissions).where(eq(formSubmissions.id, id));
  return Response.json({ ok: true });
}
