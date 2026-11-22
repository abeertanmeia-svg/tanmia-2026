import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-slate-900">مرحباً بك 👋</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">اختاري دخولاً سريعاً بنقرة واحدة، أو استخدمي حسابك.</p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="mt-5 text-center text-sm text-slate-600">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-indigo-600 hover:underline">
          أنشئي حساباً في 10 ثوانٍ
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/dashboard" className="text-slate-500 hover:text-indigo-600">
          أو تصفحي المنصة بدون تسجيل ←
        </Link>
      </p>
    </>
  );
}
