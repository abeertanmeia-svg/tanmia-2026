import type { Section } from "@/db/schema";

export type SectionConfig = {
  slug: Section;
  name: string;
  short: string;
  description: string;
  icon: string;
  color: string; // tailwind color stem
  levelLabel: string;
  levelOptions: string[];
  itemLabel: string;
  suits?: string;
};

export const SECTIONS: SectionConfig[] = [
  {
    slug: "preparation",
    suits: "نموذج تحضير يومي، خطة أسبوعية، توزيع المنهج على الصفوف.",
    name: "التحضير وتوزيع المناهج",
    short: "التحضير",
    description: "خطط الدروس اليومية والأسبوعية للتعليم المجتمعي وتوزيع المقررات.",
    icon: "📝",
    color: "indigo",
    levelLabel: "المستوى الدراسي",
    levelOptions: ["المستوى الأول", "المستوى الثاني", "المستوى الثالث", "جميع المستويات"],
    itemLabel: "تحضير",
  },
  {
    slug: "literacy",
    suits: "خطط علاجية، بطاقات حروف، نصوص قراءة متدرجة، بطاقات تشخيص.",
    name: "علاج ضعف القراءة والكتابة (القرائية)",
    short: "القراءة والكتابة",
    description: "أوراق عمل متدرجة للتمييز البصري والصوتي، التأسيس بالحركات، والتدريبات الصوتية.",
    icon: "📖",
    color: "rose",
    levelLabel: "نوع الضعف",
    levelOptions: ["تعرّف الحروف", "التهجئة", "الطلاقة القرائية", "الفهم القرائي", "الكتابة والإملاء"],
    itemLabel: "برنامج علاجي",
  },
  {
    slug: "multilevel",
    suits: "نماذج المحطات، أوراق عمل متدرجة، جداول توزيع الوقت.",
    name: "إدارة حصة متعددة المستويات",
    short: "الحصة متعددة المستويات",
    description: "استراتيجيات تنظيم العمل للصفوف (الأول والثاني والثالث معاً) وتوزيع انتباه المعلمة.",
    icon: "🎯",
    color: "amber",
    levelLabel: "عدد المستويات",
    levelOptions: ["مستويان", "ثلاثة مستويات", "أكثر من ثلاثة"],
    itemLabel: "نموذج",
  },
  {
    slug: "classroom",
    suits: "قواعد الصف، لوحات التعزيز، روتين الحصة.",
    name: "إدارة الصف والتحفيز",
    short: "إدارة الصف",
    description: "قواعد الفصل، تعزيز السلوك الإيجابي، ولائحة الانضباط والتأطير الصفّي.",
    icon: "🏫",
    color: "emerald",
    levelLabel: "المحور",
    levelOptions: ["الانضباط", "التحفيز", "تنظيم البيئة الصفية", "التواصل مع المتعلمات"],
    itemLabel: "أسلوب",
  },
  {
    slug: "strategies",
    suits: "شرح استراتيجية بخطواتها، فيديو تطبيق، بطاقات نشاط.",
    name: "استراتيجيات التعلم النشط",
    short: "الاستراتيجيات",
    description: "الخرائط الذهنية، التعلم بالتفكير، والأنشطة التفاعلية.",
    icon: "💡",
    color: "sky",
    levelLabel: "نوع الاستراتيجية",
    levelOptions: ["تعلم تعاوني", "تعلم فردي", "تفكير ناقد", "ألعاب تعليمية", "تقويم"],
    itemLabel: "استراتيجية",
  },
  {
    slug: "admin",
    suits: "استمارات، سجلات حضور ومتابعة، تقارير شهرية (Word أو PDF).",
    name: "الإداريات والنماذج المدرسية",
    short: "الإداريات",
    description: "استمارات متابعة التلميذ، سجلات الحضور، واستمارات التقييم الأسبوعي.",
    icon: "📋",
    color: "violet",
    levelLabel: "نوع الاستمارة",
    levelOptions: ["سجل حضور", "متابعة أداء", "تقرير شهري", "خطة فصلية", "أخرى"],
    itemLabel: "استمارة",
  },
  {
    slug: "exchange",
    suits: "تجارب ناجحة، أسئلة للزميلات، صور وفيديو من الفصل.",
    name: "تبادل الخبرات ومجتمعات الممارسة",
    short: "تبادل الخبرات",
    description: "قصص النجاح والممارسات الصفية الناجحة بين المعلمات.",
    icon: "🤝",
    color: "teal",
    levelLabel: "نوع المشاركة",
    levelOptions: ["تجربة ناجحة", "سؤال", "فكرة", "درس مستفاد"],
    itemLabel: "مشاركة",
  },
  {
    slug: "aids",
    suits: "بطاقات للطباعة، لوحات، عروض PowerPoint، فيديو تعليمي.",
    name: "معمل الوسائل الحسية ومنخفضة التكلفة",
    short: "معمل الوسائل",
    description: "أدوات التأسيس من خامات البيئة: صواني الرمل، الصلصال، أغطية الزجاجات، بطاقات الكرتون، والأعواد الخشبية.",
    icon: "🎨",
    color: "orange",
    levelLabel: "نوع الوسيلة",
    levelOptions: ["بطاقات", "لوحات وملصقات", "مجسمات", "عروض تقديمية", "أوراق عمل", "فيديو تعليمي"],
    itemLabel: "وسيلة",
  },
  {
    slug: "games",
    suits: "قواعد ألعاب صفية، ألعاب HTML تفاعلية، بطاقات مسابقات.",
    name: "الألعاب التعليمية",
    short: "الألعاب التعليمية",
    description: "الألعاب اليدوية والرقمية لترسيخ المفاهيم لدى الأطفال.",
    icon: "🎲",
    color: "pink",
    levelLabel: "نوع اللعبة",
    levelOptions: ["لعبة صفية بدون أدوات", "لعبة بطاقات", "لعبة حركية", "لعبة رقمية", "مسابقة"],
    itemLabel: "لعبة",
  },
  {
    slug: "inspiration",
    suits: "قصص نجاح، اقتباسات، صور إنجازات المتعلمات.",
    name: "ركن الإلهام",
    short: "ركن الإلهام",
    description: "قصص ملهمة، اقتباسات، صور من الفصول، ومقاطع تحفيزية تشعل شغف المعلمة والمتعلمة.",
    icon: "🌟",
    color: "yellow",
    levelLabel: "نوع المحتوى",
    levelOptions: ["قصة ملهمة", "اقتباس", "صور من الفصل", "فيديو تحفيزي", "إنجاز متعلمة"],
    itemLabel: "إلهام",
  },
  {
    slug: "professional",
    suits: "دورات تدريبية، ورش عمل مصغرة، أدلة المعلمة، روابط مدونات وقنوات تعليمية وأدوات ذكاء اصطناعي.",
    name: "التنمية المهنية",
    short: "التنمية المهنية",
    description: "أدلة المعلمة، الدورات التدريبية، والورش المباشرة.",
    icon: "🎓",
    color: "cyan",
    levelLabel: "نوع المورد",
    levelOptions: ["دورة تدريبية", "ورشة عمل مصغرة", "دليل المعلمة", "روابط ومصادر", "أداة ذكاء اصطناعي"],
    itemLabel: "مورد تدريبي",
  },
  {
    slug: "ai",
    suits: "برومبتات جاهزة، أدوات توليد الصور والبطاقات، تطبيقات رقمية مجانية، عروض تفاعلية.",
    name: "معلمات مبدعات بالذكاء الاصطناعي",
    short: "الذكاء الاصطناعي",
    description: "بنك البرومبتات، المساعد الذكي لتصميم الوسائل، والتطبيقات والأدوات الرقمية المجانية لتسهيل التحضير وإثراء الحصة.",
    icon: "🤖",
    color: "fuchsia",
    levelLabel: "نوع المحتوى",
    levelOptions: ["بنك البرومبتات", "تصميم الوسائل بالذكاء الاصطناعي", "تطبيقات وأدوات رقمية", "عرض تفاعلي"],
    itemLabel: "مورد ذكاء اصطناعي",
  },
  {
    slug: "stations",
    suits: "بطاقات مهام المحطات، تنظيم الأركان، جداول التدوير، أمثلة لمحطات القراءة والحساب والتعبير الفني.",
    name: "محطات التعلم الذاتي الدوارة",
    short: "محطات التعلم الذاتي",
    description: "تشغيل المجموعات المستقلة (ركن القراءة، ركن الحساب الملموس، ركن التعبير الفني) أثناء الشرح المباشر لمجموعة أخرى.",
    icon: "🔄",
    color: "lime",
    levelLabel: "الركن",
    levelOptions: ["ركن القراءة", "ركن الحساب الملموس", "ركن التعبير الفني", "تنظيم المحطات والتدوير"],
    itemLabel: "محطة",
  },
  {
    slug: "assessment",
    suits: "بطاقات الفحص السريع، سجلات المهارات الحياتية والتوكاتسو، اختبارات تشخيصية، سجلات التقدّم.",
    name: "أدوات الرصد والتقييم المستمر",
    short: "الرصد والتقييم",
    description: "بطاقات الفحص السريع للقرائية (قياس الدقيقة الواحدة) وسجلات متابعة المهارات الحياتية والوجدانية (أنشطة التوكاتسو).",
    icon: "📊",
    color: "blue",
    levelLabel: "نوع الأداة",
    levelOptions: ["فحص القرائية", "فحص الحساب", "المهارات الحياتية والتوكاتسو", "سجل تقدّم"],
    itemLabel: "أداة رصد",
  },
];

