import { db } from "@/db";
import { attachments, bookmarks, comments, resources, users, type Section } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { AI_TOOLS, getSection, GRADE_GROUPS, SCHOOL_SUBJECTS, type BriefAttachment, type FileTypeKey } from "./sections";
import type { SQL } from "drizzle-orm";

export type ResourceDTO = {
  id: number;
  section: Section;
  title: string;
  summary: string;
  content: string;
  level: string;
  subject: string;
  gradeGroup: string;
  tags: string[];
  aiTool: string | null;
  featured: boolean;
  status: "pending" | "approved";
  authorId: number;
  authorName: string;
  authorGovernorate: string | null;
  downloads: number;
  commentCount: number;
  attachmentCount: number;
  coverImageId: number | null;
  files: BriefAttachment[];
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Viewer = { id: number; role: "admin" | "teacher" } | null;

export function visibilityCondition(viewer: Viewer) {
  if (viewer?.role === "admin") return undefined;
  if (viewer) return or(eq(resources.status, "approved"), eq(resources.authorId, viewer.id));
  return eq(resources.status, "approved");
}

export type AttachmentDTO = {
  id: number;
  resourceId: number;
  kind: "file" | "link";
  name: string;
  mimeType: string;
  size: number;
  url: string | null;
  uploadedBy: number;
  createdAt: string;
};

export type CommentDTO = {
  id: number;
  resourceId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

const commentCountSq = sql<number>`(select count(*)::int from ${comments} where ${comments.resourceId} = ${resources.id})`;
const attachmentCountSq = sql<number>`(select count(*)::int from ${attachments} where ${attachments.resourceId} = ${resources.id})`;
const coverImageSq = sql<number | null>`(select ${attachments.id} from ${attachments} where ${attachments.resourceId} = ${resources.id} and ${attachments.kind} = 'file' and ${attachments.mimeType} like 'image/%' order by ${attachments.createdAt} asc limit 1)`;

const filesSq = sql<BriefAttachment[]>`(select coalesce(json_agg(json_build_object('id', a.id, 'kind', a.kind, 'mime', a.mime_type, 'name', a.name, 'size', a.size, 'url', a.url) order by a.created_at), '[]'::json) from attachments a where a.resource_id = ${resources.id})`;

/** SQL predicates over the attachments table for each file-type filter. */
export const TYPE_CONDITIONS: Record<FileTypeKey, SQL> = {
  pdf: sql`${attachments.mimeType} = 'application/pdf'`,
  word: sql`(${attachments.mimeType} like '%word%')`,
  ppt: sql`(${attachments.mimeType} like '%presentation%' or ${attachments.mimeType} like '%powerpoint%')`,
  video: sql`(${attachments.mimeType} like 'video/%' or (${attachments.kind} = 'link' and ${attachments.url} ~* 'youtu\.?be'))`,
  image: sql`${attachments.mimeType} like 'image/%'`,
  html: sql`${attachments.mimeType} = 'text/html'`,
  link: sql`(${attachments.kind} = 'link' and not (${attachments.url} ~* 'youtu\.?be'))`,
};

const downloadsSq = sql<number>`(select coalesce(sum(${attachments.downloads}), 0)::int from ${attachments} where ${attachments.resourceId} = ${resources.id})`;

/** Per-viewer "saved" flag computed inside the same query (no extra round-trip). */
function bookmarkedSq(viewerId: number | null | undefined) {
  return viewerId
    ? sql<boolean>`exists(select 1 from ${bookmarks} where ${bookmarks.resourceId} = ${resources.id} and ${bookmarks.userId} = ${viewerId})`
    : sql<boolean>`false`;
}

const resourceSelect = {
  id: resources.id,
  section: resources.section,
  title: resources.title,
  summary: resources.summary,
  content: resources.content,
  level: resources.level,
  subject: resources.subject,
  gradeGroup: resources.gradeGroup,
  tags: resources.tags,
  aiTool: resources.aiTool,
  featured: resources.featured,
  status: resources.status,
  authorId: resources.authorId,
  authorName: users.name,
  authorGovernorate: users.governorate,
  downloads: downloadsSq,
  commentCount: commentCountSq,
  attachmentCount: attachmentCountSq,
  coverImageId: coverImageSq,
  files: filesSq,
  createdAt: resources.createdAt,
  updatedAt: resources.updatedAt,
};

function toDTO(row: {
  id: number;
  section: Section;
  title: string;
  summary: string;
  content: string;
  level: string;
  subject: string;
  gradeGroup: string;
  tags: string[];
  aiTool: string | null;
  featured: boolean;
  status: "pending" | "approved";
  authorId: number;
  authorName: string;
  authorGovernorate: string | null;
  downloads: number;
  commentCount: number;
  attachmentCount: number;
  coverImageId: number | null;
  files: BriefAttachment[];
  bookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ResourceDTO {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const PAGE_SIZE = 24;

export async function listResources(
  opts: { section?: Section; q?: string; level?: string; limit?: number; offset?: number; status?: "pending" | "approved"; type?: FileTypeKey; authorId?: number; subject?: string; gradeGroup?: string },
  viewer: Viewer = null,
) {
  const conditions = [];
  if (opts.gradeGroup) conditions.push(eq(resources.gradeGroup, opts.gradeGroup));
  if (opts.subject) conditions.push(eq(resources.subject, opts.subject));
  if (opts.authorId) conditions.push(eq(resources.authorId, opts.authorId));
  if (opts.type) {
    conditions.push(sql`exists (select 1 from ${attachments} where ${attachments.resourceId} = ${resources.id} and ${TYPE_CONDITIONS[opts.type]})`);
  }
  const vis = visibilityCondition(viewer);
  if (vis) conditions.push(vis);
  if (opts.status) conditions.push(eq(resources.status, opts.status));
  if (opts.section) conditions.push(eq(resources.section, opts.section));
  if (opts.level) conditions.push(eq(resources.level, opts.level));
  if (opts.q) {
    const pattern = `%${opts.q}%`;
    conditions.push(
      or(
        ilike(resources.title, pattern),
        ilike(resources.summary, pattern),
        ilike(resources.content, pattern),
        sql`array_to_string(${resources.tags}, ' ') ilike ${pattern}`,
      ),
    );
  }
  const rows = await db
    .select({ ...resourceSelect, bookmarked: bookmarkedSq(viewer?.id) })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.authorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(resources.featured), desc(resources.createdAt), desc(resources.id))
    .limit(opts.limit ?? PAGE_SIZE)
    .offset(opts.offset ?? 0);
  return rows.map(toDTO);
}

export async function countResources(opts: { section?: Section; authorId?: number; status?: "pending" | "approved" } = {}, viewer: Viewer = null) {
  const conditions = [];
  const vis = visibilityCondition(viewer);
  if (vis) conditions.push(vis);
  if (opts.status) conditions.push(eq(resources.status, opts.status));
  if (opts.section) conditions.push(eq(resources.section, opts.section));
  if (opts.authorId) conditions.push(eq(resources.authorId, opts.authorId));
  const [row] = await db
    .select({ value: count() })
    .from(resources)
    .where(conditions.length ? and(...conditions) : undefined);
  return row.value;
}

export async function listAttachments(resourceId: number): Promise<AttachmentDTO[]> {
  const rows = await db
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
    .where(eq(attachments.resourceId, resourceId))
    .orderBy(attachments.createdAt);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getResource(id: number, viewerId?: number | null): Promise<ResourceDTO | null> {
  const rows = await db
    .select({ ...resourceSelect, bookmarked: bookmarkedSq(viewerId) })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.authorId))
    .where(eq(resources.id, id))
    .limit(1);
  return rows[0] ? toDTO(rows[0]) : null;
}

export async function listComments(resourceId: number): Promise<CommentDTO[]> {
  const rows = await db
    .select({
      id: comments.id,
      resourceId: comments.resourceId,
      authorId: comments.authorId,
      authorName: users.name,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.resourceId, resourceId))
    .orderBy(comments.createdAt);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function sectionCounts(viewer: Viewer = null): Promise<Record<string, number>> {
  const rows = await db
    .select({ section: resources.section, value: count() })
    .from(resources)
    .where(visibilityCondition(viewer))
    .groupBy(resources.section);
  return Object.fromEntries(rows.map((r) => [r.section, r.value]));
}

export async function dashboardStats() {
  const [[r], [c], [u], [a]] = await Promise.all([
    db.select({ value: count() }).from(resources).where(eq(resources.status, "approved")),
    db.select({ value: count() }).from(comments),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(attachments),
  ]);
  return { resources: r.value, comments: c.value, users: u.value, attachments: a.value };
}

export async function typeCounts(section: Section, viewer: Viewer = null): Promise<Record<"all" | FileTypeKey, number>> {
  const c = (k: FileTypeKey) => sql<number>`count(distinct ${resources.id}) filter (where ${TYPE_CONDITIONS[k]})::int`;
  const vis = visibilityCondition(viewer);
  const [row] = await db
    .select({
      all: sql<number>`count(distinct ${resources.id})::int`,
      pdf: c("pdf"), word: c("word"), ppt: c("ppt"), video: c("video"), image: c("image"), html: c("html"), link: c("link"),
    })
    .from(resources)
    .leftJoin(attachments, eq(attachments.resourceId, resources.id))
    .where(vis ? and(eq(resources.section, section), vis) : eq(resources.section, section));
  return row;
}

export async function pendingCount() {
  const [row] = await db.select({ value: count() }).from(resources).where(eq(resources.status, "pending"));
  return row.value;
}

export type ResourceInput = {
  section: Section;
  title: string;
  summary: string;
  content: string;
  level: string;
  subject: string;
  gradeGroup: string;
  tags: string[];
  aiTool: string | null;
  featured: boolean;
};

export function validateResourceInput(body: unknown, fixedSection?: Section): { data?: ResourceInput; error?: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const sectionSlug = fixedSection ?? String(b.section ?? "");
  const section = getSection(sectionSlug);
  if (!section) return { error: "القسم غير صحيح" };
  const title = String(b.title ?? "").trim();
  if (title.length < 3) return { error: "العنوان يجب أن يكون 3 أحرف على الأقل" };
  if (title.length > 200) return { error: "العنوان طويل جداً" };
  const summary = String(b.summary ?? "").trim();
  const content = String(b.content ?? "").trim();
  const level = String(b.level ?? "").trim();
  const subjectRaw = String(b.subject ?? "").trim();
  const subject = SCHOOL_SUBJECTS.includes(subjectRaw) ? subjectRaw : "";
  const gradeRaw = String(b.gradeGroup ?? "").trim();
  const gradeGroup = GRADE_GROUPS.includes(gradeRaw) ? gradeRaw : "";
  const rawTags = Array.isArray(b.tags) ? b.tags : String(b.tags ?? "").split(",");
  const tags = rawTags
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 10);
  const aiToolRaw = String(b.aiTool ?? "").trim();
  const aiTool = aiToolRaw && AI_TOOLS.includes(aiToolRaw) && aiToolRaw !== "بدون أداة" ? aiToolRaw : null;
  const featured = Boolean(b.featured);
  return { data: { section: section.slug, title, summary, content, level, subject, gradeGroup, tags, aiTool, featured } };
}

export async function subjectCounts(section: Section, viewer: Viewer = null): Promise<Record<string, number>> {
  const vis = visibilityCondition(viewer);
  const rows = await db
    .select({ subject: resources.subject, value: count() })
    .from(resources)
    .where(vis ? and(eq(resources.section, section), vis) : eq(resources.section, section))
    .groupBy(resources.subject);
  return Object.fromEntries(rows.filter((r) => r.subject).map((r) => [r.subject, r.value]));
}

export async function gradeCounts(section: Section, viewer: Viewer = null): Promise<Record<string, number>> {
  const vis = visibilityCondition(viewer);
  const rows = await db
    .select({ g: resources.gradeGroup, value: count() })
    .from(resources)
    .where(vis ? and(eq(resources.section, section), vis) : eq(resources.section, section))
    .groupBy(resources.gradeGroup);
  return Object.fromEntries(rows.filter((r) => r.g).map((r) => [r.g, r.value]));
}

/** Resources the user saved, newest bookmark first (respects visibility). */
export async function listBookmarked(viewer: { id: number; role: "admin" | "teacher" }, limit = 100): Promise<ResourceDTO[]> {
  const vis = visibilityCondition(viewer);
  const rows = await db
    .select({ ...resourceSelect, bookmarked: sql<boolean>`true` })
    .from(bookmarks)
    .innerJoin(resources, eq(resources.id, bookmarks.resourceId))
    .innerJoin(users, eq(users.id, resources.authorId))
    .where(vis ? and(eq(bookmarks.userId, viewer.id), vis) : eq(bookmarks.userId, viewer.id))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit);
  return rows.map(toDTO);
}
