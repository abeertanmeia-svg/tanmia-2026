import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
  boolean,
  customType,
  index,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const sectionEnum = pgEnum("section", [
  "preparation",
  "literacy",
  "multilevel",
  "classroom",
  "strategies",
  "admin",
  "exchange",
  "aids",
  "games",
  "inspiration",
  "professional",
  "ai",
  "stations",
  "assessment",
]);

export const resourceStatusEnum = pgEnum("resource_status", ["pending", "approved"]);
export const formTypeEnum = pgEnum("form_type", ["teacher", "ngo", "student", "parent", "feedback"]);
export const submissionStatusEnum = pgEnum("submission_status", ["new", "reviewed"]);

export const attachmentKindEnum = pgEnum("attachment_kind", ["file", "link"]);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const roleEnum = pgEnum("role", ["admin", "teacher"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("teacher"),
  school: text("school"),
  governorate: text("governorate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  section: sectionEnum("section").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  content: text("content").notNull().default(""),
  level: text("level").notNull().default(""),
  subject: text("subject").notNull().default(""),
  gradeGroup: text("grade_group").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  aiTool: text("ai_tool"),
  featured: boolean("featured").notNull().default(false),
  status: resourceStatusEnum("status").notNull().default("approved"),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("resources_section_created_idx").on(t.section, t.createdAt)]);

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  kind: attachmentKindEnum("kind").notNull().default("file"),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  size: integer("size").notNull().default(0),
  url: text("url"),
  data: bytea("data"),
  downloads: integer("downloads").notNull().default(0),
  uploadedBy: integer("uploaded_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("attachments_resource_idx").on(t.resourceId)]);

export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formType: formTypeEnum("form_type").notNull(),
  data: jsonb("data").$type<Record<string, string>>().notNull(),
  status: submissionStatusEnum("status").notNull().default("new"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("form_submissions_type_idx").on(t.formType, t.createdAt)]);

export const teacherTasks = pgTable("teacher_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("teacher_tasks_user_idx").on(t.userId)]);

export const appStatusEnum = pgEnum("app_status", ["not_opened", "testing", "tested", "broken", "duplicate", "unavailable", "no_link"]);

export type AppChecks = { open: boolean; navigate: boolean; save: boolean; reopen: boolean; print: boolean; share: boolean };

/** سجل متابعة التطبيقات — inventory of the initiative's apps, hosts and files. Rows are archived, never deleted. */
export const appRegistry = pgTable("app_registry", {
  id: serial("id").primaryKey(),
  groupKey: text("group_key").notNull(),
  name: text("name").notNull(),
  ref: text("ref").notNull().default(""),
  url: text("url"),
  purpose: text("purpose").notNull().default(""),
  status: appStatusEnum("status").notNull().default("not_opened"),
  checks: jsonb("checks").$type<AppChecks>().notNull().default({ open: false, navigate: false, save: false, reopen: false, print: false, share: false }),
  tested: text("tested").notNull().default(""),
  nextStep: text("next_step").notNull().default(""),
  userReport: text("user_report").notNull().default(""),
  isPublic: boolean("is_public").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appEvents = pgTable("app_events", {
  id: serial("id").primaryKey(),
  appId: integer("app_id")
    .notNull()
    .references(() => appRegistry.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("app_events_app_idx").on(t.appId, t.createdAt)]);

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("bookmarks_user_resource_uq").on(t.userId, t.resourceId)]);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type AppRow = typeof appRegistry.$inferSelect;
export type AppEvent = typeof appEvents.$inferSelect;
export type TeacherTask = typeof teacherTasks.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type FormType = (typeof formTypeEnum.enumValues)[number];
export type Section = (typeof sectionEnum.enumValues)[number];

export const authAttempts = pgTable("auth_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});
