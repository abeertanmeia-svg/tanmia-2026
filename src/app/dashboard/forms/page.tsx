import Link from "next/link";
import { FORMS } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default function FormsHubPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">📨 أرسلي مشاركتك</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          اختاري الاستمارة المناسبة ثم أكملي البيانات. الاستمارات متاحة للجميع دون تسجيل، وتصل مباشرة إلى فريق المبادرة.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FORMS.map((f) => (
          <Link key={f.type} href={`/dashboard/forms/${f.type}`} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-2xl">{f.icon}</span>
            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-indigo-700">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{f.audience}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-indigo-600">تعبئة الاستمارة ←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
