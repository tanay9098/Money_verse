import { demoLessons, demoMissions } from "@/lib/content/demo";
import { validateLessons, validateMissions } from "@/lib/content/validate";
import type { ContentBundle } from "@/lib/types";

export type RemotePayload = {
  missions: unknown;
  lessons: unknown;
};

export async function resolveContent(
  projectId: string | undefined,
  fetchRemote: () => Promise<RemotePayload>,
  log: (message: string) => void = () => {},
): Promise<ContentBundle> {
  if (!projectId) {
    log("[MoneyVerse] Content source: demo. Sanity project id is not set.");
    return {
      source: "demo",
      reason: "Sanity project id is not configured. These are built-in demo lessons.",
      missions: demoMissions,
      lessons: demoLessons,
    };
  }

  try {
    const remote = await fetchRemote();
    const missions = validateMissions(remote.missions);
    const lessons = validateLessons(remote.lessons);
    if (missions.length === 0) {
      log("[MoneyVerse] Content source: demo. Sanity returned no valid missions.");
      return {
        source: "demo",
        reason: "The Sanity dataset has no valid missions yet. These are built-in demo lessons.",
        missions: demoMissions,
        lessons: lessons.length > 0 ? lessons : demoLessons,
      };
    }
    if (lessons.length === 0) {
      log("[MoneyVerse] Content source: sanity. No valid lessons were published, so demo lessons are shown.");
      return {
        source: "sanity",
        reason: "Missions loaded from Sanity. Demo lessons are shown until lessons are published.",
        missions,
        lessons: demoLessons,
      };
    }
    log("[MoneyVerse] Content source: sanity.");
    return {
      source: "sanity",
      reason: null,
      missions,
      lessons,
    };
  } catch {
    log("[MoneyVerse] Content source: demo. Sanity request failed.");
    return {
      source: "demo",
      reason: "Sanity could not be reached. These are built-in demo lessons.",
      missions: demoMissions,
      lessons: demoLessons,
    };
  }
}
