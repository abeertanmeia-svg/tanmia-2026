import { db } from "@/db";
import { appEvents, appRegistry, type AppChecks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { APP_GROUPS, APP_STATUSES, CHECK_LABELS, statusLabel } from "@/lib/apps";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const TEXT_FIELDS = [
  ["name", "الاسم"],
  ["ref", "المرجع"],
  ["purpose", "الوظيفة"],
  ["tested", "ما تم اختباره"],
  ["nextStep", "الخطوة التالية"],
  ["userReport", "ملاحظة: أفادت المستخدمة"],
] as const;

/**
 * Update a registry row. Enforces the registry rules:
 *  1) status «مُختبَر» only when all six checks are done;
 *  2) every change is written to the history with old → new values;
 *  3) no deletion — only archiving.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "متاح للمنسقة فقط" }, { status: 403 });
  const id = Number((await ctx.params).id);
  const [cur] = await db.select().from(appRegistry).where(eq(appRegistry.id, id)).limit(1);
  if (!cur) return Response.json({ error: "غير موجود" }, { status: 404 });
  const b = await req.json().catch(() => ({}));

  const patch: Partial<typeof appRegistry.$inferInsert> = {};
  const log: { kind: string; summary: string }[] = [];

  // Reorder: swap sort order with the neighbour (within non-archived rows).
  if (b.move === "up" || b.move === "down") {
    const all = await db.select({ id: appRegistry.id, sortOrder: appRegistry.sortOrder, archived: appRegistry.archived }).from(appRegistry);
    const list = all.filter((r) => !r.archived).sort((x, y) => x.sortOrder - y.sortOrder || x.id - y.id);
    const i = list.findIndex((r) => r.id === id);
    const j = b.move === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return Response.json({ item: cur });
    // Normalise orders then swap.
    for (let k = 0; k < list.length; k++) list[k].sortOrder = k + 1;
    [list[i].sortOrder, list[j].sortOrder] = [list[j].sortOrder, list[i].sortOrder];
    for (const r of list) await db.update(appRegistry).set({ sortOrder: r.sortOrder }).where(eq(appRegistry.id, r.id));
    await db.insert(appEvents).values({ appId: id, userId: user.id, kind: "edit", summary: `الترتيب: ${i + 1} ← ${j + 1}` });
    const rows = await db.select().from(appRegistry);
    return Response.json({ reordered: rows.map((r) => ({ id: r.id, sortOrder: r.sortOrder })) });
  }

  for (const [key, label] of TEXT_FIELDS) {
    if (typeof b[key] === "string" && b[key].trim() !== cur[key]) {
      const v = b[key].trim().slice(0, key === "name" ? 200 : 1000);
      if (key === "name" && !v) continue;
      patch[key] = v;
      log.push({ kind: key === "userReport" ? "user_report" : "edit", summary: `${label}: «${cur[key] || "—"}» ← «${v || "—"}»` });
    }
  }
  if (typeof b.url === "string" && (b.url.trim() || null) !== cur.url) {
    const v = b.url.trim();
    if (v && !/^https?:\/\//i.test(v)) return Response.json({ error: "الرابط يجب أن يبدأ بـ http:// أو https://" }, { status: 400 });
    patch.url = v || null;
    log.push({ kind: "edit", summary: `الرابط: «${cur.url ?? "—"}» ← «${v || "—"}»` });
  }
  if (typeof b.groupKey === "string" && b.groupKey !== cur.groupKey && APP_GROUPS.some((g) => g.key === b.groupKey)) {
    patch.groupKey = b.groupKey;
    log.push({ kind: "edit", summary: `المجموعة: ${APP_GROUPS.find((g) => g.key === cur.groupKey)?.label} ← ${APP_GROUPS.find((g) => g.key === b.groupKey)?.label}` });
  }
  if (typeof b.isPublic === "boolean" && b.isPublic !== cur.isPublic) {
    patch.isPublic = b.isPublic;
    log.push({ kind: "edit", summary: b.isPublic ? "إظهار في البوابة العامة" : "إخفاء من البوابة العامة" });
  }
  if (typeof b.archived === "boolean" && b.archived !== cur.archived) {
    patch.archived = b.archived;
    log.push({ kind: "archive", summary: b.archived ? "أرشفة الصف (يبقى كسجل تاريخي — لا حذف)" : "استعادة الصف من الأرشيف" });
  }

  let checks: AppChecks = cur.checks;
  if (b.checks && typeof b.checks === "object") {
    const next = { ...cur.checks };
    for (const c of CHECK_LABELS) {
      if (typeof b.checks[c.key] === "boolean" && b.checks[c.key] !== cur.checks[c.key]) {
        next[c.key] = b.checks[c.key];
        log.push({ kind: "check", summary: `فحص «${c.label}»: ${b.checks[c.key] ? "✔ تم" : "✗ أُلغي"}` });
      }
    }
    checks = next;
    patch.checks = next;
  }
  const allChecks = CHECK_LABELS.every((c) => checks[c.key]);

  let status = cur.status;
  if (typeof b.status === "string" && b.status !== cur.status && APP_STATUSES.some((s) => s.key === b.status)) {
    if (b.status === "tested" && !allChecks) {
      return Response.json(
        { error: "لا يمكن تحويل الحالة إلى «مُختبَر» قبل إتمام الفحوص الستة: الفتح، التنقل، الحفظ، إعادة الفتح، الطباعة، المشاركة." },
        { status: 400 },
      );
    }
    status = b.status as typeof cur.status;
  }
  // A tested app whose checklist is no longer complete drops back to «قيد الاختبار».
  if (status === "tested" && !allChecks) status = "testing";
  if (status !== cur.status) {
    patch.status = status;
    log.push({ kind: "status", summary: `الحالة: ${statusLabel(cur.status)} ← ${statusLabel(status)}` });
  }

  if (typeof b.note === "string" && b.note.trim()) {
    const kind = b.noteKind === "reachability" ? "reachability" : "note";
    log.push({ kind, summary: b.note.trim().slice(0, 1000) });
  }

  if (!log.length) return Response.json({ item: cur });
  const [row] = Object.keys(patch).length
    ? await db.update(appRegistry).set({ ...patch, updatedAt: new Date() }).where(eq(appRegistry.id, id)).returning()
    : [cur];
  await db.insert(appEvents).values(log.map((l) => ({ appId: id, userId: user.id, kind: l.kind, summary: l.summary })));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(appEvents).where(eq(appEvents.appId, id));
  return Response.json({ item: { ...row, events: n } });
}
