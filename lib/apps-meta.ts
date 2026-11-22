/** Client-safe registry labels and constants (no database imports). */
import type { AppChecks } from "@/db/schema";

export const APP_GROUPS: { key: string; label: string; icon: string }[] = [
  { key: "claude", label: "تطبيقات Claude", icon: "🤖" },
  { key: "hosting", label: "المنصات والاستضافات", icon: "🌐" },
  { key: "local", label: "الملفات المحلية", icon: "💾" },
  { key: "systems", label: "المنظومات والمشروعات", icon: "🧩" },
  { key: "aids", label: "الوسائل الصفية", icon: "🎨" },
];

export const APP_STATUSES: { key: string; label: string; badge: string }[] = [
  { key: "not_opened", label: "لم يُفتح بعد", badge: "bg-slate-100 text-slate-600" },
  { key: "testing", label: "قيد الاختبار", badge: "bg-amber-50 text-amber-700" },
  { key: "tested", label: "مُختبَر", badge: "bg-emerald-50 text-emerald-700" },
  { key: "broken", label: "معطّل", badge: "bg-rose-50 text-rose-700" },
  { key: "duplicate", label: "نسخة مكررة محتملة", badge: "bg-violet-50 text-violet-700" },
  { key: "unavailable", label: "غير متاح للفحص", badge: "bg-orange-50 text-orange-700" },
  { key: "no_link", label: "بلا رابط تشغيل مثبت", badge: "bg-sky-50 text-sky-700" },
];

export const CHECK_LABELS: { key: keyof AppChecks; label: string }[] = [
  { key: "open", label: "الفتح" },
  { key: "navigate", label: "التنقل" },
  { key: "save", label: "الحفظ" },
  { key: "reopen", label: "إعادة الفتح" },
  { key: "print", label: "الطباعة" },
  { key: "share", label: "المشاركة" },
];

export const EMPTY_CHECKS: AppChecks = { open: false, navigate: false, save: false, reopen: false, print: false, share: false };

export function statusLabel(k: string) {
  return APP_STATUSES.find((s) => s.key === k)?.label ?? k;
}

export const WORK_PRINCIPLES = [
  { title: "لا بدء من الصفر", text: "نراجع الموجود ونستفيد منه قبل بناء أي جديد." },
  { title: "لا حذف ولا نقل", text: "لا يُحذف أو يُوقف أو يُنقل أي تطبيق أو استضافة أو قاعدة بيانات قبل المراجعة والموافقة." },
  { title: "النسخ الاحتياطي أولًا", text: "نحتفظ بنسخة من الأكواد وملفات SQL والبيانات قبل أي تعديل." },
  { title: "التمييز بين «يعمل» و«مُختبَر»", text: "لا نعتبر تطبيقًا جاهزًا لمجرد أنه يُفتح." },
  { title: "لا تكلفة دون موافقة", text: "لا خدمة مدفوعة أو نشر نهائي أو نقل بيانات قبل توضيح التكلفة والموافقة." },
  { title: "أمان المفاتيح", text: "لا مفاتيح API أو كلمات مرور في ملفات HTML المنشورة أو الواجهة الأمامية." },
];

