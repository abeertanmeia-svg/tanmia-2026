import { db } from "@/db";
import { appRegistry } from "@/db/schema";
import { ensureAppsSeeded } from "@/lib/apps";
import { toLegacyStatus } from "@/lib/apps-json";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Public apps.json in the exact format of the standalone «تنمية 2026» HTML page.
 * Only rows marked «ظاهر في البوابة» and not archived. CORS-enabled so the page can
 * live on Wix or any static host and read from here: fetch("https://<platform>/apps.json").
 */
export async function GET() {
  await ensureAppsSeeded();
  const rows = await db
    .select({ id: appRegistry.id, name: appRegistry.name, purpose: appRegistry.purpose, ref: appRegistry.ref, status: appRegistry.status, url: appRegistry.url })
    .from(appRegistry)
    .where(and(eq(appRegistry.isPublic, true), eq(appRegistry.archived, false)))
    .orderBy(asc(appRegistry.sortOrder), asc(appRegistry.id));
  const body = rows.map((r) => ({ id: `app-${r.id}`, name: r.name, fn: r.purpose || r.ref, status: toLegacyStatus(r.status), url: r.url ?? "" }));
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}
