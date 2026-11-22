"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ResourceDTO } from "@/lib/resources";
import { FORMS, getForm } from "@/lib/forms";
import { getSection } from "@/lib/sections";
import { timeAgo } from "@/lib/format";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

type Submission = {
  id: number;
  formType: string;
  data: Record<string, string>;
  status: "new" | "reviewed";
  note: string | null;
  createdAt: string;
};

export function AdminPanel({ pending: initialPending, submissions: initialSubs }: { pending: ResourceDTO[]; submissions: Submission[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(initialPending);
  const [subs, setSubs] = useState(initialSubs);
  const [tab, setTab] = useState<string>("pending");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "resource" | "sub"; id: number; title: string } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: pending.length };
    for (const f of FORMS) c[f.type] = subs.filter((s) => s.formType === f.type).length;
    return c;
  }, [pending, subs]);
  const newCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FORMS) c[f.type] = subs.filter((s) => s.formType === f.type && s.status === "new").length;
    return c;
  }, [subs]);

  async function approve(r: ResourceDTO) {
    setPending((p) => p.filter((x) => x.id !== r.id));
    const res = await fetch(`/api/resources/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) });
    if (!res.ok) {
      setPending((p) => [r, ...p]);
      toast.error("تعذر الاعتماد");
      return;
    }
    toast.success("تم الاعتماد والنشر");
    router.refresh();
  }

  async function rejectResource(id: number) {
    const snapshot = pending;
    setPending((p) => p.filter((x) => x.id !== id));
    setConfirm(null);
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPending(snapshot);
      toast.error("تعذر الحذف");
      return;
    }
    toast.success("تم الحذف");
    router.refresh();
  }

  async function toggleReviewed(s: Submission) {
    const status = s.status === "new" ? "reviewed" : "new";
    setSubs((all) => all.map((x) => (x.id === s.id ? { ...x, status } : x)));
    const res = await fetch(`/api/forms/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) {
      setSubs((all) => all.map((x) => (x.id === s.id ? { ...x, status: s.status } : x)));
      toast.error("تعذر التحديث");
    }
  }

  async function deleteSub(id: number) {
    const snapshot = subs;
    setSubs((all) => all.filter((x) => x.id !== id));
    setConfirm(null);
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setSubs(snapshot);
      toast.error("تعذر الحذف");
    } else toast.success("تم الحذف");
  }

  function exportCsv(type: string) {
    const form = getForm(type);
    if (!form) return;
    const fields = form.sections.flatMap((s) => s.fields);
    const rows = subs.filter((s) => s.formType === type);
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["#", "التاريخ", "الحالة", ...fields.map((f) => f.label)].map(esc).join(","),
      ...rows.map((r) => [r.id, new Date(r.createdAt).toLocaleString("ar-EG"), r.status === "new" ? "جديد" : "تمت المراجعة", ...fields.map((f) => r.data[f.key] ?? "")].map((v) => esc(String(v))).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${form.short}.csv`;
    a.click();
  }

  const tabs = [{ id: "pending", label: "مساهمات بانتظار الاعتماد", icon: "⏳" }, ...FORMS.map((f) => ({ id: f.type, label: f.short, icon: f.icon }))];
  const currentForm = getForm(tab);
  const currentSubs = subs.filter((s) => s.formType === tab);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">🛡️ لوحة إدارة المبادرة</h1>
        <p className="mt-1 text-sm text-slate-500">اعتماد مساهمات المعلمات، ومتابعة الاستمارات الواردة من المعلمات والجمعيات والطلاب وأولياء الأمور.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/review/index.html" target="_blank" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">📦 حزمة المراجعة (نسخ HTML لكل الصفحات)</a>
          <a href="/review/tanmia-review.zip" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">🗜️ تنزيل ZIP</a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const badge = t.id === "pending" ? counts.pending : newCounts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                tab === t.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{t.icon}</span> {t.label}
              {badge > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
              {t.id !== "pending" && <span className="text-[10px] text-slate-400">({counts[t.id]})</span>}
            </button>
          );
        })}
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <Empty icon="✅" title="لا توجد مساهمات بانتظار الاعتماد" text="كل المساهمات معتمدة ومنشورة." />
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const sec = getSection(r.section)!;
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                  <span className="text-2xl">{sec.icon}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/${r.section}/${r.id}`} className="block truncate font-bold text-slate-900 hover:text-indigo-700">{r.title}</Link>
                    <p className="text-xs text-slate-500">{sec.short} · {r.authorName} · {timeAgo(r.createdAt)} · 📎 {r.attachmentCount}</p>
                    {r.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.summary}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/${r.section}/${r.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">معاينة</Link>
                    <button onClick={() => approve(r)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">✓ اعتماد ونشر</button>
                    <button onClick={() => setConfirm({ kind: "resource", id: r.id, title: r.title })} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">رفض</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{currentForm?.title}</h2>
            {currentSubs.length > 0 && (
              <button onClick={() => exportCsv(tab)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">⬇ تصدير Excel (CSV)</button>
            )}
          </div>
          {currentSubs.length === 0 ? (
            <Empty icon={currentForm?.icon ?? "📨"} title="لا توجد ردود بعد" text="شاركي رابط الاستمارة ليصل إليك الردود هنا." />
          ) : (
            <div className="space-y-3">
              {currentSubs.map((s) => {
                const fields = currentForm?.sections.flatMap((x) => x.fields) ?? [];
                const headline = s.data.name || s.data.student || s.data.kind || `رد #${s.id}`;
                const open = expanded === s.id;
                return (
                  <div key={s.id} className={`rounded-2xl border bg-white shadow-sm ${s.status === "new" ? "border-indigo-200" : "border-slate-200"}`}>
                    <button onClick={() => setExpanded(open ? null : s.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-right">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.status === "new" ? "bg-indigo-500" : "bg-slate-300"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{headline}</p>
                        <p className="text-xs text-slate-500">
                          {s.data.school || s.data.address || s.data.message?.slice(0, 60) || ""} · {timeAgo(s.createdAt)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.status === "new" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.status === "new" ? "جديد" : "تمت المراجعة"}
                      </span>
                      <span className="text-slate-400">{open ? "▴" : "▾"}</span>
                    </button>
                    {open && (
                      <div className="border-t border-slate-100 px-4 py-4">
                        <dl className="grid gap-3 sm:grid-cols-2">
                          {fields.filter((f) => s.data[f.key]).map((f) => (
                            <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                              <dt className="text-[11px] font-bold text-slate-500">{f.label}</dt>
                              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{s.data[f.key]}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                          <button onClick={() => toggleReviewed(s)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                            {s.status === "new" ? "✓ تمت المراجعة" : "إعادة كجديد"}
                          </button>
                          <button onClick={() => setConfirm({ kind: "sub", id: s.id, title: headline })} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">حذف</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "resource" ? "رفض المساهمة وحذفها" : "حذف الرد"}
          message={`هل أنتِ متأكدة من حذف "${confirm.title}"؟`}
          confirmLabel="نعم، احذفي"
          onCancel={() => setConfirm(null)}
          onConfirm={() => (confirm.kind === "resource" ? rejectResource(confirm.id) : deleteSub(confirm.id))}
        />
      )}
    </div>
  );
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <p className="text-5xl">{icon}</p>
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
