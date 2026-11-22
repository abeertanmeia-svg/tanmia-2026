import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource, listAttachments } from "@/lib/resources";
import { isAllowedMime, MAX_FILE_BYTES, resolveMime } from "@/lib/sections";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  return Response.json({ items: await listAttachments(id) });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "معرّف غير صحيح" }, { status: 400 });
  const resource = await getResource(id);
  if (!resource) return Response.json({ error: "غير موجود" }, { status: 404 });
  if (resource.authorId !== user.id && user.role !== "admin") {
    return Response.json({ error: "لا تملكين صلاحية إضافة مرفقات لهذا المورد" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // External link (YouTube, Google Drive, etc.)
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const url = String(body?.url ?? "").trim();
    const name = String(body?.name ?? "").trim() || url;
    if (!/^https?:\/\//i.test(url)) return Response.json({ error: "الرابط غير صحيح، يجب أن يبدأ بـ http" }, { status: 400 });
    const [row] = await db
      .insert(attachments)
      .values({ resourceId: id, kind: "link", name: name.slice(0, 200), mimeType: "text/uri-list", size: 0, url, uploadedBy: user.id })
      .returning({ id: attachments.id });
    const items = await listAttachments(id);
    return Response.json({ item: items.find((a) => a.id === row.id) }, { status: 201 });
  }

  // Multipart file upload
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
  if (file.size === 0) return Response.json({ error: "الملف فارغ" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: `حجم الملف يتجاوز الحد المسموح (${Math.round(MAX_FILE_BYTES / 1024 / 1024)} ميجابايت). للفيديوهات الكبيرة استخدمي رابط يوتيوب أو Google Drive.` }, { status: 413 });
  }
  const mime = resolveMime(file.name, file.type);
  if (!isAllowedMime(mime)) return Response.json({ error: "نوع الملف غير مدعوم. المسموح: صور، فيديو، صوت، PDF، Word، PowerPoint، Excel، HTML تفاعلي، ZIP" }, { status: 415 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(attachments)
    .values({ resourceId: id, kind: "file", name: file.name.slice(0, 200), mimeType: mime, size: file.size, data: buffer, uploadedBy: user.id })
    .returning({ id: attachments.id });
  const [item] = await db
    .select({
      id: attachments.id,
      resourceId: attachments.resourceId,
      kind: attachments.kind,
      name: attachments.name,
      mimeType: attachments.mimeType,
      size: attachments.size,
      url: attachments.url,
      uploadedBy: attachments.uploadedBy,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(eq(attachments.id, row.id));
  return Response.json({ item: { ...item, createdAt: item.createdAt.toISOString() } }, { status: 201 });
}
