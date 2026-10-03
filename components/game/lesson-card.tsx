"use client";

import { useState } from "react";
import { BookOpen, Calendar, CheckCircle2, Coins, CupSoda, Lightbulb, PiggyBank, Scale, ShoppingCart, Umbrella } from "lucide-react";
import { useProgress } from "@/components/game/progress-provider";
import { Action } from "@/components/game/ui";
import { formatCoins } from "@/lib/format";
import { lessonPassMark, recordLessonAttempt, type LessonGrant } from "@/lib/progress";
import type { Lesson, LessonIllustration } from "@/lib/types";

const ART: Record<LessonIllustration, typeof Coins> = {
  coin: Coins,
  jar: PiggyBank,
  cart: ShoppingCart,
  calendar: Calendar,
  lemonade: CupSoda,
  balance: Scale,
  umbrella: Umbrella,
  lightbulb: Lightbulb,
};

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { progress, save } = useProgress();
  const record = progress?.lessons[lesson.slug];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LessonGrant | null>(null);
  const hasQuiz = lesson.quiz.length > 0;
  const allAnswered = lesson.quiz.every((question) => answers[question.id]);

  function submit() {
    if (!progress || result) return;
    const grant = recordLessonAttempt(progress, lesson, answers, new Date().toISOString());
    save(grant.progress);
    setResult(grant);
  }

  function reset() {
    setAnswers({});
    setResult(null);
  }

  function markRead() {
    if (!progress || record?.completed) return;
    const grant = recordLessonAttempt(progress, lesson, {}, new Date().toISOString());
    save(grant.progress);
    setResult(grant);
  }

  return (
    <details className="panel px-5 py-4">
      <summary className="cursor-pointer text-lg font-extrabold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">
        {record?.completed ? (
          <CheckCircle2 className="mr-2 inline h-5 w-5" aria-label="Lesson completed" />
        ) : (
          <BookOpen className="mr-2 inline h-5 w-5" aria-hidden="true" />
        )}
        {lesson.title}
        <span className="mt-1 block text-sm font-bold text-ink-soft">
          {lesson.summary}
          {record?.completed ? " · Completed" : ""}
          {!record?.completed && lesson.rewards && lesson.rewards.coins > 0
            ? ` · Quiz reward: ${formatCoins(lesson.rewards.coins)}`
            : ""}
        </span>
      </summary>

      <p className="mt-3 text-base leading-relaxed">{lesson.body}</p>

      {lesson.objectives.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">After this lesson you can</h3>
          <ul className="mt-1 list-disc pl-5">
            {lesson.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {lesson.sections.map((section) => {
        const Icon = section.illustration ? ART[section.illustration] : null;
        return (
          <section key={section.id} className="mt-4 flex gap-3">
            {Icon ? (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lilac">
                <Icon aria-hidden="true" />
              </span>
            ) : null}
            <div>
              <h3 className="text-lg font-extrabold">{section.heading}</h3>
              <p className="leading-relaxed">{section.body}</p>
            </div>
          </section>
        );
      })}

      {hasQuiz ? (
        <form
          className="mt-6 border-t-2 border-line pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <h3 className="text-xl font-semibold">Check what you learned</h3>
          <p className="text-sm text-ink-soft">
            Get {lessonPassMark(lesson)} of {lesson.quiz.length} right to complete the lesson. Coins are fictional game coins.
          </p>
          {lesson.quiz.map((question, index) => (
            <fieldset key={question.id} className="mt-4" disabled={result !== null}>
              <legend className="font-extrabold">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-2 grid gap-2">
                {question.choices.map((choice) => {
                  const picked = answers[question.id] === choice.id;
                  const reveal = result !== null && picked;
                  return (
                    <div key={choice.id}>
                      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink bg-paper px-3 py-2 font-bold focus-within:outline focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-ink">
                        <input
                          type="radio"
                          name={`${lesson.slug}-${question.id}`}
                          value={choice.id}
                          checked={picked}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: choice.id }))}
                        />
                        {choice.label}
                      </label>
                      {reveal ? (
                        <p className="mt-1 px-2 text-sm" role="status">
                          <strong>{choice.correct ? "Right! " : "Not quite. "}</strong>
                          {choice.explanation}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {result !== null && !question.choices.some((choice) => choice.correct && choice.id === answers[question.id]) ? (
                  <p className="px-2 text-sm">
                    <strong>Answer: </strong>
                    {question.choices.find((choice) => choice.correct)?.label}.{" "}
                    {question.choices.find((choice) => choice.correct)?.explanation}
                  </p>
                ) : null}
              </div>
            </fieldset>
          ))}

          {result ? (
            <div className="mt-4 rounded-2xl bg-lilac p-4" role="status">
              <p className="text-lg font-extrabold">
                {result.correct} of {result.total} correct.{" "}
                {result.passed ? "Lesson complete!" : "Almost there. Read again and try another round."}
              </p>
              {result.firstCompletion && (result.coinsAwarded > 0 || result.xpAwarded > 0) ? (
                <p className="font-bold">
                  You earned {formatCoins(result.coinsAwarded)} and {result.xpAwarded} XP. Check your wallet.
                </p>
              ) : null}
              {result.passed && !result.firstCompletion ? (
                <p className="text-sm text-ink-soft">You finished this one before, so the reward stays as it is. Nothing is collected twice.</p>
              ) : null}
              <div className="mt-3">
                <Action variant="secondary" onClick={reset}>
                  Try again
                </Action>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Action type="submit" disabled={!allAnswered || !progress}>
                Check my answers
              </Action>
              {!allAnswered ? <p className="mt-2 text-sm text-ink-soft">Answer every question to check them.</p> : null}
            </div>
          )}
        </form>
      ) : (
        <div className="mt-4">
          {record?.completed ? (
            <p className="font-bold">You finished this lesson.</p>
          ) : (
            <Action variant="secondary" onClick={markRead} disabled={!progress}>
              I read this lesson
            </Action>
          )}
        </div>
      )}
    </details>
  );
}
