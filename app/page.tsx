import { Dashboard } from "@/components/game/dashboard";
import { loadContent } from "@/lib/content/load";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await loadContent();
  return <Dashboard content={content} />;
}
