import { CHOICE_TAGS, DIFFICULTIES, ENGINES, type Lesson, type Mission } from "@/lib/types";

const SLUG = /^[a-z0-9-]{1,80}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, max = 800): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function intIn(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function validateLesson(raw: unknown): Lesson | null {
  if (!isRecord(raw)) return null;
  const slug = str(raw.slug, 80);
  const title = str(raw.title, 120);
  const summary = str(raw.summary, 240);
  const body = str(raw.body, 1200);
  const topic = str(raw.topic, 80);
  const ageMin = intIn(raw.ageMin, 8, 12);
  const ageMax = intIn(raw.ageMax, 8, 12);
  const order = intIn(raw.order, 1, 99);
  if (!slug || !SLUG.test(slug) || !title || !summary || !body || !topic || ageMin == null || ageMax == null || order == null) {
    return null;
  }
  if (ageMax < ageMin) return null;
  if (!isApprovedForPlay(raw.reviewStatus)) return null;
  return { id: slug, slug, title, summary, body, topic, ageMin, ageMax, order };
}

function isApprovedForPlay(status: unknown): boolean {
  return status == null || status === "approved";
}

export function validateMission(raw: unknown): Mission | null {
  if (!isRecord(raw)) return null;
  const slug = str(raw.slug, 80);
  const title = str(raw.title, 120);
  const summary = str(raw.summary, 240);
  const story = str(raw.story, 900);
  const learningGoal = str(raw.learningGoal, 240);
  const topic = str(raw.topic, 80);
  const ageMin = intIn(raw.ageMin, 8, 12);
  const ageMax = intIn(raw.ageMax, 8, 12);
  const order = intIn(raw.order, 1, 99);
  const difficulty = oneOf(raw.difficulty, DIFFICULTIES);
  const engine = oneOf(raw.engine, ENGINES);
  const startingCoins = intIn(raw.startingCoins, 0, 10000);
  const needsRequired = intIn(raw.needsRequired ?? 0, 0, 20);
  const successHeadline = str(raw.successHeadline, 160);
  const practiceHeadline = str(raw.practiceHeadline, 160);
  const lemonadeIntro = typeof raw.lemonadeIntro === "string" ? raw.lemonadeIntro.trim().slice(0, 600) : "";
  if (
    !slug ||
    !SLUG.test(slug) ||
    !title ||
    !summary ||
    !story ||
    !learningGoal ||
    !topic ||
    ageMin == null ||
    ageMax == null ||
    ageMax < ageMin ||
    order == null ||
    !difficulty ||
    !engine ||
    startingCoins == null ||
    needsRequired == null ||
    !successHeadline ||
    !practiceHeadline ||
    !isApprovedForPlay(raw.reviewStatus)
  ) {
    return null;
  }

  let goalAmount: number | null = null;
  if (raw.goalAmount !== null && raw.goalAmount !== undefined) {
    goalAmount = intIn(raw.goalAmount, 1, 100000);
    if (goalAmount == null) return null;
  }

  const rewards = validateRewards(raw.rewards);
  const quiz = validateQuiz(raw.quiz);
  if (!rewards || !quiz) return null;

  const steps = validateSteps(raw.steps);
  const supplies = validateSupplies(raw.supplies);
  const prices = validatePrices(raw.prices);
  if (!steps || !supplies || !prices) return null;

  if (engine === "choices" && steps.length < 1) return null;
  if (engine === "lemonade") {
    if (supplies.length < 1 || prices.length < 1) return null;
    if (!supplies.some((supply) => supply.cost <= startingCoins)) return null;
    if (!lemonadeIntro) return null;
  }

  return {
    id: slug,
    slug,
    title,
    summary,
    story,
    learningGoal,
    ageMin,
    ageMax,
    difficulty,
    topic,
    order,
    engine,
    startingCoins,
    goalAmount,
    needsRequired,
    successHeadline,
    practiceHeadline,
    steps: engine === "choices" ? steps : [],
    supplies: engine === "lemonade" ? supplies : [],
    prices: engine === "lemonade" ? prices : [],
    lemonadeIntro: engine === "lemonade" ? lemonadeIntro : "",
    quiz,
    rewards,
  };
}

function validateRewards(raw: unknown): Mission["rewards"] | null {
  if (!isRecord(raw)) return null;
  const xp = intIn(raw.xp, 0, 500);
  const coins = intIn(raw.coins, 0, 500);
  const badgeId = str(raw.badgeId, 80);
  const badgeName = str(raw.badgeName, 80);
  const badgeDescription = str(raw.badgeDescription, 200);
  if (xp == null || coins == null || !badgeId || !SLUG.test(badgeId) || !badgeName || !badgeDescription) return null;
  return { xp, coins, badgeId, badgeName, badgeDescription };
}

function validateQuiz(raw: unknown): Mission["quiz"] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 6) return null;
  const questions = [];
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = str(item.id, 80);
    const prompt = str(item.prompt, 300);
    if (!id || !SLUG.test(id) || !prompt || !Array.isArray(item.choices) || item.choices.length < 2 || item.choices.length > 4) {
      return null;
    }
    const choices = [];
    for (const choice of item.choices) {
      if (!isRecord(choice)) return null;
      const choiceId = str(choice.id, 80);
      const label = str(choice.label, 200);
      const explanation = str(choice.explanation, 400);
      if (!choiceId || !SLUG.test(choiceId) || !label || !explanation || typeof choice.correct !== "boolean") return null;
      choices.push({ id: choiceId, label, explanation, correct: choice.correct });
    }
    if (choices.filter((choice) => choice.correct).length !== 1) return null;
    questions.push({ id, prompt, choices });
  }
  return questions;
}

