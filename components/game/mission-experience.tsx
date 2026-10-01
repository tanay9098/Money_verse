"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Pip } from "@/components/town";
import { useProgress } from "@/components/game/progress-provider";
import { Action, CoinPill, ProgressBar, StarRow, cn } from "@/components/game/ui";
import { formatCoins } from "@/lib/format";
import {
  applyChoice,
  beginChoiceMission,
  canAffordChoice,
  continueAfterFeedback,
  outcomeFromChoices,
  outcomeFromLemonade,
  resolveLemonade,
} from "@/lib/mission-engine";
import { grantMissionReward } from "@/lib/progress";
import type { ChoiceSession, LemonadeResult, Mission, MissionOutcome, QuizQuestion } from "@/lib/types";

type RewardView = { coinsAwarded: number; xpAwarded: number; badgeEarned: boolean; badgeName: string };

export function MissionExperience({ mission }: { mission: Mission }) {
  const { ready, progress, save } = useProgress();
  const [phase, setPhase] = useState<"intro" | "play" | "results" | "quiz" | "done">("intro");
  const [playId, setPlayId] = useState(0);
  const [outcome, setOutcome] = useState<MissionOutcome | null>(null);
  const [recap, setRecap] = useState<ChoiceSession["history"]>([]);
  const [reward, setReward] = useState<RewardView | null>(null);

  function finishPlay(nextOutcome: MissionOutcome, history: ChoiceSession["history"] = []) {
    setOutcome(nextOutcome);
    setRecap(history);
    setPhase("results");
  }

  function replay() {
    setPlayId((id) => id + 1);
    setOutcome(null);
    setRecap([]);
    setReward(null);
    setPhase("intro");
  }

  function collect(quizCorrect: number) {
    if (!progress || !outcome) return;
    const granted = grantMissionReward(progress, {
      slug: mission.slug,
      stars: outcome.stars,
      rewards: mission.rewards,
      quizCorrect,
      now: new Date().toISOString(),
    });
    save(granted.progress);
    setReward({
      coinsAwarded: granted.coinsAwarded,
      xpAwarded: granted.xpAwarded,
      badgeEarned: granted.badgeEarned,
      badgeName: mission.rewards.badgeName,
    });
    setPhase("done");
  }

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-4 pb-28">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-extrabold">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Town
        </Link>
        {ready && progress ? <CoinPill amount={progress.coins} /> : null}
      </div>

      {phase === "intro" ? (
        <section className="panel p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-leaf">{mission.topic}</p>
              <h1 className="mt-1 text-4xl font-semibold">{mission.title}</h1>
            </div>
            <Pip mood="wave" />
          </div>
          <p className="text-lg leading-relaxed">{mission.story}</p>
          <p className="mt-4 rounded-2xl bg-[#fff1c9] px-4 py-3 font-bold">Practice goal: {mission.learningGoal}</p>
          <p className="mt-3 text-ink-soft">
            This mission starts with {formatCoins(mission.startingCoins)} in a practice purse. Those coins stay inside the mission.
            Your town wallet changes only when you collect a reward. All coins are fictional.
          </p>
          <Action className="mt-5 w-full sm:w-auto" onClick={() => setPhase("play")}>
            Start mission
          </Action>
        </section>
      ) : null}

      {phase === "play" && mission.engine === "choices" ? (
        <ChoicePlay key={playId} mission={mission} onComplete={(session) => finishPlay(outcomeFromChoices(mission, session), session.history)} />
      ) : null}

      {phase === "play" && mission.engine === "lemonade" ? (
        <LemonadePlay key={playId} mission={mission} onComplete={(result) => finishPlay(outcomeFromLemonade(mission, result))} />
      ) : null}

      {phase === "results" && outcome ? (
        <Results
          mission={mission}
          outcome={outcome}
          recap={recap}
          onQuiz={() => setPhase("quiz")}
          onReplay={replay}
        />
      ) : null}

      {phase === "quiz" ? (
        <Quiz questions={mission.quiz} onDone={collect} disabled={!ready || !progress} />
      ) : null}

      {phase === "done" && outcome && reward ? (
        <section className="panel pop-in p-5 sm:p-7">
          <Pip mood="cheer" />
          <h1 className="text-4xl font-semibold">Nice work checking the idea.</h1>
          <div className="mt-3">
            <StarRow stars={outcome.stars} />
          </div>
          <p className="mt-4 text-lg">
            {reward.badgeEarned
              ? `You earned the ${reward.badgeName} badge, ${formatCoins(reward.coinsAwarded)}, and ${reward.xpAwarded} XP.`
              : `Replay reward: ${reward.xpAwarded} XP. Town-wallet coins stay as they are so rewards are not collected twice.`}
          </p>
          <p className="mt-2 text-ink-soft">Practice coins from the mission were not mixed into the town wallet except for this reward.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Action href="/">Back to town</Action>
            <Action variant="secondary" onClick={replay}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Replay mission
            </Action>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ChoicePlay({ mission, onComplete }: { mission: Mission; onComplete: (session: ChoiceSession) => void }) {
  const [session, setSession] = useState(() => beginChoiceMission(mission));
  const [blocked, setBlocked] = useState<string | null>(null);
  const step = mission.steps[session.stepIndex];
  const goal = mission.goalAmount;

  function choose(choiceId: string) {
    const applied = applyChoice(mission, session, choiceId);
    if (!applied.ok) {
      setBlocked(
        applied.reason === "insufficient_funds"
          ? "That costs more practice coins than you have. Another choice is open."
          : "That choice is not part of this step.",
      );
      return;
    }
    setBlocked(null);
    setSession(applied.session);
  }

  function continuePlay() {
    if (session.stepIndex >= mission.steps.length - 1) {
      onComplete({ ...session, phase: "results", pending: null });
      return;
    }
    setSession(continueAfterFeedback(mission, session));
  }

  if (!step) return null;

  return (
    <section className="panel p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-extrabold text-ink-soft">
          Part {session.stepIndex + 1} of {mission.steps.length}
        </p>
        <p className="rounded-full bg-sun px-3 py-1 font-extrabold">Practice coins: {formatCoins(session.balance)}</p>
      </div>
      {goal != null ? (
        <div className="mt-4">
          <ProgressBar percent={Math.min(100, Math.round((session.balance / goal) * 100))} label={`Bicycle goal ${formatCoins(goal)}`} />
        </div>
      ) : null}
      <h1 className="mt-4 text-3xl font-semibold">{step.title}</h1>
      {step.income > 0 ? (
        <p className="mt-3 rounded-2xl bg-[#d9f3e4] px-4 py-3 font-bold">
          Income +{formatCoins(step.income)}
          {step.incomeLabel ? ` — ${step.incomeLabel}` : ""}. The practice jar is {formatCoins(session.balance)}.
        </p>
      ) : null}
      <p className="mt-3 text-lg">{step.prompt}</p>

      {session.phase === "feedback" && session.pending ? (
        <div className="pop-in mt-4 rounded-3xl border-2 border-ink bg-[#fff1c9] p-4" role="status" aria-live="polite">
          <h2 className="text-2xl font-semibold">{session.pending.feedbackTitle}</h2>
          <p className="mt-2">{session.pending.feedbackBody}</p>
          <p className="mt-2 font-extrabold">Practice coins now: {formatCoins(session.balance)}</p>
          <Action className="mt-4 w-full sm:w-auto" onClick={continuePlay}>
            {session.stepIndex >= mission.steps.length - 1 ? "See the results" : "Next part"}
          </Action>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {step.choices.map((choice) => {
            const affordable = canAffordChoice(session.balance, choice);
            return (
              <button
                key={choice.id}
                type="button"
                disabled={!affordable}
                onClick={() => choose(choice.id)}
                className={cn(
                  "rounded-3xl border-2 border-ink bg-paper px-4 py-4 text-left",
                  !affordable && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="block text-lg font-extrabold">{choice.label}</span>
                <span className="mt-1 block text-ink-soft">{choice.detail}</span>
                {!affordable ? <span className="mt-2 block font-extrabold text-leaf">Not enough practice coins.</span> : null}
              </button>
            );
          })}
          {blocked ? (
            <p role="alert" className="font-bold">
              {blocked}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function LemonadePlay({ mission, onComplete }: { mission: Mission; onComplete: (result: LemonadeResult) => void }) {
  const [supplyId, setSupplyId] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function openStand() {
    if (!supplyId || price == null) {
      setNote("Choose a supply batch and a price first.");
      return;
    }
    const resolved = resolveLemonade(mission, supplyId, price);
    if (!resolved.ok) {
      setNote(
        resolved.reason === "insufficient_funds"
          ? "That batch costs more practice coins than the stand has. Borrowing is not part of this mission."
          : "Pick a batch and a price from the stand.",
      );
      return;
    }
    onComplete(resolved.result);
  }

  return (
    <section className="panel p-5 sm:p-7">
      <p className="font-extrabold text-ink-soft">Practice coins: {formatCoins(mission.startingCoins)}</p>
      <h1 className="mt-2 text-3xl font-semibold">Open the stand</h1>
      <p className="mt-2">{mission.lemonadeIntro}</p>
      <h2 className="mt-5 text-xl font-extrabold">1. Pay for supplies</h2>
      <div className="mt-3 grid gap-3">
        {mission.supplies.map((supply) => {
          const affordable = supply.cost <= mission.startingCoins;
          const selected = supplyId === supply.id;
          return (
            <button
              key={supply.id}
              type="button"
              disabled={!affordable}
              aria-pressed={selected}
              onClick={() => setSupplyId(supply.id)}
              className={cn(
                "rounded-3xl border-2 px-4 py-4 text-left",
                selected ? "border-ink bg-[#fff1b8]" : "border-line bg-paper",
                !affordable && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="block font-extrabold">
                {supply.name} · {formatCoins(supply.cost)} · {supply.cups} cups
              </span>
              <span className="mt-1 block text-ink-soft">{supply.detail}</span>
            </button>
          );
        })}
      </div>
      <h2 className="mt-5 text-xl font-extrabold">2. Choose a price</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {mission.prices.map((option) => {
          const selected = price === option.price;
          return (
            <button
              key={option.price}
              type="button"
              aria-pressed={selected}
              onClick={() => setPrice(option.price)}
              className={cn("rounded-3xl border-2 px-4 py-4 text-left", selected ? "border-ink bg-[#d9f3e4]" : "border-line bg-paper")}
            >
              <span className="block font-extrabold">{formatCoins(option.price)} per cup</span>
              <span className="mt-1 block text-ink-soft">
                {option.customers} customers. {option.note}
              </span>
            </button>
          );
        })}
      </div>
      {note ? (
        <p className="mt-3 font-bold" role="alert">
          {note}
        </p>
      ) : null}
      <Action className="mt-5 w-full sm:w-auto" onClick={openStand}>
        Serve customers
      </Action>
    </section>
  );
}

function Results({
  mission,
  outcome,
  recap,
  onQuiz,
  onReplay,
}: {
  mission: Mission;
  outcome: MissionOutcome;
  recap: ChoiceSession["history"];
  onQuiz: () => void;
  onReplay: () => void;
}) {
  return (
    <section className="panel pop-in p-5 sm:p-7">
      <Pip mood={outcome.succeeded ? "cheer" : "think"} />
      <h1 className="text-4xl font-semibold">{outcome.headline}</h1>
      <div className="mt-3">
        <StarRow stars={outcome.stars} />
      </div>
      <p className="mt-4 text-lg leading-relaxed">{outcome.lesson}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {outcome.stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[#fff6e4] px-3 py-3">
            <dt className="text-sm font-bold text-ink-soft">{stat.label}</dt>
            <dd className="text-xl font-extrabold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {recap.length > 0 ? (
        <div className="mt-5">
          <h2 className="text-xl font-extrabold">What each choice did</h2>
          <ul className="mt-2 space-y-2">
            {recap.map((entry) => (
              <li key={`${entry.stepId}-${entry.choiceId}`} className="rounded-2xl bg-paper px-3 py-3">
                <p className="font-extrabold">{entry.label}</p>
                <p className="text-sm text-ink-soft">{entry.feedbackBody}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-4 text-sm font-bold text-ink-soft">
        {mission.title} used practice coins. Collecting the knowledge check can add a reward to the town wallet.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Action onClick={onQuiz}>Knowledge check</Action>
        <Action variant="secondary" onClick={onReplay}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Replay mission
        </Action>
      </div>
    </section>
  );
}

function Quiz({ questions, onDone, disabled }: { questions: QuizQuestion[]; onDone: (correct: number) => void; disabled: boolean }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const question = questions[index];
  if (!question) return null;
  const selected = question.choices.find((choice) => choice.id === picked);

  function choose(id: string) {
    if (picked) return;
    setPicked(id);
    const match = question.choices.find((choice) => choice.id === id);
    if (match?.correct) setCorrectCount((count) => count + 1);
  }

  const last = index >= questions.length - 1;

  return (
    <section className="panel p-5 sm:p-7">
      <p className="font-extrabold text-ink-soft">
        Knowledge check {index + 1} of {questions.length}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{question.prompt}</h1>
      <div className="mt-4 grid gap-3">
        {question.choices.map((choice) => {
          const isPicked = picked === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(picked)}
              onClick={() => choose(choice.id)}
              className={cn(
                "rounded-3xl border-2 px-4 py-4 text-left font-extrabold",
                isPicked ? "border-ink bg-sun" : "border-line bg-paper",
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="pop-in mt-4 rounded-3xl bg-[#fff1c9] px-4 py-4" role="status" aria-live="polite">
          <p className="font-extrabold">{selected.correct ? "Yes — that's the idea." : "Let's look at that again."}</p>
          <p className="mt-1">{selected.explanation}</p>
          <Action
            className="mt-4 w-full sm:w-auto"
            disabled={disabled}
            onClick={() => {
              if (last) {
                onDone(correctCount);
                return;
              }
              setIndex((value) => value + 1);
              setPicked(null);
            }}
          >
            {last ? "Collect reward" : "Next question"}
          </Action>
          {disabled ? <p className="mt-2 text-sm font-bold">The town wallet is still opening on this device.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
