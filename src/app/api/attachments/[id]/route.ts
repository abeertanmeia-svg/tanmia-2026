import { db } from "@/db";
import { attachments, resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const [row] = await db
    .select({ id: attachments.id, uploadedBy: attachments.uploadedBy, ownerId: resources.authorId })
    .from(attachments)
    .innerJoin(resources, eq(resources.id, attachments.resourceId))
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return Response.json({ error: "غير موجود" }, { status: 404 });
  if (row.uploadedBy !== user.id && row.ownerId !== user.id && user.role !== "admin") {
    return Response.json({ error: "لا تملكين صلاحية حذف هذا المرفق" }, { status: 403 });
  }
  await db.delete(attachments).where(eq(attachments.id, id));
  return Response.json({ ok: true });
}
