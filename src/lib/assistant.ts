import type { Section } from "@/db/schema";

export type AssistantTask = {
  id: string;
  title: string;
  hint: string;
  icon: string;
  section: Section;
  instructions: string;
};

export const ASSISTANT_TASKS: AssistantTask[] = [
  { id: "lesson", title: "تحضير درس", hint: "أهداف وتمهيد وعرض وتقويم وواجب", icon: "📝", section: "preparation",
    instructions: "أعدّي تحضير درس كامل بالعناوين: الأهداف، فكرة شيقة لكسر الجليد، التمهيد (مع زمن)، العرض بخطوات مرقمة (مع زمن لكل خطوة)، لعبة تفاعلية قصيرة، أنشطة متدرجة لثلاثة مستويات، اختبار قصير من 3 أسئلة، الواجب، والوسائل المطلوبة. واختمي بقسم بعنوان \"## رسالة لأولياء الأمور\" فيه رسالة قصيرة ودودة جاهزة للإرسال عبر واتساب (4-5 أسطر مع إيموجي) تخبرهم بما تعلمه الأبناء اليوم وكيف يساعدونهم في البيت." },
  { id: "multigrade", title: "تحضير متعدد الصفوف (1-6)", hint: "درس واحد بمهام مختلفة لكل صف", icon: "🧩", section: "multilevel",
    instructions: "أعدّي تحضيراً لحصة واحدة في فصل يضم الصفوف من الأول إلى السادس معاً حول موضوع مشترك. اجعلي: (1) تمهيداً مشتركاً للجميع، (2) جدولاً بعنوان \"المهام حسب الصف\" بأعمدة (الصف | الهدف | المهمة | الوسيلة | زمن العمل) للصفوف 1-6، (3) جدولاً زمنياً يوضح متى تكون المعلمة مع كل مجموعة، (4) دور المتعلمات الأكبر كمساعدات، (5) ختاماً مشتركاً وتقويماً لكل مجموعة." },
  { id: "curriculum", title: "توزيع المنهج", hint: "خطة أسبوعية للفصل الدراسي", icon: "📅", section: "admin",
    instructions: "أعدّي توزيعاً للمنهج على أسابيع الفصل الدراسي (افتراضياً 14 أسبوعاً إن لم يُحدد) في جدول بأعمدة (الأسبوع | الموضوع/الدرس | المهارات | نشاط مقترح | تقويم). خصصي أسبوعاً للمراجعة وأسبوعاً للتقييم الشهري كل 4 أسابيع، وأضيفي ملاحظات لمراعاة الفصل متعدد المستويات." },
  { id: "monthly", title: "اختبار شهري", hint: "اختبار متدرج مع نموذج الإجابة", icon: "🏅", section: "admin",
    instructions: "أعدّي اختباراً شهرياً قابلاً للطباعة: ترويسة (الاسم، الصف، التاريخ، الدرجة)، 4-5 أسئلة متنوعة (اختيار من متعدد، صل، أكمل، صح وخطأ، سؤال تعبيري) متدرجة الصعوبة مع توزيع الدرجات (من 20)، ثم نموذج الإجابة للمعلمة، ثم جدول تحليل النتائج (المهارة | عدد من أتقن | الإجراء العلاجي)." },
  { id: "parents", title: "رسالة لأولياء الأمور", hint: "رسالة واتساب جاهزة للإرسال", icon: "💌", section: "exchange",
    instructions: "اكتبي رسالة واتساب ودودة ومختصرة (6-8 أسطر) لأولياء الأمور بالعامية المصرية المهذبة أو الفصحى البسيطة حسب الطلب، مع إيموجي مناسبة، وتتضمن: التحية، ما تعلمه الأطفال أو المطلوب، نشاطاً بسيطاً يمكن عمله في البيت (5 دقائق)، والشكر. لا تكتبي عناوين أو جداول، فقط نص الرسالة جاهزاً للنسخ." },
  { id: "worksheet", title: "ورقة عمل", hint: "تدريبات متنوعة مع مراعاة المستويات", icon: "📄", section: "preparation",
    instructions: "أعدّي ورقة عمل بثلاثة مستويات واضحة: (1) دعم: مطابقة أو اختيار، (2) متوسط: إكمال أو ترتيب، (3) متقدم: إنتاج أو حل مسألة. ضعي التعليمات بلغة بسيطة ومكان للاسم والتاريخ، ثم مفتاح إجابة مختصر للمعلمة." },
  { id: "game", title: "لعبة تعليمية", hint: "لعبة صفية أو رقمية بخطوات وقواعد", icon: "🎲", section: "games",
    instructions: "صممي لعبة تعليمية: الهدف، المواد (بسيطة ومتاحة)، عدد اللاعبين، القواعد خطوة بخطوة، الزمن، طريقة احتساب النقاط، وتنويع لمستويات أعلى وأدنى، ونصيحة لإدارة الصف أثناء اللعب." },
  { id: "aid", title: "نشاط ووسيلة", hint: "فكرة حسية وأدوات وطريقة تنفيذ", icon: "🎨", section: "aids",
    instructions: "اقترحي وسيلة تعليمية حسية أو نشاطاً عملياً: الفكرة، الخامات المتاحة منخفضة التكلفة، خطوات الصنع، طريقة الاستخدام في الحصة، وكيف يشارك الأطفال في صنعها." },
  { id: "remedial", title: "خطة علاجية", hint: "علاج ضعف القراءة والكتابة تدريجياً", icon: "📖", section: "literacy",
    instructions: "أعدّي خطة علاجية لمدة 4 أسابيع لعلاج الضعف المحدد: تقييم تشخيصي مختصر، أهداف كل أسبوع، أنشطة يومية قصيرة (10-15 دقيقة) متعددة الحواس، مؤشرات الانتقال للمرحلة التالية، وبطاقة متابعة." },
  { id: "assess", title: "تقييم ومتابعة", hint: "اختبارات قصيرة وبطاقات رصد", icon: "📋", section: "admin",
    instructions: "أعدّي أداة تقييم: اختبار قصير من 5-8 أسئلة متدرجة مع مفتاح الإجابة، وبطاقة رصد على شكل جدول (المهارة | مهمة التحقق | مستقل / بمساعدة / لم يتقن)، وتوصيات بحسب النتيجة." },
  { id: "multilevel", title: "إدارة حصة متعددة المستويات", hint: "توزيع الوقت والمحطات", icon: "🎯", section: "multilevel",
    instructions: "خططي حصة واحدة لفصل متعدد المستويات: توزيع زمني دقيق، 3 محطات (مع المعلمة / عمل مستقل / تعاوني) مع مهمة كل مجموعة، إشارات الانتقال، وكيفية متابعة من يحتاج دعماً." },
  { id: "learnai", title: "تعلم الذكاء الاصطناعي", hint: "تعلمي استخدام الأدوات في عملك اليومي", icon: "🤖", section: "strategies",
    instructions: "اشرحي للمعلمة بخطوات عملية كيف تستخدم أدوات الذكاء الاصطناعي المجانية لتنفيذ ما طلبته، مع 3 أوامر (Prompts) جاهزة للنسخ بالعربية، وتنبيهات الخصوصية (عدم رفع أسماء أو صور الأطفال)، وكيفية مراجعة الناتج." },
  { id: "htmlgame", title: "لعبة HTML تفاعلية", hint: "لعبة أو ورقة عمل تفاعلية تعمل في المتصفح", icon: "🕹️", section: "games",
    instructions: "أنشئي ملف HTML واحداً كاملاً (HTML + CSS + JavaScript داخل الملف نفسه، بدون مكتبات خارجية) للعبة أو نشاط تفاعلي تعليمي بالعربية مع dir=\"rtl\" وخط كبير وأزرار كبيرة تناسب الأطفال والهواتف. يجب أن تتضمن: شاشة بداية، أسئلة/جولات متدرجة الصعوبة (3 مستويات)، تغذية راجعة فورية ملونة وأصوات بسيطة اختيارية عبر Web Audio، عدّاد نقاط، وشاشة نهاية مع زر إعادة. أخرجي كود HTML فقط داخل كتلة ```html بدون أي شرح قبلها أو بعدها." },
  { id: "other", title: "مساعدة أخرى", hint: "اكتبي ما تحتاجينه بالتفصيل", icon: "💡", section: "exchange",
    instructions: "ساعدي المعلمة في طلبها بشكل عملي ومباشر مع خطوات واضحة وأمثلة تناسب التعليم المجتمعي." },
];