function validateSteps(raw: unknown): Mission["steps"] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 8) return null;
  const steps = [];
  const stepIds = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = str(item.id, 80);
    const title = str(item.title, 80);
    const prompt = str(item.prompt, 400);
    const incomeLabel = typeof item.incomeLabel === "string" ? item.incomeLabel.trim().slice(0, 120) : "";
    const income = intIn(item.income ?? 0, 0, 1000);
    if (!id || !SLUG.test(id) || stepIds.has(id) || !title || !prompt || income == null) return null;
    if (!Array.isArray(item.choices) || item.choices.length < 2 || item.choices.length > 4) return null;
    stepIds.add(id);
    const choices = [];
    const choiceIds = new Set<string>();
    for (const choice of item.choices) {
      if (!isRecord(choice)) return null;
      const choiceId = str(choice.id, 80);
      const label = str(choice.label, 120);
      const detail = str(choice.detail, 240);
      const feedbackTitle = str(choice.feedbackTitle, 120);
      const feedbackBody = str(choice.feedbackBody, 500);
      const coinDelta = intIn(choice.coinDelta, -1000, 1000);
      const bonusCoins = intIn(choice.bonusCoins ?? 0, 0, 1000);
      const tag = oneOf(choice.tag, CHOICE_TAGS);
      if (
        !choiceId ||
        !SLUG.test(choiceId) ||
        choiceIds.has(choiceId) ||
        !label ||
        !detail ||
        !feedbackTitle ||
        !feedbackBody ||
        coinDelta == null ||
        bonusCoins == null ||
        !tag ||
        typeof choice.meetsNeed !== "boolean"
      ) {
        return null;
      }
      choiceIds.add(choiceId);
      choices.push({
        id: choiceId,
        label,
        detail,
        coinDelta,
        bonusCoins,
        tag,
        meetsNeed: choice.meetsNeed,
        feedbackTitle,
        feedbackBody,
      });
    }
    steps.push({ id, title, prompt, income, incomeLabel, choices });
  }
  return steps;
}

function validateSupplies(raw: unknown): Mission["supplies"] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 6) return null;
  const supplies = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = str(item.id, 80);
    const name = str(item.name, 80);
    const detail = str(item.detail, 240);
    const cost = intIn(item.cost, 0, 10000);
    const cups = intIn(item.cups, 1, 1000);
    if (!id || !SLUG.test(id) || ids.has(id) || !name || !detail || cost == null || cups == null) return null;
    ids.add(id);
    supplies.push({ id, name, detail, cost, cups });
  }
  return supplies;
}

function validatePrices(raw: unknown): Mission["prices"] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 6) return null;
  const prices = [];
  const seen = new Set<number>();
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const price = intIn(item.price, 1, 1000);
    const customers = intIn(item.customers, 0, 1000);
    const note = str(item.note, 200);
    if (price == null || customers == null || !note || seen.has(price)) return null;
    seen.add(price);
    prices.push({ price, customers, note });
  }
  return prices;
}

export function validateMissions(raw: unknown): Mission[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => validateMission(item))
    .filter((mission): mission is Mission => mission !== null)
    .sort((a, b) => a.order - b.order);
}

export function validateLessons(raw: unknown): Lesson[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => validateLesson(item))
    .filter((lesson): lesson is Lesson => lesson !== null)
    .sort((a, b) => a.order - b.order);
}
