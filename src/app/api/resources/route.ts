import { db } from "@/db";
import { resources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getResource, listResources, PAGE_SIZE, validateResourceInput } from "@/lib/resources";
import { GRADE_GROUPS, isFileTypeKey, isSection, SCHOOL_SUBJECTS } from "@/lib/sections";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const viewer = await getCurrentUser();
  const url = new URL(req.url);
  const sectionParam = url.searchParams.get("section") ?? undefined;
  const section = sectionParam && isSection(sectionParam) ? sectionParam : undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const level = url.searchParams.get("level")?.trim() || undefined;
  const typeParam = url.searchParams.get("type") ?? "";
  const type = isFileTypeKey(typeParam) ? typeParam : undefined;
  const subjectParam = url.searchParams.get("subject") ?? "";
  const subject = SCHOOL_SUBJECTS.includes(subjectParam) ? subjectParam : undefined;
  const gradeParam = url.searchParams.get("grade") ?? "";
  const gradeGroup = GRADE_GROUPS.includes(gradeParam) ? gradeParam : undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const rows = await listResources(
    { section, q, level, type, subject, gradeGroup, limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE },
    viewer ? { id: viewer.id, role: viewer.role } : null,
  );
  const hasMore = rows.length > PAGE_SIZE;
  return Response.json({ items: rows.slice(0, PAGE_SIZE), page, hasMore });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { data, error } = validateResourceInput(body);
  if (!data) return Response.json({ error }, { status: 400 });
  const [row] = await db
    .insert(resources)
    .values({ ...data, authorId: user.id, status: user.role === "admin" ? "approved" : "pending" })
    .returning({ id: resources.id });
  const item = await getResource(row.id);
  return Response.json({ item }, { status: 201 });
}
