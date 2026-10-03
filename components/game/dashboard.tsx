"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, BookOpen, CupSoda, PiggyBank, RotateCcw, ShoppingBasket } from "lucide-react";
import { Pip, TownScene } from "@/components/town";
import { AccountMenu } from "@/components/game/account-menu";
import { syncStatusCopy, useProgress } from "@/components/game/progress-provider";
import { Action, CoinPill, ProgressBar, StarRow } from "@/components/game/ui";
import { formatCoins, formatSignedCoins } from "@/lib/format";
import { levelForXp } from "@/lib/mission-engine";
import { moveCoinsToSavings } from "@/lib/progress";
import { savingsProgress } from "@/lib/finance";
import type { ContentBundle, Mission } from "@/lib/types";

const missionArt: Record<string, typeof ShoppingBasket> = {
  "needs-vs-wants": ShoppingBasket,
  "savings-quest": Bike,
  "lemonade-stand": CupSoda,
};

const missionTint: Record<string, string> = {
  "needs-vs-wants": "bg-[#ffe1d4]",
  "savings-quest": "bg-[#d9f3e4]",
  "lemonade-stand": "bg-[#fff1b8]",
};

export function Dashboard({ content, authConfigured }: { content: ContentBundle; authConfigured: boolean }) {
  const { ready, recovered, progress, signedIn, syncPhase, syncNote, save, reset, dismissHeld } = useProgress();
  const cloudNote = signedIn ? syncStatusCopy(syncPhase, syncNote) : null;
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const nextMission =
    content.missions.find((mission) => (progress?.missions[mission.slug]?.completions ?? 0) === 0) ?? content.missions[0];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="display text-2xl font-semibold text-ink">
          MoneyVerse
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AccountMenu configured={authConfigured} />
          {ready && progress ? <CoinPill amount={progress.coins} /> : <span className="h-9 w-40 rounded-full bg-line" />}
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16">
        <section className="panel overflow-hidden">
          <div className="grid items-center gap-2 md:grid-cols-[1.1fr_0.9fr]">
            <div className="px-5 py-6 sm:px-8">
              <p className="text-sm font-extrabold uppercase tracking-wide text-leaf">Fictional game coins only</p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Help Pip learn how money choices work.</h1>
              <p className="mt-3 max-w-xl text-lg text-ink-soft">
                Practice income, spending, needs and wants, saving, and profit in a pretend town. No real money.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {nextMission ? (
                  <Action href={`/missions/${nextMission.slug}`} className="w-full sm:w-auto">
                    Play {nextMission.title}
                  </Action>
                ) : null}
                <Action href="#missions" variant="secondary" className="w-full sm:w-auto">
                  See missions
                </Action>
              </div>
            </div>
            <div className="relative">
              <TownScene />
              <div className="absolute bottom-2 left-4">
                <Pip mood="wave" />
              </div>
            </div>
          </div>
        </section>

        <SourceNote content={content} />
        {recovered ? (
          <p className="rounded-3xl border-2 border-line bg-paper px-4 py-3 text-sm font-bold" role="status">
            The saved game on this device could not be read, so a fresh town wallet was started. It holds fictional game coins only.
          </p>
        ) : null}

        <WalletPanel
          ready={ready}
          coins={progress?.coins ?? 0}
          xp={progress?.xp ?? 0}
          savings={progress?.savings ?? 0}
          goalName={progress?.savingsGoalName ?? "Town bicycle"}
          goalTarget={progress?.savingsGoalTarget ?? 150}
          badges={progress?.badges ?? []}
          ledger={progress?.ledger ?? []}
          saveNote={saveNote}
          cloudNote={cloudNote}
          onDismissHeld={syncPhase === "conflict" ? dismissHeld : null}
          onSave={(amount) => {
            if (!progress) return;
            const moved = moveCoinsToSavings(progress, amount);
            if (!moved.ok) {
              setSaveNote(
                moved.reason === "insufficient_funds"
                  ? "The town wallet does not have that many game coins."
                  : "Choose a whole number of game coins to move.",
              );
              return;
            }
            save(moved.progress);
            setSaveNote(`Moved ${formatCoins(amount)} into the bicycle jar.`);
          }}
          onResetRequest={() => setConfirmReset(true)}
        />

        <section id="missions" className="scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold">Missions</h2>
            <p className="text-sm font-bold text-ink-soft">Ages 8–12</p>
          </div>
          {content.missions.length === 0 ? (
            <div className="panel p-5">
              <h3 className="text-2xl font-semibold">No approved missions yet</h3>
              <p className="mt-2 text-ink-soft">
                Studio needs a mission with review status approved, then published. Drafts and items still in review stay off the town screen.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {content.missions.map((mission) => (
                <MissionCard
                  key={mission.slug}
                  mission={mission}
                  stars={progress?.missions[mission.slug]?.bestStars ?? 0}
                  completions={progress?.missions[mission.slug]?.completions ?? 0}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-semibold">Ideas to keep</h2>
          {content.lessons.length === 0 ? (
            <p className="panel px-5 py-4 font-bold">No approved lessons are published yet.</p>
          ) : null}
          <div className="grid gap-3">
            {content.lessons.map((lesson) => (
              <details key={lesson.slug} className="panel px-5 py-4">
                <summary className="cursor-pointer text-lg font-extrabold">
                  <BookOpen className="mr-2 inline h-5 w-5" aria-hidden="true" />
                  {lesson.title}
                  <span className="mt-1 block text-sm font-bold text-ink-soft">{lesson.summary}</span>
                </summary>
                <p className="mt-3 text-base leading-relaxed">{lesson.body}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="panel px-5 py-5 text-sm leading-relaxed text-ink-soft">
          <h2 className="display text-xl font-semibold text-ink">For grownups nearby</h2>
          <p className="mt-2">
            MoneyVerse is a practice game. It does not offer personal financial advice, and every coin is a fictional game coin. Without
            signing in, progress stays in this browser. Google sign-in is optional and is used only to store that same progress in a
            private cloud save. Signing in does not move a signed-out game onto the account.
          </p>
        </section>
      </main>
      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="reset-title" className="panel w-full max-w-md p-5">
            <h2 id="reset-title" className="text-2xl font-semibold">
              Reset progress?
            </h2>
            <p className="mt-2 text-ink-soft">
              {signedIn
                ? "This clears badges, fictional game coins, and mission stars on this device. When you are online, the same reset is sent to your cloud save."
                : "This clears badges, fictional game coins, and mission stars saved on this device. A signed-in cloud save is left as it is."}
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Action variant="secondary" onClick={() => setConfirmReset(false)}>
                Keep playing
              </Action>
              <Action
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  setSaveNote(null);
                }}
              >
                Reset progress
              </Action>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SourceNote({ content }: { content: ContentBundle }) {
  const label =
    content.source === "sanity" ? "Studio lessons" : content.source === "unavailable" ? "Lessons unavailable" : "Demo lessons";
  const detail =
    content.reason ??
    (content.source === "sanity" ? "Missions and lessons are coming from Sanity." : "Built-in demo lessons are on.");
  return (
    <p className="text-sm font-bold text-ink-soft" role="status">
      <span className="mr-2 inline-flex rounded-full bg-paper px-3 py-1 text-ink">{label}</span>
      {detail}
    </p>
  );
}

function MissionCard({ mission, stars, completions }: { mission: Mission; stars: number; completions: number }) {
  const Icon = missionArt[mission.slug] ?? PiggyBank;
  return (
    <article className={`panel flex h-full flex-col p-5 ${missionTint[mission.slug] ?? "bg-paper"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper">
          <Icon aria-hidden="true" />
        </span>
        {completions > 0 ? <StarRow stars={stars} /> : <span className="text-sm font-extrabold text-ink-soft">New</span>}
      </div>
      <h3 className="text-2xl font-semibold">{mission.title}</h3>
      <p className="mt-2 flex-1 text-ink-soft">{mission.summary}</p>
      <p className="mt-3 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
        {mission.difficulty} · ages {mission.ageMin}–{mission.ageMax}
      </p>
      <Action href={`/missions/${mission.slug}`} className="mt-4 w-full">
        {completions > 0 ? "Replay" : "Start"}
      </Action>
    </article>
  );
}

function WalletPanel({
  ready,
  coins,
  xp,
  savings,
  goalName,
  goalTarget,
  badges,
  ledger,
  saveNote,
  cloudNote,
  onDismissHeld,
  onSave,
  onResetRequest,
}: {
  ready: boolean;
  coins: number;
  xp: number;
  savings: number;
  goalName: string;
  goalTarget: number;
  badges: { id: string; name: string; description: string }[];
  ledger: { id: string; label: string; amount: number }[];
  saveNote: string | null;
  cloudNote: string | null;
  onDismissHeld: (() => void) | null;
  onSave: (amount: number) => void;
  onResetRequest: () => void;
}) {
  const goal = savingsProgress(savings, goalTarget);
  const level = levelForXp(xp);
  const levelPercent = Math.round((level.intoLevel / level.span) * 100);
  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]" aria-busy={!ready}>
      <div className="panel p-5">
        <div className="flex items-center gap-3">
          <PiggyBank aria-hidden="true" />
          <h2 className="text-3xl font-semibold">Town wallet</h2>
        </div>
        {!ready ? (
          <p className="mt-4 font-bold">Opening the wallet on this device…</p>
        ) : (
          <>
            <p className="mt-3 text-4xl font-extrabold">{formatCoins(coins)}</p>
            <p className="text-sm font-bold text-ink-soft">Fictional game coins. They cannot be exchanged for real money.</p>
            {cloudNote ? (
              <p className="mt-2 text-sm font-bold" role="status">
                {cloudNote}{" "}
                {onDismissHeld ? (
                  <button type="button" className="underline" onClick={onDismissHeld}>
                    Dismiss the aside copy
                  </button>
                ) : null}
              </p>
            ) : null}
            <div className="mt-5">
              <ProgressBar percent={goal.percent} label={`${goalName}: ${formatCoins(savings)} saved of ${formatCoins(goalTarget)}`} />
              <p className="mt-2 text-sm font-bold text-ink-soft">
                {goal.complete ? "The bicycle goal is reached." : `${formatCoins(goal.remaining)} still to save.`}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[5, 10].map((amount) => (
                <Action key={amount} variant="secondary" disabled={coins < amount} onClick={() => onSave(amount)}>
                  Save {amount}
                </Action>
              ))}
              <Action variant="secondary" disabled={coins < 1} onClick={() => onSave(coins)}>
                Save all
              </Action>
            </div>
            {saveNote ? (
              <p className="mt-3 font-bold" role="status">
                {saveNote}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">Moving coins lowers the town wallet and raises the bicycle jar. The wallet cannot go below zero.</p>
            )}
            <div className="mt-5">
              <ProgressBar
                percent={level.nextName ? levelPercent : 100}
                label={level.nextName ? `${level.name} · ${xp} XP toward ${level.nextName}` : `${level.name} · ${xp} XP`}
              />
            </div>
            <h3 className="mt-6 text-lg font-extrabold">Recent game-coin notes</h3>
            {ledger.length === 0 ? (
              <p className="mt-2 text-ink-soft">No game-coin activity yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {ledger.slice(-5).reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm font-bold">
                    <span>{entry.label}</span>
                    <span>{formatSignedCoins(entry.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={onResetRequest} className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-ink underline-offset-4 hover:underline">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset progress
            </button>
          </>
        )}
      </div>
      <div className="panel p-5">
        <h2 className="text-2xl font-semibold">Badges</h2>
        {badges.length === 0 ? (
          <p className="mt-3 text-ink-soft">Badges you earn will line up here after a mission and its knowledge check.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {badges.map((badge) => (
              <li key={badge.id} className="rounded-2xl bg-lilac px-3 py-3">
                <p className="font-extrabold">{badge.name}</p>
                <p className="text-sm text-ink-soft">{badge.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
