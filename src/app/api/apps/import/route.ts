import { db } from "@/db";
import { appEvents, appRegistry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { EMPTY_CHECKS } from "@/lib/apps";
import { fromLegacyStatus } from "@/lib/apps-json";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Import an apps.json (legacy page format). Never deletes or overwrites:
 * rows whose name already exists are skipped; new rows are added with a history entry.
 * «مُختبَر» (ok) is imported as «قيد الاختبار» until the six checks are completed (rule 1).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "متاح للمنسقة فقط" }, { status: 403 });
  const data = await req.json().catch(() => null);
  if (!Array.isArray(data)) return Response.json({ error: "الملف لا يحتوي على مصفوفة تطبيقات." }, { status: 400 });

  const existing = await db.select({ name: appRegistry.name }).from(appRegistry);
  const names = new Set(existing.map((e) => e.name.trim()));
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${appRegistry.sortOrder}),0)::int` }).from(appRegistry);

  let added = 0;
  let skipped = 0;
  let order = max;
  for (const raw of data.slice(0, 200)) {
    const name = String(raw?.name ?? "").trim().slice(0, 200);
    if (!name || names.has(name)) {
      skipped++;
      continue;
    }
    const url = /^https?:\/\//i.test(String(raw?.url ?? "")) ? String(raw.url).trim() : null;
    const legacy = String(raw?.status ?? "gray");
    const status = fromLegacyStatus(legacy);
    const [row] = await db
      .insert(appRegistry)
      .values({ groupKey: "hosting", name, purpose: String(raw?.fn ?? "").slice(0, 500), url, status, checks: EMPTY_CHECKS, isPublic: true, sortOrder: ++order })
      .returning({ id: appRegistry.id });
    await db.insert(appEvents).values({
      appId: row.id,
      userId: user.id,
      kind: "import",
      summary: `استيراد من apps.json (الحالة في الملف: ${legacy})${legacy === "ok" ? " — سُجّل «قيد الاختبار» حتى تُستكمل الفحوص الستة" : ""}`,
    });
    names.add(name);
    added++;
  }
  return Response.json({ added, skipped });
}