export function getTask(id: string) {
  return ASSISTANT_TASKS.find((t) => t.id === id);
}

export const SYSTEM_PROMPT = `أنتِ "مساعدة المعلمة الذكية" في مبادرة معلمات مبدعات بالذكاء الاصطناعي – التعليم المجتمعي (مصر).
جمهورك معلمات فصول التعليم المجتمعي (فصل واحد متعدد المستويات، موارد قليلة، أطفال وكبار متسربون من التعليم، بعضهم يعاني من ضعف القراءة والكتابة).
القواعد:
- اكتبي بالعربية الفصحى المبسطة، بصيغة المؤنث عند مخاطبة المعلمة.
- كوني عملية جداً: خطوات مرقمة، أزمنة، خامات منخفضة التكلفة ومتاحة في القرى.
- راعي ثلاثة مستويات دائماً (دعم / متوسط / متقدم) حيثما أمكن.
- استخدمي تنسيق Markdown بسيط: عناوين بـ ## ، قوائم بـ - أو أرقام، جداول بـ | عند الحاجة، و**تأكيد** للمهم.
- لا تذكري أسماء أطفال حقيقيين ولا تطلبي بيانات شخصية.
- اختمي بفقرة قصيرة "💡 نصيحة للمعلمة".`;

export type AssistantInput = { task: string; grade: string; subject: string; details: string };

