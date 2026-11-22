import { db } from "@/db";
import { teacherTasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { asc, desc, eq } from "drizzle-orm";
import { ClassroomTools } from "@/components/ClassroomTools";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const user = await getCurrentUser();
  const tasks = user
    ? await db.select().from(teacherTasks).where(eq(teacherTasks.userId, user.id)).orderBy(asc(teacherTasks.done), desc(teacherTasks.createdAt))
    : [];
  return <ClassroomTools loggedIn={!!user} initialTasks={tasks} />;
}
