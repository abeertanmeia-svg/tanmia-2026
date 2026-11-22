"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ResourceDTO } from "@/lib/resources";
import { ACCEPT_ATTR, AI_TOOLS, GRADE_GROUPS, SCHOOL_SUBJECTS, type SectionConfig } from "@/lib/sections";
import { UrlCheckerInput } from "./UrlCheckerInput";

export type ResourceFormValues = {
  title: string;
  summary: string;
  content: string;
  level: string;
  subject: string;
  gradeGroup: string;
  tags: string;
  aiTool: string;
  featured: boolean;
  files: File[];
  linkUrl: string;
};

export function ResourceFormModal({
  section,
  initial,
  onClose,
  onSubmit,
  canFeature,
}: {
  section: SectionConfig;
  initial?: ResourceDTO | null;
  onClose: () => void;
  onSubmit: (values: ResourceFormValues) => Promise<string | null>;
  canFeature: boolean;
}) {
  const [values, setValues] = useState<ResourceFormValues>({
    title: initial?.title ?? "",
    summary: initial?.summary ?? "",
    content: initial?.content ?? "",
    level: initial?.level ?? section.levelOptions[0],
    subject: initial?.subject ?? "",
    gradeGroup: initial?.gradeGroup ?? "",
    tags: initial?.tags.join(", ") ?? "",
    aiTool: initial?.aiTool ?? "بدون أداة",
    featured: initial?.featured ?? false,
    files: [],
    linkUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.title.trim().length < 3) {
      setError("العنوان يجب أن يكون 3 أحرف على الأقل");
      return;
    }
    setSaving(true);
    const err = await onSubmit(values);
    setSaving(false);
    if (err) setError(err);
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
  const label = "mb-1 block text-sm font-semibold text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-fade-up sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initial ? `تعديل ${section.itemLabel}` : `إضافة ${section.itemLabel} جديد`}
            </h2>
            <p className="text-xs text-slate-500">
              {section.icon} {section.name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className={label}>العنوان *</label>
            <input
              className={input}
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              placeholder={`عنوان ${section.itemLabel}`}
              autoFocus
            />
          </div>
          <div>
            <label className={label}>وصف مختصر</label>
            <textarea
              className={`${input} min-h-[70px]`}
              value={values.summary}
              onChange={(e) => setValues({ ...values, summary: e.target.value })}
              placeholder="سطر أو سطران يلخصان المحتوى"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>{section.levelLabel}</label>
              <select className={input} value={values.level} onChange={(e) => setValues({ ...values, level: e.target.value })}>
                {section.levelOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>أداة الذكاء الاصطناعي المستخدمة</label>
              <select className={input} value={values.aiTool} onChange={(e) => setValues({ ...values, aiTool: e.target.value })}>
                {AI_TOOLS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>المادة الدراسية</label>
              <select className={input} value={values.subject} onChange={(e) => setValues({ ...values, subject: e.target.value })}>
                <option value="">— غير محددة —</option>
                {SCHOOL_SUBJECTS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>المرحلة الدراسية</label>
              <select className={input} value={values.gradeGroup} onChange={(e) => setValues({ ...values, gradeGroup: e.target.value })}>
                <option value="">— غير محددة —</option>
                {GRADE_GROUPS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <UrlCheckerInput url={values.linkUrl} onChange={(v) => setValues({ ...values, linkUrl: v })} inputClassName={input} />
            </div>
          </div>
          <div>
            <label className={label}>الوسوم (مفصولة بفاصلة)</label>
            <input
              className={input}
              value={values.tags}
              onChange={(e) => setValues({ ...values, tags: e.target.value })}
              placeholder="رياضيات, تعلم نشط, تقويم"
            />
          </div>
          <div>
            <label className={label}>المحتوى التفصيلي</label>
            <textarea
              className={`${input} min-h-[220px] font-[inherit] leading-relaxed`}
              value={values.content}
              onChange={(e) => setValues({ ...values, content: e.target.value })}
              placeholder={"## الأهداف\n- ...\n\n## الخطوات\n1. ...\n2. ..."}
            />
            <p className="mt-1 text-[11px] text-slate-400">يمكنك استخدام ## للعناوين، و- للقوائم، و**نص** للتأكيد، والجداول بعلامة |.</p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">📎 المرفقات (صور، فيديو، PDF، Word، PowerPoint، ألعاب HTML تفاعلية)</p>
            <input
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              onChange={(e) => setValues({ ...values, files: [...values.files, ...Array.from(e.target.files ?? [])] })}
              className="mt-2 block w-full text-xs text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-indigo-700"
            />
            {values.files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {values.files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs">
                    <span className="truncate">{f.name} <span className="text-slate-400">({(f.size / 1024 / 1024).toFixed(1)} م.ب)</span></span>
                    <button type="button" onClick={() => setValues({ ...values, files: values.files.filter((_, j) => j !== i) })} className="text-rose-600">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-1 text-[11px] text-slate-400">الحد 25 م.ب للملف الواحد. للفيديوهات الكبيرة استخدمي رابط يوتيوب. يمكنك إضافة المزيد لاحقاً من صفحة المورد.</p>
          </div>
          {canFeature && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => setValues({ ...values, featured: e.target.checked })}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              ⭐ تثبيت كمورد مميز
            </label>
          )}
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {initial ? "حفظ التعديلات" : "إضافة"}
          </button>
        </div>
      </form>
    </div>
  );
}
