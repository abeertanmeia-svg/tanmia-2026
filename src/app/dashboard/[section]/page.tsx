import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { countResources, gradeCounts, listResources, PAGE_SIZE, subjectCounts, typeCounts } from "@/lib/resources";
import { getSection } from "@/lib/sections";
import { SectionBoard } from "@/components/SectionBoard";

export const dynamic = "force-dynamic";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (!section) notFound();
  const user = await getCurrentUser();
  const viewer = user ? { id: user.id, role: user.role } : null;
  const [rows, total, counts, subjects, grades] = await Promise.all([
    listResources({ section: section.slug, limit: PAGE_SIZE + 1 }, viewer),
    countResources({ section: section.slug }, viewer),
    typeCounts(section.slug, viewer),
    subjectCounts(section.slug, viewer),
    gradeCounts(section.slug, viewer),
  ]);
  const items = rows.slice(0, PAGE_SIZE);
  return (
    <Suspense>
      <SectionBoard
        section={section}
        initialItems={items}
        initialHasMore={rows.length > PAGE_SIZE}
        totalCount={total}
        typeCounts={counts}
        subjectCounts={subjects}
        gradeCounts={grades}
        currentUser={user ? { id: user.id, name: user.name, role: user.role } : null}
      />
    </Suspense>
  );
}
