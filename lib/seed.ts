import { db, pool } from "@/db";
import { comments, resources, users, type Section } from "@/db/schema";
import { hashPassword } from "./auth";
import { count } from "drizzle-orm";
import { seedContent } from "./content-seeds";

type SeedResource = {
  section: Section;
  title: string;
  summary: string;
  content: string;
  level: string;
  tags: string[];
  aiTool?: string;
  featured?: boolean;
  author: number; // index in seeded users
};

const SEED_USERS = [
  { name: "أ. منى عبد الرحمن", email: "mona@teachers.ai", role: "admin" as const, school: "منسقة المبادرة" },
  { name: "أ. سارة الحسيني", email: "sara@teachers.ai", role: "teacher" as const, school: "فصل التعليم المجتمعي - الحي الشرقي" },
  { name: "أ. هدى محمود", email: "huda@teachers.ai", role: "teacher" as const, school: "فصل التعليم المجتمعي - القرية الجديدة" },
  { name: "أ. ريم خالد", email: "reem@teachers.ai", role: "teacher" as const, school: "فصل الفتيات - المركز الغربي" },
];

const SEED_RESOURCES: SeedResource[] = [
  // preparation
  {
    section: "preparation", author: 1, featured: true, aiTool: "ChatGPT",
    title: "تحضير درس: الكسور الاعتيادية بالصور الحياتية",
    summary: "تحضير كامل لدرس الكسور يستخدم أمثلة من الحياة اليومية (الخبز، الفواكه) مع أنشطة تفاعلية مولّدة بالذكاء الاصطناعي.",
    level: "المستوى الثاني", tags: ["رياضيات", "كسور", "تعلم نشط"],
    content: `## الأهداف
- أن تتعرف المتعلمة على مفهوم الكسر كجزء من كل.
- أن تمثل المتعلمة كسوراً بسيطة بالرسم.

## التمهيد (5 دقائق)
أعرض رغيف خبز وأقسمه أمام المتعلمات، وأسأل: كم جزءاً أصبح لدينا؟

## العرض (20 دقيقة)
1. استخدام بطاقات مصورة مولّدة بـ ChatGPT وCanva لتمثيل 1/2 و1/4.
2. نشاط ثنائي: كل متعلمتين تقسمان ورقة دائرية إلى أجزاء متساوية.

## التقويم
ورقة عمل قصيرة بثلاثة أسئلة متدرجة.

## الواجب
ارسمي شيئاً من بيتك مقسوماً إلى أربعة أجزاء.`,
  },
  {
    section: "preparation", author: 2, aiTool: "Gemini",
    title: "تحضير درس: الجملة الاسمية والجملة الفعلية",
    summary: "خطة درس مدتها 45 دقيقة مع أمثلة من بيئة المتعلمات وتمارين متدرجة.",
    level: "المستوى الثالث", tags: ["لغة عربية", "نحو"],
    content: `## الأهداف
- التمييز بين الجملة الاسمية والفعلية.
- إنتاج جمل من النوعين.

## خطوات الدرس
1. تمهيد بقصة قصيرة من البيئة المحلية.
2. استخراج الجمل من القصة وتصنيفها على السبورة.
3. لعبة "صندوق الجمل": سحب بطاقات وتصنيفها.

## التقويم
اكتبي ثلاث جمل اسمية وثلاث جمل فعلية عن يومك.`,
  },
  {
    section: "preparation", author: 3, aiTool: "Gamma",
    title: "تحضير درس العلوم: دورة الماء في الطبيعة",
    summary: "عرض تقديمي مولّد بـ Gamma مع تجربة بسيطة باستخدام كيس بلاستيكي وماء.",
    level: "المستوى الأول", tags: ["علوم", "تجربة عملية"],
    content: `## الأهداف
- أن تصف المتعلمة مراحل دورة الماء.

## التجربة
كيس شفاف + ماء + تعليقه على النافذة في الشمس، ومتابعة التبخر والتكاثف خلال اليوم.

## الأنشطة
- رسم دورة الماء.
- أغنية قصيرة عن المراحل (تبخر، تكاثف، هطول).`,
  },
  // literacy
  {
    section: "literacy", author: 3, featured: true, aiTool: "ChatGPT",
    title: "برنامج 4 أسابيع لعلاج صعوبة تعرّف الحروف",
    summary: "خطة علاجية تدريجية تعتمد على الحواس المتعددة (لمس، سمع، بصر) مع بطاقات مولّدة بالذكاء الاصطناعي.",
    level: "تعرّف الحروف", tags: ["حروف", "حواس متعددة", "خطة علاجية"],
    content: `## التشخيص
اختبار قبلي بسيط: عرض 28 بطاقة حرف وتسجيل الحروف غير المعروفة.

## الأسبوع الأول: الحروف المتشابهة شكلاً
(ب ت ث) – (ج ح خ): تشكيل الحروف بالصلصال، كتابتها على الرمل.

## الأسبوع الثاني: ربط الحرف بالصوت والصورة
بطاقات مصورة (كل حرف مع 3 صور تبدأ به) مولدة بـ ChatGPT + Canva.

## الأسبوع الثالث: الحروف في أول ووسط وآخر الكلمة
لعبة "أين الحرف؟".

## الأسبوع الرابع: تقييم بعدي
إعادة الاختبار ومقارنة النتائج في استمارة المتابعة.`,
  },
  {
    section: "literacy", author: 2, aiTool: "Diffit",
    title: "نصوص متدرجة الصعوبة لتحسين الطلاقة القرائية",
    summary: "مجموعة نصوص قصيرة (30-80 كلمة) مولّدة بأداة Diffit بثلاثة مستويات، مع تعليمات القراءة الموقوتة.",
    level: "الطلاقة القرائية", tags: ["طلاقة", "قراءة موقوتة"],
    content: `## الفكرة
القراءة المتكررة للنص نفسه 3 مرات مع قياس الزمن وعدد الأخطاء.

## النصوص
- المستوى أ: "في بيتنا قطة صغيرة..." (30 كلمة)
- المستوى ب: "ذهبت فاطمة إلى السوق..." (55 كلمة)
- المستوى ج: "في قريتنا نهر جميل..." (80 كلمة)

## التسجيل
تدوّن المعلمة الزمن وعدد الكلمات الصحيحة في الدقيقة في جدول المتابعة الأسبوعي.`,
  },
  {
    section: "literacy", author: 4,
    title: "إملاء منظور ومسموع: خطوات علاج أخطاء التاء المربوطة والهاء",
    summary: "تمارين يومية قصيرة مدتها 10 دقائق لعلاج الخلط بين التاء المربوطة والهاء.",
    level: "الكتابة والإملاء", tags: ["إملاء", "تاء مربوطة"],
    content: `## القاعدة المبسطة
ننطق الكلمة بالتنوين: "مدرسةٌ" تسمع صوت التاء فهي تاء مربوطة. "وجهٌ" لا نسمع تاء فهي هاء.

## التمارين
1. 10 كلمات يومياً إملاء منظور.
2. 5 كلمات إملاء مسموع.
3. تصحيح ذاتي بالقلم الأخضر.`,
  },
  // multilevel
  {
    section: "multilevel", author: 1, featured: true, aiTool: "ChatGPT",
    title: "نموذج المحطات الدوّارة لثلاثة مستويات في حصة واحدة",
    summary: "تقسيم الحصة إلى ثلاث محطات (مع المعلمة، عمل مستقل، عمل تعاوني) وتدوير المجموعات كل 12 دقيقة.",
    level: "ثلاثة مستويات", tags: ["محطات", "تنظيم الوقت"],
    content: `## توزيع الحصة (45 دقيقة)
- 5 دقائق: تمهيد مشترك.
- 3 × 12 دقيقة: المحطات.
- 4 دقائق: ختام مشترك.

## المحطات
1. **محطة المعلمة**: شرح مباشر للمستوى الذي يحتاج دعماً.
2. **محطة العمل المستقل**: أوراق عمل متدرجة مولدة بالذكاء الاصطناعي.
3. **محطة التعاون**: لعبة أو مشروع صغير.

## نصائح
- جرس أو موسيقى قصيرة للتنبيه بالتدوير.
- لوحة ملونة توضح مسار كل مجموعة.`,
  },
  {
    section: "multilevel", author: 3, aiTool: "MagicSchool",
    title: "توليد أوراق عمل متدرجة لنفس الهدف بثلاثة مستويات",
    summary: "خطوات عملية لاستخدام MagicSchool لإنتاج ثلاث نسخ من ورقة العمل نفسها بمستويات صعوبة مختلفة.",
    level: "ثلاثة مستويات", tags: ["أوراق عمل", "تمايز"],
    content: `## الخطوات
1. اكتبي الهدف التعليمي بوضوح.
2. اطلبي من الأداة ثلاث نسخ: أساسية، متوسطة، متقدمة.
3. راجعي اللغة وبسّطيها لتناسب البيئة المحلية.
4. اطبعي كل مستوى بلون مختلف.

## مثال
الهدف: جمع عددين ضمن 20.
- أساسي: جمع بالصور.
- متوسط: جمع عمودي.
- متقدم: مسائل لفظية.`,
  },
  {
    section: "multilevel", author: 2,
    title: "نظام «الصديقة المعلمة» للتعلم بالأقران",
    summary: "إشراك المتعلمات المتقدمات في دعم زميلاتهن وفق بطاقات مهام واضحة.",
    level: "مستويان", tags: ["تعلم بالأقران", "تعاون"],
    content: `## الفكرة
تُقرن كل متعلمة متقدمة بزميلة تحتاج دعماً لمدة 10 دقائق في بداية الحصة.

## بطاقة المهمة
- اقرئي لصديقتك الكلمات التالية.
- اطلبي منها إعادتها.
- ضعي نجمة عند كل كلمة صحيحة.

## الفوائد
تعزيز الثقة لدى الطرفين وتحرير وقت المعلمة.`,
  },
  // classroom
  {
    section: "classroom", author: 4, featured: true, aiTool: "Canva AI",
    title: "لوحة النجوم الرقمية لتحفيز السلوك الإيجابي",
    summary: "نظام تعزيز بصري بسيط مع شهادات أسبوعية مصممة بـ Canva AI.",
    level: "التحفيز", tags: ["تعزيز", "سلوك إيجابي"],
    content: `## القواعد
- نجمة ذهبية لكل مشاركة فعالة.
- نجمة فضية للتعاون مع الزميلات.
- 10 نجوم = شهادة "نجمة الأسبوع".

## التنفيذ
لوحة كرتونية في الفصل + نسخة رقمية تُرسل لأولياء الأمور شهرياً.`,
  },
  {
    section: "classroom", author: 1,
    title: "ميثاق الصف: قواعد نضعها معاً",
    summary: "جلسة مدتها 30 دقيقة تضع فيها المتعلمات قواعد الفصل بأنفسهن ويوقّعن عليها.",
    level: "الانضباط", tags: ["قواعد", "مشاركة"],
    content: `## الخطوات
1. عصف ذهني: ماذا نحتاج لنتعلم براحة؟
2. تجميع الأفكار في 5 قواعد إيجابية الصياغة.
3. كتابتها على لوحة كبيرة وتوقيع الجميع.
4. مراجعتها كل شهر.`,
  },
  {
    section: "classroom", author: 3,
    title: "روتين بداية الحصة في 3 دقائق",
    summary: "تسلسل ثابت يهدئ الفصل ويهيئ المتعلمات للتعلم.",
    level: "تنظيم البيئة الصفية", tags: ["روتين", "تهيئة"],
    content: `1. التحية والابتسامة عند الباب.
2. سؤال اليوم على السبورة.
3. دقيقة تنفس وهدوء.
4. البدء بالنشاط التمهيدي.`,
  },
  // strategies
  {
    section: "strategies", author: 1, featured: true, aiTool: "ChatGPT",
    title: "استراتيجية فكّر – زاوج – شارك بدعم الذكاء الاصطناعي",
    summary: "توليد أسئلة مفتوحة عالية المستوى بالذكاء الاصطناعي وتطبيق الاستراتيجية بخطوات زمنية محددة.",
    level: "تعلم تعاوني", tags: ["تعلم نشط", "تفكير"],
    content: `## الخطوات
1. **فكّر** (دقيقتان): كل متعلمة تفكر بصمت في السؤال.
2. **زاوج** (3 دقائق): مناقشة مع الزميلة المجاورة.
3. **شارك** (5 دقائق): عرض الأفكار أمام الفصل.

## دور الذكاء الاصطناعي
استخدمي الأمر: "اقترح 5 أسئلة مفتوحة عن [الموضوع] تناسب متعلمات مبتدئات".`,
  },
  {
    section: "strategies", author: 2, aiTool: "Quizizz AI",
    title: "التقويم باللعب: مسابقات سريعة في نهاية الحصة",
    summary: "إنشاء اختبار قصير من 5 أسئلة بـ Quizizz AI وتنفيذه ورقياً أو عبر هاتف واحد.",
    level: "تقويم", tags: ["ألعاب", "تقويم تكويني"],
    content: `## لماذا؟
التقويم الممتع يرفع الدافعية ويعطي المعلمة صورة فورية عن الفهم.

## التنفيذ بدون أجهزة
اطبعي الأسئلة على بطاقات، والمتعلمات يرفعن بطاقات ملونة (أ، ب، ج) للإجابة.`,
  },
  {
    section: "strategies", author: 4,
    title: "خرائط المفاهيم اليدوية لتلخيص الدرس",
    summary: "تدريب المتعلمات على رسم خريطة مفاهيم بسيطة في نهاية كل وحدة.",
    level: "تفكير ناقد", tags: ["تلخيص", "خرائط ذهنية"],
    content: `## الخطوات
1. المفهوم الرئيسي في المنتصف.
2. الأفرع للأفكار الفرعية.
3. الألوان لتمييز كل فرع.

## نصيحة
ابدئي بخريطة جماعية على السبورة قبل العمل الفردي.`,
  },
  // admin
  {
    section: "admin", author: 1, featured: true,
    title: "استمارة متابعة أداء المتعلمة الشهرية",
    summary: "نموذج جاهز للطباعة يرصد المهارات الأساسية (قراءة، كتابة، حساب) والسلوك والحضور.",
    level: "متابعة أداء", tags: ["استمارة", "متابعة"],
    content: `## بيانات المتعلمة
الاسم: ............  المستوى: ............  الشهر: ............

## المهارات (1-5)
| المهارة | الدرجة | ملاحظات |
|---|---|---|
| القراءة | | |
| الكتابة | | |
| الحساب | | |

## الحضور
عدد أيام الحضور: ....  الغياب: ....

## توصيات المعلمة
..........................`,
  },
  {
    section: "admin", author: 2,
    title: "سجل الحضور والغياب الأسبوعي",
    summary: "جدول بسيط للحضور اليومي مع خانة لسبب الغياب والتواصل مع الأسرة.",
    level: "سجل حضور", tags: ["حضور", "سجل"],
    content: `| م | الاسم | السبت | الأحد | الاثنين | الثلاثاء | الأربعاء | ملاحظات |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |

**رموز:** ✓ حاضرة، غ غائبة بعذر، × غائبة بدون عذر.`,
  },
  {
    section: "admin", author: 3, aiTool: "ChatGPT",
    title: "نموذج التقرير الشهري للمنسّقة",
    summary: "هيكل تقرير شهري مختصر مع أمر جاهز لتوليد مسودة التقرير بالذكاء الاصطناعي.",
    level: "تقرير شهري", tags: ["تقرير", "إداري"],
    content: `## أقسام التقرير
1. عدد المتعلمات والحضور.
2. الدروس المنجزة.
3. أبرز التحديات.
4. قصص نجاح.
5. الاحتياجات.

## أمر مقترح للذكاء الاصطناعي
"اكتب تقريراً شهرياً مختصراً لفصل تعليم مجتمعي بناءً على النقاط التالية: ..."`,
  },
  // exchange
  {
    section: "exchange", author: 2, featured: true, aiTool: "ChatGPT",
    title: "كيف حوّلت فصلي الصامت إلى فصل متفاعل خلال شهر",
    summary: "تجربتي مع استراتيجية «سؤال اليوم» والمسابقات القصيرة؛ ارتفعت المشاركة من 3 متعلمات إلى 15.",
    level: "تجربة ناجحة", tags: ["مشاركة", "تحفيز", "قصة نجاح"],
    content: `بدأت العام ومعظم المتعلمات يخشين الكلام. جربت ثلاثة أمور:

1. **سؤال اليوم** على السبورة قبل دخولهن.
2. **بطاقات الإجابة الملونة** لتخفيف الخوف من الخطأ.
3. **الثناء المحدد**: "أعجبني أنك ربطتِ الفكرة بمثال من بيتك".

النتيجة بعد 4 أسابيع: المشاركة اليومية أصبحت شبه كاملة، وبدأت المتعلمات يقترحن أسئلة اليوم بأنفسهن!`,
  },
  {
    section: "exchange", author: 4,
    title: "سؤال: كيف تتعاملن مع المتعلمات الأكبر سناً اللاتي يشعرن بالحرج؟",
    summary: "لدي متعلمتان في الأربعين من العمر تترددان في المشاركة مع الفتيات الصغيرات. أبحث عن أفكار.",
    level: "سؤال", tags: ["تعليم كبار", "دعم نفسي"],
    content: `المتعلمتان ملتزمتان جداً لكن تجلسان في الخلف ولا تشاركان. هل من تجارب مماثلة؟ ما الذي نجح معكن؟`,
  },
  {
    section: "exchange", author: 3, aiTool: "Canva AI",
    title: "فكرة: معرض نهاية الفصل لأعمال المتعلمات",
    summary: "دعوة الأهالي لمعرض صغير يعرض كتابات ورسومات المتعلمات؛ أثر كبير على الدافعية والدعم الأسري.",
    level: "فكرة", tags: ["أسرة", "دافعية"],
    content: `## ما فعلناه
- جمعنا أفضل عمل لكل متعلمة.
- صممنا دعوات بـ Canva AI.
- كل متعلمة قدّمت عملها بنفسها في دقيقة.

## الأثر
حضر 20 ولي أمر، وزاد انتظام الحضور في الأسابيع التالية بشكل ملحوظ.`,
  },
];

