import Link from "next/link";
import type { ResourceDTO } from "@/lib/resources";
import { attachmentType, colorClasses, FILE_TYPES, getSection } from "@/lib/sections";
import { timeAgo } from "@/lib/format";
import { SmartExternalLink } from "./SmartExternalLink";
import { BookmarkButton } from "./BookmarkButton";

export function ResourceCard({
  item,
  showSection,
  actions,
  pending,
  loggedIn,
}: {
  item: ResourceDTO;
  showSection?: boolean;
  actions?: React.ReactNode;
  pending?: boolean;
  /** When provided, shows the ⭐ save button (guests are redirected to login). */
  loggedIn?: boolean;
}) {
  const section = getSection(item.section)!;
  const c = colorClasses[section.color];
  return (
    <article
      className={`group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showSection && (
            <span className={`inline-flex items-center gap-1 rounded-full ${c.soft} ${c.text} px-2.5 py-1 text-[11px] font-bold`}>
              {section.icon} {section.short}
            </span>
          )}
          {item.subject && (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">📘 {item.subject}</span>
          )}
          {item.gradeGroup && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">🎒 {item.gradeGroup}</span>
          )}
          {item.level && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{item.level}</span>
          )}
          {item.featured && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">⭐ مميز</span>}
          {item.status === "pending" && <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">⏳ بانتظار الاعتماد</span>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {loggedIn !== undefined && item.id > 0 && <BookmarkButton resourceId={item.id} initial={item.bookmarked} loggedIn={loggedIn} />}
          {actions}
        </div>
      </div>
      {!item.coverImageId && item.files[0] && (() => {
        const t = FILE_TYPES.find((x) => x.key === attachmentType(item.files[0]));
        if (!t) return null;
        return (
          <Link href={`/dashboard/${item.section}/${item.id}`} className={`mt-3 grid aspect-[16/7] place-items-center rounded-2xl ${t.tile}`}>
            <span className="text-center">
              <span className="block text-4xl">{t.icon}</span>
              <span className="mt-1 block text-sm font-bold">{t.label}</span>
            </span>
          </Link>
        );
      })()}
      {item.coverImageId && (
        <Link href={`/dashboard/${item.section}/${item.id}`} className="mt-3 block overflow-hidden rounded-2xl bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/files/${item.coverImageId}`} alt="" className="aspect-[16/9] w-full object-cover transition group-hover:scale-105" loading="lazy" />
        </Link>
      )}
      <Link href={`/dashboard/${item.section}/${item.id}`} className="mt-3 block">
        <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{item.summary || "بدون وصف"}</p>
      </Link>
      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
              #{t}
            </span>
          ))}
        </div>
      )}
      {item.files[0] && item.id > 0 && (() => {
        const f = item.files[0];
        const t = FILE_TYPES.find((x) => x.key === attachmentType(f));
        const openHref = f.kind === "link" ? (f.url ?? "#") : `/api/files/${f.id}`;
        return (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {f.kind === "link" ? (
              <SmartExternalLink url={f.url ?? ""} href={`/api/files/${f.id}`} />
            ) : (
              t && <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${t.tile}`}>{t.label}</span>
            )}
            {f.kind === "file" && <span className="text-[11px] text-slate-400">{f.size < 1048576 ? `${Math.max(1, Math.round(f.size / 1024))} ك.ب` : `${(f.size / 1048576).toFixed(1)} م.ب`}</span>}
            <span className="flex-1" />
            <a href={f.kind === "link" ? `/api/files/${f.id}` : openHref} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">↗ فتح</a>
            {f.kind === "file" && (
              <a href={`/api/files/${f.id}?download=1`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">⬇ تحميل</a>
            )}
          </div>
        );
      })()}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="truncate">
          {item.authorName}
          {item.authorGovernorate && <span className="text-slate-400"> · {item.authorGovernorate}</span>}
        </span>
        <div className="flex items-center gap-3">
          {item.aiTool && <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-600">🤖 {item.aiTool}</span>}
          {item.downloads > 0 && <span title="مرات التحميل">⬇ {item.downloads}</span>}
          {item.attachmentCount > 0 && <span>📎 {item.attachmentCount}</span>}
          <span>💬 {item.commentCount}</span>
          <span>{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
