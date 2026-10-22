# MoneyVerse product requirements (PRD)

| | |
|---|---|
| **Product** | MoneyVerse, a financial-literacy game for children |
| **Owner** | tanay9098 |
| **Status** | v1 is built and playable. This PRD describes it as shipped and lists proposed next steps. |
| **Last updated** | 2026-10-22 |
| **Related docs** | [README.md](README.md) (setup, content model, economy rules), [ARCHITECTURE.md](ARCHITECTURE.md) (how it is built), [RULES.md](RULES.md) (working rules), [MEMORY.md](MEMORY.md) (status and change log) |

Labels used here: **[Shipped]** means the code does this today. **[Proposed]** means it is a suggestion that the owner has not yet approved. Requirement ids (`FR-…`, `NFR-…`) are stable, so commits and issues can refer to them.

## 1. Problem

Children aged 8–12 start to make small money decisions: pocket money, treats, saving for a toy. Most never practise the ideas behind those decisions (needs versus wants, opportunity cost, saving toward a goal, and how a business makes a profit) before real money is involved. Worksheets explain the words but do not let a child try a choice, see what happens, and try again.

## 2. Vision

A short, friendly game in which a child helps **Pip, a piggy-bank guide**, make money choices in a small town using **fictional game coins only**. Every choice gets an immediate, non-judgemental explanation. Mistakes are safe, replays are encouraged, and nothing real (money, personal data, strangers) is ever involved.

## 3. Goals and non-goals

### Goals

| # | Goal |
|---|---|
| G1 | Teach core money ideas through play: income, spending, needs versus wants, opportunity cost, budgeting, saving toward a goal, simple interest, revenue, expenses, profit and loss. |
| G2 | Give feedback that explains each outcome and never shames the child. Wants are allowed, and a loss is something to practise. |
| G3 | Be safe for children by design: fictional coins, no accounts, no personal data, no ads, no chat, no purchases. |
| G4 | Let non-developers (teachers, content editors) change lesson and mission content without touching code, with a review step before children see it. |
| G5 | Work instantly in a browser on phones, tablets, and desktops, with no install or sign-up. |

### Non-goals (explicitly out of scope)

