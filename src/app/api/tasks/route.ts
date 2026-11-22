import { db } from "@/db";
import { teacherTasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const items = await db.select().from(teacherTasks).where(eq(teacherTasks.userId, user.id)).orderBy(asc(teacherTasks.done), desc(teacherTasks.createdAt));
  return Response.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 300);
  if (!title) return Response.json({ error: "اكتبي المهمة" }, { status: 400 });
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate ?? "")) ? String(body.dueDate) : null;
  const [item] = await db.insert(teacherTasks).values({ userId: user.id, title, dueDate }).returning();
  return Response.json({ item }, { status: 201 });
}
