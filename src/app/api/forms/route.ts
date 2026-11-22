import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getForm } from "@/lib/forms";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const form = getForm(String(body?.type ?? ""));
  if (!form) return Response.json({ error: "نوع الاستمارة غير صحيح" }, { status: 400 });
  const raw = (body?.data ?? {}) as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const sec of form.sections) {
    for (const f of sec.fields) {
      const v = String(raw[f.key] ?? "").trim().slice(0, 4000);
      if (f.required && !v) return Response.json({ error: `الحقل "${f.label}" مطلوب` }, { status: 400 });
      if (v) data[f.key] = v;
    }
  }
  const [row] = await db.insert(formSubmissions).values({ formType: form.type, data }).returning({ id: formSubmissions.id });
  return Response.json({ ok: true, id: row.id }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return Response.json({ error: "غير مصرح" }, { status: 403 });
  const type = new URL(req.url).searchParams.get("type");
  const form = type ? getForm(type) : undefined;
  const rows = await db
    .select()
    .from(formSubmissions)
    .where(form ? eq(formSubmissions.formType, form.type) : undefined)
    .orderBy(desc(formSubmissions.createdAt))
    .limit(500);
  return Response.json({ items: rows });
}