export function buildUserPrompt(task: AssistantTask, input: AssistantInput) {
  return `نوع المساعدة: ${task.title}
الصف/المستوى: ${input.grade || "غير محدد"}
المادة أو المجال: ${input.subject || "غير محدد"}
تفاصيل الطلب: ${input.details}

التعليمات: ${task.instructions}`;
}

/** Offline, template-based fallback used when no AI key is configured. */
export function offlineTemplate(task: AssistantTask, input: AssistantInput) {
  const grade = input.grade || "المستوى المناسب";
  const subject = input.subject || "المجال";
  const topic = input.details.trim() || task.title;
  const levels = `## الأنشطة بثلاثة مستويات
| المستوى | المهمة | شكل الدعم |
|---|---|---|
| دعم | مطابقة أو اختيار من صورتين حول "${topic}" | بطاقات مصورة ونموذج من المعلمة |
| متوسط | إكمال أو ترتيب خطوات/كلمات | تلميح شفهي |
| متقدم | إنتاج جملة أو حل مسألة أو شرح للزميلات | عمل مستقل |`;
  const tip = `## 💡 نصيحة للمعلمة
هذا قالب منظّم يمكنك تعبئته مباشرة. لتفعيل التوليد الذكي الكامل، تُضاف أداة الذكاء الاصطناعي من إعدادات المنصة (GEMINI_API_KEY).`;

  switch (task.id) {
    case "lesson":
      return `## بيانات الدرس
- **الموضوع:** ${topic}
- **الصف:** ${grade} · **المادة:** ${subject}

## الأهداف
1. أن تتعرف المتعلمة على ${topic}.
2. أن تطبق المتعلمة ما تعلمته في مثال من بيئتها.

## التمهيد (5 دقائق)
سؤال أو موقف من الحياة اليومية مرتبط بـ"${topic}".

## العرض (20 دقيقة)
1. شرح مباشر مع وسيلة بصرية.
2. مثال جماعي على السبورة.
3. تدريب ثنائي.

${levels}

## التقويم (10 دقائق)
ثلاثة أسئلة متدرجة شفهية أو كتابية.

## الواجب
مهمة قصيرة مرتبطة بالبيت أو القرية.

${tip}`;
    case "remedial":
      return `## خطة علاجية لمدة 4 أسابيع — ${topic}
**الصف:** ${grade}

## التقييم التشخيصي
| المهارة | مهمة التحقق | الأداء |
|---|---|---|
| تمييز الحروف | يسمي الحرف ويختار شكله | مستقل / بمساعدة / لم يتقن |
| الوعي الصوتي | يحدد صوت البداية والنهاية | مستقل / بمساعدة / لم يتقن |
| الدمج والقراءة | يركب مقطعاً ويقرأ كلمة | مستقل / بمساعدة / لم يتقن |
| الكتابة | يكتب حرفاً وكلمة وجملة | مستقل / بمساعدة / لم يتقن |

## الأسابيع
1. **الأسبوع الأول:** تشخيص وتجميع مرن وتدريب حسي (رمل، صلصال).
2. **الأسبوع الثاني:** الوعي الصوتي ولعبة "من يبدأ بالصوت نفسه".
3. **الأسبوع الثالث:** دمج المقاطع وقراءة كلمات متدرجة.
4. **الأسبوع الرابع:** إعادة التقييم بنفس المؤشرات وتحديد الخطوة التالية.

> 10–15 دقيقة يومياً، ولا تنتقلين لمحطة جديدة إلا عند الإتقان.

${tip}`;
    case "game":
      return `## لعبة: ${topic}
- **الهدف:** تدريب ${subject} للصف ${grade}.
- **المواد:** بطاقات ورقية، سلة، ساعة توقيت.
- **عدد اللاعبين:** فريقان أو مجموعات صغيرة.

## القواعد
1. تعرض المعلمة البطاقة أو السؤال.
2. أول فريق يجيب إجابة صحيحة يحصل على نقطة.
3. من يساعد زميلته يحصل على نقطة تعاون.

${levels}

${tip}`;
    case "htmlgame":
      return "```html\n" + offlineHtmlGame(topic, grade) + "\n```";
    case "parents":
      return `السلام عليكم ورحمة الله 🌸
أولياء الأمور الكرام،
تعلّم أبناؤنا اليوم: ${topic} ✨
💡 نشاط بسيط في البيت (5 دقائق): اطلبوا من ابنكم/ابنتكم أن يشرح لكم ما تعلّمه بكلماته، واكتشفوا معاً مثالاً عليه من البيت.
شكراً لتعاونكم، فأنتم شركاؤنا في النجاح 🤝
معلمة الفصل`;
    default:
      return `## ${task.title}: ${topic}
- **الصف:** ${grade} · **المجال:** ${subject}

## الخطوات
1. حددي الهدف بوضوح.
2. جهزي الخامات البسيطة المتاحة.
3. نفذي مع مجموعة صغيرة أولاً ثم مع الفصل.
4. سجلي من أدى المهمة باستقلال ومن احتاج مساعدة.

${levels}

${tip}`;
  }
}

