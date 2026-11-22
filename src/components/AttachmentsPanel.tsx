"use client";

import { useRef, useState } from "react";
import type { AttachmentDTO } from "@/lib/resources";
import { ACCEPT_ATTR, MAX_FILE_BYTES } from "@/lib/sections";
import { useToast } from "./Toast";
import { detectLinkProvider } from "@/lib/links";
import { UrlCheckerInput } from "./UrlCheckerInput";
import { SmartExternalLink } from "./SmartExternalLink";

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ك.ب`;
  return `${(bytes / 1024 / 1024).toFixed(1)} م.ب`;
}

export function fileIcon(a: AttachmentDTO) {
  if (a.kind === "link") return detectLinkProvider(a.url ?? "").icon;
  const m = a.mimeType;
  if (m === "text/html") return "🕹️";
  if (m.startsWith("image/")) return "🖼️";
  if (m.startsWith("video/")) return "🎬";
  if (m.startsWith("audio/")) return "🎵";
  if (m === "application/pdf") return "📄";
  if (m.includes("word")) return "📝";
  if (m.includes("presentation") || m.includes("powerpoint")) return "📊";
  if (m.includes("sheet") || m.includes("excel")) return "📈";
  return "📎";
}

export function youtubeId(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

type UploadState = { name: string; progress: number; error?: string };

export function AttachmentsPanel({
  resourceId,
  initial,
  canEdit,
}: {
  resourceId: number;
  initial: AttachmentDTO[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState<AttachmentDTO[]>(initial);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadOne(file: File): Promise<void> {
    return new Promise((resolve) => {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`"${file.name}" أكبر من 25 م.ب — استخدمي رابط يوتيوب/Drive للفيديوهات الكبيرة`);
        resolve();
        return;
      }
      const key = `${file.name}-${Date.now()}`;
      setUploads((u) => [...u, { name: key, progress: 0 }]);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/resources/${resourceId}/attachments`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          setUploads((u) => u.map((x) => (x.name === key ? { ...x, progress: p } : x)));
        }
      };
      xhr.onload = () => {
        setUploads((u) => u.filter((x) => x.name !== key));
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setItems((prev) => [...prev, data.item]);
            toast.success(`تم رفع ${file.name}`);
          } else {
            toast.error(data.error ?? "فشل الرفع");
          }
        } catch {
          toast.error("فشل الرفع");
        }
        resolve();
      };
      xhr.onerror = () => {
        setUploads((u) => u.filter((x) => x.name !== key));
        toast.error("تعذر الاتصال بالخادم");
        resolve();
      };
      const fd = new FormData();
      fd.append("file", file);
      xhr.send(fd);
    });
  }

  async function handleFiles(files: FileList | File[]) {
    for (const f of Array.from(files)) await uploadOne(f);
  }

  async function addLink() {
    if (!linkUrl.trim()) return;
    setAddingLink(true);
    const res = await fetch(`/api/resources/${resourceId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkUrl.trim(), name: linkName.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setAddingLink(false);
    if (!res.ok) {
      toast.error(data.error ?? "تعذر إضافة الرابط");
      return;
    }
    setItems((prev) => [...prev, data.item]);
    setLinkUrl("");
    setLinkName("");
    setShowLink(false);
    toast.success("تمت إضافة الرابط");
  }

  async function remove(a: AttachmentDTO) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== a.id));
    const res = await fetch(`/api/attachments/${a.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(snapshot);
      toast.error("تعذر حذف المرفق");
    }
  }

  const htmls = items.filter((a) => a.kind === "file" && a.mimeType === "text/html");
  const images = items.filter((a) => a.kind === "file" && a.mimeType.startsWith("image/"));
  const videos = items.filter((a) => (a.kind === "file" && a.mimeType.startsWith("video/")) || (a.kind === "link" && youtubeId(a.url)));
  const others = items.filter((a) => !images.includes(a) && !videos.includes(a) && !htmls.includes(a));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">
          المرفقات والملفات <span className="text-sm font-semibold text-slate-400">({items.length})</span>
        </h2>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => inputRef.current?.click()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
              ⬆ رفع ملف
            </button>
            <button onClick={() => setShowLink((v) => !v)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              🔗 إضافة رابط
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPT_ATTR}
              onChange={(e) => {
                if (e.target.files) void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      {canEdit && showLink && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-start">
          <UrlCheckerInput url={linkUrl} onChange={setLinkUrl} label={null} inputClassName="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="اسم وصفي (اختياري)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <button onClick={addLink} disabled={addingLink} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {addingLink ? "..." : "إضافة"}
          </button>
        </div>
      )}

      {canEdit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`mt-4 rounded-2xl border-2 border-dashed p-5 text-center text-sm transition ${
            dragging ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"
          }`}
        >
          اسحبي الملفات وأفلتيها هنا — صور، فيديو، PDF، Word، PowerPoint، ألعاب وأوراق عمل HTML تفاعلية (حتى 25 م.ب للملف)
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((u) => (
            <div key={u.name} className="rounded-xl bg-slate-50 px-4 py-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="truncate">{u.name.replace(/-\d+$/, "")}</span>
                <span>{u.progress}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && uploads.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">لا توجد مرفقات بعد.</p>
      )}

      {htmls.length > 0 && (
        <div className="mt-5 space-y-3">
          {htmls.map((a) => {
            const on = playing === a.id;
            return (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/40">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="text-2xl">🕹️</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">محتوى HTML تفاعلي · {formatSize(a.size)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <button onClick={() => setPlaying(on ? null : a.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
                      {on ? "إيقاف" : "▶ تشغيل هنا"}
                    </button>
                    <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                      فتح بملء الشاشة ↗
                    </a>
                    <a href={`/api/files/${a.id}?download=1`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white">⬇ تنزيل</a>
                    {canEdit && <button onClick={() => remove(a)} className="rounded-lg px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50" title="حذف">✕</button>}
                  </div>
                </div>
                {on && (
                  <iframe
                    src={`/api/files/${a.id}`}
                    title={a.name}
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
                    className="h-[70vh] w-full border-t border-indigo-200 bg-white"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((a) => (
            <figure key={a.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${a.id}`} alt={a.name} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" loading="lazy" />
              </a>
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="truncate text-slate-600">{a.name}</span>
                <span className="flex shrink-0 gap-1">
                  <a href={`/api/files/${a.id}?download=1`} className="rounded-md px-1.5 py-0.5 text-indigo-600 hover:bg-indigo-50" title="تنزيل">⬇</a>
                  {canEdit && <button onClick={() => remove(a)} className="rounded-md px-1.5 py-0.5 text-rose-600 hover:bg-rose-50" title="حذف">✕</button>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {videos.map((a) => {
            const yt = youtubeId(a.url);
            return (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                {yt ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${yt}`}
                    title={a.name}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={`/api/files/${a.id}`} controls preload="metadata" className="aspect-video w-full" />
                )}
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 text-xs">
                  <span className="truncate text-slate-600">{a.name}</span>
                  <span className="flex shrink-0 gap-1">
                    {a.kind === "file" && <a href={`/api/files/${a.id}?download=1`} className="rounded-md px-1.5 py-0.5 text-indigo-600 hover:bg-indigo-50">⬇ تنزيل</a>}
                    {canEdit && <button onClick={() => remove(a)} className="rounded-md px-1.5 py-0.5 text-rose-600 hover:bg-rose-50">✕</button>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {others.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {others.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-2xl">{fileIcon(a)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                {a.kind === "link" ? (
                  <SmartExternalLink url={a.url ?? ""} href={`/api/files/${a.id}`} className="mt-1" />
                ) : (
                  <p className="text-xs text-slate-500">{formatSize(a.size)}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {a.kind === "link" ? (
                  <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                    فتح ↗
                  </a>
                ) : (
                  <>
                    <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      معاينة
                    </a>
                    <a href={`/api/files/${a.id}?download=1`} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                      ⬇ تنزيل
                    </a>
                  </>
                )}
                {canEdit && (
                  <button onClick={() => remove(a)} className="rounded-lg px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50" title="حذف">
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
