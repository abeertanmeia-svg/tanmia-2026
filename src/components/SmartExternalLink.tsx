import { detectLinkProvider } from "@/lib/links";

/** Coloured, clickable badge for an external link. `href` lets callers route through the download counter. */
export function SmartExternalLink({ url, href, className = "" }: { url: string; href?: string; className?: string }) {
  const info = detectLinkProvider(url);
  return (
    <a
      href={href ?? url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${info.badgeColor} ${className}`}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
      <span className="opacity-60">↗</span>
    </a>
  );
}
