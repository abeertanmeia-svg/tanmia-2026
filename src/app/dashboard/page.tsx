import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { countResources, dashboardStats, listResources, sectionCounts } from "@/lib/resources";
import { SECTIONS, colorClasses } from "@/lib/sections";
import { ResourceCard } from "@/components/ResourceCard";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  const viewer = user ? { id: user.id, role: user.role } : null;
  const [stats, counts, recent, mine] = await Promise.all([
    dashboardStats(),
    sectionCounts(viewer),
    listResources({ limit: 6 }, viewer),
    user ? countResources({ authorId: user.id }) : Promise.resolve(0),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : "مساء الخير";

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting} 👋</p>
          <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{user ? user.name : "أهلاً بك في منصة المبادرة"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user ? "هذه نظرة سريعة على ما يحدث في المبادرة اليوم." : "تصفحي جميع الأقسام بحرية، وسجّلي دخولك عندما تودين المشاركة."}
          </p>
        </div>
        <Link
          href={user ? "/dashboard/exchange?new=1" : "/login?next=%2Fdashboard%2Fexchange%3Fnew%3D1"}
          className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          + شاركي خبرة جديدة
        </Link>
      </div>

      <Link href="/dashboard/assistant" className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-l from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl transition hover:brightness-110">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-3xl">✨</span>
          <div>
            <h2 className="text-lg font-bold">مساعد المعلمة الذكي</h2>
            <p className="text-sm text-white/90">تحضير درس، ورقة عمل، لعبة، خطة علاجية... في دقيقة — ثم احفظيها في المكتبة.</p>
          </div>
        </div>
        <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700">جرّبيه الآن ←</span>
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/guide" className="flex items-center gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl">🌱</span>
          <div>
            <p className="font-bold text-slate-900">دليل من الحرف إلى الإبداع</p>
            <p className="text-xs text-slate-600">17 فصلاً: المحطات الأربع، خارطة اليوم، شجرة الحروف، بطاقة التشخيص...</p>
          </div>
        </Link>
        <Link href="/dashboard/tools" className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl">⏰</span>
          <div>
            <p className="font-bold text-slate-900">بدء الحصة وأدواتها</p>
            <p className="text-xs text-slate-600">مؤقت المراحل والمحطات، الاختيار العشوائي، وقائمة مهامي.</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="إجمالي الموارد" value={stats.resources} icon="📚" />
        <Stat label="مساهماتي" value={mine} icon="✍️" />
        <Stat label="الملفات والمرفقات" value={stats.attachments} icon="📎" />
        <Stat label="المعلمات المشاركات" value={stats.users} icon="👩‍🏫" />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">الأقسام</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {SECTIONS.map((s) => {
            const c = colorClasses[s.color];
            return (
              <Link
                key={s.slug}
                href={`/dashboard/${s.slug}`}
                className={`flex items-center gap-3 rounded-2xl border ${c.border} bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.soft} text-xl`}>{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{s.short}</p>
                  <p className="text-xs text-slate-500">{counts[s.slug] ?? 0} {s.itemLabel}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">أحدث الإضافات</h2>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            لا توجد موارد بعد. كوني أول من يضيف!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((r) => (
              <ResourceCard key={r.id} item={r} showSection loggedIn={!!user} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
