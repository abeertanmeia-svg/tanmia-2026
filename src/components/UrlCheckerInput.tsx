"use client";

import { useEffect, useRef, useState } from "react";
import { detectLinkProvider, validateExternalUrl, type LinkCheckResult } from "@/lib/links";

const STYLES: Record<string, string> = {
  valid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
  checking: "bg-slate-50 text-slate-600 border-slate-200",
};
const ICONS: Record<string, string> = { valid: "✅", warning: "⚠️", error: "⛔", checking: "⏳" };

/**
 * External-link input with an instant format check, an automatic server-side
 * reachability check (private Drive / dead link detection), a provider badge,
 * and a one-click fix for edit links.
 */
export function UrlCheckerInput({
  url,
  onChange,
  label = "رابط المورد الخارجي (Drive / Canva / Video)",
  className = "",
  inputClassName = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100",
}: {
  url: string;
  onChange: (val: string) => void;
  label?: string | null;
  className?: string;
  inputClassName?: string;
}) {
  const [result, setResult] = useState<LinkCheckResult>({ status: "idle", message: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  async function runCheck(value: string) {
    const v = value.trim();
    if (!v) return setResult({ status: "idle", message: "" });
    const local = validateExternalUrl(v);
    if (local.status === "error") return setResult(local);
    const id = ++seq.current;
    setResult({ status: "checking", message: "جارٍ فحص الرابط..." });
    try {
      const res = await fetch(`/api/link-check?url=${encodeURIComponent(v)}`, { cache: "no-store" });
      const data = (await res.json()) as LinkCheckResult;
      if (id === seq.current) setResult(res.status === 401 ? local : data);
    } catch {
      if (id === seq.current) setResult(local);
    }
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!url.trim()) {
      setResult({ status: "idle", message: "" });
      return;
    }
    timer.current = setTimeout(() => runCheck(url), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [url]);

  const provider = /^https?:\/\//i.test(url.trim()) ? detectLinkProvider(url) : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-bold text-slate-700">{label}</label>}
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => onChange(e.target.value)} placeholder="https://drive.google.com/..." className={`${inputClassName} flex-1 text-left`} dir="ltr" />
        <button
          type="button"
          onClick={() => runCheck(url)}
          disabled={result.status === "checking" || !url.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {result.status === "checking" ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" /> : "🔎"}
          فحص الرابط
        </button>
      </div>
      {provider && (
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${provider.badgeColor}`}>
          {provider.icon} {provider.label}
        </span>
      )}
      {result.status !== "idle" && (
        <div className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs font-medium ${STYLES[result.status]}`}>
          <span className="shrink-0">{ICONS[result.status]}</span>
          <span className="flex-1 leading-relaxed">{result.message}</span>
          {result.fixedUrl && result.fixedUrl !== url.trim() && (
            <button type="button" onClick={() => onChange(result.fixedUrl!)} className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-amber-800 shadow-sm hover:bg-amber-100">
              🔧 إصلاح تلقائي
            </button>
          )}
        </div>
      )}
    </div>
  );
}
