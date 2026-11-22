import { db } from "@/db";
import { comments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const [existing] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!existing) return Response.json({ error: "غير موجود" }, { status: 404 });
  if (existing.authorId !== user.id && user.role !== "admin") {
    return Response.json({ error: "لا تملكين صلاحية حذف هذا التعليق" }, { status: 403 });
  }
  await db.delete(comments).where(eq(comments.id, id));
  return Response.json({ ok: true });
}
