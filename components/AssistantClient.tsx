"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ASSISTANT_TASKS, extractHtml, getTask } from "@/lib/assistant";
import { getSection, SCHOOL_SUBJECTS } from "@/lib/sections";
import { Markdown } from "./Markdown";
import { useToast } from "./Toast";
import { whatsappUrl } from "./WhatsAppShare";

type Result = { content: string; provider: "gemini" | "openai" | "offline"; section: string; warning?: string };

const EXAMPLES: Record<string, string> = {
  lesson: "درس الحروف المتشابهة في الصوت (س، ص) مع نشاط حسي وتمارين لطلاب متفاوتي المستوى",
  worksheet: "ورقة عمل عن جمع عددين ضمن 20 بثلاثة مستويات",
  game: "لعبة لمراجعة جدول الضرب 2 و3 بدون أدوات",
  aid: "وسيلة لتعليم الكسور من خامات البيئة",
  remedial: "طفلة في الصف الثالث لا تميز الحروف المتشابهة شكلاً (ب ت ث) وتخلط بين الحركات",
  assess: "تقييم تشخيصي سريع لمهارات القراءة لمتعلمات جدد",
  multilevel: "حصة لغة عربية لفصل فيه 3 مستويات: مبتدئات، وسط، متقدمات (25 متعلمة)",
  learnai: "كيف أستخدم ChatGPT لتوليد قصة قصيرة مصورة لأطفالي؟",
  multigrade: "درس عن الماء ومصادره لفصل يضم الصفوف من الأول إلى السادس",
  curriculum: "توزيع منهج اللغة العربية للصف الثالث الابتدائي على الفصل الدراسي الأول",
  monthly: "اختبار شهر أكتوبر في الرياضيات للصف الثاني: الجمع والطرح ضمن 100",
  parents: "رسالة تخبرهم أننا بدأنا برنامج علاج القراءة وأحتاج دعمهم بقراءة 10 دقائق يومياً",
  htmlgame: "لعبة اختيار من متعدد لمراجعة الجمع والطرح ضمن 20 مع مؤثرات صوتية وثلاثة مستويات",
  other: "",
};

