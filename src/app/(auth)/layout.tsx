import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  await ensureSeeded().catch(() => undefined);
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-rose-50 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="mb-6 flex items-center justify-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-200">✨</span>
          <div className="text-right">
            <p className="font-display text-xl text-slate-900">معلمات مبدعات</p>
            <p className="text-xs text-slate-500">مبادرة التعليم المجتمعي</p>
          </div>
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">{children}</div>
      </div>
    </main>
  );
}
