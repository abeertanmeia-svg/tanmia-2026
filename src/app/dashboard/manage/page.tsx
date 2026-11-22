import { redirect } from "next/navigation";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { listResources } from "@/lib/resources";
import { desc } from "drizzle-orm";
import { AdminPanel } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/manage");
  if (user.role !== "admin") redirect("/dashboard");
  const [pending, submissions] = await Promise.all([
    listResources({ status: "pending", limit: 200 }, { id: user.id, role: "admin" }),
    db.select().from(formSubmissions).orderBy(desc(formSubmissions.createdAt)).limit(500),
  ]);
  return (
    <AdminPanel
      pending={pending}
      submissions={submissions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
    />
  );
}
