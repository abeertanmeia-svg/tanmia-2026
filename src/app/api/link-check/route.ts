import { getCurrentUser } from "@/lib/auth";
import { validateExternalUrl, type LinkCheckResult } from "@/lib/links";

export const dynamic = "force-dynamic";

const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd]|metadata\.google\.internal)/i;

function safe(u: URL) {
  return (u.protocol === "https:" || u.protocol === "http:") && !PRIVATE_HOST.test(u.hostname) && !u.hostname.endsWith(".internal") && !u.hostname.endsWith(".local");
}

/**
 * Really opens the link (following up to 5 redirects manually so every hop is
 * checked against private addresses) to detect private Drive files and dead links.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ status: "error", message: "سجّلي الدخول أولاً" }, { status: 401 });
  const target = new URL(req.url).searchParams.get("url") ?? "";
  const base = validateExternalUrl(target);
  if (base.status === "error") return Response.json(base);

  let current: URL;
  try {
    current = new URL(target.trim());
  } catch {
    return Response.json(base);
  }
  try {
    for (let hop = 0; hop < 6; hop++) {
      if (!safe(current)) return Response.json({ status: "error", message: "هذا الرابط غير مسموح." } satisfies LinkCheckResult);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(current, { method: "GET", redirect: "manual", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (link-check)" } }).finally(() => clearTimeout(t));
      res.body?.cancel().catch(() => {});
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current);
        if (/accounts\.google\.com|ServiceLogin/i.test(next.href)) {
          return Response.json({
            status: "error",
            message: "🔒 الملف خاص! افتحي Google Drive ← مشاركة ← «أي شخص لديه الرابط» ثم انسخي الرابط من جديد.",
          } satisfies LinkCheckResult);
        }
        if (/canva\.com\/login/i.test(next.href)) {
          return Response.json({ status: "error", message: "🔒 التصميم خاص على Canva. اختاري مشاركة ← «أي شخص لديه الرابط» أو «رابط العرض فقط»." } satisfies LinkCheckResult);
        }
        current = next;
        continue;
      }
      if (res.status >= 400 && res.status !== 404 && res.status !== 410 && /canva\.com/i.test(current.hostname)) {
        // Canva blocks automated checks even for public designs; rely on the format check.
        return Response.json(
          base.status === "warning"
            ? base
            : ({ status: "valid", message: "رابط Canva بصيغة صحيحة (Canva لا يسمح بالفحص الآلي؛ تأكدي أنه «رابط عرض» عام)." } satisfies LinkCheckResult),
        );
      }
      if (res.status === 404 || res.status === 410) {
        return Response.json({ status: "error", message: "الرابط لا يعمل (الصفحة غير موجودة). تأكدي من نسخه كاملاً." } satisfies LinkCheckResult);
      }
      if (res.status === 401 || res.status === 403) {
        if (base.status === "warning") return Response.json(base);
        return Response.json({ status: "warning", message: "الرابط يحتاج صلاحية للدخول. تأكدي أن المشاركة عامة.", fixedUrl: base.fixedUrl } satisfies LinkCheckResult);
      }
      if (res.status >= 400) {
        return Response.json({ status: "warning", message: `تعذر التأكد من الرابط (رمز ${res.status}). قد يعمل في المتصفح.`, fixedUrl: base.fixedUrl } satisfies LinkCheckResult);
      }
      // Reachable: keep the format advice (e.g. edit-link warning) if any.
      return Response.json(base.status === "warning" ? base : { status: "valid", message: `✓ تم فتح الرابط بنجاح. ${base.message}` });
    }
    return Response.json({ status: "warning", message: "الرابط يحوّل مرات كثيرة؛ جرّبي فتحه في المتصفح." });
  } catch {
    return Response.json({ status: "warning", message: "تعذر الوصول للرابط الآن. قد يكون الإنترنت بطيئاً — يمكنك الحفظ والمحاولة لاحقاً.", fixedUrl: base.fixedUrl } satisfies LinkCheckResult);
  }
}
