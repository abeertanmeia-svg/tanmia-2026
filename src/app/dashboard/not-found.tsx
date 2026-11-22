import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-6xl">🧭</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-slate-500">ربما تم حذف هذا العنصر أو أن الرابط غير صحيح.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
