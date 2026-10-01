import { applyCoins, calculateLemonade } from "@/lib/finance";
import type {
  ChoiceOption,
  ChoiceSession,
  LemonadeResult,
  Mission,
  MissionOutcome,
  Stars,
} from "@/lib/types";

export type ChoiceFailure = "invalid_choice" | "insufficient_funds" | "invalid_amount";

export function beginChoiceMission(mission: Mission): ChoiceSession {
  const income = mission.steps[0]?.income ?? 0;
  const applied = applyCoins(mission.startingCoins, income);
  return {
    balance: applied.ok ? applied.balance : mission.startingCoins,
    stepIndex: 0,
    history: [],
    needsMet: 0,
    wantsChosen: 0,
    phase: mission.steps.length === 0 ? "results" : "playing",
    pending: null,
  };
}

export function replayChoiceSession(mission: Mission): ChoiceSession {
  return beginChoiceMission(mission);
}

export function canAffordChoice(balance: number, choice: ChoiceOption): boolean {
  if (!Number.isInteger(balance) || !Number.isInteger(choice.coinDelta)) return false;
  if (choice.coinDelta < 0 && balance + choice.coinDelta < 0) return false;
  return true;
}

export function applyChoice(
  mission: Mission,
  session: ChoiceSession,
  choiceId: string,
): { ok: true; session: ChoiceSession } | { ok: false; reason: ChoiceFailure; session: ChoiceSession } {
  if (session.phase !== "playing") {
    return { ok: false, reason: "invalid_choice", session };
  }
  const step = mission.steps[session.stepIndex];
  if (!step) {
    return { ok: false, reason: "invalid_choice", session };
  }
  const choice = step.choices.find((item) => item.id === choiceId);
  if (!choice) {
    return { ok: false, reason: "invalid_choice", session };
  }
  if (!canAffordChoice(session.balance, choice)) {
    return { ok: false, reason: "insufficient_funds", session };
  }

  const spent = applyCoins(session.balance, choice.coinDelta);
  if (!spent.ok) {
    return { ok: false, reason: spent.reason, session };
  }
  const withBonus = applyCoins(spent.balance, choice.bonusCoins);
  if (!withBonus.ok) {
    return { ok: false, reason: withBonus.reason, session };
  }

  const entry = {
    stepId: step.id,
    choiceId: choice.id,
    label: choice.label,
    coinDelta: choice.coinDelta,
    bonusCoins: choice.bonusCoins,
    balanceAfter: withBonus.balance,
    tag: choice.tag,
    meetsNeed: choice.meetsNeed,
    feedbackTitle: choice.feedbackTitle,
    feedbackBody: choice.feedbackBody,
  };

  return {
    ok: true,
    session: {
      ...session,
      balance: withBonus.balance,
      history: [...session.history, entry],
      needsMet: session.needsMet + (choice.meetsNeed ? 1 : 0),
      wantsChosen: session.wantsChosen + (choice.tag === "want" ? 1 : 0),
      phase: "feedback",
      pending: entry,
    },
  };
}

export function continueAfterFeedback(mission: Mission, session: ChoiceSession): ChoiceSession {
  if (session.phase !== "feedback") return session;
  const nextIndex = session.stepIndex + 1;
  if (nextIndex >= mission.steps.length) {
    return { ...session, phase: "results", pending: null };
  }
  const income = mission.steps[nextIndex]?.income ?? 0;
  const applied = applyCoins(session.balance, income);
  return {
    ...session,
    stepIndex: nextIndex,
    balance: applied.ok ? applied.balance : session.balance,
    phase: "playing",
    pending: null,
  };
}

export function playChoices(
  mission: Mission,
  choiceIds: string[],
): { ok: true; session: ChoiceSession } | { ok: false; reason: ChoiceFailure; session: ChoiceSession } {
  let session = beginChoiceMission(mission);
  for (const choiceId of choiceIds) {
    const applied = applyChoice(mission, session, choiceId);
    if (!applied.ok) return applied;
    if (applied.session.stepIndex >= mission.steps.length - 1) {
      return { ok: true, session: { ...applied.session, phase: "results", pending: null } };
    }
    session = continueAfterFeedback(mission, applied.session);
  }
  return { ok: true, session };
}

function starsFromGoal(balance: number, goal: number): { stars: Stars; succeeded: boolean } {
  if (balance >= goal) return { stars: 3, succeeded: true };
  if (goal - balance <= 25) return { stars: 2, succeeded: false };
  return { stars: 1, succeeded: false };
}

