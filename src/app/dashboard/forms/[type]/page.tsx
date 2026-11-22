import { notFound } from "next/navigation";
import { getForm } from "@/lib/forms";
import { PublicForm } from "@/components/PublicForm";

export const dynamic = "force-dynamic";

export default async function FormPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const form = getForm(type);
  if (!form) notFound();
  return <PublicForm form={form} />;
}
