import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listBookmarked } from "@/lib/resources";
import { ResourceCard } from "@/components/ResourceCard";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-md animate-fade-up rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-5xl">⭐</p>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900">محفوظاتي</h1>
        <p className="mt-2 text-sm text-slate-500">سجّلي الدخول لحفظ الموارد التي تعجبك والعودة إليها من أي جهاز.</p>
        <Link href="/login?next=/dashboard/saved" className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">تسجيل الدخول</Link>
      </div>
    );
  }
  const items = await listBookmarked({ id: user.id, role: user.role });
  return (
    <div className="animate-fade-up space-y-5">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">⭐ محفوظاتي</h1>
        <p className="mt-1 text-sm text-slate-600">الموارد التي حفظتِها من كل الأقسام ({items.length}). اضغطي ★ على أي بطاقة لإزالتها.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-4xl">☆</p>
          <p className="mt-2 font-bold text-slate-900">لم تحفظي أي مورد بعد</p>
          <p className="mt-1 text-sm text-slate-500">اضغطي النجمة ☆ على أي بطاقة لحفظها هنا.</p>
          <Link href="/dashboard/sections" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">تصفّحي الأقسام</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => <ResourceCard key={r.id} item={r} showSection loggedIn />)}
        </div>
      )}
    </div>
  );
}
