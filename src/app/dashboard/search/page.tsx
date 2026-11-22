import { getCurrentUser } from "@/lib/auth";
import { listResources } from "@/lib/resources";
import { ResourceCard } from "@/components/ResourceCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const user = await getCurrentUser();
  const results = q ? await listResources({ q, limit: 60 }, user ? { id: user.id, role: user.role } : null) : [];
  return (
    <div className="animate-fade-up space-y-5">
      <form action="/dashboard/search" className="flex gap-2">
        <input name="q" defaultValue={q} autoFocus placeholder="ابحثي في كل الأقسام: عنوان، وسم، كلمة..." className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
        <button className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">🔍 بحث</button>
      </form>
      {q && <p className="text-sm text-slate-500">{results.length} نتيجة لـ «{q}»</p>}
      {!q ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 text-sm">اكتبي كلمة مثل: الحروف، الكسور، جدول الضرب، استمارة...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-4xl">🤔</p>
          <p className="mt-2 font-bold text-slate-900">لا توجد نتائج</p>
          <p className="mt-1 text-sm text-slate-500">جرّبي كلمة أقصر أو مرادفاً آخر.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => <ResourceCard key={r.id} item={r} showSection loggedIn={!!user} />)}
        </div>
      )}
    </div>
  );
}
