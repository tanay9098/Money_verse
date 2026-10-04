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
- Guest play with progress saved in the browser (`localStorage`)
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
6. Optional: create a robot token with **Editor** rights and set `SANITY_API_WRITE_TOKEN` only in `.env.local`, then run `npm run seed:sanity`. That writes the demo missions and lessons. The token is used only by the seed script.
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

## Saving progress

There are no accounts. Progress is saved in this browser's `localStorage` under `moneyverse.progress.v1`. It is not synced between browsers or devices, and clearing site data erases it. Reset progress any time from the town wallet.

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
- Do not add analytics, ads, chat, or payments. There are no accounts.

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

No birth dates, location, or real financial data. No advertising, purchases, stranger chat, or public leaderboards. Reset progress any time from the town wallet.

## Content guide: publishing missions and lessons

Children only see a mission or lesson when **both** are true:

1. **Review status is Approved** (our own checklist field: Draft → In review → Approved).
2. **The document is Published** in Sanity (the green Publish button). A draft that is merely saved is never shown, because the site reads with the `published` perspective.

The two are separate on purpose. Approving without publishing keeps content hidden. Publishing without approving is also hidden.

### Why the deployed town says "No approved missions yet"

The `production` dataset in Sanity project `8ndcaq5n` has no mission or lesson documents (Studio overview: Documents 0 / 10k). Nothing in the code hides them. Add and publish content using either route below.

### Route A: write content in Studio (`/studio`)

1. Open `https://<your-site>/studio` and sign in with the Sanity account.
2. **Missions** or **Lessons** → create a document and fill the required fields. Studio shows validation messages on each field.
3. Document actions: **Send for review** → **Approve** → **Publish**.
4. Reload the town. Lessons: sections, a quiz of 1–5 single-choice questions (exactly one answer marked correct), a pass percentage (66 = 2 of 3), and an optional one-time coin/XP reward.

Studio must be allowed to talk to the project: in sanity.io/manage → project → API → **CORS origins**, add the deployed site origin (for example `https://money-verse-orpin.vercel.app`) **with credentials allowed**. Only `http://localhost:3000` is registered today, so `/studio` on Vercel cannot sign in until this is added.

### Route B: load the 3 missions and 8 starter lessons

```bash
# .env.local needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
npm run seed:sanity            # dry run: lists the 11 documents, writes nothing
npm run seed:sanity -- --yes   # writes them as approved + published
```

The script only creates or replaces documents whose ids start with `mission-` or `lesson-` and are listed in the dry run. It never deletes anything. Run it only when you want those documents in production.

## Game economy rules

All logic lives in `lib/economy.ts`; components call it and never compute balances themselves.

- Coins are whole numbers from 1 to 1,000,000 per action. Decimals, negatives, `NaN`, and text like `1e3` are rejected.
- The wallet and the jar never go below 0. A failed action returns the original state, so nothing is half-applied.
- Wallet, jar, and total earned always agree: `wallet + savings + spent = total earned`.
- **Goal target ≠ wallet ≠ savings.** The target (default 150, editable up to 1,000,000 in the app) only measures progress. How much can be saved at once is limited by the wallet, nothing else. Example: 100 in the wallet and 20 saved toward 150 → save 100 → 120 of 150, 30 left.
- Save 5 / Save 10 / Save all / any typed amount move wallet → jar. **Take back** moves jar → wallet.
- Rewards: a mission pays once (first clear), a lesson pays once (first passing quiz). Replays give XP only (missions) or nothing (lessons). Reaching the goal with real savings awards the Goal Getter badge and 25 XP once.

## Persistence

- Progress is saved in this browser's `localStorage`. Clearing site data erases it.