const EXTRA_SEEDS: SeedResource[] = [
  // aids
  {
    section: "aids", author: 3, featured: true, aiTool: "Canva AI",
    title: "بطاقات الحروف المصورة (28 بطاقة جاهزة للطباعة)",
    summary: "مجموعة بطاقات ملونة لكل حرف مع صورة وكلمة من البيئة المحلية، مصممة بـ Canva AI بحجم A5.",
    level: "بطاقات", tags: ["حروف", "طباعة", "قراءة"],
    content: `## طريقة الاستخدام
1. اطبعي البطاقات على ورق مقوى وقصّيها.
2. غلّفيها بالبلاستيك لتدوم طويلاً.
3. استخدميها في لعبة "اصطياد الحرف" أو للعرض على الحائط.

## نصيحة
ارفعي صور البطاقات كمرفقات هنا ليتمكن الجميع من تنزيلها وطباعتها.`,
  },
  {
    section: "aids", author: 2, aiTool: "Gamma",
    title: "عرض تقديمي: أجزاء النبات بالصور المتحركة",
    summary: "عرض من 12 شريحة بصور توضيحية كبيرة وأسئلة تفاعلية في نهاية كل جزء.",
    level: "عروض تقديمية", tags: ["علوم", "نبات", "عرض"],
    content: `## محتوى العرض
- الجذر، الساق، الأوراق، الزهرة، الثمرة.
- سؤال "خمّني الجزء" بعد كل شريحة.

## التجهيز
يمكن عرضه من الهاتف أو طباعته كلوحات إن لم يتوفر جهاز عرض.`,
  },
  {
    section: "aids", author: 4,
    title: "لوحة الجيوب للأعداد من 1 إلى 100",
    summary: "لوحة قماشية بجيوب شفافة لتدريب المتعلمات على العد والترتيب والأنماط العددية.",
    level: "لوحات وملصقات", tags: ["رياضيات", "أعداد", "يدوي"],
    content: `## المواد
قماش 1م × 1م، أكياس شفافة، بطاقات أعداد.

## الأنشطة
1. ترتيب الأعداد تصاعدياً.
2. إخفاء أعداد والطلب من المتعلمة اكتشاف الناقص.
3. تلوين مضاعفات 5 و10.`,
  },
  // games
  {
    section: "games", author: 1, featured: true, aiTool: "ChatGPT",
    title: "لعبة «سباق الكلمات»: تركيب كلمات من حروف متناثرة",
    summary: "لعبة جماعية حركية مدتها 15 دقيقة تدرّب على التهجئة والطلاقة، قوائم الكلمات مولدة بالذكاء الاصطناعي.",
    level: "لعبة حركية", tags: ["تهجئة", "حركية", "تعاون"],
    content: `## المواد
بطاقات حروف كبيرة، سلة، ساعة توقيت.

## القواعد
1. تُقسم المتعلمات إلى فريقين.
2. تعرض المعلمة صورة، وعلى الفريق تكوين اسمها من بطاقات الحروف.
3. أول فريق يرفع الكلمة الصحيحة يحصل على نقطة.

## التدرج
ابدئي بكلمات من 3 حروف ثم 4 ثم 5.`,
  },
  {
    section: "games", author: 3, aiTool: "Quizizz AI",
    title: "بنغو الجمع والطرح",
    summary: "بطاقات بنغو بنتائج عمليات حسابية؛ تقرأ المعلمة المسألة وتغطي المتعلمة الناتج.",
    level: "لعبة بطاقات", tags: ["رياضيات", "جمع", "طرح"],
    content: `## التجهيز
اطبعي بطاقات بنغو 3×3 بأرقام من 1 إلى 20 (مرفق نموذج).

## اللعب
- اقرئي مسألة مثل "7 + 5".
- من تغطي صفاً كاملاً تنادي "بنغو!".

## التنويع
للمستوى المتقدم استخدمي الضرب.`,
  },
  {
    section: "games", author: 2,
    title: "لعبة «أنا أرى» للمفردات والوصف",
    summary: "لعبة بدون أدوات تنمي المفردات والجمل الوصفية في أي وقت فراغ خلال الحصة.",
    level: "لعبة صفية بدون أدوات", tags: ["مفردات", "تعبير شفهي"],
    content: `## القواعد
تقول المعلمة: "أنا أرى شيئاً لونه أحمر وشكله دائري". وتخمّن المتعلمات.

## التطوير
المتعلمة التي تخمّن صحيحاً تصف الشيء التالي بجملتين كاملتين.`,
  },
  // inspiration
  {
    section: "inspiration", author: 1, featured: true,
    title: "قصة «أم أحمد»: من الأمية إلى قراءة القرآن في عام واحد",
    summary: "متعلمة في الخامسة والأربعين التحقت بالفصل وهي لا تعرف الحروف، واليوم تقرأ لأحفادها.",
    level: "قصة ملهمة", tags: ["قصة نجاح", "تعليم كبار"],
    content: `جاءت أم أحمد في أول يوم وهي تقول: "أنا كبيرة على التعليم". اليوم، بعد عام، تجلس في الصف الأول وتقرأ بصوت عالٍ.

## ما ساعدها
- صبر المعلمة وعدم تصحيح كل خطأ أمام الجميع.
- بطاقات الحروف المصورة.
- 10 دقائق قراءة يومية مع حفيدتها.

> "التعليم ليس له عمر، بل له إرادة."`,
  },
  {
    section: "inspiration", author: 4,
    title: "اقتباسات تربوية لبداية الحصة",
    summary: "20 اقتباساً قصيراً عن العلم والإصرار يمكن كتابة واحد منها يومياً على السبورة.",
    level: "اقتباس", tags: ["تحفيز", "روتين"],
    content: `1. من جدّ وجد، ومن زرع حصد.
2. العلم نور، والجهل ظلام.
3. كل خبيرة كانت يوماً مبتدئة.
4. الخطأ أول خطوة نحو التعلم.
5. لا تقارني نفسك إلا بنفسك بالأمس.

**نصيحة:** اطلبي من المتعلمات اقتراح اقتباسات من ثقافتهن المحلية.`,
  },
  {
    section: "inspiration", author: 2, aiTool: "Canva AI",
    title: "صور من معرض نهاية الفصل بفصل الحي الشرقي",
    summary: "لقطات من معرض أعمال المتعلمات وفرحة الأهالي — مكان مثالي لرفع صور فصلك أيضاً!",
    level: "صور من الفصل", tags: ["معرض", "أسرة", "صور"],
    content: `## ماذا عرضنا
- كتابات المتعلمات الأولى.
- رسومات دورة الماء.
- شهادات «نجمة الأسبوع».

## شاركينا
ارفعي صور فصلك كمرفقات في مشاركة جديدة لنلهم بعضنا.`,
  },
];

