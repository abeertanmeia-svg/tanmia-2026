"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ResourceDTO } from "@/lib/resources";
import type { SectionConfig } from "@/lib/sections";
import { attachmentType, colorClasses, FILE_TYPES, type FileTypeKey } from "@/lib/sections";
import { QuickAddModal } from "./QuickAddModal";
import { SECTION_TASK } from "@/lib/assistant";
import { ResourceCard } from "./ResourceCard";
import { ResourceFormModal, type ResourceFormValues } from "./ResourceFormModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

type Props = {
  section: SectionConfig;
  initialItems: ResourceDTO[];
  initialHasMore: boolean;
  totalCount: number;
  typeCounts: Record<"all" | FileTypeKey, number>;
  subjectCounts: Record<string, number>;
  gradeCounts: Record<string, number>;
  currentUser: { id: number; name: string; role: "admin" | "teacher" } | null;
};

function attachmentTypeOf(item: ResourceDTO) {
  const f = item.files[0];
  return f ? attachmentType(f) : null;
}

async function uploadAttachments(resourceId: number, values: ResourceFormValues): Promise<string[]> {
  const errors: string[] = [];
  for (const file of values.files) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/resources/${resourceId}/attachments`, { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      errors.push(d.error ?? `فشل رفع ${file.name}`);
    }
  }
  if (values.linkUrl.trim()) {
    const res = await fetch(`/api/resources/${resourceId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: values.linkUrl.trim() }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      errors.push(d.error ?? "فشل إضافة الرابط");
    }
  }
  return errors;
}

