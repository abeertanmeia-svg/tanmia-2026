"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Friendly fallback so a database hiccup doesn't blank the whole dashboard. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-md">
        <p className="text-6xl">🌧️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">حدث خطأ مؤقت</h1>
        <p className="mt-2 text-sm text-slate-500">لم نتمكن من تحميل هذه الصفحة الآن. قد يكون الاتصال ضعيفاً — حاولي مرة أخرى بعد لحظات.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">↻ إعادة المحاولة</button>
          <Link href="/" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">الصفحة الرئيسية</Link>
        </div>
        {error.digest && <p className="mt-4 text-[11px] text-slate-400" dir="ltr">ref: {error.digest}</p>}
      </div>
    </div>
  );
}
