"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "./Toast";
import { GOVERNORATES } from "@/lib/sections";

export function ProfileForm({ name: n0, school: s0, governorate: g0 }: { name: string; school: string; governorate: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(n0);
  const [school, setSchool] = useState(s0);
  const [governorate, setGovernorate] = useState(g0);
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, school, governorate }) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return toast.error(data.error ?? "تعذر الحفظ");
    toast.success("تم حفظ بياناتك");
    setOpen(false);
    router.refresh();
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        ✎ تعديل الاسم والمدرسة والمحافظة
      </button>
    );
  const input = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400";
  return (
    <form onSubmit={save} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className={input} />
      <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="الفصل / المدرسة" className={input} />
      <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className={input}>
        <option value="">المحافظة...</option>
        {GOVERNORATES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "..." : "حفظ"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">إلغاء</button>
      </div>
    </form>
  );
}
