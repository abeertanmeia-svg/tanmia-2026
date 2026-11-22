import type { Metadata } from "next";
import { GuideViewer } from "@/components/GuideViewer";
import { GUIDE_TITLE } from "@/lib/guide";

export const metadata: Metadata = { title: `${GUIDE_TITLE} | معلمات مبدعات` };

export default function GuidePage() {
  return <GuideViewer />;
}
