import { Dashboard } from "@/components/game/dashboard";
import { isGoogleAuthConfigured } from "@/lib/auth-ready";
import { loadContent } from "@/lib/content/load";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await loadContent();
  return <Dashboard content={content} authConfigured={isGoogleAuthConfigured()} />;
}
