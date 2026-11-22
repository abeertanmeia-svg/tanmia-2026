import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getResource, listAttachments, listComments, listResources } from "@/lib/resources";
import { colorClasses, getSection } from "@/lib/sections";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
import { CommentsPanel } from "@/components/CommentsPanel";
import { ResourceActions } from "@/components/ResourceActions";
import { ResourceCard } from "@/components/ResourceCard";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import { PrintButton } from "@/components/PrintButton";
import { BookmarkButton } from "@/components/BookmarkButton";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section: slug, id: rawId } = await params;
  const section = getSection(slug);
  const id = Number(rawId);
  if (!section || !Number.isInteger(id)) notFound();
  const user = await getCurrentUser();
  const item = await getResource(id, user?.id);
  if (!item || item.section !== section.slug) notFound();
  const canSee = item.status === "approved" || user?.role === "admin" || user?.id === item.authorId;
  if (!canSee) notFound();
  const [comments, attachmentItems, related] = await Promise.all([
    listComments(id),
    listAttachments(id),
    listResources({ section: section.slug, limit: 20 }, user ? { id: user.id, role: user.role } : null).then((all) => all.filter((r) => r.id !== id).slice(0, 3)),
  ]);
  const c = colorClasses[section.color];
  const canManage = !!user && (item.authorId === user.id || user.role === "admin");

  return (
    <div className="animate-fade-up mx-auto max-w-4xl space-y-6">
      <nav className="no-print flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-indigo-600">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href={`/dashboard/${section.slug}`} className="hover:text-indigo-600">
          {section.short}
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700">{item.title}</span>
      </nav>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className={`${c.soft} border-b ${c.border} px-6 py-6 md:px-8`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full bg-white ${c.text} px-3 py-1 text-xs font-bold`}>
              {section.icon} {section.name}
            </span>
            {item.subject && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-700">📘 {item.subject}</span>}
            {item.gradeGroup && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">🎒 {item.gradeGroup}</span>}
            {item.level && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{item.level}</span>}
            {item.featured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">⭐ مميز</span>}
            {item.status === "pending" && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">⏳ بانتظار الاعتماد</span>}
            {item.aiTool && <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">🤖 {item.aiTool}</span>}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold leading-snug text-slate-900 md:text-3xl">{item.title}</h1>
          {item.summary && <p className="mt-3 text-base leading-relaxed text-slate-600">{item.summary}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-bold text-indigo-700 shadow-sm">
                {item.authorName.replace(/^أ\.\s*/, "").slice(0, 1)}
              </span>
              <div>
                <p className="font-bold text-slate-900">
                  {item.authorName}
                  {item.authorGovernorate && <span className="font-normal text-slate-500"> · {item.authorGovernorate}</span>}
                </p>
                <p className="text-xs text-slate-500">
                  نُشر في {formatDate(item.createdAt)}
                  {item.downloads > 0 && ` · ⬇ ${item.downloads} تحميل`}
                  {item.updatedAt !== item.createdAt && ` · عُدّل ${formatDate(item.updatedAt)}`}
                </p>
              </div>
            </div>
            <div className="no-print flex flex-wrap items-center gap-2">
              <BookmarkButton resourceId={item.id} initial={item.bookmarked} loggedIn={!!user} size="lg" />
              <PrintButton />
              <WhatsAppShare text={`${section.icon} ${item.title}\n${item.summary}`} path={`/dashboard/${section.slug}/${item.id}`} label="مشاركة" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700" />
              {canManage && <ResourceActions item={item} section={section} isAdmin={user?.role === "admin"} />}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          {item.content ? (
            <Markdown content={item.content} />
          ) : (
            <p className="text-sm text-slate-400">لا يوجد محتوى تفصيلي لهذا المورد.</p>
          )}
          {item.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
              {item.tags.map((t) => (
                <span key={t} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      <div className="no-print space-y-6">
      <AttachmentsPanel resourceId={item.id} initial={attachmentItems} canEdit={canManage} />

      <CommentsPanel resourceId={item.id} initial={comments} currentUser={user ? { id: user.id, name: user.name, role: user.role } : null} />

      </div>

      {related.length > 0 && (
        <section className="no-print">
          <h2 className="mb-4 text-lg font-bold text-slate-900">المزيد من {section.short}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <ResourceCard key={r.id} item={r} loggedIn={!!user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
