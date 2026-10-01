import { describe, expect, it } from "vitest";
import { demoMissions } from "@/lib/content/demo";
import {
  applyChoice,
  beginChoiceMission,
  canAffordChoice,
  outcomeFromChoices,
  outcomeFromLemonade,
  playChoices,
  replayChoiceSession,
  resolveLemonade,
} from "@/lib/mission-engine";

const needs = demoMissions.find((mission) => mission.slug === "needs-vs-wants");
const savings = demoMissions.find((mission) => mission.slug === "savings-quest");
const lemonade = demoMissions.find((mission) => mission.slug === "lemonade-stand");
if (!needs || !savings || !lemonade) throw new Error("demo missions missing");

describe("choice missions", () => {
  it("covers needs and keeps a budget", () => {
    const played = playChoices(needs, ["apple", "bus", "water"]);
    expect(played.ok).toBe(true);
    if (!played.ok) return;
    expect(played.session.balance).toBe(16);
    expect(played.session.needsMet).toBe(3);
    expect(outcomeFromChoices(needs, played.session).stars).toBe(3);
  });

  it("rejects an unknown choice and an unaffordable one without changing coins", () => {
    const started = beginChoiceMission(needs);
    const invalid = applyChoice(needs, started, "not-a-choice");
    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.reason).toBe("invalid_choice");
    expect(invalid.session.balance).toBe(started.balance);

    const low = playChoices(needs, ["cookies", "cap"]);
    expect(low.ok).toBe(true);
    if (!low.ok) return;
    expect(low.session.balance).toBe(2);
    const water = needs.steps[2].choices.find((choice) => choice.id === "water");
    if (!water) throw new Error("missing water");
    expect(canAffordChoice(low.session.balance, water)).toBe(false);
    const blocked = applyChoice(needs, { ...low.session, phase: "playing" }, "water");
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.reason).toBe("insufficient_funds");
    expect(blocked.session.balance).toBe(2);
  });

  it("reaches the bicycle by saving and misses it by spending", () => {
    const saved = playChoices(savings, ["save", "save", "save", "save"]);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.session.balance).toBe(192);
    const savedOutcome = outcomeFromChoices(savings, saved.session);
    expect(savedOutcome.succeeded).toBe(true);
    expect(savedOutcome.stats.find((stat) => stat.label === "Simple interest")?.value).toBe("+12");

    const spent = playChoices(savings, ["arcade", "comic", "snack", "toy"]);
    expect(spent.ok).toBe(true);
    if (!spent.ok) return;
    expect(spent.session.balance).toBe(75);
    expect(outcomeFromChoices(savings, spent.session).stars).toBe(1);

    const withNeeds = playChoices(savings, ["pencils", "boots", "gift", "save"]);
    expect(withNeeds.ok).toBe(true);
    if (!withNeeds.ok) return;
    expect(withNeeds.session.balance).toBe(156);
  });

  it("replays from the original practice jar", () => {
    const played = playChoices(savings, ["arcade", "comic", "snack", "toy"]);
    expect(played.ok).toBe(true);
    const replay = replayChoiceSession(savings);
    const fresh = beginChoiceMission(savings);
    expect(replay).toEqual(fresh);
    expect(replay.balance).toBe(120);
    expect(replay.history).toEqual([]);
  });
});

describe("lemonade choices", () => {
  it("rejects a price that is not on the menu", () => {
    expect(resolveLemonade(lemonade, "neighborhood", 9)).toEqual({ ok: false, reason: "invalid_choice" });
  });

  it("explains a break-even stand without calling it a loss", () => {
    const outcome = outcomeFromLemonade(lemonade, {
      supplyId: "custom",
      supplyName: "Practice batch",
      price: 2,
      customers: 5,
      cupsAvailable: 5,
      cupsSold: 5,
      revenue: 10,
      expenses: 10,
      profit: 0,
      endingCoins: 30,
    });
    expect(outcome.headline).toBe("The stand broke even.");
    expect(outcome.succeeded).toBe(false);
    expect(outcome.stars).toBe(1);
  });
});
