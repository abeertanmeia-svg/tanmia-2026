import { db } from "@/db";
import { appEvents, appRegistry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureAppsSeeded } from "@/lib/apps";
import { and, asc, eq, sql } from "drizzle-orm";
import { AppRegistry } from "@/components/AppRegistry";
import { PublicApps } from "@/components/PublicApps";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  await ensureAppsSeeded();
  const user = await getCurrentUser();
  if (user?.role === "admin") {
    const rows = await db
      .select({ row: appRegistry, events: sql<number>`(select count(*)::int from ${appEvents} where ${appEvents.appId} = ${appRegistry.id})` })
      .from(appRegistry)
      .orderBy(asc(appRegistry.sortOrder), asc(appRegistry.id));
    return (
      <AppRegistry
        initial={rows.map(({ row, events }) => ({ ...row, events, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }))}
      />
    );
  }
  const items = await db
    .select({ id: appRegistry.id, name: appRegistry.name, purpose: appRegistry.purpose, status: appRegistry.status, url: appRegistry.url })
    .from(appRegistry)
    .where(and(eq(appRegistry.isPublic, true), eq(appRegistry.archived, false)))
    .orderBy(asc(appRegistry.sortOrder));
  return (
    <div className="animate-fade-up space-y-5">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">🧩 التطبيقات والموارد</h1>
        <p className="mt-1 text-sm text-slate-600">تطبيقات المبادرة وروابطها. الحالة تُحدّث بعد الاختبار الفعلي (فتح + تنقل + حفظ + إعادة فتح + طباعة + مشاركة).</p>
      </div>
      <PublicApps items={items} />
    </div>
  );
}
