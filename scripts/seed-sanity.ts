import { createClient, type IdentifiedSanityDocumentStub } from "@sanity/client";
import { demoLessons, demoMissions } from "../lib/content/demo";
import type { Lesson, Mission } from "../lib/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Add it to .env.local. Never commit the token.`);
  }
  return value;
}

function missionDocument(mission: Mission) {
  return {
    _id: `mission-${mission.slug}`,
    _type: "mission",
    reviewStatus: "approved",
    reviewerNote: "Seeded as approved so the town can load it.",
    title: mission.title,
    slug: { _type: "slug", current: mission.slug },
    summary: mission.summary,
    story: mission.story,
    learningGoal: mission.learningGoal,
    ageMin: mission.ageMin,
    ageMax: mission.ageMax,
    difficulty: mission.difficulty,
    topic: mission.topic,
    order: mission.order,
    engine: mission.engine,
    startingCoins: mission.startingCoins,
    goalAmount: mission.goalAmount,
    needsRequired: mission.needsRequired,
    successHeadline: mission.successHeadline,
    practiceHeadline: mission.practiceHeadline,
    lemonadeIntro: mission.lemonadeIntro,
    steps: mission.steps.map((step) => ({
      _key: step.id,
      _type: "missionStep",
      id: step.id,
      title: step.title,
      prompt: step.prompt,
      income: step.income,
      incomeLabel: step.incomeLabel,
      choices: step.choices.map((choice) => ({
        _key: choice.id,
        _type: "choiceOption",
        ...choice,
      })),
    })),
    supplies: mission.supplies.map((supply) => ({
      _key: supply.id,
      _type: "supplyOption",
      ...supply,
    })),
    prices: mission.prices.map((price) => ({
      _key: `price-${price.price}`,
      _type: "priceOption",
      ...price,
    })),
    quiz: mission.quiz.map((question) => ({
      _key: question.id,
      _type: "quizQuestion",
      id: question.id,
      prompt: question.prompt,
      choices: question.choices.map((choice) => ({
        _key: choice.id,
        _type: "quizChoice",
        ...choice,
      })),
    })),
    rewards: { _type: "reward", ...mission.rewards },
  };
}

function lessonDocument(lesson: Lesson) {
  return {
    _id: `lesson-${lesson.slug}`,
    _type: "lesson",
    reviewStatus: "approved",
    reviewerNote: "Seeded as approved so the town can load it.",
    title: lesson.title,
    slug: { _type: "slug", current: lesson.slug },
    summary: lesson.summary,
    body: lesson.body,
    topic: lesson.topic,
    ageMin: lesson.ageMin,
    ageMax: lesson.ageMax,
    order: lesson.order,
  };
}

async function main() {
  const projectId = requireEnv("NEXT_PUBLIC_SANITY_PROJECT_ID");
  const token = requireEnv("SANITY_API_WRITE_TOKEN");
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01",
    token,
    useCdn: false,
  });

  const documents = [...demoMissions.map(missionDocument), ...demoLessons.map(lessonDocument)];
  for (const document of documents) {
    await client.createOrReplace(document as IdentifiedSanityDocumentStub);
    console.log(`Published ${document._id}`);
  }
  console.log("Demo lessons and missions are in Sanity. Publish state is the document itself (createOrReplace writes the published document).");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed";
  console.error(message);
  process.exitCode = 1;
});
