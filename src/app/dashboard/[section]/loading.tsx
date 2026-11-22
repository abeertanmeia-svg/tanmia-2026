export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 rounded-3xl bg-slate-200" />
      <div className="h-11 rounded-xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-3xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