export const SECTION_SLUGS = SECTIONS.map((s) => s.slug);

export function getSection(slug: string): SectionConfig | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function isSection(slug: string): slug is Section {
  return SECTION_SLUGS.includes(slug as Section);
}

export const AI_TOOLS = [
  "ChatGPT",
  "Gemini",
  "Canva AI",
  "Copilot",
  "Gamma",
  "Quizizz AI",
  "MagicSchool",
  "Diffit",
  "بدون أداة",
];

export const colorClasses: Record<string, { bg: string; text: string; border: string; soft: string; dot: string }> = {
  indigo: { bg: "bg-indigo-600", text: "text-indigo-700", border: "border-indigo-200", soft: "bg-indigo-50", dot: "bg-indigo-500" },
  rose: { bg: "bg-rose-600", text: "text-rose-700", border: "border-rose-200", soft: "bg-rose-50", dot: "bg-rose-500" },
  amber: { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", soft: "bg-amber-50", dot: "bg-amber-500" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200", soft: "bg-emerald-50", dot: "bg-emerald-500" },
  sky: { bg: "bg-sky-600", text: "text-sky-700", border: "border-sky-200", soft: "bg-sky-50", dot: "bg-sky-500" },
  violet: { bg: "bg-violet-600", text: "text-violet-700", border: "border-violet-200", soft: "bg-violet-50", dot: "bg-violet-500" },
  teal: { bg: "bg-teal-600", text: "text-teal-700", border: "border-teal-200", soft: "bg-teal-50", dot: "bg-teal-500" },
  orange: { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-200", soft: "bg-orange-50", dot: "bg-orange-500" },
  pink: { bg: "bg-pink-600", text: "text-pink-700", border: "border-pink-200", soft: "bg-pink-50", dot: "bg-pink-500" },
  fuchsia: { bg: "bg-fuchsia-600", text: "text-fuchsia-700", border: "border-fuchsia-200", soft: "bg-fuchsia-50", dot: "bg-fuchsia-500" },
  lime: { bg: "bg-lime-600", text: "text-lime-700", border: "border-lime-200", soft: "bg-lime-50", dot: "bg-lime-500" },
  blue: { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-200", soft: "bg-blue-50", dot: "bg-blue-500" },
  cyan: { bg: "bg-cyan-600", text: "text-cyan-700", border: "border-cyan-200", soft: "bg-cyan-50", dot: "bg-cyan-500" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-200", soft: "bg-yellow-50", dot: "bg-yellow-500" },
};

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file

export const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/html",
  "application/zip",
];

const EXT_MIME: Record<string, string> = {
  html: "text/html", htm: "text/html", pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain", zip: "application/zip", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav",
};

/** Resolve a reliable mime type from the browser-provided type or the file extension. */
export function resolveMime(name: string, provided: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (provided && provided !== "application/octet-stream") return provided;
  return EXT_MIME[ext] ?? provided ?? "application/octet-stream";
}

export const ACCEPT_ATTR = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.html,.htm";

export function isAllowedMime(mime: string) {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p)) || ALLOWED_MIME_TYPES.includes(mime);
}

