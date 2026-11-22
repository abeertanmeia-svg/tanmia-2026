import { APP_STATUSES, statusLabel } from "@/lib/apps-meta";

type PublicApp = { id: number; name: string; purpose: string; status: string; url: string | null };

/** Public catalogue of initiative apps with honest test-status badges (from سجل متابعة التطبيقات). */
export function PublicApps({ items, compact = false }: { items: PublicApp[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
      {items.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-200">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">{a.name}</p>
            <p className="truncate text-xs text-slate-500">{a.purpose}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${APP_STATUSES.find((s) => s.key === a.status)?.badge ?? ""}`}>{statusLabel(a.status)}</span>
          {a.url ? (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">فتح ↗</a>
          ) : (
            <span className="rounded-lg border border-emerald-700/40 px-3 py-1.5 text-xs font-bold text-emerald-700/60">قريبًا</span>
          )}
        </div>
      ))}
    </div>
  );
}
