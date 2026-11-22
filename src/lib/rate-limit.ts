import { db } from "@/db";
import { sql } from "drizzle-orm";

type Row = { count: number; window_start: Date };

/**
 * DB-backed fixed-window limiter. Works across all server instances,
 * unlike an in-memory Map. Returns whether the key is over `max` hits
 * within `windowMs`.
 */
export async function hitLimit(key: string, max: number, windowMs: number) {
  const secs = Math.floor(windowMs / 1000);
  const res = await db.execute<Row>(sql`
    INSERT INTO auth_attempts AS a (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN a.window_start < now() - make_interval(secs => ${secs}) THEN 1 ELSE a.count + 1 END,
      window_start = CASE WHEN a.window_start < now() - make_interval(secs => ${secs}) THEN now() ELSE a.window_start END
    RETURNING count, window_start
  `);
  const row = res.rows[0];
  const elapsed = (Date.now() - new Date(row.window_start).getTime()) / 1000;
  return { limited: row.count > max, retryAfterSec: Math.max(1, Math.ceil(secs - elapsed)) };
}

export async function clearLimit(key: string) {
  await db.execute(sql`DELETE FROM auth_attempts WHERE key = ${key}`);
}

/**
 * Client IP. Trust x-forwarded-for only when the platform proxy overwrites it
 * (most hosts do); otherwise the limit can be bypassed by spoofing the header.
 */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function tooManyResponse(retryAfterSec: number) {
  const minutes = Math.ceil(retryAfterSec / 60);
  return Response.json(
    { error: `محاولات كثيرة. حاولي بعد ${minutes} دقيقة.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
