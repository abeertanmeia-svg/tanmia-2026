"use client";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-6xl">🌧️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">حدث خطأ مؤقت</h1>
        <p className="mt-2 text-sm text-slate-500">حاولي مرة أخرى بعد لحظات.</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">↻ إعادة المحاولة</button>
      </div>
    </main>
  );
}
