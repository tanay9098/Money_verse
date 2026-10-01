import { describe, expect, it } from "vitest";
import { applyCoins, calculateLemonade, purchase, savingsProgress, transferToSavings } from "@/lib/finance";
import { demoMissions } from "@/lib/content/demo";

describe("wallet and purchases", () => {
  it("adds and subtracts whole game coins", () => {
    expect(applyCoins(20, 12)).toEqual({ ok: true, balance: 32 });
    expect(purchase(20, 8)).toEqual({ ok: true, balance: 12 });
  });

  it("rejects invalid amounts and insufficient funds", () => {
    expect(purchase(10, 0).ok).toBe(false);
    expect(purchase(10, 1.5)).toEqual({ ok: false, balance: 10, reason: "invalid_amount" });
    expect(applyCoins(5, Number.NaN).ok).toBe(false);
    expect(purchase(4, 5)).toEqual({ ok: false, balance: 4, reason: "insufficient_funds" });
    expect(purchase(4, 5)).toMatchObject({ balance: 4 });
  });

  it("tracks a savings goal without going negative", () => {
    expect(savingsProgress(40, 150)).toMatchObject({ remaining: 110, percent: 27, complete: false });
    expect(savingsProgress(150, 150).complete).toBe(true);
    expect(savingsProgress(180, 150)).toMatchObject({ percent: 100, remaining: 0, complete: true });
    const moved = transferToSavings(20, 0, 10, 150);
    expect(moved).toMatchObject({ ok: true, wallet: 10, saved: 10 });
    expect(transferToSavings(5, 0, 10, 150)).toMatchObject({ ok: false, reason: "insufficient_funds", wallet: 5, saved: 0 });
  });
});

describe("lemonade stand", () => {
  const stand = demoMissions.find((mission) => mission.slug === "lemonade-stand");
  if (!stand) throw new Error("missing lemonade mission");

  it("calculates revenue, expenses, and profit", () => {
    const supply = stand.supplies.find((item) => item.id === "neighborhood");
    const price = stand.prices.find((item) => item.price === 2);
    if (!supply || !price) throw new Error("missing lemonade options");
    const result = calculateLemonade(stand.startingCoins, supply, price);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toMatchObject({
      cupsSold: 12,
      revenue: 24,
      expenses: 16,
      profit: 8,
      endingCoins: 38,
    });
  });

  it("can show a loss while the purse stays at zero or above", () => {
    const supply = stand.supplies.find((item) => item.id === "block");
    const price = stand.prices.find((item) => item.price === 1);
    if (!supply || !price) throw new Error("missing lemonade options");
    const result = calculateLemonade(30, supply, price);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.profit).toBe(-6);
    expect(result.result.endingCoins).toBeGreaterThanOrEqual(0);
  });

  it("blocks a batch the purse cannot afford", () => {
    const supply = stand.supplies.find((item) => item.id === "festival");
    const price = stand.prices[0];
    if (!supply) throw new Error("missing festival batch");
    expect(calculateLemonade(30, supply, price)).toEqual({ ok: false, reason: "insufficient_funds" });
  });
});
