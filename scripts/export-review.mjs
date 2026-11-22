// Builds a static, offline review bundle of every platform page into public/review/.
// Usage: start the app (e.g. `npx next start -p 3100`), then: node scripts/export-review.mjs http://localhost:3100
import { mkdir, writeFile, readFile, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const BASE = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const OUT = path.resolve("review-bundle");
const PAGES_DIR = path.join(OUT, "pages");
const stamp = new Date().toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" });

const SECTIONS = [
  ["preparation", "التحضير وتوزيع المناهج"], ["literacy", "علاج ضعف القراءة والكتابة"], ["multilevel", "إدارة حصة متعددة المستويات"],
  ["classroom", "إدارة الصف والتحفيز"], ["strategies", "استراتيجيات التعلم النشط"], ["aids", "معمل الوسائل الحسية"],
  ["games", "الألعاب التعليمية"], ["admin", "الإداريات والنماذج"], ["professional", "التنمية المهنية"], ["exchange", "تبادل الخبرات"],
  ["ai", "معلمات مبدعات بالذكاء الاصطناعي"], ["stations", "محطات التعلم الذاتي"], ["assessment", "أدوات الرصد والتقييم"], ["inspiration", "ركن الإلهام"],
];
const FORMS = [["teacher", "استمارة المعلمة"], ["ngo", "استمارة الجمعية"], ["student", "استمارة الطالب"], ["parent", "استمارة ولي الأمر"], ["feedback", "ملاحظات المنصة"]];

async function login(email) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "123456" }) });
  const c = r.headers.get("set-cookie") || "";
  return c.split(";")[0];
}