export function extractHtml(content: string): string | null {
  const m = content.match(/```html\s*([\s\S]*?)```/i) ?? content.match(/```\s*(<!doctype[\s\S]*?)```/i);
  const raw = m ? m[1] : /^\s*<!doctype html/i.test(content) || /^\s*<html/i.test(content) ? content : null;
  return raw ? raw.trim() : null;
}

function offlineHtmlGame(topic: string, grade: string) {
  const safeTopic = topic.replace(/[<>&"]/g, "");
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>لعبة: ${safeTopic}</title>
<style>
  body{font-family:Tahoma,Arial,sans-serif;background:linear-gradient(135deg,#eef2ff,#fdf2f8);margin:0;min-height:100vh;display:grid;place-items:center;color:#1e293b}
  .card{background:#fff;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.1);padding:28px;max-width:520px;width:92%;text-align:center}
  h1{font-size:26px;margin:0 0 6px}.sub{color:#64748b;font-size:14px;margin-bottom:18px}
  .q{font-size:30px;font-weight:800;margin:18px 0}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  button{font:inherit;font-size:22px;font-weight:700;padding:16px;border:0;border-radius:16px;background:#6366f1;color:#fff;cursor:pointer;transition:.15s}
  button:active{transform:scale(.97)}.ok{background:#10b981!important}.bad{background:#ef4444!important}
  .bar{display:flex;justify-content:space-between;font-weight:700;color:#475569;margin-bottom:10px}
  .big{font-size:20px;padding:18px 28px}.hidden{display:none}
  .lvl{display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700}
</style>
</head>
<body>
<div class="card">
  <div id="start">
    <h1>🎮 لعبة: ${safeTopic}</h1>
    <p class="sub">${grade ? grade + " · " : ""}أجيبي عن أكبر عدد من الأسئلة!</p>
    <button class="big" onclick="startGame()">ابدئي اللعب ▶</button>
  </div>
  <div id="game" class="hidden">
    <div class="bar"><span>⭐ النقاط: <b id="score">0</b></span><span class="lvl" id="lvl">المستوى 1</span><span>❓ <b id="n">1</b>/9</span></div>
    <div class="q" id="q"></div>
    <div class="opts" id="opts"></div>
    <p id="fb" style="min-height:28px;font-weight:800"></p>
  </div>
  <div id="end" class="hidden">
    <h1>🎉 أحسنتِ!</h1>
    <p class="q">نتيجتك: <span id="final"></span> / 9</p>
    <p class="sub" id="msg"></p>
    <button class="big" onclick="location.reload()">العبي مرة أخرى 🔄</button>
  </div>
</div>
<script>
// قالب لعبة جمع وطرح بثلاثة مستويات — عدّلي الأسئلة لتناسب موضوعك
const levels=[{max:10,ops:['+']},{max:20,ops:['+','-']},{max:50,ops:['+','-']}];
let i=0,score=0,qs=[];
function rnd(n){return Math.floor(Math.random()*n)}
function makeQ(l){const L=levels[l];const op=L.ops[rnd(L.ops.length)];let a=rnd(L.max)+1,b=rnd(L.max)+1;if(op==='-'&&b>a)[a,b]=[b,a];const ans=op==='+'?a+b:a-b;const set=new Set([ans]);while(set.size<4)set.add(Math.max(0,ans+rnd(11)-5));return{t:a+' '+op+' '+b+' = ؟',ans,opts:[...set].sort(()=>Math.random()-.5),l}}
function startGame(){for(let l=0;l<3;l++)for(let k=0;k<3;k++)qs.push(makeQ(l));document.getElementById('start').classList.add('hidden');document.getElementById('game').classList.remove('hidden');show()}
function beep(f){try{const c=new(window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();o.frequency.value=f;o.connect(c.destination);o.start();o.stop(c.currentTime+.15)}catch(e){}}
function show(){const q=qs[i];document.getElementById('q').textContent=q.t;document.getElementById('n').textContent=i+1;document.getElementById('lvl').textContent='المستوى '+(q.l+1);document.getElementById('fb').textContent='';const o=document.getElementById('opts');o.innerHTML='';q.opts.forEach(v=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>pick(b,v);o.appendChild(b)})}
function pick(b,v){const q=qs[i];const all=[...document.querySelectorAll('#opts button')];all.forEach(x=>x.disabled=true);if(v===q.ans){b.classList.add('ok');score++;document.getElementById('score').textContent=score;document.getElementById('fb').textContent='✅ إجابة صحيحة!';document.getElementById('fb').style.color='#059669';beep(880)}else{b.classList.add('bad');all.find(x=>+x.textContent===q.ans).classList.add('ok');document.getElementById('fb').textContent='❌ حاولي مرة أخرى، الإجابة '+q.ans;document.getElementById('fb').style.color='#dc2626';beep(220)}setTimeout(()=>{i++;if(i<qs.length)show();else end()},1100)}
function end(){document.getElementById('game').classList.add('hidden');document.getElementById('end').classList.remove('hidden');document.getElementById('final').textContent=score;document.getElementById('msg').textContent=score>=8?'ممتازة! أنتِ بطلة الحساب 🏆':score>=5?'جيد جداً! استمري في التدريب 💪':'لا بأس، كل محاولة تجعلك أقوى 🌱'}
</script>
</body>
</html>`;
}

/** Which assistant task best fits each library section ("مساعد هذا القسم"). */
export const SECTION_TASK: Record<Section, string> = {
  preparation: "lesson",
  literacy: "remedial",
  multilevel: "multigrade",
  classroom: "multilevel",
  strategies: "learnai",
  admin: "monthly",
  exchange: "parents",
  aids: "aid",
  games: "game",
  inspiration: "other",
  professional: "learnai",
  ai: "learnai",
  stations: "multilevel",
  assessment: "assess",
};
