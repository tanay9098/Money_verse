import type { LemonadeResult, SupplyOption, PriceOption } from "@/lib/types";

export type CoinFailure = "insufficient_funds" | "invalid_amount";

export type CoinResult =
  | { ok: true; balance: number }
  | { ok: false; balance: number; reason: CoinFailure };

export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function applyCoins(balance: number, delta: number): CoinResult {
  if (!isInteger(balance) || !isInteger(delta)) {
    return { ok: false, balance, reason: "invalid_amount" };
  }
  const next = balance + delta;
  if (next < 0) {
    return { ok: false, balance, reason: "insufficient_funds" };
  }
  return { ok: true, balance: next };
}

export function purchase(balance: number, cost: number): CoinResult {
  if (!isInteger(cost) || cost <= 0) {
    return { ok: false, balance, reason: "invalid_amount" };
  }
  return applyCoins(balance, -cost);
}

export type SavingsProgress = {
  saved: number;
  target: number;
  remaining: number;
  percent: number;
  complete: boolean;
};

export function savingsProgress(saved: number, target: number): SavingsProgress {
  const safeSaved = isInteger(saved) && saved > 0 ? saved : 0;
  const safeTarget = isInteger(target) && target > 0 ? target : 1;
  const remaining = Math.max(safeTarget - safeSaved, 0);
  const percent = Math.min(100, Math.round((Math.min(safeSaved, safeTarget) / safeTarget) * 100));
  return {
    saved: safeSaved,
    target: safeTarget,
    remaining,
    percent,
    complete: safeSaved >= safeTarget,
  };
}

export type TransferResult =
  | { ok: true; wallet: number; saved: number; progress: SavingsProgress }
  | { ok: false; wallet: number; saved: number; reason: CoinFailure };

export function transferToSavings(
  wallet: number,
  saved: number,
  amount: number,
  target: number,
): TransferResult {
  if (!isInteger(saved) || saved < 0) {
    return { ok: false, wallet, saved, reason: "invalid_amount" };
  }
  const spent = purchase(wallet, amount);
  if (!spent.ok) {
    return { ok: false, wallet, saved, reason: spent.reason };
  }
  const nextSaved = saved + amount;
  return {
    ok: true,
    wallet: spent.balance,
    saved: nextSaved,
    progress: savingsProgress(nextSaved, target),
  };
}

export type LemonadeFailure = "invalid_choice" | "insufficient_funds" | "invalid_amount";

export function calculateLemonade(
  startingCoins: number,
  supply: SupplyOption,
  price: PriceOption,
): { ok: true; result: LemonadeResult } | { ok: false; reason: LemonadeFailure } {
  if (!isInteger(startingCoins) || startingCoins < 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (
    !isInteger(supply.cost) ||
    supply.cost < 0 ||
    !isInteger(supply.cups) ||
    supply.cups <= 0 ||
    !isInteger(price.price) ||
    price.price <= 0 ||
    !isInteger(price.customers) ||
    price.customers < 0
  ) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (supply.cost > startingCoins) {
    return { ok: false, reason: "insufficient_funds" };
  }

  const cupsSold = Math.min(supply.cups, price.customers);
  const revenue = cupsSold * price.price;
  const expenses = supply.cost;
  const profit = revenue - expenses;
  const ending = applyCoins(startingCoins, -expenses + revenue);
  if (!ending.ok) {
    return { ok: false, reason: ending.reason };
  }

  return {
    ok: true,
    result: {
      supplyId: supply.id,
      supplyName: supply.name,
      price: price.price,
      customers: price.customers,
      cupsAvailable: supply.cups,
      cupsSold,
      revenue,
      expenses,
      profit,
      endingCoins: ending.balance,
    },
  };
}