export function outcomeFromChoices(mission: Mission, session: ChoiceSession): MissionOutcome {
  const spent = session.history.reduce(
    (sum, entry) => sum + Math.abs(Math.min(entry.coinDelta, 0)),
    0,
  );
  const interest = session.history.reduce((sum, entry) => sum + entry.bonusCoins, 0);
  const income = mission.steps
    .slice(0, session.history.length)
    .reduce((sum, step) => sum + step.income, 0);

  if (mission.goalAmount != null) {
    const rated = starsFromGoal(session.balance, mission.goalAmount);
    const remaining = Math.max(mission.goalAmount - session.balance, 0);
    return {
      stars: rated.stars,
      succeeded: rated.succeeded,
      headline: rated.succeeded ? mission.successHeadline : mission.practiceHeadline,
      lesson: rated.succeeded
        ? `The bicycle costs ${mission.goalAmount} game coins and the practice jar finished with ${session.balance}. Simple interest added ${interest} game coins because some weeks the jar was left untouched. In real life, interest is not guaranteed, and investing can lose money. This game uses pretend coins only.`
        : `The bicycle still needs ${remaining} more game coins. Spending changed the plan, and that is useful to see. Saving more weeks, or choosing smaller costs, brings the jar to ${mission.goalAmount}. You can replay and try another plan. Nothing here is real money.`,
      stats: [
        { label: "Practice jar start", value: `${mission.startingCoins}` },
        { label: "Income", value: `+${income}` },
        { label: "Spent", value: `-${spent}` },
        { label: "Simple interest", value: `+${interest}` },
        { label: "Ending jar", value: `${session.balance}` },
        { label: "Goal", value: `${mission.goalAmount}` },
      ],
    };
  }

  const succeeded = session.needsMet >= mission.needsRequired;
  const stars: Stars = session.needsMet >= 3 ? 3 : succeeded ? 2 : 1;
  return {
    stars,
    succeeded,
    headline: succeeded ? mission.successHeadline : mission.practiceHeadline,
    lesson:
      session.wantsChosen > 0
        ? `You covered ${session.needsMet} needs. A need helps you stay healthy, safe, or ready to learn. A want is nice to have. Opportunity cost is what you give up by choosing: the ${spent} game coins spent on wants or extras were not available for other needs or for saving.`
        : `You covered ${session.needsMet} needs and kept the budget in mind. A need helps you stay healthy, safe, or ready to learn. A want is nice to have. Covering needs first leaves more choices open later.`,
    stats: [
      { label: "Budget", value: `${mission.startingCoins}` },
      { label: "Needs covered", value: `${session.needsMet}` },
      { label: "Wants chosen", value: `${session.wantsChosen}` },
      { label: "Spent", value: `-${spent}` },
      { label: "Coins left", value: `${session.balance}` },
    ],
  };
}

export function resolveLemonade(
  mission: Mission,
  supplyId: string,
  priceValue: number,
): { ok: true; result: LemonadeResult } | { ok: false; reason: "invalid_choice" | "insufficient_funds" | "invalid_amount" } {
  const supply = mission.supplies.find((item) => item.id === supplyId);
  const price = mission.prices.find((item) => item.price === priceValue);
  if (!supply || !price) return { ok: false, reason: "invalid_choice" };
  return calculateLemonade(mission.startingCoins, supply, price);
}

export function outcomeFromLemonade(mission: Mission, result: LemonadeResult): MissionOutcome {
  const succeeded = result.profit > 0;
  const stars: Stars = result.profit >= 8 ? 3 : result.profit > 0 ? 2 : 1;
  const profitLabel = result.profit < 0 ? "Loss" : "Profit";
  const headline =
    result.profit > 0 ? mission.successHeadline : result.profit === 0 ? "The stand broke even." : mission.practiceHeadline;
  const lesson =
    result.profit > 0
      ? `Revenue is cups sold times price: ${result.cupsSold} × ${result.price} = ${result.revenue} game coins. Expenses are the supply cost of ${result.expenses}. Profit = revenue − expenses, so profit is ${result.profit} game coins. A higher price can mean fewer customers. These customers follow a set rule so you can compare choices.`
      : result.profit === 0
        ? `Revenue was ${result.revenue} game coins and expenses were ${result.expenses}. Profit = revenue − expenses, which is 0. The stand did not gain or lose practice coins. Try another price to see the revenue change.`
        : `Revenue was ${result.revenue} game coins and supplies cost ${result.expenses}. Profit = revenue − expenses, which is ${result.profit}. A negative result is a loss: the stand paid more than customers paid in. That is a normal thing to practice. Try a smaller batch or a different price. No real money was used.`;
  return {
    stars,
    succeeded,
    headline,
    lesson,
    stats: [
      { label: "Cups sold", value: `${result.cupsSold}` },
      { label: "Price", value: `${result.price}` },
      { label: "Revenue", value: `${result.revenue}` },
      { label: "Expenses", value: `${result.expenses}` },
      { label: profitLabel, value: `${result.profit}` },
      { label: "Mission coins left", value: `${result.endingCoins}` },
    ],
  };
}

export function levelForXp(xp: number): { name: string; nextName: string | null; intoLevel: number; span: number } {
  const levels = [
    { xp: 0, name: "Coin Curious" },
    { xp: 40, name: "Saver Sprout" },
    { xp: 100, name: "Budget Buddy" },
    { xp: 180, name: "Market Helper" },
    { xp: 280, name: "Town Treasurer" },
  ];
  let index = 0;
  for (let i = 0; i < levels.length; i += 1) {
    if (xp >= levels[i].xp) index = i;
  }
  const current = levels[index];
  const next = levels[index + 1] ?? null;
  if (!next) {
    return { name: current.name, nextName: null, intoLevel: 1, span: 1 };
  }
  return {
    name: current.name,
    nextName: next.name,
    intoLevel: xp - current.xp,
    span: next.xp - current.xp,
  };
}
