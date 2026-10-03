"use client";

import { useId, useState } from "react";
import { Action } from "@/components/game/ui";
import {
  MAX_GOAL_TARGET,
  parseCoinInput,
  setSavingsGoal,
  transferBlockedReason,
  transferToSavings,
  withdrawFromSavings,
  type EconomyFailure,
} from "@/lib/economy";
import { formatCoins } from "@/lib/format";
import type { PlayerProgress } from "@/lib/types";

const QUICK_AMOUNTS = [5, 10];

const FAILURE_COPY: Record<EconomyFailure, string> = {
  invalid_amount: "Type a whole number of game coins, like 25.",
  insufficient_funds: "The town wallet does not have that many game coins.",
  insufficient_savings: "The jar does not have that many game coins.",
  invalid_goal: "Give the goal a name and a whole-number target of at least 1.",
  duplicate: "That reward was already collected.",
};

/** Wallet to jar moves, jar to wallet moves, and the goal. All money rules live in lib/economy. */
export function SavingsControls({ progress, onChange }: { progress: PlayerProgress; onChange: (next: PlayerProgress) => void }) {
  const amountId = useId();
  const hintId = useId();
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalName, setGoalName] = useState(progress.savingsGoalName);
  const [goalTarget, setGoalTarget] = useState(String(progress.savingsGoalTarget));

  const emptyWallet = progress.coins === 0;
  const blocked = transferBlockedReason(progress, 1);

  function move(amount: number) {
    const now = new Date().toISOString();
    const result = transferToSavings(progress, amount, now);
    if (!result.ok) {
      setNote(FAILURE_COPY[result.reason]);
      return;
    }
    onChange(result.progress);
    setAmountText("");
    setNote(`Moved ${formatCoins(amount)} into the ${progress.savingsGoalName} jar.`);
  }

  function takeOut(amount: number) {
    const result = withdrawFromSavings(progress, amount, new Date().toISOString());
    if (!result.ok) {
      setNote(FAILURE_COPY[result.reason]);
      return;
    }
    onChange(result.progress);
    setAmountText("");
    setNote(`Took ${formatCoins(amount)} out of the jar and back into the wallet.`);
  }

  function typedAmount(): number | null {
    const amount = parseCoinInput(amountText);
    if (amount === null) setNote(FAILURE_COPY.invalid_amount);
    return amount;
  }

  function saveGoal() {
    const target = /^\d{1,7}$/.test(goalTarget.trim()) ? Number(goalTarget.trim()) : NaN;
    const result = setSavingsGoal(progress, goalName, target);
    if (!result.ok) {
      setNote(FAILURE_COPY[result.reason]);
      return;
    }
    onChange(result.progress);
    setEditingGoal(false);
    setNote(`New goal: ${result.progress.savingsGoalName}, ${formatCoins(target)}.`);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick save">
        {QUICK_AMOUNTS.map((amount) => (
          <Action key={amount} variant="secondary" disabled={progress.coins < amount} onClick={() => move(amount)}>
            Save {amount}
          </Action>
        ))}
        <Action variant="secondary" disabled={emptyWallet} onClick={() => move(progress.coins)}>
          Save all
        </Action>
      </div>

      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const amount = typedAmount();
          if (amount !== null) move(amount);
        }}
      >
        <div>
          <label htmlFor={amountId} className="block text-sm font-extrabold">
            Pick your own amount
          </label>
          <input
            id={amountId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
            aria-describedby={hintId}
            placeholder={emptyWallet ? "0" : progress.coins === 1 ? "1" : `1 to ${progress.coins}`}
            className="mt-1 min-h-12 w-40 rounded-2xl border-2 border-ink bg-paper px-3 text-base font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </div>
        <Action type="submit" variant="secondary" disabled={emptyWallet}>
          Move to jar
        </Action>
        <Action
          variant="secondary"
          disabled={progress.savings === 0}
          onClick={() => {
            const amount = typedAmount();
            if (amount !== null) takeOut(amount);
          }}
        >
          Take back
        </Action>
      </form>

      <p id={hintId} className="mt-2 text-sm text-ink-soft">
        {blocked ??
          `You can move up to ${formatCoins(progress.coins)} now. The goal is ${formatCoins(progress.savingsGoalTarget)}, and you can save toward it a little at a time.`}
      </p>
      {note ? (
        <p className="mt-2 font-bold" role="status">
          {note}
        </p>
      ) : null}

      <div className="mt-3">
        {editingGoal ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveGoal();
            }}
          >
            <label className="text-sm font-extrabold">
              Goal name
              <input
                type="text"
                maxLength={60}
                value={goalName}
                onChange={(event) => setGoalName(event.target.value)}
                className="mt-1 block min-h-12 w-48 rounded-2xl border-2 border-ink bg-paper px-3 text-base font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
              />
            </label>
            <label className="text-sm font-extrabold">
              Goal amount (up to {MAX_GOAL_TARGET.toLocaleString("en-US")})
              <input
                type="text"
                inputMode="numeric"
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
                className="mt-1 block min-h-12 w-40 rounded-2xl border-2 border-ink bg-paper px-3 text-base font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
              />
            </label>
            <Action type="submit" variant="secondary">
              Set goal
            </Action>
            <Action variant="quiet" onClick={() => setEditingGoal(false)}>
              Cancel
            </Action>
          </form>
        ) : (
          <button
            type="button"
            className="text-sm font-extrabold underline underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
            onClick={() => {
              setGoalName(progress.savingsGoalName);
              setGoalTarget(String(progress.savingsGoalTarget));
              setEditingGoal(true);
            }}
          >
            Change my savings goal
          </button>
        )}
      </div>
    </div>
  );
}
