import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { pendingCount, sectionCounts } from "@/lib/resources";
import { DashboardShell } from "@/components/DashboardShell";
import { ToastProvider } from "@/components/Toast";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Seeding and the session lookup are independent — run them together.
  const [, user] = await Promise.all([ensureSeeded().catch(() => undefined), getCurrentUser()]);
  const [counts, pending] = await Promise.all([
    sectionCounts(user ? { id: user.id, role: user.role } : null),
    user?.role === "admin" ? pendingCount() : Promise.resolve(0),
  ]);
  // Only what the shell renders is serialised to the browser.
  const shellUser = user ? { id: user.id, name: user.name, role: user.role, school: user.school } : null;
  return (
    <ToastProvider>
      <DashboardShell user={shellUser} counts={counts} pending={pending}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