const SEED_COMMENTS: { resourceTitle: string; author: number; body: string }[] = [
  { resourceTitle: "كيف حوّلت فصلي الصامت إلى فصل متفاعل خلال شهر", author: 1, body: "تجربة ملهمة يا أستاذة سارة! سأجرب بطاقات الإجابة الملونة هذا الأسبوع." },
  { resourceTitle: "كيف حوّلت فصلي الصامت إلى فصل متفاعل خلال شهر", author: 3, body: "فكرة الثناء المحدد غيّرت طريقتي في التعامل. شكراً للمشاركة." },
  { resourceTitle: "سؤال: كيف تتعاملن مع المتعلمات الأكبر سناً اللاتي يشعرن بالحرج؟", author: 2, body: "نجح معي أن أعطيهن دوراً قيادياً: مسؤولة توزيع الأوراق أو قائدة مجموعة. الشعور بالقيمة أزال الحرج تدريجياً." },
  { resourceTitle: "سؤال: كيف تتعاملن مع المتعلمات الأكبر سناً اللاتي يشعرن بالحرج؟", author: 1, body: "يمكن أيضاً تخصيص 10 دقائق في بداية الحصة للعمل معهن في مجموعة مستقلة قبل الدمج مع البقية." },
  { resourceTitle: "نموذج المحطات الدوّارة لثلاثة مستويات في حصة واحدة", author: 4, body: "طبقته مع تعديل بسيط: جعلت المحطة الثالثة قراءة حرة. النتائج ممتازة." },
  { resourceTitle: "برنامج 4 أسابيع لعلاج صعوبة تعرّف الحروف", author: 2, body: "الكتابة على الرمل كانت الأكثر فاعلية مع متعلماتي. أنصح بها بشدة." },
];

