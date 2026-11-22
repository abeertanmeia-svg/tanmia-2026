import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AssistantClient } from "@/components/AssistantClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مساعد المعلمة الذكي | معلمات مبدعات بالذكاء الاصطناعي" };

export default async function AssistantPage() {
  const user = await getCurrentUser();
  const aiEnabled = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  return (
    <Suspense>
      <AssistantClient loggedIn={!!user} aiEnabled={aiEnabled} />
    </Suspense>
  );
}
