"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";

/** Optimistic ⭐ save toggle. Guests are sent to login and brought back. */
export function BookmarkButton({ resourceId, initial, loggedIn = true, size = "sm" }: { resourceId: number; initial: boolean; loggedIn?: boolean; size?: "sm" | "lg" }) {
  const router = useRouter();
  const toast = useToast();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (resourceId < 0 || busy) return;
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !on;
    setOn(next);
    setBusy(true);
    const res = await fetch(`/api/resources/${resourceId}/bookmark`, { method: next ? "POST" : "DELETE" });
    setBusy(false);
    if (res.status === 401) {
      setOn(!next);
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!res.ok) {
      setOn(!next);
      toast.error("تعذر الحفظ، حاولي مرة أخرى");
      return;
    }
    if (next) toast.success("أُضيف إلى محفوظاتي ⭐");
  }

  return size === "lg" ? (
    <button onClick={toggle} className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${on ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {on ? "⭐ محفوظ" : "☆ حفظ"}
    </button>
  ) : (
    <button
      onClick={toggle}
      aria-pressed={on}
      title={on ? "إزالة من محفوظاتي" : "حفظ في محفوظاتي"}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base transition ${on ? "text-amber-500" : "text-slate-300 hover:bg-amber-50 hover:text-amber-500"}`}
    >
      {on ? "★" : "☆"}
    </button>
  );
}
