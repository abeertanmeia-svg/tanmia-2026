import type { FormType } from "@/db/schema";

export type FormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "tel";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type FormDef = {
  type: FormType;
  title: string;
  short: string;
  audience: string;
  icon: string;
  intro: string;
  sections: { title: string; fields: FormField[] }[];
};

const GRADES = ["الأول الابتدائي", "الثاني الابتدائي", "الثالث الابتدائي", "الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي", "الإعدادي", "أخرى"];

export const FORMS: FormDef[] = [
  {
    type: "teacher",
    title: "استمارة مبادرة معلمات مبدعات بالذكاء الاصطناعي",
    short: "استمارة المعلمة",
    audience: "استمارة المشاركة والتطوير للمعلمات",
    icon: "✨",
    intro: "شاركينا تجربتك مع الذكاء الاصطناعي في فصلك، واحتياجاتك لتطوير المبادرة.",
    sections: [
      {
        title: "أولاً: بيانات المعلمة",
        fields: [
          { key: "name", label: "اسم المعلمة", type: "text", required: true, placeholder: "اكتبي الاسم بالكامل" },
          { key: "directorate", label: "الإدارة التعليمية", type: "text", required: true },
          { key: "school", label: "اسم مدرسة التعليم المجتمعي", type: "text", required: true },
          { key: "phone", label: "رقم التواصل (اختياري)", type: "tel" },
        ],
      },
      {
        title: "ثانياً: استخدام الذكاء الاصطناعي",
        fields: [
          { key: "tools", label: "ما أدوات الذكاء الاصطناعي التي استخدمتِها في شرحك؟", type: "text", required: true, placeholder: "ChatGPT، Canva، Gemini..." },
          { key: "attention", label: "كيف استخدمتِ الذكاء الاصطناعي لجذب انتباه أطفال التعليم المجتمعي؟", type: "textarea", required: true },
        ],
      },
      {
        title: "ثالثاً: الإبداع والأنشطة",
        fields: [
          { key: "activity", label: "احكي لنا عن نشاط مبدع نفذتِه باستخدام الذكاء الاصطناعي وكان له تأثير على الطلاب", type: "textarea", required: true, placeholder: "ما فكرة النشاط؟ وكيف تفاعل الأطفال معه؟" },
          { key: "libraryOpinion", label: "رأيك في مكتبة الأنشطة وأوراق العمل", type: "textarea" },
          { key: "worksheetTypes", label: "أنواع أوراق العمل المطلوبة", type: "select", options: ["أوراق عمل قرائية", "أوراق عمل كتابية", "أنشطة تفاعلية", "قصص مصورة بالذكاء الاصطناعي", "جميع ما سبق"] },
        ],
      },
      {
        title: "رابعاً: علاج ضعف القراءة والكتابة",
        fields: [
          { key: "weakCount", label: "عدد التلاميذ الضعاف في القراءة والكتابة", type: "text", required: true },
          { key: "plan", label: "الخطة المقترحة للعلاج خلال شهر", type: "textarea" },
          { key: "bestActivity", label: "النشاط الأكثر فاعلية للطفل الضعيف", type: "textarea" },
          { key: "difficulties", label: "الصعوبات التي واجهتك", type: "textarea" },
          { key: "suggestions", label: "مقترحات تطوير المبادرة العام القادم", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "ngo",
    title: "استمارة بيانات واحتياجات جمعية",
    short: "استمارة الجمعية",
    audience: "للجمعيات والخدمات المجتمعية",
    icon: "🤝",
    intro: "لتنسيق الدعم مع الجمعيات الأهلية الشريكة في التعليم المجتمعي.",
    sections: [
      {
        title: "بيانات الجمعية",
        fields: [
          { key: "name", label: "اسم الجمعية", type: "text", required: true },
          { key: "address", label: "عنوان الجمعية", type: "textarea", required: true, placeholder: "المحافظة والمركز والقرية والعنوان بالتفصيل" },
          { key: "phone", label: "رقم التواصل", type: "tel", required: true },
        ],
      },
      {
        title: "خدمات الجمعية واحتياجاتها",
        fields: [
          { key: "services", label: "أهم الخدمات التي تقدمها الجمعية حالياً", type: "textarea", required: true },
          { key: "needed", label: "ما نوع الخدمة المطلوب تقديمها للجمعية؟", type: "textarea", required: true, placeholder: "وضحي الخدمة والفئة المستفيدة منها" },
          { key: "opinion", label: "رأيكم أو مقترحاتكم حول الخدمة (اختياري)", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "student",
    title: "استمارة رأي الطالب",
    short: "استمارة الطالب",
    audience: "رأي الطالب في التعلم والمدرسة",
    icon: "🎒",
    intro: "رأيك يهمنا! أخبرنا بما تحبه وما تجده صعباً.",
    sections: [
      {
        title: "بيانات الطالب",
        fields: [
          { key: "name", label: "اسم الطالب", type: "text", required: true },
          { key: "grade", label: "الصف الدراسي", type: "select", required: true, options: GRADES },
          { key: "school", label: "اسم المدرسة", type: "text", required: true },
        ],
      },
      {
        title: "رأيك يهمنا",
        fields: [
          { key: "likes", label: "ما أكثر شيء تحبه في المدرسة أو التعلم؟", type: "textarea", required: true, placeholder: "مثل القراءة أو اللعب أو الأنشطة أو المعلمة..." },
          { key: "hard", label: "ما الشيء الذي تجد صعوبة فيه وتحتاج مساعدة بشأنه؟", type: "textarea", required: true },
          { key: "suggestion", label: "ما اقتراحك لتحسين المدرسة أو الأنشطة؟ (اختياري)", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "parent",
    title: "استمارة رأي ولي الأمر",
    short: "استمارة ولي الأمر",
    audience: "رأي الأسرة واحتياجات الأبناء",
    icon: "👨‍👩‍👧",
    intro: "شاركونا رأيكم في الخدمة التعليمية واحتياجات أبنائكم.",
    sections: [
      {
        title: "بيانات ولي الأمر والطالب",
        fields: [
          { key: "name", label: "اسم ولي الأمر", type: "text", required: true },
          { key: "phone", label: "رقم التواصل", type: "tel", required: true },
          { key: "student", label: "اسم الطالب / الطالبة", type: "text", required: true },
          { key: "grade", label: "الصف الدراسي", type: "select", required: true, options: GRADES },
          { key: "school", label: "اسم المدرسة", type: "text", required: true },
        ],
      },
      {
        title: "رأي ولي الأمر واحتياجات الطالب",
        fields: [
          { key: "opinion", label: "ما رأيكم في مستوى الخدمة التعليمية والتواصل مع المدرسة؟", type: "textarea", required: true },
          { key: "needs", label: "ما الدعم أو الخدمات التي يحتاجها ابنكم/ابنتكم؟ (اختياري)", type: "textarea", placeholder: "مثل دعم القراءة والكتابة أو أنشطة أو متابعة..." },
        ],
      },
    ],
  },
  {
    type: "feedback",
    title: "رأيك في المنصة",
    short: "ملاحظات المنصة",
    audience: "اقتراحات أو شكاوى أو مشكلة تقنية أو طلب مساعدة",
    icon: "💬",
    intro: "ساعدينا على تحسين المنصة — كل ملاحظة تصل لفريق المبادرة.",
    sections: [
      {
        title: "ملاحظتك",
        fields: [
          { key: "kind", label: "نوع الملاحظة", type: "select", required: true, options: ["رأي عام", "اقتراح أو فكرة جديدة", "مشكلة أو شكوى", "طلب مساعدة أو استفسار", "غير ذلك"] },
          { key: "message", label: "التفاصيل", type: "textarea", required: true },
          { key: "name", label: "الاسم (اختياري)", type: "text" },
          { key: "contact", label: "وسيلة التواصل (اختياري)", type: "text", placeholder: "بريد أو رقم هاتف" },
        ],
      },
    ],
  },
];

export function getForm(type: string): FormDef | undefined {
  return FORMS.find((f) => f.type === type);
}

export const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "";
export const WHATSAPP_CHANNEL_URL = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "";
