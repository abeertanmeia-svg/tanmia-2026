"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ResourceDTO } from "@/lib/resources";
import { FILE_TYPES, GRADE_GROUPS, MAX_FILE_BYTES, SCHOOL_SUBJECTS, type FileTypeKey, type SectionConfig } from "@/lib/sections";
import { detectLinkProvider } from "@/lib/links";
import { UrlCheckerInput } from "./UrlCheckerInput";

/**
 * One-step "add a file to this section" flow: choose type, title, optional
 * description, then a file from the device or a link. Creates the resource and
 * uploads the attachment with progress.
 */
function linkLabel(u: string) {
  return detectLinkProvider(u).label;
}

export function QuickAddModal({
  section,
  onClose,
  onCreated,
}: {
  section: SectionConfig;
  onClose: () => void;
  onCreated: (item: ResourceDTO, pending: boolean) => void;
}) {
  const [type, setType] = useState<FileTypeKey>("pdf");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeGroup, setGradeGroup] = useState("");
  const [extraUrl, setExtraUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = FILE_TYPES.find((t) => t.key === type)!;
  const effectiveSource = type === "link" ? "link" : source;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && progress === null && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, progress]);

  function pickFile(f: File | null) {
    setFile(f);
    setError(null);
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    if (f && f.size > MAX_FILE_BYTES) setError("حجم الملف أكبر من 25 ميجابايت — استخدمي رابطاً بدلاً منه.");
  }

  function upload(resourceId: number): Promise<string | null> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/resources/${resourceId}/attachments`);
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(null);
        else {
          try {
            resolve(JSON.parse(xhr.responseText).error ?? "فشل رفع الملف");
          } catch {
            resolve("فشل رفع الملف");
          }
        }
      };
      xhr.onerror = () => resolve("تعذر الاتصال بالخادم");
      const fd = new FormData();
      fd.append("file", file!);
      xhr.send(fd);
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError("اكتبي عنواناً واضحاً (3 أحرف على الأقل).");
    if (effectiveSource === "file" && !file) return setError("اختاري ملفاً من جهازك.");
    if (effectiveSource === "file" && file && file.size > MAX_FILE_BYTES) return setError("حجم الملف أكبر من 25 ميجابايت.");
    if (effectiveSource === "link" && !/^https?:\/\//i.test(url.trim())) return setError("الرابط يجب أن يبدأ بـ http:// أو https://");
    if (extraUrl.trim() && !/^https?:\/\//i.test(extraUrl.trim())) return setError("الرابط الخارجي الإضافي يجب أن يبدأ بـ http:// أو https://");

    setProgress(0);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: section.slug,
        title: title.trim(),
        summary: summary.trim(),
        content: "",
        level: section.levelOptions[0],
        subject,
        gradeGroup,
        tags: [meta.label, subject].filter(Boolean),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProgress(null);
      return setError(data.error ?? "تعذر الحفظ");
    }
    const id: number = data.item.id;

    let err: string | null = null;
    if (effectiveSource === "file") err = await upload(id);
    else {
      const r = await fetch(`/api/resources/${id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), name: title.trim() }),
      });
      if (!r.ok) err = (await r.json().catch(() => ({}))).error ?? "تعذر إضافة الرابط";
    }
    if (!err && extraUrl.trim() && effectiveSource === "file") {
      await fetch(`/api/resources/${id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extraUrl.trim(), name: linkLabel(extraUrl.trim()) }),
      });
    }
    if (err) {
      // Roll back the empty resource so the section doesn't show a broken card.
      await fetch(`/api/resources/${id}`, { method: "DELETE" });
      setProgress(null);
      return setError(err);
    }
    const fresh = await fetch(`/api/resources/${id}`).then((r) => r.json()).catch(() => null);
    onCreated(fresh?.item ?? data.item, (fresh?.item ?? data.item).status === "pending");
  }

  const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100";
  const chip = (on: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={() => progress === null && onClose()} />
      <form onSubmit={submit} className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-fade-up sm:rounded-3xl">
        <h2 className="text-xl font-extrabold text-slate-900">إضافة إلى «{section.short}»</h2>
        <p className="mt-1 text-sm text-slate-500">ستظهر المادة لكل المعلمات في هذا القسم.</p>

        <p className="mb-2 mt-5 text-sm font-bold text-slate-700">نوع المادة</p>
        <div className="flex flex-wrap gap-2">
          {FILE_TYPES.map((t) => (
            <button key={t.key} type="button" onClick={() => { setType(t.key); setFile(null); }} className={chip(type === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <label className="mb-1 mt-5 block text-sm font-bold text-slate-700">العنوان</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} autoFocus />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">المادة الدراسية</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={input}>
              <option value="">— اختياري —</option>
              {SCHOOL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">المرحلة</label>
            <select value={gradeGroup} onChange={(e) => setGradeGroup(e.target.value)} className={input}>
              <option value="">— اختياري —</option>
              {GRADE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="mb-1 mt-4 block text-sm font-bold text-slate-700">وصف قصير (اختياري)</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={`${input} resize-y`} />

        {type !== "link" && (
          <>
            <p className="mb-2 mt-4 text-sm font-bold text-slate-700">مصدر المادة</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSource("file")} className={chip(source === "file")}>ملف من جهازك</button>
              <button type="button" onClick={() => setSource("link")} className={chip(source === "link")}>رابط</button>
            </div>
          </>
        )}

        {effectiveSource === "file" ? (
          <>
            <label className="mb-1 mt-4 block text-sm font-bold text-slate-700">الملف</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm hover:border-teal-400">
              <span className="text-2xl">{meta.icon}</span>
              <span className="min-w-0 flex-1 truncate text-slate-600">{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} م.ب)` : "اضغطي لاختيار ملف"}</span>
              <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">اختيار ملف</span>
              <input type="file" accept={meta.accept} className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </label>
          </>
        ) : (
          <>
            <UrlCheckerInput url={url} onChange={setUrl} label="الرابط" className="mt-4" />
          </>
        )}
        <p className="mt-1.5 text-xs text-slate-500">{effectiveSource === "link" ? "رابط Google Drive أو Canva أو يوتيوب أو أي موقع." : meta.hint}</p>

        {effectiveSource === "file" && (
          <>
            <UrlCheckerInput url={extraUrl} onChange={setExtraUrl} label="رابط المورد الخارجي (Drive / Canva / Video) — اختياري" className="mt-4" />
            <p className="mt-1 text-xs text-slate-500">مثلاً: النسخة القابلة للتعديل على Canva، أو فيديو شرح الدرس.</p>
          </>
        )}

        {progress !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-600">
              <span>جارٍ الرفع...</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button type="submit" disabled={progress !== null} className="flex-1 rounded-xl bg-teal-700 px-5 py-3 text-base font-bold text-white hover:bg-teal-800 disabled:opacity-60">
            {progress !== null ? "جارٍ الحفظ..." : "حفظ المادة"}
          </button>
          <button type="button" onClick={onClose} disabled={progress !== null} className="rounded-xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
