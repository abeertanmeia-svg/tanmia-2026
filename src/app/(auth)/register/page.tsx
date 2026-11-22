import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-slate-900">انضمي إلى المبادرة 🌟</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">اسم وبريد وكلمة مرور فقط — وسيتم دخولك مباشرة.</p>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
      <p className="mt-5 text-center text-sm text-slate-600">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-indigo-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </>
  );
}
