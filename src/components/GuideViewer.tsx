"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GUIDE, GUIDE_SUBTITLE, GUIDE_TITLE } from "@/lib/guide";
import { Markdown } from "./Markdown";
import { WhatsAppShare } from "./WhatsAppShare";

export function GuideViewer() {
  const [idx, setIdx] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [printAll, setPrintAll] = useState(false);
  const ch = GUIDE[idx];

  const go = useCallback((n: number) => {
    setIdx(Math.max(0, Math.min(GUIDE.length - 1, n)));
    setShowToc(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fromHash = GUIDE.findIndex((c) => `#${c.id}` === window.location.hash);
    if (fromHash >= 0) setIdx(fromHash);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", `#${ch.id}`);
  }, [ch.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") go(idx + 1); // RTL: left = next
      if (e.key === "ArrowRight") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, go]);

  useEffect(() => {
    if (!printAll) return;
    const t = setTimeout(() => {
      window.print();
      setPrintAll(false);
    }, 300);
    return () => clearTimeout(t);
  }, [printAll]);

  const toc = (
    <ol className="space-y-1">
      {GUIDE.map((c, i) => {
        const newPart = i === 0 || GUIDE[i - 1].part !== c.part;
        return (
          <li key={c.id}>
            {newPart && <p className="px-2 pb-1 pt-3 text-[11px] font-bold text-slate-400">{c.part}</p>}
            <button
              onClick={() => go(i)}
              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-sm transition ${
                i === idx ? "bg-rose-50 font-bold text-rose-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
              <span>{c.icon}</span>
              <span className="flex-1">{c.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  if (printAll) {
    return (
      <div className="space-y-10 bg-white p-6">
        <h1 className="text-3xl font-extrabold">{GUIDE_TITLE}</h1>
        <p className="text-slate-600">{GUIDE_SUBTITLE}</p>
        {GUIDE.map((c, i) => (
          <section key={c.id} style={{ breakBefore: i ? "page" : "auto" }}>
            <h2 className="mb-2 text-2xl font-bold">
              {i + 1}. {c.icon} {c.title}
            </h2>
            <Markdown content={c.content} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-rose-500 via-orange-400 to-amber-400 p-6 text-white shadow-xl md:p-8">
        <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-bold">🌱 حروفنا نور · دليل تطبيقي</span>
        <h1 className="mt-3 text-2xl font-extrabold leading-snug md:text-3xl">{GUIDE_TITLE}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/95">{GUIDE_SUBTITLE}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setPrintAll(true)} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">
            🖨️ طباعة الدليل كاملاً / حفظ PDF
          </button>
          <Link href="/dashboard/assistant" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">
            ✨ ولّدي خطة علاجية بالمساعد
          </Link>
          <WhatsAppShare text={`📘 ${GUIDE_TITLE}`} path="/dashboard/guide" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:block">{toc}</aside>

        <div className="space-y-4">
          <button
            onClick={() => setShowToc((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 lg:hidden"
          >
            <span>📑 فهرس الدليل ({idx + 1} / {GUIDE.length})</span>
            <span>{showToc ? "▴" : "▾"}</span>
          </button>
          {showToc && <div className="rounded-3xl border border-slate-200 bg-white p-3 lg:hidden">{toc}</div>}

          <article key={ch.id} className="animate-fade-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-slate-100">
              <div className="h-full bg-gradient-to-l from-rose-500 to-amber-400 transition-all" style={{ width: `${((idx + 1) / GUIDE.length) * 100}%` }} />
            </div>
            <div className="border-b border-slate-100 px-6 py-5 md:px-8">
              <p className="text-xs font-bold text-rose-600">
                {ch.part} · {idx + 1} من {GUIDE.length}
              </p>
              <h2 className="mt-1 flex items-center gap-3 text-2xl font-extrabold text-slate-900">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-2xl">{ch.icon}</span>
                {ch.title}
              </h2>
            </div>
            <div className="px-6 py-5 md:px-8">
              <Markdown content={ch.content} />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 md:px-8">
              <button
                onClick={() => go(idx - 1)}
                disabled={idx === 0}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                → السابق
              </button>
              <span className="hidden text-xs text-slate-400 sm:block">استخدمي أسهم لوحة المفاتيح للتنقل</span>
              <button
                onClick={() => go(idx + 1)}
                disabled={idx === GUIDE.length - 1}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                التالي ←
              </button>
            </div>
          </article>

          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">
            💡 لديك نسخة العرض المصوّرة (الشرائح)؟ من Claude: <b>Export ← PDF</b>، ثم ارفعيها كمرفق في قسم{" "}
            <Link href="/dashboard/literacy" className="font-bold text-rose-600 hover:underline">علاج ضعف القراءة والكتابة</Link> ليتمكن الجميع من تنزيلها.
          </p>
        </div>
      </div>
    </div>
  );
}
