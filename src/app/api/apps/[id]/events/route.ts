import { db } from "@/db";
import { appEvents, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "متاح للمنسقة فقط" }, { status: 403 });
  const id = Number((await ctx.params).id);
  const rows = await db
    .select({ id: appEvents.id, kind: appEvents.kind, summary: appEvents.summary, createdAt: appEvents.createdAt, by: users.name })
    .from(appEvents)
    .leftJoin(users, eq(users.id, appEvents.userId))
    .where(eq(appEvents.appId, id))
    .orderBy(desc(appEvents.createdAt), desc(appEvents.id));
  return Response.json({ items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}
