export type LinkProvider = "drive" | "canva" | "youtube" | "office" | "generic";

/** Identify where an external link points so it can be labelled and coloured. */
export function detectLinkProvider(url: string): { type: LinkProvider; label: string; badgeColor: string; icon: string } {
  const u = (url || "").toLowerCase();
  if (u.includes("drive.google.com") || u.includes("docs.google.com"))
    return { type: "drive", label: "Google Drive", badgeColor: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", icon: "🗂️" };
  if (u.includes("canva.com") || u.includes("canva.link"))
    return { type: "canva", label: "عرض Canva", badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100", icon: "🎨" };
  if (u.includes("youtube.com") || u.includes("youtu.be"))
    return { type: "youtube", label: "فيديو يوتيوب", badgeColor: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", icon: "▶️" };
  if (u.includes("onedrive") || u.includes("1drv.ms") || u.includes("sharepoint") || u.includes("office.com"))
    return { type: "office", label: "Microsoft Office", badgeColor: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", icon: "📊" };
  return { type: "generic", label: "رابط خارجي", badgeColor: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200", icon: "🔗" };
}

export type LinkCheckStatus = "idle" | "checking" | "valid" | "warning" | "error";
export interface LinkCheckResult {
  status: LinkCheckStatus;
  message: string;
  /** A suggested safer URL (e.g. a Canva/Drive view link instead of an edit link). */
  fixedUrl?: string;
}

/** Instant, offline format check of an external link (runs in the browser). */
export function validateExternalUrl(url: string): LinkCheckResult {
  const raw = url.trim();
  if (!raw) return { status: "error", message: "يرجى إدخال الرابط أولاً" };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { status: "error", message: "صيغة الرابط غير صحيحة، يرجى نسخه بالكامل من المتصفح." };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return { status: "error", message: "الرابط يجب أن يبدأ بـ https://" };
  const host = parsed.hostname.toLowerCase();

  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    if (/\/edit\b/.test(parsed.pathname)) {
      return {
        status: "warning",
        message: "هذا رابط تعديل. يفضّل رابط العرض حتى لا تعدّل الزميلات الملف الأصلي، وتأكدي أن المشاركة «أي شخص لديه الرابط».",
        fixedUrl: raw.replace(/\/edit[^?#]*/, "/view"),
      };
    }
    const looksShared = /usp=sharing|usp=drive_link|\/view|\/folders\/|open\?id=|\/preview/.test(raw);
    if (!looksShared) return { status: "warning", message: "تأكدي من ضبط المشاركة في Google Drive على «أي شخص لديه الرابط»." };
    return { status: "valid", message: "الرابط سليم ومهيأ للمشاركة العامة." };
  }
  if (host.includes("canva.com")) {
    if (/\/edit\b/.test(parsed.pathname)) {
      return {
        status: "warning",
        message: "هذا رابط تعديل خاص. يفضّل «رابط العرض فقط» أو «مشاركة رابط القالب».",
        fixedUrl: raw.replace(/\/edit[^?#]*/, "/view"),
      };
    }
    return { status: "valid", message: "رابط Canva جاهز للعرض والمشاركة." };
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    const ok = host.includes("youtu.be") || parsed.searchParams.has("v") || /\/(shorts|embed|live)\//.test(parsed.pathname) || parsed.pathname.startsWith("/playlist");
    if (!ok) return { status: "warning", message: "يرجى التأكد من أن الرابط يشير إلى فيديو محدد." };
    return { status: "valid", message: "رابط فيديو صالح ومتاح." };
  }
  return { status: "valid", message: "الرابط صالح وقابل للفتح." };
}
