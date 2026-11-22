"use client";

import Link from "next/link";
import { useState } from "react";
import { PROMPT_CATEGORIES, PROMPTS } from "@/lib/prompts";
import { useToast } from "./Toast";

export function PromptBank() {
  const toast = useToast();
  const [cat, setCat] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const list = PROMPTS.filter((p) => !cat || p.category === cat);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("تعذر النسخ تلقائياً، حددي النص وانسخيه يدوياً");
    }
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="rounded-3xl bg-gradient-to-l from-fuchsia-600 to-indigo-600 p-6 text-white shadow-xl">
        <h1 className="text-2xl font-extrabold">🧠 بنك البرومبتات</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/90">
          أوامر جاهزة لأدوات الذكاء الاصطناعي المجانية. انسخي الأمر، واستبدلي ما بين [الأقواس]، والصقيه في ChatGPT أو Gemini، أو جرّبيه مباشرة في مساعد المنصة.
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {["", ...PROMPT_CATEGORIES].map((c) => (
          <button
            key={c || "all"}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${cat === c ? "border-fuchsia-700 bg-fuchsia-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {c || "الكل"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-bold text-fuchsia-700">{p.category}</span>
                <h2 className="mt-2 font-bold text-slate-900">{p.title}</h2>
                <p className="text-[11px] text-slate-400">الأداة: {p.use}</p>
              </div>
            </div>
            <p className={`mt-3 flex-1 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ${/^[A-Za-z]/.test(p.text) ? "text-left" : ""}`} dir={/^[A-Za-z]/.test(p.text) ? "ltr" : "rtl"}>
              {p.text.split(/(\[[^\]]+\])/g).map((part, i) =>
                part.startsWith("[") ? <mark key={i} className="rounded bg-amber-100 px-0.5 text-amber-800">{part}</mark> : <span key={i}>{part}</span>,
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy(p.id, p.text)} className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${copied === p.id ? "bg-emerald-600" : "bg-fuchsia-600 hover:bg-fuchsia-700"}`}>
                {copied === p.id ? "✓ تم النسخ" : "📋 نسخ الأمر"}
              </button>
              {p.task && (
                <Link href={`/dashboard/assistant?task=${p.task}`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  ✨ جرّبيه في مساعد المنصة
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
