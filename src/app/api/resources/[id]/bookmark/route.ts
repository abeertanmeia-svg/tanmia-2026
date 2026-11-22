import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Save a resource to «محفوظاتي». Idempotent thanks to the unique (user, resource) index. */
export async function POST(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "سجّلي الدخول لحفظ المورد" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const item = Number.isInteger(id) ? await getResource(id) : null;
  const visible = item && (item.status === "approved" || user.role === "admin" || item.authorId === user.id);
  if (!visible) return Response.json({ error: "غير موجود" }, { status: 404 });
  await db.insert(bookmarks).values({ userId: user.id, resourceId: id }).onConflictDoNothing();
  return Response.json({ bookmarked: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, user.id), eq(bookmarks.resourceId, id)));
  return Response.json({ bookmarked: false });
}
