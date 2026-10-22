# MoneyVerse project memory

A short context file for the next person or AI tool. Read this first, then [RULES.md](RULES.md). Open [ARCHITECTURE.md](ARCHITECTURE.md) when you need detail. You should not need to read the whole codebase to start.

**Update this file after every change.** Add a change-log entry at the top of section 4, and edit sections 1–3 if they are no longer true.

## 1. Current state (as of 2026-10-22, commit `5463c5f`)

- **What it is:** a financial-literacy game for ages 8–12 that uses fictional coins. It is one Next.js 16 app with Sanity Studio at `/studio`.
- **Works today:**
  - Town dashboard: wallet, savings jar, bicycle goal, XP and levels, badges, missions scroller, lessons.
  - 3 missions: Needs vs Wants, Savings Quest, Lemonade Stand. Each has a quiz and can be replayed.
  - 8 starter lessons with quizzes and one-time rewards.
  - Progress saved in `localStorage` (`moneyverse.progress.v1`), with reset.
  - Studio with a review workflow (Draft → In review → Approved → Publish), coin input, and a mission Play preview.
  - Demo-content fallback in dev. Empty "unavailable" state in prod.
  - Seed script.
- **Removed on purpose** (do not re-add without asking): Google sign-in, cloud save, PWA/offline install, the "For grownups nearby" dashboard section.
- **Quality gates:** `npm run test` (6 files, 55 tests), `typecheck`, and `lint` all pass on this commit.
- **Not covered by tests:** React components and end-to-end flows. Test those by hand with `npm run dev`.

## 2. Key facts to remember

- Content: Sanity GROQ (`lib/sanity/queries.ts`) → `validate.ts` → `resolve.ts` → `ContentBundle` → client components. Only **approved and published** documents show.
- Progress: client-only. `ProgressProvider` (`useSyncExternalStore`) → pure functions in `lib/economy.ts` and `lib/progress.ts` → `save()` → `localStorage`.
- Invariant: `coins + savings + totalSpent === totalEarned`. Rewards are paid once through ledger id `reward:mission:<slug>` or `reward:lesson:<slug>`.
- No API routes, no DB, no auth, no middleware. Tokens are server-only.
- Mission slugs: `needs-vs-wants`, `savings-quest`, `lemonade-stand`. Engines: `choices` (first two) and `lemonade`.
- `AGENTS.md`'s top block is rewritten by `next dev`. Edit only below the `END:nextjs-agent-rules` marker. `CLAUDE.md` should stay exactly `@AGENTS.md`.

## 3. Open issues and next steps

- Unused scaffold: `sanity/env.ts` and `sanity/lib/*`. It has a mismatched API version default, throws when env is missing, and uses the transitive `@sanity/image-url`. Delete it or wire it in (ARCHITECTURE §10).
- `getSanityClient()` in `lib/sanity/client.ts` is unused.
- `spendCoins` has no UI caller yet (kept for a future shop).
- Badge id clash: the Savings Quest mission badge and the real-savings goal badge are both `goal-getter`. If the mission is cleared first, the goal's badge and 25 XP never arrive (PRD FR-4.4, §12 Q6). Owner to decide.
- No component or E2E tests.

## 4. Change log (newest first)

Use this format: `YYYY-MM-DD — short title — files touched — tests run and results — notes`.

- **2026-10-22 — Fixed hidden "GROQ" label in ARCHITECTURE §4 diagram.** Docs only. The `GROQ via sanityFetch` edge label was covered by the `demo.ts` node. Moved `DEMO` before `RES` and drew the fallback edge as `DEMO <-- ... --- RES`, so the label now renders fully. Checked by rendering the diagram with mermaid-cli. No code changed.
- **2026-10-22 — Added PRD.md.** Docs only. Covers problem, goals and non-goals, personas, user stories, functional requirements (FR-x, marked Shipped or Proposed, checked against the code), NFRs, offline success metrics, risks, roadmap, and open questions. Found the `goal-getter` badge id clash (open issue above). Linked from AGENTS.md and the README project map. Tests: `npm run test` 55/55 pass, `typecheck` clean, `lint` clean.
- **2026-10-22 — Added ARCHITECTURE.md, RULES.md, MEMORY.md.** Docs only. Checked the architecture against the code and recorded the inconsistencies in ARCHITECTURE §10. Added a short pointer section to `AGENTS.md` below the managed block. In the README project map, listed the new docs and corrected the `sanity/lib/` description. Tests: `npm run test` 55/55 pass, `typecheck` clean, `lint` clean. No code changed.
- **Earlier history:**
  - PR #15 removed the "For grownups nearby" section.
  - PRs #13 and #14 fixed the README and added the content model.
  - PRs #11 and #12 removed Google sign-in, cloud save, and PWA, keeping guest localStorage play.
  - PR #10 added missions scroller arrows.
  - PRs #8 and #9 improved seed script env handling.
  - Commit `4c18c73` (owner) added the `sanity/env.ts` and `sanity/lib/*` scaffold.
