"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResourceDTO } from "@/lib/resources";
import type { SectionConfig } from "@/lib/sections";
import { ResourceFormModal, type ResourceFormValues } from "./ResourceFormModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export function ResourceActions({
  item,
  section,
  isAdmin,
}: {
  item: ResourceDTO;
  section: SectionConfig;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save(values: ResourceFormValues): Promise<string | null> {
    const res = await fetch(`/api/resources/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? "تعذر الحفظ";
    for (const file of values.files) {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`/api/resources/${item.id}/attachments`, { method: "POST", body: fd });
      if (!up.ok) {
        const d = await up.json().catch(() => ({}));
        toast.error(d.error ?? `فشل رفع ${file.name}`);
      }
    }
    if (values.linkUrl.trim()) {
      await fetch(`/api/resources/${item.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: values.linkUrl.trim() }),
      });
    }
    setEditing(false);
    toast.success("تم حفظ التعديلات");
    router.refresh();
    return null;
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/resources/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "تعذر الحذف");
      setDeleting(false);
      setConfirming(false);
      return;
    }
    toast.success("تم الحذف");
    router.push(`/dashboard/${section.slug}`);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ✎ تعديل
        </button>
        <button
          onClick={() => setConfirming(true)}
          disabled={deleting}
          className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
        >
          {deleting ? "جارٍ الحذف..." : "🗑 حذف"}
        </button>
      </div>
      {editing && (
        <ResourceFormModal section={section} initial={item} onClose={() => setEditing(false)} onSubmit={save} canFeature={isAdmin} />
      )}
      {confirming && (
        <ConfirmDialog
          title={`حذف ${section.itemLabel}`}
          message={`هل أنتِ متأكدة من حذف "${item.title}"؟ سيتم حذف التعليقات المرتبطة أيضاً.`}
          confirmLabel="نعم، احذفي"
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
