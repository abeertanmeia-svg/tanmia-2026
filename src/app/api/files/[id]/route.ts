import { db } from "@/db";
import { attachments, resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Bad request", { status: 400 });
  const [row] = await db
    .select({
      name: attachments.name,
      mimeType: attachments.mimeType,
      data: attachments.data,
      kind: attachments.kind,
      url: attachments.url,
      size: attachments.size,
      resourceStatus: resources.status,
      resourceAuthorId: resources.authorId,
    })
    .from(attachments)
    .innerJoin(resources, eq(resources.id, attachments.resourceId))
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  // Files of resources not yet approved are visible only to their author and the admin.
  if (row.resourceStatus !== "approved") {
    const viewer = await getCurrentUser();
    if (!viewer || (viewer.id !== row.resourceAuthorId && viewer.role !== "admin")) {
      return new Response("Not found", { status: 404 });
    }
  }
  const download = new URL(req.url).searchParams.get("download") === "1";
  if (download || row.kind === "link") {
    // Count real downloads (and link opens). Range requests from video players are not counted.
    if (!req.headers.get("range")) {
      await db.update(attachments).set({ downloads: sql`${attachments.downloads} + 1` }).where(eq(attachments.id, id));
    }
  }
  if (row.kind === "link" && row.url) return Response.redirect(row.url, 302);
  if (!row.data) return new Response("Not found", { status: 404 });

  const encoded = encodeURIComponent(row.name).replace(/['()]/g, escape);
  const body = new Uint8Array(row.data);
  const isHtml = row.mimeType === "text/html" || row.mimeType === "image/svg+xml";
  const headers: Record<string, string> = {
    "Content-Type": isHtml && row.mimeType === "text/html" ? "text/html; charset=utf-8" : row.mimeType,
    "Content-Length": String(body.byteLength),
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
  if (isHtml && !download) {
    // Run user-uploaded HTML in an opaque, sandboxed origin so it can't touch
    // the platform's cookies, storage or APIs — while still allowing scripts
    // (interactive games/worksheets) and external CDNs.
    headers["Content-Security-Policy"] = "sandbox allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock";
  }
  return new Response(body, { headers });
}
