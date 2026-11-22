import { db } from "@/db";
import { teacherTasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const body = await req.json().catch(() => ({}));
  const patch: { done?: boolean; title?: string } = {};
  if (typeof body.done === "boolean") patch.done = body.done;
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 300);
  const [item] = await db.update(teacherTasks).set(patch).where(and(eq(teacherTasks.id, id), eq(teacherTasks.userId, user.id))).returning();
  if (!item) return Response.json({ error: "غير موجود" }, { status: 404 });
  return Response.json({ item });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  await db.delete(teacherTasks).where(and(eq(teacherTasks.id, id), eq(teacherTasks.userId, user.id)));
  return Response.json({ ok: true });
}
