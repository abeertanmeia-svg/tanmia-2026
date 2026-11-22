import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource, listComments } from "@/lib/resources";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  return Response.json({ items: await listComments(id) });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const resource = await getResource(id);
  if (!resource) return Response.json({ error: "غير موجود" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (!text) return Response.json({ error: "نص التعليق مطلوب" }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "التعليق طويل جداً" }, { status: 400 });
  const [row] = await db.insert(comments).values({ resourceId: id, authorId: user.id, body: text }).returning();
  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id));
  return Response.json(
    { item: { ...row, authorName: author.name, createdAt: row.createdAt.toISOString() } },
    { status: 201 },
  );
}