export function SectionBoard({ section, initialItems, initialHasMore, totalCount, typeCounts, subjectCounts, gradeCounts, currentUser }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const c = colorClasses[section.color];

  const [items, setItems] = useState<ResourceDTO[]>(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; item: ResourceDTO } | null>(
    searchParams.get("new") && currentUser ? { mode: "create" } : null,
  );
  const loginHref = `/login?next=${encodeURIComponent(`/dashboard/${section.slug}?new=1`)}`;
  function openCreate() {
    if (!currentUser) {
      router.push(loginHref);
      return;
    }
    setModal({ mode: "create" });
  }
  const [confirmDelete, setConfirmDelete] = useState<ResourceDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(totalCount);
  const tempId = useRef(-1);
  const [fileType, setFileType] = useState<FileTypeKey | "">("");
  const [quickOpen, setQuickOpen] = useState(() => searchParams.get("quick") === "1" && !!currentUser);
  const [counts, setCounts] = useState(typeCounts);
  useEffect(() => setCounts(typeCounts), [typeCounts]);

  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const gradeRef = useRef("");
  const listQuery = (t: string, sub: string) =>
    `/api/resources?section=${section.slug}${t ? `&type=${t}` : ""}${sub ? `&subject=${encodeURIComponent(sub)}` : ""}${gradeRef.current ? `&grade=${encodeURIComponent(gradeRef.current)}` : ""}`;

  async function selectGrade(g: string) {
    setGrade(g);
    gradeRef.current = g;
    await reload(fileType, subject);
  }

  async function selectSubject(sub: string) {
    setSubject(sub);
    await reload(fileType, sub);
  }

  async function selectType(t: FileTypeKey | "") {
    setFileType(t);
    await reload(t, subject);
  }

  async function reload(t: string, sub: string) {
    setRefreshing(true);
    try {
      const res = await fetch(listQuery(t, sub), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  }

  function openQuick() {
    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(`/dashboard/${section.slug}`)}`);
      return;
    }
    setQuickOpen(true);
  }

  function onQuickCreated(item: ResourceDTO, pendingApproval: boolean) {
    setQuickOpen(false);
    setItems((prev) => [item, ...prev]);
    setTotal((t) => t + 1);
    setCounts((c) => {
      const next = { ...c, all: c.all + 1 };
      const k = item.files[0] ? (FILE_TYPES.find((f) => f.key === attachmentTypeOf(item))?.key ?? null) : null;
      if (k) next[k] = (next[k] ?? 0) + 1;
      return next;
    });
    toast.success(pendingApproval ? "تم الإرسال، وستظهر المادة للجميع بعد اعتماد المنسقة" : "تم حفظ المادة");
    router.refresh();
  }

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setTotal(totalCount);
    setPage(1);
  }, [initialItems, initialHasMore, totalCount]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await fetch(`${listQuery(fileType, subject)}&page=${next}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.items.filter((it: ResourceDTO) => !seen.has(it.id))];
        });
        setHasMore(data.hasMore);
        setPage(next);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  const canManage = useCallback(
    (item: ResourceDTO) => !!currentUser && (item.authorId === currentUser.id || currentUser.role === "admin"),
    [currentUser],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (level && it.level !== level) return false;
      if (onlyMine && it.authorId !== currentUser?.id) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q)) ||
        it.authorName.toLowerCase().includes(q)
      );
    });
  }, [items, query, level, onlyMine, currentUser]);

  function markPending(id: number, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function refetch() {
    setRefreshing(true);
    try {
      const res = await fetch(listQuery(fileType, subject), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  }

  function closeModal() {
    setModal(null);
    if (searchParams.get("new")) router.replace(`/dashboard/${section.slug}`);
  }

  async function handleCreate(values: ResourceFormValues): Promise<string | null> {
    if (!currentUser) return "يجب تسجيل الدخول أولاً";
    const id = tempId.current--;
    const now = new Date().toISOString();
    const optimistic: ResourceDTO = {
      id,
      section: section.slug,
      title: values.title.trim(),
      summary: values.summary.trim(),
      content: values.content.trim(),
      level: values.level,
      subject: values.subject,
      gradeGroup: values.gradeGroup,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      aiTool: values.aiTool === "بدون أداة" ? null : values.aiTool,
      featured: values.featured,
      status: currentUser.role === "admin" ? "approved" : "pending",
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorGovernorate: null,
      downloads: 0,
      commentCount: 0,
      attachmentCount: values.files.length + (values.linkUrl.trim() ? 1 : 0),
      coverImageId: null,
      files: [],
      bookmarked: false,
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [optimistic, ...prev]);
    markPending(id, true);
    closeModal();

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, section: section.slug }),
    });
    const data = await res.json().catch(() => ({}));
    markPending(id, false);
    if (!res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.error(data.error ?? "تعذر الحفظ");
      return data.error ?? "تعذر الحفظ";
    }
    setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
    setTotal((t) => t + 1);
    toast.success(
      currentUser.role === "admin" ? `تمت إضافة ${section.itemLabel} بنجاح` : `تم إرسال ${section.itemLabel} وسيُنشر للجميع بعد اعتماد المنسقة`,
    );
    if (values.files.length || values.linkUrl.trim()) {
      markPending(data.item.id, true);
      const errors = await uploadAttachments(data.item.id, values);
      markPending(data.item.id, false);
      errors.forEach((e) => toast.error(e));
      const fresh = await fetch(`/api/resources/${data.item.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (fresh?.item) setItems((prev) => prev.map((it) => (it.id === data.item.id ? fresh.item : it)));
    }
    router.refresh();
    return null;
  }

  async function handleEdit(item: ResourceDTO, values: ResourceFormValues): Promise<string | null> {
    const snapshot = items;
    const optimistic: ResourceDTO = {
      ...item,
      title: values.title.trim(),
      summary: values.summary.trim(),
      content: values.content.trim(),
      level: values.level,
      subject: values.subject,
      gradeGroup: values.gradeGroup,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      aiTool: values.aiTool === "بدون أداة" ? null : values.aiTool,
      featured: values.featured,
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((it) => (it.id === item.id ? optimistic : it)));
    markPending(item.id, true);
    closeModal();

    const res = await fetch(`/api/resources/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    markPending(item.id, false);
    if (!res.ok) {
      setItems(snapshot);
      toast.error(data.error ?? "تعذر حفظ التعديلات");
      return data.error ?? "تعذر حفظ التعديلات";
    }
    setItems((prev) => prev.map((it) => (it.id === item.id ? data.item : it)));
    toast.success("تم حفظ التعديلات");
    if (values.files.length || values.linkUrl.trim()) {
      markPending(item.id, true);
      const errors = await uploadAttachments(item.id, values);
      markPending(item.id, false);
      errors.forEach((e) => toast.error(e));
      const fresh = await fetch(`/api/resources/${item.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (fresh?.item) setItems((prev) => prev.map((it) => (it.id === item.id ? fresh.item : it)));
    }
    return null;
  }

  async function handleDelete(item: ResourceDTO) {
    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setConfirmDelete(null);
    const res = await fetch(`/api/resources/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setItems(snapshot);
      toast.error(data.error ?? "تعذر الحذف");
      return;
    }
    setTotal((t) => Math.max(0, t - 1));
    toast.success("تم الحذف");
    router.refresh();
  }

  const input =
    "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className={`rounded-3xl border ${c.border} ${c.soft} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{section.icon}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{section.name}</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{section.description}</p>
              {section.suits && (
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600">
                  <b className="text-slate-800">يناسب هذا القسم:</b> {section.suits}
                </p>
              )}
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {total} {section.itemLabel}
                {refreshing && <span className="mr-2 text-slate-400">· جارٍ التحديث...</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openQuick} className={`rounded-2xl ${c.bg} px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110`}>
              ⬆ إضافة ملف إلى القسم
            </button>
            <button onClick={openCreate} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              ✍️ مورد مفصّل
            </button>
            <a
              href={`/dashboard/assistant?task=${SECTION_TASK[section.slug]}`}
              className="rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110"
            >
              ✨ مساعد هذا القسم
            </a>
          </div>
        </div>
      </div>

      {section.slug === "literacy" && (
        <a href="/dashboard/guide" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
          <span className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <span>
              <span className="block font-bold text-slate-900">دليل خطة العلاج المتكاملة: من الحرف إلى الإبداع</span>
              <span className="block text-xs text-slate-500">الدليل المرجعي الكامل للمبادرة — 17 فصلاً قابلة للطباعة</span>
            </span>
          </span>
          <span className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">افتحي الدليل ←</span>
        </a>
      )}

      {section.slug === "ai" && (
        <a href="/dashboard/prompts" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fuchsia-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
          <span className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <span>
              <span className="block font-bold text-slate-900">بنك البرومبتات</span>
              <span className="block text-xs text-slate-500">أوامر جاهزة للنسخ: تحضير، قصص من البيئة الريفية، قرائية، تقييم، تصميم بطاقات</span>
            </span>
          </span>
          <span className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white">افتحي البنك ←</span>
        </a>
      )}
      {(section.slug === "assessment" || section.slug === "stations") && (
        <a href="/dashboard/tools" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
          <span className="flex items-center gap-3">
            <span className="text-2xl">{section.slug === "assessment" ? "⏱️" : "⏰"}</span>
            <span>
              <span className="block font-bold text-slate-900">{section.slug === "assessment" ? "أداة الفحص السريع للقرائية (دقيقة واحدة)" : "مؤقت المحطات والمجموعات الدوارة"}</span>
              <span className="block text-xs text-slate-500">{section.slug === "assessment" ? "مؤقت، عدّ الأخطاء، حساب الكلمات الصحيحة في الدقيقة، وسجل أسبوعي لكل تلميذ" : "مؤقت بمراحل الحصة المدمجة وتنبيه صوتي عند تدوير المحطات"}</span>
            </span>
          </span>
          <span className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">افتحي الأداة ←</span>
        </a>
      )}

      {/* File-type chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ key: "" as const, label: "الكل", icon: "📚" }, ...FILE_TYPES].map((t) => {
          const n = t.key ? counts[t.key] : counts.all;
          const on = fileType === t.key;
          return (
            <button
              key={t.key || "all"}
              onClick={() => selectType(t.key)}
              disabled={!on && n === 0 && t.key !== ""}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                on ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{t.icon}</span> {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحثي بالعنوان أو الوسم أو اسم المعلمة..."
            className={`${input} w-full pr-10`}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        {Object.keys(subjectCounts).length > 0 && (
          <select value={subject} onChange={(e) => selectSubject(e.target.value)} className={input} aria-label="المادة الدراسية">
            <option value="">📘 كل المواد</option>
            {Object.entries(subjectCounts).map(([sub, n]) => (
              <option key={sub} value={sub}>{sub} ({n})</option>
            ))}
          </select>
        )}
        {Object.keys(gradeCounts).length > 0 && (
          <select value={grade} onChange={(e) => selectGrade(e.target.value)} className={input} aria-label="المرحلة">
            <option value="">🎒 كل الصفوف</option>
            {Object.entries(gradeCounts).map(([g, n]) => (
              <option key={g} value={g}>{g} ({n})</option>
            ))}
          </select>
        )}
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={input}>
          <option value="">كل {section.levelLabel}</option>
          {section.levelOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {currentUser && (
        <button
          onClick={() => setOnlyMine((v) => !v)}
          className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
            onlyMine ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          مساهماتي فقط
        </button>
        )}
        <button onClick={refetch} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50" title="تحديث">
          ↻
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          section={section}
          filtered={items.length > 0 || fileType !== "" || subject !== "" || grade !== ""}
          onCreate={openQuick}
          onReset={() => {
            setQuery("");
            setLevel("");
            setOnlyMine(false);
            if (fileType || subject || grade) {
              setFileType("");
              setSubject("");
              setGrade("");
              gradeRef.current = "";
              void reload("", "");
            }
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              loggedIn={!!currentUser}
              pending={pendingIds.has(item.id) || item.id < 0}
              actions={
                canManage(item) && item.id > 0 ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setModal({ mode: "edit", item })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                      title="تعديل"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="حذف"
                    >
                      🗑
                    </button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {hasMore && !query && !level && !onlyMine && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />}
            تحميل المزيد ({items.length} من {total})
          </button>
        </div>
      )}
      {(query || level || onlyMine) && hasMore && (
        <p className="text-center text-xs text-slate-400">البحث يشمل العناصر المحمّلة فقط — اضغطي ↻ أو حمّلي المزيد لتوسيع النتائج.</p>
      )}

      {quickOpen && (
        <QuickAddModal
          section={section}
          onClose={() => {
            setQuickOpen(false);
            if (searchParams.get("quick")) router.replace(`/dashboard/${section.slug}`);
          }}
          onCreated={onQuickCreated}
        />
      )}

      {modal && (
        <ResourceFormModal
          section={section}
          initial={modal.mode === "edit" ? modal.item : null}
          onClose={closeModal}
          canFeature={currentUser?.role === "admin"}
          onSubmit={(values) => (modal.mode === "edit" ? handleEdit(modal.item, values) : handleCreate(values))}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`حذف ${section.itemLabel}`}
          message={`هل أنتِ متأكدة من حذف "${confirmDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="نعم، احذفي"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

function EmptyState({
  section,
  filtered,
  onCreate,
  onReset,
}: {
  section: SectionConfig;
  filtered: boolean;
  onCreate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <span className="text-5xl">{filtered ? "🔎" : section.icon}</span>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{filtered ? "لا توجد نتائج مطابقة" : `لا يوجد ${section.itemLabel} بعد`}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        {filtered ? "جرّبي تعديل كلمات البحث أو إزالة الفلاتر." : `كوني أول من يضيف ${section.itemLabel} في هذا القسم ويشاركه مع زميلاتها.`}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {filtered ? (
          <button onClick={onReset} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            إزالة الفلاتر
          </button>
        ) : (
          <button onClick={onCreate} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
            + إضافة {section.itemLabel}
          </button>
        )}
      </div>
    </div>
  );
}
