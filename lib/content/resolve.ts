import { demoLessons, demoMissions } from "@/lib/content/demo";
import { validateLessons, validateMissions } from "@/lib/content/validate";
import type { ContentBundle } from "@/lib/types";

export type RemotePayload = {
  missions: unknown;
  lessons: unknown;
};

export type ResolveOptions = {
  allowDemoFallback: boolean;
};

const demoBundle = {
  source: "demo" as const,
  reason: "Sanity project id is not configured. These are built-in demo lessons.",
  missions: demoMissions,
  lessons: demoLessons,
};

export async function resolveContent(
  projectId: string | undefined,
  fetchRemote: () => Promise<RemotePayload>,
  log: (message: string) => void = () => {},
  options: ResolveOptions = { allowDemoFallback: true },
): Promise<ContentBundle> {
  if (!projectId) {
    if (!options.allowDemoFallback) {
      log("[MoneyVerse] Content source: unavailable. Production has no Sanity project id.");
      return {
        source: "unavailable",
        reason: "This deployment has no Sanity project id, so approved lessons are not loaded.",
        missions: [],
        lessons: [],
      };
    }
    log("[MoneyVerse] Content source: demo. Sanity project id is not set.");
    return demoBundle;
  }

  try {
    const remote = await fetchRemote();
    const missions = validateMissions(remote.missions);
    const lessons = validateLessons(remote.lessons);
    if (missions.length === 0) {
      if (!options.allowDemoFallback) {
        log("[MoneyVerse] Content source: unavailable. Sanity returned no approved missions.");
        return {
          source: "unavailable",
          reason: "No approved missions are published in Sanity yet. Approve and publish them in Studio.",
          missions: [],
          lessons,
        };
      }
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
        reason: options.allowDemoFallback
          ? "Missions loaded from Sanity. Demo lessons are shown until lessons are published."
          : "Missions loaded from Sanity. No approved lessons are published yet.",
        missions,
        lessons: options.allowDemoFallback ? demoLessons : [],
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
    if (!options.allowDemoFallback) {
      log("[MoneyVerse] Content source: unavailable. Sanity request failed.");
      return {
        source: "unavailable",
        reason: "Sanity could not be reached, so approved lessons are not loaded.",
        missions: [],
        lessons: [],
      };
    }
    log("[MoneyVerse] Content source: demo. Sanity request failed.");
    return {
      source: "demo",
      reason: "Sanity could not be reached. These are built-in demo lessons.",
      missions: demoMissions,
      lessons: demoLessons,
    };
  }
}
