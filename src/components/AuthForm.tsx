"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GOVERNORATES } from "@/lib/sections";

const DEMO = [
  { label: "دخول سريع كمنسقة", email: "mona@teachers.ai", icon: "👩‍💼" },
  { label: "دخول سريع كمعلمة", email: "sara@teachers.ai", icon: "👩‍🏫" },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function send(endpoint: "login" | "register", payload: Record<string, unknown>, key: string) {
    setError(null);
    setLoading(key);
    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ غير متوقع");
        setLoading(null);
        return;
      }
      // Hard navigation so the new session cookie is sent with the next request.
      window.location.assign(next);
    } catch {
      setError("تعذر الاتصال بالخادم، حاولي مرة أخرى");
      setLoading(null);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    void send(mode, payload, "form");
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="space-y-5">
      {mode === "login" && process.env.NEXT_PUBLIC_SHOW_DEMO === "1" && (
        <div className="space-y-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              disabled={loading !== null}
              onClick={() => send("login", { email: d.email, password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "" }, d.email)}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{d.icon}</span> {d.label}
              </span>
              {loading === d.email ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
              ) : (
                <span>←</span>
              )}
            </button>
          ))}
          <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            أو بحسابك الخاص
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">الاسم</label>
              <input name="name" required className={input} placeholder="اسم المعلمة" autoComplete="name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">المحافظة (اختياري)</label>
                <select name="governorate" className={input} defaultValue="">
                  <option value="">اختاري...</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">الفصل / المدرسة (اختياري)</label>
                <input name="school" className={input} placeholder="فصل التعليم المجتمعي - ..." />
              </div>
            </div>
          </>
        )}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            className={`${input} text-left`}
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">كلمة المرور</label>
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              required
              minLength={6}
              dir="ltr"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={`${input} pr-20 text-left`}
              placeholder="8 أحرف على الأقل"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600"
            >
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-base font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading === "form" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب والدخول"}
        </button>
      </form>
    </div>
  );
}
