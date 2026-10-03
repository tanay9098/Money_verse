import { notFound } from "next/navigation";
import { MissionExperience } from "@/components/game/mission-experience";
import { isGoogleAuthConfigured } from "@/lib/auth-ready";
import { loadContent } from "@/lib/content/load";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadContent();
  const mission = content.missions.find((item) => item.slug === slug);
  if (!mission) notFound();
  return <MissionExperience mission={mission} authConfigured={isGoogleAuthConfigured()} />;
}