async function main() {
  const [adminCookie, teacherCookie] = await Promise.all([login("mona@teachers.ai"), login("sara@teachers.ai")]);

  // Pick sample resource pages: featured ones from a few key sections.
  const samples = [];
  for (const slug of ["multilevel", "literacy", "games", "ai"]) {
    const r = await fetch(`${BASE}/api/resources?section=${slug}`).then((x) => x.json()).catch(() => ({ items: [] }));
    const it = r.items?.find((i) => i.featured) || r.items?.[0];
    if (it) samples.push(it);
  }

  /** @type {{file:string,path:string,title:string,group:string,as?:"admin"|"teacher"}[]} */
  const pages = [
    { file: "home", path: "/", title: "الصفحة الرئيسية العامة", group: "البوابة العامة" },
    { file: "login", path: "/login", title: "تسجيل الدخول", group: "البوابة العامة" },
    { file: "register", path: "/register", title: "إنشاء حساب", group: "البوابة العامة" },
    { file: "dashboard", path: "/dashboard", title: "لوحة المعلمة (الرئيسية)", group: "لوحة المعلمة", as: "teacher" },
    { file: "sections", path: "/dashboard/sections", title: "كل الأقسام", group: "لوحة المعلمة" },
    { file: "search", path: "/dashboard/search?q=" + encodeURIComponent("الحروف"), title: "البحث (مثال: الحروف)", group: "لوحة المعلمة" },
    { file: "saved", path: "/dashboard/saved", title: "محفوظاتي", group: "لوحة المعلمة", as: "teacher" },
    { file: "profile", path: "/dashboard/profile", title: "حسابي ومشاركاتي", group: "لوحة المعلمة", as: "teacher" },
    ...SECTIONS.map(([slug, t]) => ({ file: `section-${slug}`, path: `/dashboard/${slug}`, title: `قسم: ${t}`, group: "الأقسام" })),
    ...samples.map((s) => ({ file: `resource-${s.id}`, path: `/dashboard/${s.section}/${s.id}`, title: `مورد: ${s.title}`, group: "نماذج صفحات الموارد" })),
    { file: "assistant", path: "/dashboard/assistant", title: "مساعد المعلمة الذكي", group: "الأدوات" },
    { file: "prompts", path: "/dashboard/prompts", title: "بنك البرومبتات", group: "الأدوات" },
    { file: "guide", path: "/dashboard/guide", title: "دليل من الحرف إلى الإبداع", group: "الأدوات" },
    { file: "tools", path: "/dashboard/tools", title: "أدوات الحصة", group: "الأدوات", as: "teacher" },
    { file: "apps-public", path: "/dashboard/apps", title: "التطبيقات والموارد (عرض عام)", group: "الأدوات" },
    { file: "forms", path: "/dashboard/forms", title: "الاستمارات (الفهرس)", group: "الاستمارات" },
    ...FORMS.map(([t, n]) => ({ file: `form-${t}`, path: `/dashboard/forms/${t}`, title: n, group: "الاستمارات" })),
    { file: "apps-registry", path: "/dashboard/apps", title: "سجل متابعة التطبيقات (المنسقة)", group: "الإدارة", as: "admin" },
    { file: "manage", path: "/dashboard/manage", title: "لوحة الإدارة (المنسقة)", group: "الإدارة", as: "admin" },
  ];

  // Map internal paths → local files (first match wins; registry vs public share a path).
  const linkMap = new Map();
  for (const p of pages) {
    const key = p.path.split("?")[0];
    if (!linkMap.has(key)) linkMap.set(key, `${p.file}.html`);
  }
  linkMap.set("/dashboard/new", "sections.html");

  const cssCache = new Map();
  async function inlineCss(html) {
    const links = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
    for (const tag of links) {
      const href = tag.match(/href="([^"]+)"/)?.[1];
      if (!href || !href.startsWith("/")) continue;
      if (!cssCache.has(href)) cssCache.set(href, await fetch(BASE + href).then((r) => r.text()).catch(() => ""));
      html = html.replace(tag, `<style>${cssCache.get(href)}</style>`);
    }
    return html;
  }

  function resolveSuspense(html) {
    // Move streamed Suspense content (<div hidden id="S:n">) into its placeholder, since scripts are removed.
    const chunks = new Map();
    for (const m of html.matchAll(/<div hidden id="S:(\d+)">([\s\S]*?)<\/div><script>/g)) chunks.set(m[1], m[2]);
    for (let pass = 0; pass < 5; pass++) {
      html = html.replace(/<!--\$\?--><template id="B:(\d+)"><\/template>[\s\S]*?<!--\/\$-->/g, (all, id) => (chunks.has(id) ? chunks.get(id) : all));
    }
    return html.replace(/<div hidden id="S:\d+">[\s\S]*?<\/div>(?=<script>)/g, "");
  }

  function clean(html, page) {
    html = resolveSuspense(html);
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<script\b[^>]*\/>/g, "");
    html = html.replace(/<link[^>]+rel="(preload|modulepreload|prefetch|dns-prefetch)"[^>]*>/g, "");
    html = html.replace(/<link[^>]+href="\/_next\/[^"]*"[^>]*>/g, "");
    html = html.replace(/<template[^>]*><\/template>/g, "").replace(/<!--\$!?\??-->|<!--\/\$-->/g, "");
    // Rewrite internal links to local copies; unknown internal links become inert.
    html = html.replace(/href="(\/[^"]*)"/g, (all, href) => {
      if (href.startsWith("/_next/")) return all;
      if (href === "/apps.json") return `href="${BASE}/apps.json" data-review-note="live"`;
      const key = href.split("?")[0].split("#")[0];
      const local = linkMap.get(key);
      return local ? `href="${local}"` : `href="#" title="${href.replace(/"/g, "")}" data-review-inert="1"`;
    });
    html = html.replace(/action="\/[^"]*"/g, 'action="#"');
    html = html.replace(/src="\/api\/files\//g, `src="${BASE}/api/files/`);
    const bar = `<div style="position:sticky;top:0;z-index:9999;background:#0a4a37;color:#fff;font:600 13px/1.6 Tahoma,Arial,sans-serif;padding:8px 14px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;direction:rtl" class="no-print">
  <span>📝 نسخة مراجعة ثابتة</span><span style="opacity:.85">${page.title}</span><span style="opacity:.6;direction:ltr">${page.path}</span>
  <span style="opacity:.6">${page.as === "admin" ? "· معروضة كمنسقة" : page.as === "teacher" ? "· معروضة كمعلمة" : "· معروضة كزائرة"}</span>
  <span style="flex:1"></span><span style="opacity:.6">${stamp}</span>
  <a href="../index.html" style="background:#c9a227;color:#0a4a37;padding:3px 10px;border-radius:6px;text-decoration:none">↩ فهرس المراجعة</a>
</div>`;
    html = html.replace(/<body([^>]*)>/, `<body$1>${bar}`);
    html = html.replace(/<title>([\s\S]*?)<\/title>/, `<title>[مراجعة] ${page.title}</title>`);
    return html;
  }

  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(PAGES_DIR, { recursive: true });

  const results = [];
  for (const p of pages) {
    const cookie = p.as === "admin" ? adminCookie : p.as === "teacher" ? teacherCookie : "";
    const res = await fetch(BASE + p.path, { headers: cookie ? { cookie } : {} });
    let html = await res.text();
    html = clean(await inlineCss(html), p);
    await writeFile(path.join(PAGES_DIR, `${p.file}.html`), html, "utf8");
    results.push({ ...p, status: res.status, kb: Math.round(Buffer.byteLength(html) / 1024) });
    console.log(res.status, `${p.file}.html`, `${Math.round(Buffer.byteLength(html) / 1024)}KB`);
  }

  const portal = (await readFile(path.resolve("scripts/review-src/tanmia-portal-corrected.html"), "utf8")).replace("{{PLATFORM_URL}}", "");
  await writeFile(path.join(OUT, "tanmia-portal-corrected.html"), portal, "utf8");

  const groups = [...new Set(results.map((r) => r.group))];
  const index = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>حزمة المراجعة — منصة معلمات مصر · تنمية 2026</title>
<style>
body{font-family:Tahoma,"Segoe UI",Arial,sans-serif;background:#f7faf8;color:#1b2a24;margin:0;line-height:1.7}
.wrap{max-width:980px;margin:0 auto;padding:20px}
header{background:linear-gradient(135deg,#0a4a37,#0f6b4f);color:#fff;padding:26px 0}
h1{margin:0;font-size:24px} .sub{opacity:.9;font-size:14px}
.tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.tools a,.tools button{font:inherit;font-size:13px;font-weight:700;border:0;border-radius:9px;padding:8px 14px;cursor:pointer;text-decoration:none;background:#c9a227;color:#0a4a37}
.tools .ghost{background:rgba(255,255,255,.15);color:#fff}
h2{font-size:17px;color:#0a4a37;margin:26px 0 10px;border-right:5px solid #c9a227;padding-right:10px}
.row{background:#fff;border:1px solid #dde7e2;border-radius:12px;padding:12px 14px;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start}
.row.done{background:#f0faf5;border-color:#a7dcc4}
.row a{color:#0f6b4f;font-weight:700;text-decoration:none} .meta{font-size:11px;color:#7a8a83;direction:ltr;text-align:right}
textarea{width:100%;box-sizing:border-box;border:1px solid #dde7e2;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px;min-height:34px;resize:vertical;margin-top:6px}
.chk{width:20px;height:20px;accent-color:#0f6b4f;margin-top:4px}
.badge{font-size:11px;padding:2px 8px;border-radius:99px;background:#eef2f0;color:#5b6b64;white-space:nowrap}
.note{background:#fff8e1;border:1px solid #f0e2b8;border-radius:12px;padding:12px 14px;font-size:13px;color:#7a5c00}
.progress{height:8px;background:rgba(255,255,255,.2);border-radius:99px;overflow:hidden;margin-top:12px}.progress i{display:block;height:100%;background:#c9a227;width:0}
</style></head><body>
<header><div class="wrap"><h1>📦 حزمة المراجعة — منصة معلمات مصر · تنمية 2026</h1>
<div class="sub">${results.length} صفحة HTML ثابتة · أُنشئت ${stamp}</div>
<div class="progress"><i id="bar"></i></div><div class="sub" id="prog"></div>
<div class="tools"><button onclick="exportNotes()">⬇ تصدير ملاحظات المراجعة (TXT)</button><a class="ghost" href="tanmia-portal-corrected.html">🌐 صفحة «تنمية 2026» المستقلة (مصحَّحة)</a><a class="ghost" href="tanmia-review.zip">🗜️ تنزيل الحزمة ZIP</a><button class="ghost" onclick="if(confirm('مسح كل علامات وملاحظات المراجعة من هذا المتصفح؟')){localStorage.removeItem(K);location.reload()}">↺ مسح الملاحظات</button></div>
</div></header>
<div class="wrap">
<div class="note">🔎 <b>طريقة المراجعة:</b> افتحي كل صفحة، وراجعي النصوص والتنسيق والصور، ثم اكتبي ما يحتاج تصحيحاً في خانة الملاحظة وعلّمي «✔ تمت المراجعة». الملاحظات تُحفظ في هذا المتصفح، واضغطي «تصدير الملاحظات» لإرسالها.<br>
⚠️ هذه نسخ <b>ثابتة للمراجعة البصرية</b>: الأزرار والنماذج والقوائم المنبثقة لا تعمل فيها، والروابط بين الصفحات تفتح النسخ المحلية. للتجربة التفاعلية افتحي المنصة نفسها.</div>
${groups
  .map(
    (g) => `<h2>${g}</h2>` +
      results
        .filter((r) => r.group === g)
        .map(
          (r) => `<div class="row" data-id="${r.file}"><input type="checkbox" class="chk" title="تمت المراجعة">
<div><a href="pages/${r.file}.html" target="_blank">${r.title}</a> <span class="badge">${r.as === "admin" ? "منسقة" : r.as === "teacher" ? "معلمة" : "زائرة"}</span><div class="meta">${r.path} · ${r.kb}KB${r.status !== 200 ? " · HTTP " + r.status : ""}</div>
<textarea placeholder="ملاحظات التصحيح لهذه الصفحة..."></textarea></div><span class="meta">${r.file}.html</span></div>`,
        )
        .join(""),
  )
  .join("")}
<h2>صفحات إضافية</h2>
<div class="row" data-id="portal"><input type="checkbox" class="chk"><div><a href="tanmia-portal-corrected.html" target="_blank">صفحة «تنمية 2026» المستقلة — نسخة مصحَّحة</a> <span class="badge">مستقلة</span>
<div class="meta">بدون حذف · بدون Supabase · تقرأ apps.json من المنصة بعد ضبط PLATFORM_URL</div><textarea placeholder="ملاحظات..."></textarea></div><span class="meta">tanmia-portal-corrected.html</span></div>
</div>
<script>
const K="tanmia_review_notes_v1";
const S=JSON.parse(localStorage.getItem(K)||"{}");
const rows=[...document.querySelectorAll(".row")];
function save(){localStorage.setItem(K,JSON.stringify(S));prog()}
function prog(){const d=rows.filter(r=>S[r.dataset.id]?.done).length;document.getElementById("bar").style.width=(d/rows.length*100)+"%";document.getElementById("prog").textContent="تمت مراجعة "+d+" من "+rows.length}
rows.forEach(r=>{const id=r.dataset.id,c=r.querySelector(".chk"),t=r.querySelector("textarea");const s=S[id]||{};c.checked=!!s.done;t.value=s.note||"";r.classList.toggle("done",c.checked);
c.onchange=()=>{S[id]={...(S[id]||{}),done:c.checked};r.classList.toggle("done",c.checked);save()};t.oninput=()=>{S[id]={...(S[id]||{}),note:t.value};save()}});
prog();
function exportNotes(){let out="ملاحظات مراجعة منصة معلمات مصر — تنمية 2026\\nتاريخ التصدير: "+new Date().toLocaleString("ar-EG")+"\\n\\n";
rows.forEach(r=>{const s=S[r.dataset.id]||{};const title=r.querySelector("a").textContent;out+=(s.done?"✔ ":"○ ")+title+"\\n"+(s.note?"   ملاحظة: "+s.note.replace(/\\n/g,"\\n   ")+"\\n":"")+"\\n"});
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\\ufeff"+out],{type:"text/plain;charset=utf-8"}));a.download="ملاحظات-المراجعة.txt";a.click()}
</script></body></html>`;
  await writeFile(path.join(OUT, "index.html"), index, "utf8");
  console.log(`\n✔ ${results.length} pages → review-bundle/  (served at /review/, coordinator only)`);
  const bad = results.filter((r) => r.status !== 200);
  if (bad.length) console.log("Non-200:", bad.map((b) => `${b.file}:${b.status}`).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
