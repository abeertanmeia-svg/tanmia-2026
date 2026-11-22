import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sectionCounts } from "@/lib/resources";
import { SECTIONS, colorClasses } from "@/lib/sections";

export const dynamic = "force-dynamic";

export default async function SectionsPage({ searchParams }: { searchParams: Promise<{ pick?: string }> }) {
  const pick = (await searchParams).pick === "1";
  const user = await getCurrentUser();
  const counts = await sectionCounts(user ? { id: user.id, role: user.role } : null);
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{pick ? "➕ أين تريدين الإضافة؟" : "📚 الأقسام"}</h1>
        <p className="mt-1 text-sm text-slate-500">{pick ? "اختاري القسم المناسب لمشاركتك." : "كل أقسام مكتبة المبادرة."}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const c = colorClasses[s.color];
          return (
            <Link key={s.slug} href={`/dashboard/${s.slug}${pick ? "?quick=1" : ""}`} className={`flex items-center gap-4 rounded-2xl border ${c.border} bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${c.soft} text-2xl`}>{s.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{s.name}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{s.suits ?? s.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{counts[s.slug] ?? 0}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
