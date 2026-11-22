import Link from "next/link";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { listResources } from "@/lib/resources";
import { count, eq } from "drizzle-orm";
import { ResourceCard } from "@/components/ResourceCard";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-md animate-fade-up rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-5xl">👩‍🏫</p>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900">حسابي</h1>
        <p className="mt-2 text-sm text-slate-500">سجّلي الدخول لتري مشاركاتك وتتابعي حالة اعتمادها. التصفح والتحميل متاح بدون حساب.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/login?next=/dashboard/profile" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">تسجيل الدخول</Link>
          <Link href="/register" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">حساب جديد</Link>
        </div>
      </div>
    );
  }
  const viewer = { id: user.id, role: user.role };
  const [mine, [c]] = await Promise.all([
    listResources({ authorId: user.id, limit: 100 }, viewer),
    db.select({ value: count() }).from(comments).where(eq(comments.authorId, user.id)),
  ]);
  const pending = mine.filter((r) => r.status === "pending").length;
  const files = mine.reduce((n, r) => n + r.attachmentCount, 0);
  const downloads = mine.reduce((n, r) => n + r.downloads, 0);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
          {user.name.replace(/^أ\.\s*/, "").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.role === "admin" ? "منسقة المبادرة" : user.school || "معلمة"}{user.governorate ? ` · ${user.governorate}` : ""} · <span dir="ltr">{user.email}</span></p>
        </div>
        {user.role === "admin" && <Link href="/dashboard/manage" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">🛡️ لوحة الإدارة</Link>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["مشاركاتي", mine.length, "📚"],
          ["بانتظار الاعتماد", pending, "⏳"],
          ["ملفات رفعتُها", files, "📎"],
          ["مرات تحميل موادي", downloads, "⬇"],
        ].map(([label, value, icon]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{icon} {label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <ProfileForm name={user.name} school={user.school ?? ""} governorate={user.governorate ?? ""} />

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">مشاركاتي</h2>
        {mine.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-4xl">✍️</p>
            <p className="mt-2 font-bold text-slate-900">لم تشاركي بعد</p>
            <p className="mt-1 text-sm text-slate-500">ابدئي بإضافة ملف أو فكرة لتستفيد زميلاتك.</p>
            <Link href="/dashboard/new" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">➕ أول مشاركة</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((r) => <ResourceCard key={r.id} item={r} showSection loggedIn={!!user} />)}
          </div>
        )}
      </section>
    </div>
  );
}
