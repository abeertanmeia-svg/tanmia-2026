import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة معلمات مصر - تنمية 2026 | معلمات مبدعات بالذكاء الاصطناعي",
  description:
    "مكتبة الموارد وخطط التدريس المفتوحة للمعلمات في التعليم المجتمعي والابتدائي: تحضير الدروس، علاج القرائية، إدارة الفصول متعددة المستويات، والوسائل التعليمية منخفضة التكلفة.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
