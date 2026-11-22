"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SECTIONS, colorClasses } from "@/lib/sections";
export type ShellUser = { id: number; name: string; role: "admin" | "teacher"; school: string | null };

export function DashboardShell({
  user,
  counts,
  pending = 0,
  children,
}: {
  user: ShellUser | null;
  counts: Record<string, number>;
  pending?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5" onClick={() => setOpen(false)}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg text-white">✨</span>
        <div>
          <p className="font-display text-lg leading-tight text-slate-900">معلمات مبدعات</p>
          <p className="text-[11px] text-slate-500">بالذكاء الاصطناعي</p>
        </div>
      </Link>

      <form action="/dashboard/search" className="px-3 pb-3" onSubmit={() => setOpen(false)}>
        <input
          name="q"
          placeholder="🔍 ابحثي في كل الأقسام..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
        />
      </form>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <NavLink href="/dashboard" active={pathname === "/dashboard"} onClick={() => setOpen(false)} icon="🏠" label="الرئيسية" />
        <NavLink href="/dashboard/assistant" active={pathname.startsWith("/dashboard/assistant")} onClick={() => setOpen(false)} icon="✨" label="مساعد المعلمة الذكي" highlight />
        <NavLink href="/dashboard/saved" active={pathname.startsWith("/dashboard/saved")} onClick={() => setOpen(false)} icon="⭐" label="محفوظاتي" />
        <NavLink href="/dashboard/profile" active={pathname.startsWith("/dashboard/profile")} onClick={() => setOpen(false)} icon="👤" label="حسابي ومشاركاتي" />
        <NavLink href="/dashboard/apps" active={pathname.startsWith("/dashboard/apps")} onClick={() => setOpen(false)} icon={user?.role === "admin" ? "🗂️" : "🧩"} label={user?.role === "admin" ? "سجل متابعة التطبيقات" : "التطبيقات والموارد"} />
        <NavLink href="/dashboard/prompts" active={pathname.startsWith("/dashboard/prompts")} onClick={() => setOpen(false)} icon="🧠" label="بنك البرومبتات" />
        <NavLink href="/dashboard/guide" active={pathname.startsWith("/dashboard/guide")} onClick={() => setOpen(false)} icon="🌱" label="دليل من الحرف إلى الإبداع" />
        <NavLink href="/dashboard/tools" active={pathname.startsWith("/dashboard/tools")} onClick={() => setOpen(false)} icon="🧰" label="أدوات الحصة" />
        <NavLink href="/dashboard/forms" active={pathname.startsWith("/dashboard/forms")} onClick={() => setOpen(false)} icon="📨" label="الاستمارات" />
        {user?.role === "admin" && (
          <NavLink href="/dashboard/manage" active={pathname.startsWith("/dashboard/manage")} onClick={() => setOpen(false)} icon="🛡️" label="لوحة الإدارة" badge={pending} />
        )}
        <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">الأقسام</p>
        {SECTIONS.map((s) => {
          const active = pathname.startsWith(`/dashboard/${s.slug}`);
          const c = colorClasses[s.color];
          return (
            <NavLink
              key={s.slug}
              href={`/dashboard/${s.slug}`}
              active={active}
              onClick={() => setOpen(false)}
              icon={s.icon}
              label={s.short}
              badge={counts[s.slug] ?? 0}
              dot={c.dot}
            />
          );
        })}
      </div>

      <div className="border-t border-slate-200 p-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {user.name.replace(/^أ\.\s*/, "").slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.role === "admin" ? "منسقة المبادرة" : user.school || "معلمة"}</p>
              </div>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-indigo-50 p-3 text-center">
            <p className="text-xs font-semibold text-indigo-800">أنتِ تتصفحين كزائرة</p>
            <p className="mt-1 text-[11px] text-indigo-600">سجّلي دخولك للإضافة والتعليق</p>
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              تسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-72 shrink-0 border-l border-slate-200 bg-white lg:block">{nav}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 bg-white shadow-2xl animate-fade-up">{nav}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700"
            aria-label="فتح القائمة"
          >
            ☰
          </button>
          <p className="flex-1 text-sm font-bold text-slate-900">معلمات مبدعات بالذكاء الاصطناعي</p>
          <Link href="/dashboard/search" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700" aria-label="بحث">🔍</Link>
          {!user && (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
              دخول
            </Link>
          )}
        </header>
        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:py-8 lg:pb-8">{children}</main>
        <footer className="no-print mb-20 flex items-center justify-between border-t border-slate-200 px-4 py-4 md:px-8 lg:mb-0">
          <p className="text-xs text-slate-400">منصة معلمات التعليم المجتمعي - مصر © {new Date().getFullYear()}</p>
          <Link
            href={user?.role === "admin" ? "/dashboard/manage" : "/login?next=%2Fdashboard%2Fmanage"}
            className="grid h-7 w-7 place-items-center rounded-lg text-xs text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
            aria-label="لوحة الإدارة"
            title="لوحة الإدارة"
          >
            🔒
          </Link>
        </footer>
      </div>

      <BottomNav pathname={pathname} loggedIn={!!user} />
    </div>
  );
}

function NavLink({
  href,
  active,
  onClick,
  icon,
  label,
  badge,
  dot,
  highlight,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
  dot?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : highlight
            ? "bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 hover:brightness-110"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
          {badge}
        </span>
      )}
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
    </Link>
  );
}

function BottomNav({ pathname, loggedIn }: { pathname: string; loggedIn: boolean }) {
  const items = [
    { href: "/dashboard", label: "الرئيسية", icon: "🏠", active: pathname === "/dashboard" },
    { href: "/dashboard/sections", label: "الأقسام", icon: "📚", active: pathname.startsWith("/dashboard/sections") || /^\/dashboard\/(preparation|literacy|multilevel|classroom|strategies|admin\b|aids|games|inspiration)/.test(pathname) },
    { href: "/dashboard/new", label: "إضافة", icon: "➕", active: false, fab: true },
    { href: "/dashboard/exchange", label: "المنتدى", icon: "🤝", active: pathname.startsWith("/dashboard/exchange") },
    { href: loggedIn ? "/dashboard/profile" : "/login?next=%2Fdashboard%2Fprofile", label: loggedIn ? "حسابي" : "دخول", icon: "👤", active: pathname.startsWith("/dashboard/profile") },
  ];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => (
          <li key={it.label} className="flex justify-center">
            {it.fab ? (
              <Link href={it.href} className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-300 ring-4 ring-white" aria-label="إضافة مشاركة">
                ＋
              </Link>
            ) : (
              <Link href={it.href} className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${it.active ? "text-indigo-700" : "text-slate-500"}`}>
                <span className={`text-xl ${it.active ? "" : "grayscale"}`}>{it.icon}</span>
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
