import type { Metadata } from "next";
import { PromptBank } from "@/components/PromptBank";

export const metadata: Metadata = { title: "بنك البرومبتات | منصة معلمات مصر - تنمية 2026" };

export default function PromptsPage() {
  return <PromptBank />;
}
