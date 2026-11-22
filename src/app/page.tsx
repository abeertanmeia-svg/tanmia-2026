import Link from "next/link";
import { SECTIONS, colorClasses } from "@/lib/sections";
import { getCurrentUser } from "@/lib/auth";
import { WHATSAPP_CHANNEL_URL, WHATSAPP_GROUP_URL } from "@/lib/forms";
import { db } from "@/db";
import { appRegistry } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { ensureAppsSeeded } from "@/lib/apps";
import { PublicApps } from "@/components/PublicApps";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const cta = "/dashboard";
  const apps = await ensureAppsSeeded()
    .then(() =>
      db
        .select({ id: appRegistry.id, name: appRegistry.name, purpose: appRegistry.purpose, status: appRegistry.status, url: appRegistry.url })
        .from(appRegistry)
        .where(and(eq(appRegistry.isPublic, true), eq(appRegistry.archived, false)))
        .orderBy(asc(appRegistry.sortOrder)),
    )
    .catch(() => []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">✨</span>
          <div>
            <p className="font-display text-lg leading-tight text-slate-900">معلمات مبدعات</p>
            <p className="text-xs text-slate-500">مبادرة بالذكاء الاصطناعي · التعليم المجتمعي</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              لوحة التحكم
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                انضمي للمبادرة
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-bold text-teal-700">🇪🇬 منصة معلمات مصر - تنمية 2026</p>
        <h1 className="font-display mx-auto mt-3 max-w-3xl text-5xl leading-[1.35] text-slate-900 md:text-6xl">
          مبادرة <span className="mark-hl">معلمات مبدعات</span> بالذكاء الاصطناعي
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-slate-800">
          مكتبة الموارد وخطط التدريس المفتوحة للمعلمات في التعليم المجتمعي والابتدائي.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          منصة تشاركية مفتوحة تهدف إلى تمكين معلمات التعليم المجتمعي والفصول متعددة المستويات من توظيف أدوات الذكاء الاصطناعي التوليدي،
          وإنتاج وسائل تعليمية منخفضة ومنعدمة التكلفة، وتطبيق استراتيجيات إدارة الصف المدمج لعلاج ضعف القرائية وتحقيق التعلم النشط. ارفعي ما أعددتِه من ملفات PDF وWord وفيديوهات وصور وروابط، وحمّلي ما شاركته
          زميلاتك. وفي كل قسم مساعد بالذكاء الاصطناعي يجهّز لك الخطط والأفكار.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={cta} className="rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">
            تصفحي المنصة الآن
          </Link>
          {!user && (
            <Link href="/login" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-50">
              دخول سريع بنقرة واحدة
            </Link>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-500">التصفح متاح للجميع بدون تسجيل — التسجيل مطلوب فقط للإضافة والتعليق.</p>
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          🔒 <b>خصوصية الأطفال أولًا:</b> لا نجمع بيانات شخصية للأطفال، ولا نعرض أو نلمّح إلى الظروف الأسرية أو الاجتماعية أو الاقتصادية لأي طفل.
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/assistant" className="rounded-3xl bg-gradient-to-l from-indigo-600 to-violet-600 p-6 text-white shadow-xl transition hover:-translate-y-1">
            <p className="text-3xl">✨</p>
            <h3 className="mt-3 text-lg font-bold">مساعد المعلمة الذكي</h3>
            <p className="mt-1 text-sm text-white/90">تحضير دروس وأوراق عمل وألعاب وخطط علاجية — متاح للجميع دون تسجيل.</p>
            <span className="mt-4 inline-block text-sm font-bold">ابدئي الاستخدام ←</span>
          </Link>
          <Link href="/dashboard/guide" className="rounded-3xl border border-rose-200 bg-rose-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-3xl">🌱</p>
            <h3 className="mt-3 text-lg font-bold text-slate-900">من الحرف إلى الإبداع</h3>
            <p className="mt-1 text-sm text-slate-600">مكتبة عملية للتأسيس العلاجي، وإدارة الفصل متعدد المستويات، والاستراتيجيات.</p>
            <span className="mt-4 inline-block text-sm font-bold text-rose-700">اكتشفي الأدلة ←</span>
          </Link>
          <Link href="/dashboard/forms" className="rounded-3xl border border-violet-200 bg-violet-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-3xl">📨</p>
            <h3 className="mt-3 text-lg font-bold text-slate-900">الاستمارات</h3>
            <p className="mt-1 text-sm text-slate-600">استمارة المعلمة المبدعة، الجمعيات، رأي الطالب وولي الأمر، وملاحظات المنصة.</p>
            <span className="mt-4 inline-block text-sm font-bold text-violet-700">أرسلي مشاركتك ←</span>
          </Link>
        </div>
      </section>

      {(WHATSAPP_GROUP_URL || WHATSAPP_CHANNEL_URL) && (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">🟢 مجتمع معلمات التعليم المجتمعي على واتساب</h3>
              <p className="mt-1 text-sm text-slate-600">مئات المعلمات يجمعهن حب التعلم والتعاون وتبادل الخبرات.</p>
            </div>
            <div className="flex gap-2">
              {WHATSAPP_GROUP_URL && <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">انضمي للمجموعة</a>}
              {WHATSAPP_CHANNEL_URL && <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100">تابعي القناة</a>}
            </div>
          </div>
        </section>
      )}

      {apps.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <h2 className="text-center text-2xl font-bold text-slate-900">🧩 التطبيقات والموارد</h2>
          <p className="mb-5 mt-1 text-center text-sm text-slate-500">الحالة تُحدّث بعد الاختبار الفعلي (فتح + تنقل + حفظ + إعادة فتح + طباعة + مشاركة).</p>
          <PublicApps items={apps} compact />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">📂 أقسام المنصة</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const c = colorClasses[s.color];
            return (
              <Link
                key={s.slug}
                href={`/dashboard/${s.slug}`}
                className={`group rounded-3xl border ${c.border} bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${c.soft} text-2xl`}>{s.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
                <span className={`mt-4 inline-block text-sm font-semibold ${c.text}`}>استعراض القسم ←</span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>مبادرة معلمات مبدعات بالذكاء الاصطناعي — التعليم المجتمعي © {new Date().getFullYear()}</p>
        <p className="mt-1 text-xs text-slate-400">هذا الملتقى جهد شخصي تطوعي من المعلمات، وليس جهة رسمية أو تابعاً لوزارة التربية والتعليم، ولا يستقبل تبرعات.</p>
      </footer>
    </main>
  );
}
