# MoneyVerse

MoneyVerse is a financial-literacy game for children ages 8–12. Players help Pip, a piggy-bank guide, practice income, spending, needs versus wants, saving, budgeting, revenue, expenses, profit, and a simple-interest example. Every coin is a **fictional game coin**. The game does not give personal financial advice, take payments, or ask for personal information.

## Features

- Town dashboard with a wallet, bicycle savings goal (150 game coins), XP, badges, and three mission cards
- Needs vs Wants: a 24-coin outing budget with trade-offs and opportunity cost
- Savings Quest: a practice jar that starts at 100 game coins and aims for a 150-coin bicycle, with weekly income and a 3-coin simple-interest example
- Lemonade Stand: supply costs, a chosen price, deterministic customers, and profit = revenue − expenses
- A short knowledge check after each mission, plus replay
- Practice coins stay inside the mission. The town wallet changes only for rewards and for savings the player moves on purpose
- Anonymous progress in `localStorage` under `moneyverse.progress.v1`, with a confirmed reset
- Sanity Studio for lessons, missions, choices, quizzes, rewards, and age ranges
- Built-in demo content when Sanity is not configured, is empty, or cannot be reached. The town screen says **Demo lessons** or **Studio lessons**

## Stack

One Next.js app (App Router, TypeScript, Tailwind CSS, Lucide icons) with Sanity Studio mounted at `/studio`. There is no nested app.

## Scripts

```bash
npm install
npm run dev          # game at http://localhost:3000 and Studio at http://localhost:3000/studio
npm run studio       # same dev server
npm run test
npm run lint
npm run typecheck
npm run build
npm run start
npm run seed:sanity  # optional; needs a write token in .env.local
```

## Play without Sanity

Copy the example env file if you want, leave the project id blank, and start the app:

```bash
cp .env.example .env.local
npm run dev
```

The game loads the lessons and missions in `lib/content/demo.ts`. The server log says the content source is demo. That fallback is for local development. A production server with no project id, a failed request, or no approved missions shows an empty town and says the lessons are unavailable.

## Connect Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage). The [Sanity Learn](https://www.sanity.io/learn) guides cover projects, datasets, and Studio.
2. Create a dataset named `production` (or set `NEXT_PUBLIC_SANITY_DATASET` to the name you use).
3. Add the CORS origin `http://localhost:3000` in the project API settings. Add your deployed origin later.
4. Put this in `.env.local` (never commit it):

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-01-01
```

5. Start `npm run dev` and open `/studio`. Log in with your Sanity account.
6. Optional: create a robot token with **Editor** rights and set `SANITY_API_WRITE_TOKEN` only in `.env.local`, then run `npm run seed:sanity`. That writes the demo missions and lessons. The token is server-only and is not read by the game UI.
7. For a private dataset, set `SANITY_API_READ_TOKEN` in `.env.local`. Do not prefix tokens with `NEXT_PUBLIC_`.

Editors can change lesson text, mission descriptions, choice explanations, prices, supply costs, quiz answers, difficulty, and age ranges in Studio. Coin fields use a custom game-coin input. Each mission has a Play preview. Documents move from draft to in review to approved with Studio actions. The town queries only published documents whose `reviewStatus` is `approved`. Live Content refreshes the town after a publish when a Sanity project id is set. In local development, invalid or empty Sanity results fall back to demo content and the screen says so. In production they do not.

`goalAmount` turns a choice mission into a savings goal. Leave it empty to score needs instead (`needsRequired`). The lemonade play style uses supply batches and prices. Customer counts are fixed rules, not random chance.

## Game design

- Needs help a person stay healthy, safe, or ready to learn. Wants are nice to have. Wants are not treated as failures.
- Opportunity cost is the option you give up.
- Income is coins coming in. A budget is the plan for using them.
- Revenue = cups sold × price. Expenses are supply costs. Profit = revenue − expenses. A negative result is a loss.
- Simple interest in Savings Quest is a flat 3 game coins on a week the practice jar is left untouched. The copy says real investing can lose money.
- Mission rewards are paid once. Replays can still update stars and grant a smaller XP amount.
- The town wallet cannot go below zero. The lemonade mission does not teach borrowing; an unaffordable supply batch stays disabled.

## Progress schema

`localStorage` key: `moneyverse.progress.v1`

```json
{
  "version": 1,
  "coins": 20,
  "xp": 0,
  "savings": 0,
  "savingsGoalName": "Town bicycle",
  "savingsGoalTarget": 150,
  "badges": [],
  "missions": {},
  "ledger": []
}
```

Missing data starts a new wallet with 20 starter game coins. Malformed numbers, the wrong version, or unreadable JSON replace the save with a fresh wallet and the town screen explains that. Broken badge rows are dropped.

## Deployment

- Deploy the Next.js app on Vercel or another Node host. Set the same public Sanity variables in the host. Set read or write tokens only as server environment variables.
- Studio is the `/studio` route of this app. Sanity hosts the content; this app hosts the editor UI.
- `npm run build` then `npm run start` is the production pair.
- Add the production URL to Sanity CORS origins before logging into Studio there.
- Do not add analytics, ads, chat, payments, or accounts for this MVP.

## Project map

- `app/` routes: town, mission play, Studio
- `components/game/` dashboard, mission play, local progress
- `lib/finance.ts` wallet, savings, lemonade math
- `lib/mission-engine.ts` mission rules and results
- `lib/progress.ts` versioned save data
- `lib/content/` demo content, validation, Sanity fallback
- `lib/sanity/` client, live content, and GROQ
- `sanity/actions/` review actions
- `sanity/components/` coin input and mission preview
- `WRITEUP.md` challenge notes
- `sanity/` schema
- `tests/` unit tests

## Privacy

No names, birth dates, email, location, or real financial data. No advertising, purchases, stranger chat, or public leaderboards. Reset progress any time from the town wallet.