- Real money, real prices, payment, banking, investing advice, or links to financial products.
- User accounts, sign-in, cloud save, or syncing between devices (removed on purpose in PRs #11 and #12).
- Analytics, ads, tracking, chat, social features, or public leaderboards.
- Offline install or PWA (removed on purpose).
- A content section aimed at parents (the "For grownups nearby" section was removed in PR #15).
- New play styles created from the CMS. Play styles stay in code.

## 4. Target users

| Persona | Who | Needs | How MoneyVerse serves them |
|---|---|---|---|
| **Primary: the young player** | A child aged 8–12, reading at roughly a primary-school level, often on a shared tablet or a parent's phone | Short sessions, big tap targets, clear words, instant feedback, a sense of progress, no fear of "losing" | Missions of 3–4 steps, plain copy, stars and badges, XP levels, safe replays, a savings goal with a visible bar |
| **Secondary: the trusted adult** (parent, teacher, carer) | Chooses the app and may sit beside the child | Confidence that the app is safe, ad-free, and accurate, and that it collects no data | No accounts or data collection, fictional coins, a stated disclaimer about real interest and investing, local-only progress with reset |
| **Tertiary: the content editor** | A teacher or curriculum writer, not a developer | Change text, numbers, and quizzes; review before publishing; preview a mission | Sanity Studio at `/studio`, with a coin input, field validation, a Draft → In review → Approved workflow, and a mission Play preview |
| **Tertiary: the developer and maintainer** | Runs, deploys, and extends the app | Runs locally without credentials, gets predictable fallbacks, has tests | Demo-content fallback in dev, an empty "unavailable" state in prod, a seed script, unit tests |

## 5. User stories

- As a **player**, I want to choose what to buy on an outing so that I can see which choices cover my needs.
- As a **player**, I want to save toward a bicycle over several weeks so that I learn how small savings add up.
- As a **player**, I want to run a lemonade stand and see my profit so that I understand revenue and costs.
- As a **player**, I want to replay a mission so that I can try a different plan without losing what I earned.
- As a **player**, I want to move coins into a savings jar and take them back so that I control my own goal.
- As a **player**, I want short lessons with a quiz so that I can check that I understood an idea.
- As a **trusted adult**, I want to know that no personal data is collected and that I can reset progress.
- As an **editor**, I want to edit mission text, amounts, and quiz answers, and send them for review, so that children only see checked content.
- As an **editor**, I want to preview a mission before publishing so that I can catch mistakes.

## 6. Functional requirements

### 6.1 Town dashboard (`/`)

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-1.1 | Show the town wallet, savings jar, savings goal, XP level, and badges. | A new player sees 20 starter coins, 0 saved, the goal "Town bicycle" at 150, the level "Coin Curious", and no badges. | Shipped |
| FR-1.2 | Show the missions as cards in a horizontally scrollable row with arrow controls. | Each card shows title, summary, difficulty, best stars, and a play link to `/missions/<slug>`. Arrows scroll the row. Cards resize for phone widths. | Shipped |
| FR-1.3 | Offer a "next mission" call to action. | The hero button links to the first mission the player has not yet completed, or to the first mission once all are done. | Shipped |
| FR-1.4 | Show where the content comes from. | The label reads **Studio lessons**, **Demo lessons**, or **Lessons unavailable**, with a reason. | Shipped |
| FR-1.5 | Show empty states. | With no approved missions or lessons, the town says so and points editors to the README content guide. | Shipped |
| FR-1.6 | Show recent wallet activity. | The wallet panel lists the 5 most recent ledger entries (up to 40 are stored), each with its amount and the balance after. | Shipped |
| FR-1.7 | Reset progress with confirmation. | "Reset" opens a modal dialog. Confirming restores a fresh 20-coin wallet. Cancelling changes nothing. | Shipped |
| FR-1.8 | Explain a recovered save. | If saved data was unreadable, the town says a fresh wallet was started. | Shipped |

### 6.2 Missions (`/missions/[slug]`)

All missions use practice coins that stay inside the mission. Only the final reward reaches the town wallet.

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-2.1 | **Needs vs Wants** (`needs-vs-wants`, choices engine, easy). The player spends a 24-coin outing budget over 3 steps. | Each choice is tagged need, want, save, or spend, and shows feedback. Unaffordable choices are disabled. 3 stars for 3+ needs met, 2 stars at the required 2 needs, otherwise 1 star. The result explains opportunity cost. | Shipped |
| FR-2.2 | **Savings Quest** (`savings-quest`, choices engine, medium). A practice jar goes from 100 toward a 150-coin bicycle over 4 weeks of income and choices. | A week left untouched adds a flat 3-coin simple-interest bonus. 3 stars if the jar reaches the goal, 2 if within 25 coins, otherwise 1. The copy says real interest is not guaranteed and investing can lose money. | Shipped |
| FR-2.3 | **Lemonade Stand** (`lemonade-stand`, lemonade engine, medium). The player has 30 coins, picks a supply batch (8, 16, or 26 coins) and a price. | Customer counts follow fixed rules, never random. Revenue = cups sold × price. Profit = revenue − expenses. A batch the player cannot afford stays disabled; there is no borrowing. 3 stars for profit ≥ 8, 2 for any profit, 1 for break-even or a loss. A loss is explained, not punished. | Shipped |
| FR-2.4 | A knowledge-check quiz after each mission. | Single-choice questions, each answer with an explanation. 5 XP per correct answer. | Shipped |
| FR-2.5 | Rewards are paid once. | First clear: mission XP + coins + badge (Need Spotter, Goal Getter, Profit Pro). Replays: 15 XP + quiz XP and may raise best stars, but pay no coins and no duplicate badge. | Shipped |
| FR-2.6 | Unknown mission slugs show a friendly not-found page with a link back to town. | Visiting `/missions/does-not-exist` shows "That path is not on the town map." | Shipped |

### 6.3 Lessons

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-3.1 | Show lessons on the town screen in editor-defined order. | 8 starter lessons: income, needs and wants, opportunity cost, budgeting, saving for a goal, profit, planning for surprises, thoughtful choices. | Shipped |
| FR-3.2 | Each lesson has a summary, an intro, objectives, and illustrated sections. | Illustrations come from a fixed list: coin, jar, cart, calendar, lemonade, balance, umbrella, lightbulb. | Shipped |
| FR-3.3 | An optional quiz with a pass mark. | Up to 5 single-choice questions, exactly one correct answer each. The pass mark is `ceil(questions × passPercent / 100)`; the default of 66% means 2 of 3. A lesson with no quiz completes when read. | Shipped |
| FR-3.4 | A one-time lesson reward. | Coins and XP are paid only on the first passing attempt. Attempts and best score are recorded. | Shipped |

### 6.4 Savings and economy

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-4.1 | Move coins wallet → jar with Save 5, Save 10, Save all, or a typed amount. Move them back with Take back. | Only whole numbers from 1 to 1,000,000. Decimals, negatives, `NaN`, and `1e3` are rejected with a clear message. | Shipped |
| FR-4.2 | Balances never go negative, and failed actions change nothing. | `coins + savings + totalSpent === totalEarned` always holds. | Shipped |
| FR-4.3 | The player can rename the savings goal and change its target (up to 1,000,000). | The target only measures progress. It never limits or changes balances. | Shipped |
| FR-4.4 | Reaching the goal with real savings awards a badge. | The Goal Getter badge and 25 XP are granted once. **Known gap:** the Savings Quest mission badge uses the same id (`goal-getter`). A player who clears that mission first never gets this badge or its 25 XP (see §12, question 6). | Shipped |
| FR-4.5 | XP levels. | Coin Curious (0), Saver Sprout (40), Budget Buddy (100), Market Helper (180), Town Treasurer (280), with a progress bar to the next level. | Shipped |
| FR-4.6 | A town shop where coins can be spent on cosmetic items. | Uses the existing `spendCoins` and `"spend"` ledger kind. Nothing real is purchasable. | **Proposed** |

### 6.5 Progress storage

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-5.1 | Save progress in the browser only. | `localStorage` key `moneyverse.progress.v1`, format `version: 1`. No network calls are made for progress. | Shipped |
| FR-5.2 | Handle old or broken saves safely. | Older v1 saves load with missing fields filled in. Unreadable data is replaced by a fresh wallet, and the player is told. | Shipped |
| FR-5.3 | No server-side rendering mismatch. | The server renders a "not ready" state, and the client then reads storage. | Shipped |

### 6.6 Content management (Sanity Studio at `/studio`)

| Id | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| FR-6.1 | Editors can manage missions and lessons: text, amounts, choices, supplies, prices, quizzes, rewards, difficulty, age range (8–12), and order. | All fields validate in Studio. Coin fields use the custom game-coin input. | Shipped |
| FR-6.2 | A review workflow. | Draft → **Send for review** → **Approve** → Publish. The desk groups In review, Approved, and Drafts. Reviewer notes are never shown to players. | Shipped |
| FR-6.3 | Only content that is approved **and** published reaches children. | The GROQ filter is `reviewStatus == "approved"`, read with the `published` perspective. | Shipped |
| FR-6.4 | A mission Play preview. | The mission document has a Play preview tab listing steps, supplies, prices, and quiz questions. | Shipped |
| FR-6.5 | Publishing updates the game without a redeploy. | With a project id set, Live Content refreshes the town after a publish. | Shipped |
| FR-6.6 | Invalid content never breaks the game. | The game validates every document at runtime and drops invalid ones. | Shipped |
| FR-6.7 | Content fallbacks. | Dev with no, failing, or empty Sanity shows demo content. Production shows the "unavailable" empty state, never demo content. | Shipped |
| FR-6.8 | Optional seeding. | `npm run seed:sanity` is a dry run by default. `-- --yes` writes the 3 missions and 8 lessons as approved and published, replaces only those ids, and never deletes. | Shipped |
| FR-6.9 | Editors can choose a play style but cannot invent a new one. | `engine` is `choices` or `lemonade`. Scoring and customer rules stay in TypeScript. | Shipped (by design) |

## 7. Non-functional requirements

| Id | Area | Requirement | Status |
|---|---|---|---|
| NFR-1 | **Child safety and privacy** | Collect no personal data: no birth dates, location, names, or real financial data. No ads, purchases, chat, or public leaderboards. Every amount is labelled a fictional game coin. | Shipped |
| NFR-2 | **Content tone** | Copy is plain, short, and kind. Wants are never framed as failures, and losses are framed as practice. No real financial advice. Interest and investing disclaimers appear where relevant. | Shipped |
| NFR-3 | **Accessibility** | A skip link to main content, semantic headings, labelled controls, a modal dialog with `aria-modal`, large touch targets (min height about 44–48px), and readable fonts. **[Proposed]** Run an audit to WCAG 2.2 AA: contrast, keyboard paths through every mission, screen-reader announcements for feedback. | Partly shipped |
| NFR-4 | **Responsive** | Usable from phone width (about 360px) to desktop with no horizontal page scroll. The mission row scrolls on its own. | Shipped |
| NFR-5 | **Reliability** | The game still renders if Sanity is down: demo in dev, a clear empty state in prod. A render error shows a friendly retry page. Saved progress is never lost because of a content error. | Shipped |
| NFR-6 | **Security** | Sanity tokens are server-only, never under `NEXT_PUBLIC_`. Studio is `noindex`. The write token is used only by the seed script. | Shipped |
| NFR-7 | **Performance** | Pages are server-rendered with content inlined, and there are no client-side content fetches. **[Proposed]** Target LCP under 2.5s on a mid-range phone over 4G. | Partly shipped |
| NFR-8 | **Maintainability** | Game rules live in pure, unit-tested functions in `lib/`. Tests, typecheck, and lint pass on every change (see [RULES.md](RULES.md)). No unnecessary dependencies. | Shipped |
| NFR-9 | **Determinism** | No randomness in scoring or customers, so children can compare choices and editors can predict outcomes. | Shipped |

## 8. Success metrics

The app deliberately has no analytics (NFR-1), so success is measured **offline**: through moderated play sessions with children and feedback from adults. These targets are **[Proposed]**:

| Metric | How to measure | Target |
|---|---|---|
| Comprehension | Children answer the mission and lesson quizzes during observed sessions | At least 70% of quiz questions correct on the first try |
| Learning gain | A short verbal or paper pre/post check on needs vs wants, saving, and profit | Most children improve on at least 2 of the 3 ideas |
| Completion | Observed sessions | At least 80% finish all 3 missions in one 20-minute session |
| Replay | Observed sessions | At least 50% replay at least one mission by choice |
| Usability | Sessions without adult help | A child can start and finish a mission without help |
| Adult trust | Short survey of parents and teachers | Most would recommend it as safe and ad-free |
| Editor efficiency | An editor creates, reviews, and publishes a lesson | Done in under 15 minutes without developer help |

## 9. Constraints and assumptions

- Tech is fixed: Next.js 16 App Router, TypeScript, Tailwind v4, and Sanity v6 with Studio embedded at `/studio` (details in [ARCHITECTURE.md](ARCHITECTURE.md)).
- No backend or database is planned. Progress is per device.
- Content is in English only. The age range is fixed at 8–12.
- Assumes a modern evergreen browser with `localStorage` enabled.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| A child clears browser data or switches device | Progress is lost | Stated clearly in the README and the UI. This is accepted, because no accounts is a privacy choice. |
| An editor publishes inaccurate or unkind content | Children learn something wrong | Review workflow, runtime validation, and Play preview. **[Proposed]** a written editorial checklist in Studio. |
| Sanity is misconfigured in production | Empty town | A clear "unavailable" state with a reason, and a content guide in the README. |
| Content model changes break saved progress or published docs | Lost progress or invalid content | Contract rules in [RULES.md](RULES.md) §2. Save format and schema changes must stay backward compatible. |
| Scope creep toward accounts, analytics, or payments | Privacy and safety risk | Non-goals in §3. These need the owner's explicit approval. |

## 11. Roadmap (all [Proposed], to be prioritised by the owner)

1. **Clean-up:** remove or wire in the unused `sanity/env.ts` and `sanity/lib/*` scaffold (ARCHITECTURE §10).
2. **Component and E2E tests** for the dashboard, each mission, and lessons (for example Testing Library or Playwright). Each needs a dependency justified per RULES.md.
3. **Accessibility audit** to WCAG 2.2 AA (NFR-3).
4. **Town shop** (FR-4.6) for cosmetic items, using the existing `spendCoins`.
5. **More lessons**, for example the drafts already in `studio-content-draft.md` (smart shopping, giving and sharing).
6. **Fourth play style**, such as a weekly budget planner. This needs code, because play styles are not CMS-defined.
7. **Localisation**, starting with copy extraction.

## 12. Open questions for the owner

1. Is the 8–12 age range fixed, or should content be split by age (8–9 versus 10–12)?
2. Should the shop (FR-4.6) exist, and should spending ever be irreversible in a learning game?
3. Which success metrics in §8 matter most, and who will run the play sessions?
4. Are other languages planned? That affects how copy is stored, in Sanity or in code.
5. Should the demo lessons in `studio-content-draft.md` be added to the seed set?
6. The Savings Quest mission reward and the real-savings goal both use the badge id `goal-getter` (`lib/content/demo.ts`, `lib/economy.ts#awardGoalBadge`). Whichever happens first wins, and the goal's 25 XP is skipped if the mission came first. Is that intended? If not, the goal badge needs its own id. That is a code change, kept out of this docs-only update.
