"use client";

export function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Opens WhatsApp with the given text (and the absolute page URL when `path` is given). */
export function WhatsAppShare({ text, path, label = "مشاركة عبر واتساب", className }: { text: string; path?: string; label?: string; className?: string }) {
  function share() {
    const url = path ? `${window.location.origin}${path}` : "";
    window.open(whatsappUrl(url ? `${text}\n${url}` : text), "_blank", "noopener");
  }
  return (
    <button type="button" onClick={share} className={className ?? "rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"}>
      🟢 {label}
    </button>
  );
}