let seedPromise: Promise<void> | null = null;

/**
 * Serialises seeding across processes/instances with a Postgres advisory lock,
 * so two servers starting at the same moment can't insert the demo data twice.
 * The "already seeded?" checks inside run while the lock is held.
 */
async function withSeedLock(fn: () => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock(727172026)");
    await fn();
  } finally {
    await client.query("select pg_advisory_unlock(727172026)").catch(() => undefined);
    client.release();
  }
}

function demoPassword(): string {
  const p = process.env.SEED_DEMO_PASSWORD ?? "";
  if (p.length < 10) throw new Error("SEED_DEMO_PASSWORD (10+ chars) is required to seed demo data");
  return p;
}

/** Production: create the first admin from env vars, only when the users table is empty. */
async function bootstrapAdmin() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  if (value > 0) return;
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 10) return;
  await db.insert(users).values({
    name: process.env.ADMIN_NAME || "المسؤولة",
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    school: "منسقة المبادرة",
  });
}

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = withSeedLock(async () => {
      if (process.env.SEED_DEMO === "1") {
        await seed();
        await seedContent();
      } else {
        await bootstrapAdmin();
      }
    }).catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function seedMissingSections(allUsers: { id: number }[]) {
  const existing = await db.select({ section: resources.section, value: count() }).from(resources).groupBy(resources.section);
  const have = new Set(existing.filter((r) => r.value > 0).map((r) => r.section));
  const missing = EXTRA_SEEDS.filter((r) => !have.has(r.section));
  if (!missing.length) return;
  const now = Date.now();
  await db.insert(resources).values(
    missing.map((r, i) => {
      const createdAt = new Date(now - (missing.length - i) * 20 * 60 * 60 * 1000);
      return {
        section: r.section,
        title: r.title,
        summary: r.summary,
        content: r.content,
        level: r.level,
        tags: r.tags,
        aiTool: r.aiTool ?? null,
        featured: r.featured ?? false,
        authorId: (allUsers[r.author - 1] ?? allUsers[0]).id,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );
}

async function seed() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  if (value > 0) {
    const existingUsers = await db.select({ id: users.id }).from(users).orderBy(users.id).limit(4);
    await seedMissingSections(existingUsers);
    return;
  }

  const insertedUsers = await db
    .insert(users)
    .values(
      SEED_USERS.map((u) => ({
        name: u.name,
        email: u.email,
        passwordHash: hashPassword(demoPassword()),
        role: u.role,
        school: u.school,
      })),
    )
    .returning({ id: users.id });

  const now = Date.now();
  const insertedResources = await db
    .insert(resources)
    .values(
      SEED_RESOURCES.map((r, i) => {
        const createdAt = new Date(now - (SEED_RESOURCES.length - i) * 36 * 60 * 60 * 1000);
        return {
          section: r.section,
          title: r.title,
          summary: r.summary,
          content: r.content,
          level: r.level,
          tags: r.tags,
          aiTool: r.aiTool ?? null,
          featured: r.featured ?? false,
          authorId: insertedUsers[r.author - 1].id,
          createdAt,
          updatedAt: createdAt,
        };
      }),
    )
    .returning({ id: resources.id, title: resources.title });

  const byTitle = new Map(insertedResources.map((r) => [r.title, r.id]));
  const commentRows = SEED_COMMENTS.flatMap((c, i) => {
    const resourceId = byTitle.get(c.resourceTitle);
    if (!resourceId) return [];
    return [
      {
        resourceId,
        authorId: insertedUsers[c.author - 1].id,
        body: c.body,
        createdAt: new Date(now - (SEED_COMMENTS.length - i) * 5 * 60 * 60 * 1000),
      },
    ];
  });
  if (commentRows.length) await db.insert(comments).values(commentRows);
  await seedMissingSections(insertedUsers);
}
