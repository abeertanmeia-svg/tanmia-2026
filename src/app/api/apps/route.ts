import { db } from "@/db";
import { appEvents, appRegistry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { APP_GROUPS, EMPTY_CHECKS, ensureAppsSeeded } from "@/lib/apps";
import { and, asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureAppsSeeded();
  const user = await getCurrentUser();
  const publicOnly = new URL(req.url).searchParams.get("public") === "1" || user?.role !== "admin";
  if (publicOnly) {
    const items = await db
      .select({ id: appRegistry.id, groupKey: appRegistry.groupKey, name: appRegistry.name, purpose: appRegistry.purpose, status: appRegistry.status, url: appRegistry.url })
      .from(appRegistry)
      .where(and(eq(appRegistry.isPublic, true), eq(appRegistry.archived, false)))
      .orderBy(asc(appRegistry.sortOrder));
    return Response.json({ items });
  }
  const items = await db
    .select({
      row: appRegistry,
      events: sql<number>`(select count(*)::int from ${appEvents} where ${appEvents.appId} = ${appRegistry.id})`,
    })
    .from(appRegistry)
    .orderBy(asc(appRegistry.sortOrder), asc(appRegistry.id));
  return Response.json({ items: items.map((i) => ({ ...i.row, events: i.events })) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "متاح للمنسقة فقط" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim().slice(0, 200);
  if (!name) return Response.json({ error: "اسم التطبيق مطلوب" }, { status: 400 });
  const groupKey = APP_GROUPS.some((g) => g.key === b.groupKey) ? String(b.groupKey) : "hosting";
  const url = /^https?:\/\//i.test(String(b.url ?? "")) ? String(b.url).trim() : null;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${appRegistry.sortOrder}),0)::int` }).from(appRegistry);
  const [row] = await db
    .insert(appRegistry)
    .values({
      groupKey,
      name,
      ref: String(b.ref ?? "").slice(0, 300),
      url,
      purpose: String(b.purpose ?? "").slice(0, 500),
      nextStep: String(b.nextStep ?? "").slice(0, 500),
      checks: EMPTY_CHECKS,
      isPublic: Boolean(b.isPublic),
      sortOrder: max + 1,
    })
    .returning();
  await db.insert(appEvents).values({ appId: row.id, userId: user.id, kind: "create", summary: `إضافة صف جديد: ${name}` });
  return Response.json({ item: { ...row, events: 1 } }, { status: 201 });
}