export type BriefAttachment = { id: number; kind: "file" | "link"; mime: string; name: string; size: number; url: string | null };

export type FileTypeKey = "pdf" | "word" | "ppt" | "video" | "image" | "html" | "link";

export const FILE_TYPES: { key: FileTypeKey; label: string; icon: string; tile: string; accept: string; hint: string }[] = [
  { key: "pdf", label: "PDF", icon: "📄", tile: "bg-red-50 text-red-700", accept: ".pdf,application/pdf", hint: "ملف PDF حتى 25 ميجابايت." },
  { key: "word", label: "Word", icon: "📝", tile: "bg-blue-50 text-blue-700", accept: ".doc,.docx", hint: "ملف Word حتى 25 ميجابايت." },
  { key: "ppt", label: "PowerPoint", icon: "📊", tile: "bg-orange-50 text-orange-700", accept: ".ppt,.pptx", hint: "عرض تقديمي حتى 25 ميجابايت." },
  { key: "video", label: "فيديو", icon: "🎬", tile: "bg-purple-50 text-purple-700", accept: "video/*", hint: "فيديو حتى 25 ميجابايت، أو رابط يوتيوب للفيديوهات الأطول." },
  { key: "image", label: "صورة", icon: "🖼️", tile: "bg-emerald-50 text-emerald-700", accept: "image/*", hint: "صورة JPG أو PNG." },
  { key: "html", label: "لعبة HTML", icon: "🕹️", tile: "bg-indigo-50 text-indigo-700", accept: ".html,.htm", hint: "لعبة أو نشاط تفاعلي بملف HTML واحد." },
  { key: "link", label: "رابط", icon: "🔗", tile: "bg-slate-100 text-slate-700", accept: "", hint: "رابط Google Drive أو يوتيوب أو أي موقع." },
];

export function attachmentType(a: { kind: string; mime: string; url: string | null }): FileTypeKey | null {
  if (a.kind === "link") return /youtu\.?be/i.test(a.url ?? "") ? "video" : "link";
  const m = a.mime;
  if (m === "application/pdf") return "pdf";
  if (m.includes("word")) return "word";
  if (m.includes("presentation") || m.includes("powerpoint")) return "ppt";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("image/")) return "image";
  if (m === "text/html") return "html";
  return null;
}

export function isFileTypeKey(v: string): v is FileTypeKey {
  return FILE_TYPES.some((t) => t.key === v);
}

export const SCHOOL_SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "متعدد التخصصات (ديسكفر)",
  "العلوم",
  "اللغة الإنجليزية",
  "الدراسات الاجتماعية",
  "التربية الدينية",
  "أنشطة التوكاتسو والمهارات",
  "عام / جميع المواد",
];

export const GRADE_GROUPS = ["الصفوف 1-3", "الصفوف 4-6", "جميع الصفوف (متعدد المستويات)"];

export const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ",
  "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا",
  "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء",
];
