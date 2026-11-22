"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { CommentDTO } from "@/lib/resources";
import { timeAgo } from "@/lib/format";
import { useToast } from "./Toast";

export function CommentsPanel({
  resourceId,
  initial,
  currentUser,
}: {
  resourceId: number;
  initial: CommentDTO[];
  currentUser: { id: number; name: string; role: "admin" | "teacher" } | null;
}) {
  const toast = useToast();
  const pathname = usePathname();
  const [items, setItems] = useState<CommentDTO[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const tempId = useRef(-1);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !currentUser) return;
    const id = tempId.current--;
    const optimistic: CommentDTO = {
      id,
      resourceId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, optimistic]);
    setBody("");
    setSending(true);
    const res = await fetch(`/api/resources/${resourceId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setItems((prev) => prev.filter((c) => c.id !== id));
      setBody(text);
      toast.error(data.error ?? "تعذر إرسال التعليق");
      return;
    }
    setItems((prev) => prev.map((c) => (c.id === id ? data.item : c)));
  }

  async function remove(c: CommentDTO) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== c.id));
    const res = await fetch(`/api/comments/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(snapshot);
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "تعذر حذف التعليق");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        النقاش والتعليقات <span className="text-sm font-semibold text-slate-400">({items.length})</span>
      </h2>

      <div className="mt-5 space-y-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            لا توجد تعليقات بعد. شاركي رأيك أو تجربتك مع هذا المورد 💬
          </div>
        )}
        {items.map((c) => {
          const mine = !!currentUser && (c.authorId === currentUser.id || currentUser.role === "admin");
          const pending = c.id < 0;
          return (
            <div key={c.id} className={`flex gap-3 ${pending ? "opacity-60" : ""}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {c.authorName.replace(/^أ\.\s*/, "").slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{c.authorName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{pending ? "جارٍ الإرسال..." : timeAgo(c.createdAt)}</span>
                    {mine && !pending && (
                      <button onClick={() => remove(c)} className="rounded-md px-1.5 py-0.5 hover:bg-rose-50 hover:text-rose-600" title="حذف">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{c.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!currentUser ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-800">سجّلي دخولك للمشاركة في النقاش</p>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
            تسجيل الدخول
          </Link>
        </div>
      ) : (
      <form onSubmit={submit} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتبي تعليقك هنا..."
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          إرسال
        </button>
      </form>
      )}
    </section>
  );
}