/** Extract the "رسالة لأولياء الأمور" section (or the whole text for the parents task). */
function parentMessage(content: string): string | null {
  const m = content.match(/##\s*رسالة\s*(?:ل|إلى\s*)?أولياء\s*الأمور[^\n]*\n([\s\S]*?)(?=\n##\s|$)/);
  if (m) return m[1].replace(/\*\*/g, "").trim();
  if (!content.includes("##") && content.length < 1500) return content.trim();
  return null;
}

export function AssistantClient({ loggedIn, aiEnabled }: { loggedIn: boolean; aiEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [task, setTask] = useState(() => getTask(searchParams.get("task") ?? "") ?? ASSISTANT_TASKS[0]);
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const html = result ? extractHtml(result.content) : null;
  const htmlUrl = useMemo(() => (html ? URL.createObjectURL(new Blob([html], { type: "text/html" })) : null), [html]);
  useEffect(() => () => { if (htmlUrl) URL.revokeObjectURL(htmlUrl); }, [htmlUrl]);

  async function generate() {
    setError(null);
    if (details.trim().length < 5) {
      setError("اكتبي تفاصيل طلبك أولاً (5 أحرف على الأقل)");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.id, grade, subject, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "تعذر تنفيذ الطلب الآن.");
      } else {
        setResult(data);
        setTimeout(() => document.getElementById("assistant-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      toast.success("تم النسخ");
    } catch {
      toast.error("تعذر النسخ تلقائياً. حددي النص وانسخيه يدوياً.");
    }
  }

  function print() {
    const el = document.getElementById("assistant-result-body");
    if (!el) return;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${task.title}</title>
<style>body{font-family:Tahoma,Arial,sans-serif;line-height:1.9;padding:32px;color:#111}h2{font-size:18px;margin:20px 0 6px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 10px;text-align:right}ul,ol{padding-right:24px}</style>
</head><body><h1 style="font-size:22px">${task.title}${subject ? " — " + subject : ""}${grade ? " (" + grade + ")" : ""}</h1>${el.innerHTML}
<p style="margin-top:30px;font-size:12px;color:#666">مبادرة معلمات مبدعات بالذكاء الاصطناعي – التعليم المجتمعي</p></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  function downloadHtml() {
    if (!html) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${(subject || task.title).replace(/\s+/g, "-")}.html`;
    a.click();
  }

  async function saveToLibrary() {
    if (!result) return;
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/dashboard/assistant")}`);
      return;
    }
    setSaving(true);
    const section = getSection(result.section)!;
    const title = `${task.title}: ${details.trim().slice(0, 80)}`;
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: section.slug,
        title,
        summary: `${subject ? subject + " · " : ""}${grade ? grade + " · " : ""}أُعدّ بمساعد المعلمة الذكي`,
        content: html
          ? `## لعبة تفاعلية\nافتحي المرفق 🕹️ أدناه واضغطي "تشغيل هنا" للعب مباشرة في المتصفح، أو نزّليه لتشغيله بدون إنترنت.\n\n**الطلب:** ${details.trim()}`
          : result.content,
        level: section.levelOptions[0],
        subject: SCHOOL_SUBJECTS.find((x) => subject && (x.includes(subject.trim()) || subject.includes(x.replace(/^ال/, "")))) ?? "",
        tags: [task.title, subject, grade].filter(Boolean),
        aiTool: result.provider === "gemini" ? "Gemini" : result.provider === "openai" ? "ChatGPT" : "بدون أداة",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "تعذر الحفظ");
      return;
    }
    if (html) {
      const fd = new FormData();
      fd.append("file", new File([html], `${(subject || details.slice(0, 30) || "لعبة").replace(/[\\/:*?"<>|]/g, "")}.html`, { type: "text/html" }));
      await fetch(`/api/resources/${data.item.id}/attachments`, { method: "POST", body: fd });
    }
    toast.success("تم الحفظ في المكتبة");
    router.push(`/dashboard/${section.slug}/${data.item.id}`);
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="animate-fade-up space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl md:p-8">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">✨ مجاني · متاح للجميع دون تسجيل</span>
        <h1 className="mt-3 text-2xl font-extrabold md:text-3xl">مساعد المعلمة الذكي</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
          أفكار عملية وتحضيرات وأنشطة وألعاب وخطط علاجية بخطوات واضحة تناسب فصول التعليم المجتمعي متعددة المستويات — ثم احفظيها في المكتبة بنقرة لتستفيد زميلاتك.
        </p>
        {!aiEnabled && (
          <p className="mt-3 inline-block rounded-xl bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-100">
            ⚠️ وضع القوالب: التوليد الذكي الكامل يُفعَّل بإضافة مفتاح GEMINI_API_KEY في إعدادات المنصة.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">1. اختاري نوع المساعدة</h2>
            <p className="text-xs text-slate-500">حددي ما تريدين إعداده اليوم.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ASSISTANT_TASKS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTask(t)}
                  className={`rounded-2xl border p-3 text-right transition ${
                    task.id === t.id ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="mt-1 text-sm font-bold text-slate-900">{t.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{t.hint}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">2. اكتبي تفاصيل طلبك</h2>
            <p className="text-xs text-slate-500">كلما كان الطلب أوضح كانت النتيجة أقرب لما تحتاجينه.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="الصف / المستوى — مثال: الثاني الابتدائي" className={input} />
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="المادة أو المجال — مثال: اللغة العربية" className={input} />
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 6000))}
              rows={5}
              placeholder={EXAMPLES[task.id] ? `مثال: ${EXAMPLES[task.id]}` : "اكتبي ما تحتاجينه بالتفصيل..."}
              className={`${input} mt-3 resize-y`}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>{details.length} / 6000 حرف</span>
              {EXAMPLES[task.id] && !details && (
                <button onClick={() => setDetails(EXAMPLES[task.id])} className="font-semibold text-indigo-600 hover:underline">
                  استخدمي المثال
                </button>
              )}
            </div>
            {error && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
            <button
              onClick={generate}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> جارٍ إعداد طلبك...
                </>
              ) : (
                <>✨ أنشئي المحتوى</>
              )}
            </button>
          </section>
        </div>

        <section id="assistant-result" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          {!result && !loading && (
            <div className="grid h-full min-h-[320px] place-items-center text-center">
              <div>
                <p className="text-5xl">🪄</p>
                <p className="mt-3 font-bold text-slate-900">النتيجة ستظهر هنا</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">اختاري نوع المساعدة واكتبي طلبك ثم اضغطي "أنشئي المحتوى".</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-1/2 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-200" />
              <div className="h-4 w-5/6 rounded bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-24 w-full rounded-xl bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-200" />
            </div>
          )}
          {result && !loading && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-bold text-slate-900">النتيجة جاهزة ✅</h2>
                  <p className="text-[11px] text-slate-500">
                    {result.provider === "offline" ? "قالب منظّم" : `مولَّد بـ ${result.provider === "gemini" ? "Gemini" : "OpenAI"}`} · {task.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copy} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">📋 نسخ</button>
                  <button onClick={print} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">🖨️ طباعة</button>
                  {!html && (
                    <a href={whatsappUrl(parentMessage(result.content) ?? result.content.slice(0, 3500))} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                      🟢 {parentMessage(result.content) ? "إرسال رسالة الأهل عبر واتساب" : "إرسال عبر واتساب"}
                    </a>
                  )}
                  <button onClick={saveToLibrary} disabled={saving} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? "جارٍ الحفظ..." : loggedIn ? "💾 حفظ في المكتبة" : "💾 سجّلي الدخول للحفظ"}
                  </button>
                </div>
              </div>
              {result.warning && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">{result.warning}</p>}
              {html && htmlUrl ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm">
                    <span className="font-semibold text-indigo-800">🕹️ معاينة حية للعبة — جرّبيها الآن</span>
                    <div className="flex gap-2">
                      <a href={htmlUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">فتح بملء الشاشة ↗</a>
                      <button onClick={downloadHtml} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">⬇ تنزيل HTML</button>
                    </div>
                  </div>
                  <iframe src={htmlUrl} title="معاينة اللعبة" sandbox="allow-scripts allow-forms allow-modals allow-popups" className="h-[65vh] w-full rounded-2xl border border-slate-200 bg-white" />
                  <details className="rounded-xl border border-slate-200">
                    <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-600">عرض كود HTML</summary>
                    <pre dir="ltr" className="max-h-72 overflow-auto bg-slate-900 p-4 text-left text-[11px] leading-relaxed text-slate-100">{html}</pre>
                  </details>
                </div>
              ) : (
                <div id="assistant-result-body" className="mt-4">
                  <Markdown content={result.content} />
                </div>
              )}
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
                راجعي المحتوى وملاءمته لطلابك قبل استخدامه. لا ترفعي أسماء الأطفال أو صورهم إلى أدوات الذكاء الاصطناعي.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
