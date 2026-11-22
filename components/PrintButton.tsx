"use client";

export function PrintButton({ label = "🖨️ طباعة / حفظ PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      title="اختاري «حفظ بتنسيق PDF» من نافذة الطباعة لتنزيل ملف"
    >
      {label}
    </button>
  );
}
