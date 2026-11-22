import { db } from "@/db";
import { appEvents, appRegistry } from "@/db/schema";
import { count } from "drizzle-orm";
import { EMPTY_CHECKS } from "./apps-meta";

export * from "./apps-meta";

type Seed = { g: string; name: string; ref?: string; url?: string; purpose: string; status?: string; next: string; pub?: boolean };

/** Version 0 of the registry, exactly as documented — every row starts at "لم يُفتح بعد" unless there is an objective reason. */
const SEED: Seed[] = [
  { g: "claude", name: "Artifact 1", ref: "96dc421f…", purpose: "غير محددة", next: "فتحه وتحديد وظيفته والصفوف المستفيدة" },
  { g: "claude", name: "Artifact 2", ref: "d17166f9…", purpose: "غير محددة", next: "فتحه وتحديد وظيفته" },
  { g: "claude", name: "Artifact 3", ref: "2957463b…", purpose: "غير محددة", next: "فتحه وتحديد وظيفته" },
  { g: "claude", name: "Artifact 4", ref: "ba1de980…", purpose: "غير محددة", status: "duplicate", next: "مقارنة محتواه مع 1–3 قبل أي قرار (نسخة أم مشروع مستقل؟)" },
  { g: "claude", name: "رابط مشاركة Claude", ref: "73cfcbab…", purpose: "مشاركة محادثة", next: "التحقق من صلاحية الوصول" },
  { g: "hosting", name: "منصة التواصل", ref: "Cloud Run", url: "https://ais-pre-ta74jmiqro3gdsjmx7f3az-871170181157.europe-west2.run.app/", purpose: "تواصل/عرض", next: "اختبار الفتح والتنقل والحفظ والصلاحيات", pub: true },
  { g: "hosting", name: "موقع Wix", ref: "tanmeia2008.wixsite.com", url: "https://tanmeia2008.wixsite.com/-site", purpose: "موقع تعريفي", next: "حصر الصفحات والروابط الحيّة", pub: true },
  { g: "hosting", name: "محرر Wix", ref: "editor.wix.com", purpose: "إدارة الموقع", next: "التحقق من ملكية الحساب قبل أي تعديل" },
  { g: "hosting", name: "Floot", ref: "floot.com", url: "https://tanmia2026tanmia2026.floot.app/", purpose: "مشروعات Tanmia / حروفنا نور / Feedback Hub", next: "تسجيل الدخول وحصر المشروعات", pub: true },
  { g: "hosting", name: "Mable — قطار المقاطع", ref: "mable.gg/g/apk8b6", url: "https://mable.gg/g/apk8b6", purpose: "محتوى تعليمي", next: "اختبار التشغيل", pub: true },
  { g: "hosting", name: "Supabase Dashboard", ref: "dashboard", purpose: "إدارة قواعد البيانات", next: "حصر المشاريع والجداول دون تعديل" },
  { g: "hosting", name: "مشروع Supabase", ref: "cezzfgyorrnmjpjxefen", purpose: "قاعدة بيانات", next: "التحقق من الجداول والصلاحيات (قراءة فقط)" },
  { g: "local", name: "استوديو ملتقى الأنشطة / مصنع الأفكار", ref: "activity-platform-prototype.html", purpose: "استوديو الأنشطة", next: "فتحه محليًا وتوثيق الوظائف", pub: true },
  { g: "local", name: "السبورة الذكية", ref: "smart-board (1).html", purpose: "السبورة الذكية", next: "اختبار الرسم والحفظ وإعادة الفتح", pub: true },
  { g: "local", name: "مساعد توليد التحضير", ref: "lesson_generator_v2.html", purpose: "مساعد توليد التحضير", next: "توليد تحضير كامل وطباعته", pub: true },
  { g: "local", name: "منصة المعلمة المبدعة", ref: "mobdaa-shared.html", purpose: "منصة المعلمة المبدعة", next: "فتحه وتحديد وظائفه", pub: true },
  { g: "local", name: "منصة المعلمة المبدعة (نسخة)", ref: "mobdaa-shared(1).html", purpose: "منصة المعلمة المبدعة", status: "duplicate", next: "مقارنة بايتية مع «mobdaa-shared.html» قبل أي قرار" },
  { g: "local", name: "الأرشيف المضغوط (45 ملفًا)", ref: "أرشيف ZIP", purpose: "أرشيف غير مفحوص", status: "unavailable", next: "محاولة الحصول عليه وحصره قبل الاعتماد على القائمة" },
  { g: "systems", name: "حروفنا نور", purpose: "منظومة علاجية لتأسيس القراءة والكتابة: تقييم قبلي، مجموعات، وألعاب حسية", next: "تحديد رابط التشغيل ثم اختبار التقييم القبلي والمجموعات", pub: true },
  { g: "systems", name: "قطار الحروف", purpose: "تطبيق تعليمي", status: "no_link", next: "البحث عن رابط التشغيل النهائي", pub: true },
  { g: "aids", name: "القياس والأطوال", purpose: "وسيلة صفية", next: "تحديد مكانها (ملف/رابط) ثم اختبارها" },
  { g: "aids", name: "صندوق السلوك الصحيح والخاطئ", purpose: "وسيلة صفية", next: "تحديد مكانها ثم اختبارها" },
  { g: "aids", name: "لوحات الدروس", purpose: "وسيلة صفية", next: "تحديد مكانها ثم اختبارها" },
  { g: "aids", name: "أنشطة متعددة المستويات", purpose: "وسيلة صفية", next: "تحديد مكانها ثم اختبارها" },
];

let seeded = false;
export async function ensureAppsSeeded() {
  if (seeded) return;
  seeded = true;
  const [{ value }] = await db.select({ value: count() }).from(appRegistry);
  if (value > 0) return;
  const rows = await db
    .insert(appRegistry)
    .values(
      SEED.map((r, i) => ({
        groupKey: r.g,
        name: r.name,
        ref: r.ref ?? "",
        url: r.url ?? null,
        purpose: r.purpose,
        status: (r.status ?? "not_opened") as "not_opened",
        checks: EMPTY_CHECKS,
        tested: "",
        nextStep: r.next,
        isPublic: r.pub ?? false,
        sortOrder: i + 1,
      })),
    )
    .returning({ id: appRegistry.id });
  await db.insert(appEvents).values(rows.map((r) => ({ appId: r.id, kind: "create", summary: "إنشاء الصف — سجل متابعة التطبيقات (نسخة 0)" })));
}
