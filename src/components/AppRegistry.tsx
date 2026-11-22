"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppChecks, AppRow } from "@/db/schema";
import { APP_GROUPS, APP_STATUSES, CHECK_LABELS, statusLabel, WORK_PRINCIPLES } from "@/lib/apps-meta";
import { useToast } from "./Toast";

type Row = Omit<AppRow, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string; events: number };
type Ev = { id: number; kind: string; summary: string; createdAt: string; by: string | null };

const badge = (k: string) => APP_STATUSES.find((s) => s.key === k)?.badge ?? "bg-slate-100 text-slate-600";
const doneCount = (c: AppChecks) => CHECK_LABELS.filter((x) => c[x.key]).length;
const fmt = (iso: string) => new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function AppRegistry({ initial }: { initial: Row[] }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const legacy = (st: string) => (st === "tested" ? "ok" : st === "testing" ? "warn" : st === "broken" ? "bad" : "gray");
  function exportJson() {
    const data = rows
      .filter((r) => r.isPublic && !r.archived)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({ id: `app-${r.id}`, name: r.name, fn: r.purpose || r.ref, status: legacy(r.status), url: r.url ?? "" }));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
    a.download = "apps.json";
    a.click();
  }
  async function importJson(file: File) {
    try {
      const arr = JSON.parse(await file.text());
      const res = await fetch("/api/apps/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(arr) });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error ?? "تعذر الاستيراد");
      toast.success(`أُضيف ${d.added} صف، وتُخطّي ${d.skipped} (موجود مسبقاً — لا استبدال ولا حذف)`);
      const fresh = await fetch("/api/apps").then((r) => r.json());
      setRows(fresh.items);
    } catch {
      toast.error("الملف ليس JSON صالحاً");
    }
  }
  async function move(id: number, dir: "up" | "down") {
    const res = await fetch(`/api/apps/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ move: dir }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.reordered) return;
    const map = new Map<number, number>(d.reordered.map((r: { id: number; sortOrder: number }) => [r.id, r.sortOrder]));
    setRows((all) => all.map((r) => ({ ...r, sortOrder: map.get(r.id) ?? r.sortOrder, events: r.id === id ? r.events + 1 : r.events })).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
  }

  const visible = rows.filter((r) => (showArchived ? r.archived : !r.archived) && (!group || r.groupKey === group) && (!status || r.status === status));
  const stats = useMemo(() => {
    const live = rows.filter((r) => !r.archived);
    return APP_STATUSES.map((s) => ({ ...s, n: live.filter((r) => r.status === s.key).length })).filter((s) => s.n > 0);
  }, [rows]);

  async function patch(id: number, body: Record<string, unknown>, okMsg?: string): Promise<boolean> {
    const res = await fetch(`/api/apps/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "تعذر الحفظ");
      return false;
    }
    setRows((all) => all.map((r) => (r.id === id ? { ...r, ...data.item, createdAt: r.createdAt, updatedAt: new Date().toISOString() } : r)));
    if (okMsg) toast.success(okMsg);
    return true;
  }

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["#", "المجموعة", "اسم التطبيق", "المرجع", "الرابط", "الوظيفة", "الحالة", ...CHECK_LABELS.map((c) => c.label), "ما تم اختباره", "الخطوة التالية", "ملاحظة: أفادت المستخدمة", "في البوابة العامة", "مؤرشف", "آخر تحديث", "عدد سجلات التاريخ"];
    const lines = rows.map((r, i) =>
      [i + 1, APP_GROUPS.find((g) => g.key === r.groupKey)?.label, r.name, r.ref, r.url ?? "", r.purpose, statusLabel(r.status), ...CHECK_LABELS.map((c) => (r.checks[c.key] ? "✔" : "")), r.tested, r.nextStep, r.userReport, r.isPublic ? "نعم" : "لا", r.archived ? "نعم" : "لا", fmt(r.updatedAt), r.events]
        .map(esc)
        .join(","),
    );
    const blob = new Blob(["\ufeff" + [head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `سجل-متابعة-التطبيقات-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="rounded-3xl bg-gradient-to-l from-emerald-800 to-emerald-600 p-6 text-white shadow-xl">
        <h1 className="text-2xl font-extrabold">🗂️ سجل متابعة التطبيقات — تنمية 2026</h1>
        <p className="mt-1 text-xs text-white/80" dir="ltr">
          رابط عام لصفحة HTML المستقلة: <code className="rounded bg-white/15 px-1">{origin}/apps.json</code>
        </p>
        <p className="mt-1 max-w-3xl text-sm text-white/90">
          حصر كل تطبيقات المبادرة واستضافاتها وملفاتها، وحالة اختبار كل منها. «مُختبَر» فقط بعد الفحوص الستة كاملة، وكل تعديل محفوظ في السجل التاريخي، ولا حذف لأي صف.
        </p>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button onClick={() => setAdding(true)} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-800">+ إضافة صف</button>
          <button onClick={exportCsv} className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">⬇ تصدير CSV (Excel / Sheets)</button>
          <button onClick={() => window.print()} className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">🖨️ طباعة / PDF</button>
          <a href="/review/index.html" target="_blank" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">📦 حزمة المراجعة HTML</a>
          <button onClick={exportJson} className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30" title="بصيغة صفحة تنمية 2026 المستقلة">⤓ تصدير apps.json</button>
          <button onClick={() => fileRef.current?.click()} className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">⤒ استيراد apps.json</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = ""; }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <button key={s.key} onClick={() => setStatus(status === s.key ? "" : s.key)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${s.badge} ${status === s.key ? "ring-2 ring-slate-800" : ""}`}>
            {s.label}: {s.n}
          </button>
        ))}
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">كل المجموعات</option>
          {APP_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>{g.icon} {g.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">كل الحالات</option>
          {APP_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-emerald-600" /> الأرشيف التاريخي
        </label>
      </div>

      {APP_GROUPS.filter((g) => visible.some((r) => r.groupKey === g.key)).map((g) => (
        <section key={g.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-3 font-bold text-slate-900">
            {g.icon} {g.label}
          </h2>
          <ul className="divide-y divide-slate-100">
            {visible
              .filter((r) => r.groupKey === g.key)
              .map((r) => (
                <li key={r.id}>
                  <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-right hover:bg-slate-50">
                    <span className="no-print flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <span role="button" onClick={() => move(r.id, "up")} className="cursor-pointer px-1 text-[10px] leading-none text-slate-400 hover:text-emerald-700" title="أعلى">▲</span>
                      <span role="button" onClick={() => move(r.id, "down")} className="cursor-pointer px-1 text-[10px] leading-none text-slate-400 hover:text-emerald-700" title="أسفل">▼</span>
                    </span>
                    <span className="w-6 text-xs text-slate-400">{rows.indexOf(r) + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900">
                        {r.name} {r.isPublic && <span title="ظاهر في البوابة العامة" className="text-xs">🌐</span>}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{r.ref || r.purpose}</span>
                    </span>
                    <span className="text-[11px] text-slate-400" title="الفحوص المكتملة">✔ {doneCount(r.checks)}/6</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge(r.status)}`}>{statusLabel(r.status)}</span>
                    <span className="hidden max-w-[240px] truncate text-xs text-slate-500 md:block">← {r.nextStep}</span>
                  </button>
                  {openId === r.id && <RowEditor row={r} patch={patch} />}
                </li>
              ))}
          </ul>
        </section>
      ))}
      {visible.length === 0 && <p className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">لا توجد صفوف بهذا التصفية.</p>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">📜 قواعد تحديث السجل</h2>
        <ol className="mt-2 list-decimal space-y-1 pr-5 text-sm text-slate-600">
          <li>لا تُغيَّر الحالة إلى «مُختبَر» إلا بعد: الفتح + التنقل + الحفظ + إعادة الفتح + الطباعة + المشاركة (يرفضها النظام تلقائياً).</li>
          <li>أي تعديل يُوثَّق بالتاريخ والقيمة السابقة والجديدة في السجل التاريخي لكل صف.</li>
          <li>لا حذف لأي صف؛ الأرشفة فقط، والصفوف القديمة تبقى كسجل تاريخي.</li>
          <li>«أفادت المستخدمة أنه يعمل» ≠ «مُختبَر» — تُكتب في خانة الملاحظة المنفصلة ولا تغيّر الحالة.</li>
        </ol>
        <h2 className="mt-5 font-bold text-slate-900">🧭 مبادئ العمل</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
              <p className="text-sm font-bold text-emerald-900">{p.title}</p>
              <p className="text-xs text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {adding && <AddRow onClose={() => setAdding(false)} onAdded={(r) => { setRows((all) => [...all, r]); setAdding(false); toast.success("أُضيف الصف"); }} />}
    </div>
  );
}

function RowEditor({ row, patch }: { row: Row; patch: (id: number, body: Record<string, unknown>, ok?: string) => Promise<boolean> }) {
  const [f, setF] = useState({ name: row.name, ref: row.ref, url: row.url ?? "", purpose: row.purpose, tested: row.tested, nextStep: row.nextStep, userReport: row.userReport, groupKey: row.groupKey });
  const [note, setNote] = useState("");
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [checking, setChecking] = useState(false);
  const allDone = doneCount(row.checks) === 6;

  async function loadEvents() {
    const res = await fetch(`/api/apps/${row.id}/events`);
    if (res.ok) setEvents((await res.json()).items);
  }

  async function reach() {
    if (!row.url) return;
    setChecking(true);
    const r = await fetch(`/api/link-check?url=${encodeURIComponent(row.url)}`).then((x) => x.json()).catch(() => null);
    setChecking(false);
    const msg = r ? `فحص وصول آلي (${r.status === "valid" ? "✅" : r.status === "warning" ? "⚠️" : "⛔"}): ${r.message} — ملاحظة: الفحص الآلي يثبت إمكانية الوصول فقط ولا يساوي «مُختبَر».` : "تعذر تنفيذ فحص الوصول.";
    await patch(row.id, { note: msg, noteKind: "reachability" }, "سُجّلت نتيجة فحص الوصول في التاريخ");
    if (events) loadEvents();
  }

  const input = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  const label = "mb-1 block text-[11px] font-bold text-slate-500";

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
      <div>
        <p className="mb-2 text-xs font-bold text-slate-700">الفحوص الستة (شرط «مُختبَر»)</p>
        <div className="flex flex-wrap gap-2">
          {CHECK_LABELS.map((c) => (
            <button
              key={c.key}
              onClick={() => patch(row.id, { checks: { [c.key]: !row.checks[c.key] } })}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${row.checks[c.key] ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {row.checks[c.key] ? "✔" : "○"} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700">الحالة:</span>
        {APP_STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => patch(row.id, { status: s.key }, `الحالة: ${s.label}`)}
            disabled={s.key === "tested" && !allDone}
            title={s.key === "tested" && !allDone ? "أكملي الفحوص الستة أولاً" : ""}
            className={`rounded-full px-3 py-1 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${s.badge} ${row.status === s.key ? "ring-2 ring-slate-800" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className={label}>اسم التطبيق</label><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className={label}>المرجع (ملف / معرّف)</label><input className={input} value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></div>
        <div><label className={label}>رابط التشغيل</label><input className={`${input} text-left`} dir="ltr" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://..." /></div>
        <div>
          <label className={label}>المجموعة</label>
          <select className={input} value={f.groupKey} onChange={(e) => setF({ ...f, groupKey: e.target.value })}>
            {APP_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className={label}>الوظيفة</label><input className={input} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></div>
        <div><label className={label}>ما تم اختباره</label><textarea rows={2} className={input} value={f.tested} onChange={(e) => setF({ ...f, tested: e.target.value })} /></div>
        <div><label className={label}>الخطوة التالية</label><textarea rows={2} className={input} value={f.nextStep} onChange={(e) => setF({ ...f, nextStep: e.target.value })} /></div>
        <div className="md:col-span-2">
          <label className={label}>ملاحظة منفصلة: «أفادت المستخدمة أنه يعمل» (لا تغيّر الحالة)</label>
          <input className={input} value={f.userReport} onChange={(e) => setF({ ...f, userReport: e.target.value })} placeholder="مثال: أفادت أ. عبير بتاريخ ... أنه يفتح على الهاتف" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => patch(row.id, f, "تم الحفظ وتوثيق التعديل")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">💾 حفظ التعديلات</button>
        {row.url && (
          <>
            <a href={row.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">↗ فتح الرابط</a>
            <button onClick={reach} disabled={checking} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
              {checking ? "⏳ جارٍ الفحص..." : "🔎 فحص الوصول الآلي"}
            </button>
          </>
        )}
        <button onClick={() => patch(row.id, { isPublic: !row.isPublic }, row.isPublic ? "أُخفي من البوابة العامة" : "سيظهر في البوابة العامة")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          {row.isPublic ? "🙈 إخفاء من البوابة" : "🌐 إظهار في البوابة"}
        </button>
        <button onClick={() => patch(row.id, { archived: !row.archived }, row.archived ? "استُعيد الصف" : "أُرشف الصف (لم يُحذف)")} className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700">
          {row.archived ? "↩ استعادة من الأرشيف" : "🗄️ أرشفة (بدون حذف)"}
        </button>
      </div>

      <div className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة للتاريخ: نتيجة تجربة، قرار، نسخة احتياطية تمت..." className={`${input} flex-1`} />
        <button onClick={async () => { if (note.trim() && (await patch(row.id, { note }, "سُجلت الملاحظة"))) { setNote(""); if (events) loadEvents(); } }} className="rounded-xl bg-slate-800 px-4 text-sm font-bold text-white">تسجيل</button>
      </div>

      <div>
        <button onClick={() => (events ? setEvents(null) : loadEvents())} className="text-xs font-bold text-emerald-700 hover:underline">
          📜 {events ? "إخفاء" : "عرض"} السجل التاريخي ({row.events})
        </button>
        {events && (
          <ol className="mt-2 max-h-64 space-y-1.5 overflow-y-auto border-r-2 border-emerald-200 pr-3">
            {events.map((e) => (
              <li key={e.id} className="text-xs">
                <span className="text-slate-400">{fmt(e.createdAt)}{e.by ? ` · ${e.by}` : ""}</span>
                <p className="text-slate-700">{e.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function AddRow({ onClose, onAdded }: { onClose: () => void; onAdded: (r: Row) => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", groupKey: "hosting", ref: "", url: "", purpose: "", nextStep: "" });
  async function save() {
    const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "تعذر الإضافة");
    onAdded(data.item);
  }
  const input = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg space-y-3 rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold">+ إضافة صف للسجل</h2>
        <input className={input} placeholder="اسم التطبيق *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className={input} value={f.groupKey} onChange={(e) => setF({ ...f, groupKey: e.target.value })}>
          {APP_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <input className={input} placeholder="المرجع (اسم الملف / المعرّف)" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} />
        <input className={`${input} text-left`} dir="ltr" placeholder="https://..." value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input className={input} placeholder="الوظيفة" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} />
        <input className={input} placeholder="الخطوة التالية" value={f.nextStep} onChange={(e) => setF({ ...f, nextStep: e.target.value })} />
        <p className="text-[11px] text-slate-500">يبدأ كل صف جديد بحالة «لم يُفتح بعد».</p>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">إضافة</button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 text-sm">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
