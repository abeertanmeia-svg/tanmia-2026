import pg from "pg";
import { readFileSync } from "fs";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
await c.connect();
const html = readFileSync(new URL("./rocket-game.html", import.meta.url));
const title = "🚀 صاروخ جدول الضرب — لعبة تفاعلية تعمل بدون إنترنت";
const { rows: ex } = await c.query("select id from resources where title=$1", [title]);
if (ex.length) { console.log("exists", ex[0].id); await c.end(); process.exit(0); }
const { rows: [admin] } = await c.query("select id from users where role='admin' order by id limit 1");
const content = `## الفكرة
كل إجابة صحيحة ترفع الصاروخ خطوة نحو القمر 🌕. تختار المتعلمة الجدول (أو عدة جداول) والمستوى، وتجيب عن مسائل اختيار من متعدد مع مؤثرات صوتية ونجوم في النهاية.

## المستويات
| المستوى | المدى | الوقت | عدد الأسئلة |
|---|---|---|---|
| 🌱 مبتدئ | حتى ×5 | بدون وقت | 8 |
| ⭐ متوسط | حتى ×10 | 12 ثانية | 10 |
| 🔥 متقدم | حتى ×12 مع قلب الترتيب | 7 ثوانٍ | 12 |

## كيف تستخدمينها في الحصة
1. اضغطي **▶ تشغيل هنا** في المرفق أدناه، أو نزّلي الملف وافتحيه على أي هاتف أو حاسوب **بدون إنترنت**.
2. للفصل متعدد المستويات: المبتدئات يخترن جدولاً واحداً بالمستوى 🌱، والمتقدمات عدة جداول بالمستوى 🔥.
3. في نهاية اللعبة يظهر جدول **الأخطاء** وزر **تدرّبي على الأخطاء** — استخدميه كتقويم تكويني سريع.
4. مسابقة جماعية: اعرضي الشاشة وقسّمي الفصل فريقين، كل فريق يرفع بطاقة الإجابة.

## نصيحة
اطلبي من المتعلمة أن تقول المسألة بصوت عالٍ قبل الاختيار؛ هذا يثبّت الحفظ السمعي.`;
const { rows: [r] } = await c.query(
  `insert into resources (section,title,summary,content,level,tags,ai_tool,featured,status,author_id) values ('games',$1,$2,$3,'لعبة رقمية',$4,'Claude',true,'approved',$5) returning id`,
  [title, "لعبة HTML بثلاثة مستويات لحفظ جدول الضرب: اختيار الجداول، مؤقت، مؤثرات صوتية، صاروخ يصعد مع كل إجابة صحيحة، ومراجعة للأخطاء. تعمل على الهاتف بدون إنترنت.", content, ["جدول الضرب", "رياضيات", "لعبة رقمية", "HTML"], admin.id]);
await c.query(`insert into attachments (resource_id,kind,name,mime_type,size,data,uploaded_by) values ($1,'file','صاروخ-جدول-الضرب.html','text/html',$2,$3,$4)`, [r.id, html.length, html, admin.id]);
console.log("inserted resource", r.id);
await c.end();
