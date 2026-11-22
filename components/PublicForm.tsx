"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { FormDef } from "@/lib/forms";

export function PublicForm({ form }: { form: FormDef }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, data: values }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر إرسال ردك الآن. حاولي مرة أخرى.");
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  if (done) {
    return (
      <div className="animate-fade-up mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
        <p className="text-6xl">🎉</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">شكراً لك! تم استلام ردك</h1>
        <p className="mt-2 text-sm text-slate-600">وصلت مشاركتك إلى فريق المبادرة وسنراجعها بعناية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/forms" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">استمارة أخرى</Link>
          <Link href="/dashboard" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">العودة للمنصة</Link>
        </div>
      </div>
    );
  }

  let counter = 0;
  return (
    <form onSubmit={submit} className="animate-fade-up mx-auto max-w-2xl space-y-5">
      <nav className="text-sm text-slate-500">
        <Link href="/dashboard/forms" className="hover:text-indigo-600">الاستمارات</Link> / <span className="text-slate-700">{form.short}</span>
      </nav>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="text-3xl">{form.icon}</span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{form.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{form.intro}</p>
      </div>

      {form.sections.map((sec) => (
        <section key={sec.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-slate-100 pb-3 font-bold text-slate-900">{sec.title}</h2>
          <div className="space-y-4">
            {sec.fields.map((f) => {
              counter++;
              const label = (
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {counter}. {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
              );
              const common = {
                required: f.required,
                value: values[f.key] ?? "",
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                  setValues({ ...values, [f.key]: e.target.value }),
              };
              return (
                <div key={f.key}>
                  {label}
                  {f.type === "textarea" ? (
                    <textarea {...common} rows={3} placeholder={f.placeholder} className={`${input} resize-y`} />
                  ) : f.type === "select" ? (
                    <select {...common} className={input}>
                      <option value="">اختاري...</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input {...common} type={f.type === "tel" ? "tel" : "text"} dir={f.type === "tel" ? "ltr" : undefined} placeholder={f.placeholder} className={input} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60">
        {loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        إرسال
      </button>
      <p className="text-center text-[11px] text-slate-400">لا تُدرجي أسماء الأطفال الكاملة أو بياناتهم الحساسة إلا عند الضرورة.</p>
    </form>
  );
}
