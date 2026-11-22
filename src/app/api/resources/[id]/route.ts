import { db } from "@/db";
import { resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource, validateResourceInput } from "@/lib/resources";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const viewer = await getCurrentUser();
  const item = await getResource(id, viewer?.id);
  const visible = item && (item.status === "approved" || viewer?.role === "admin" || viewer?.id === item.authorId);
  if (!item || !visible) return Response.json({ error: "غير موجود" }, { status: 404 });
  return Response.json({ item });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = parseId((await ctx.params).id);
  if (!id) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const existing = await getResource(id);
  if (!existing) return Response.json({ error: "غير موجود" }, { status: 404 });
  if (existing.authorId !== user.id && user.role !== "admin") {
    return Response.json({ error: "لا تملكين صلاحية تعديل هذا العنصر" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  // Admin-only moderation shortcut
  if (body && Object.keys(body).length === 1 && typeof body.status === "string") {
    if (user.role !== "admin") return Response.json({ error: "الاعتماد متاح للمنسقة فقط" }, { status: 403 });
    const status = body.status === "approved" ? "approved" : "pending";
    await db.update(resources).set({ status }).where(eq(resources.id, id));
    return Response.json({ item: await getResource(id) });
  }
  const { data, error } = validateResourceInput({ ...existing, ...(body ?? {}) }, existing.section);
  if (!data) return Response.json({ error }, { status: 400 });
  await db
    .update(resources)
    .set({ ...data, featured: user.role === "admin" ? data.featured : existing.featured, updatedAt: new Date() })
    .where(eq(resources.id, id));
  const item = await getResource(id);
  return Response.json({ item });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = parseId((await ctx.params).id);
  if (!id) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const existing = await getResource(id);
  if (!existing) return Response.json({ error: "غير موجود" }, { status: 404 });
  if (existing.authorId !== user.id && user.role !== "admin") {
    return Response.json({ error: "لا تملكين صلاحية حذف هذا العنصر" }, { status: 403 });
  }
  await db.delete(resources).where(eq(resources.id, id));
  return Response.json({ ok: true });
}
