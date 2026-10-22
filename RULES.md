# MoneyVerse working rules

These rules apply to every change, whether a person or an AI tool makes it. Read them before you edit code. If a request conflicts with a rule, stop and ask the project owner. Do not quietly break the rule.

Related docs: [ARCHITECTURE.md](ARCHITECTURE.md) (how the app is built), [MEMORY.md](MEMORY.md) (current state and change log), [README.md](README.md) (product and economy rules), [AGENTS.md](AGENTS.md) (Next.js version notice).

## 1. No unnecessary dependencies

- **Do not add a package unless the task cannot reasonably be done without it.** First check whether the platform (`fetch`, `Intl`, `crypto`, React, Next.js), an existing dependency (`next-sanity`, `lucide-react`, Tailwind), or a few lines in `lib/` already covers it.
- If a new dependency really is needed, say why in the commit message and in [MEMORY.md](MEMORY.md): what it does, why the existing stack is not enough, and its size and maintenance status. Prefer small, well-maintained packages with no transitive bloat.
- Never add a package for one small helper: dates, classnames, lodash-style utils, UUIDs, or state management. `cn()` in `components/game/ui.tsx` and `useSyncExternalStore` already cover the last two cases.
- Do not import a package that is only a transitive dependency. Example: `@sanity/image-url` arrives through `sanity` and `next-sanity` but is not in `package.json`. Add it on purpose before you import it.
- Change `package.json` and `package-lock.json` together, through `npm install` / `npm uninstall`, never by hand. Do not bump major versions as part of an unrelated change.
- Out of scope by product decision. Do not add: analytics, ads, chat, payments, accounts or auth, cloud save, or PWA/service workers. They need explicit approval from the owner first.

## 2. Don't break existing APIs and contracts

This app has no HTTP API of its own. Its "APIs" are the contracts other code, saved data, and editors already depend on. Keep them backward compatible.

| Contract | Where | What must not break |
|---|---|---|
| Routes | `app/` | `/`, `/missions/[slug]`, `/studio`. Mission URLs use the Sanity slug, so existing links must keep working. |
| Save format | `lib/progress.ts`, `lib/types.ts` | `localStorage` key `moneyverse.progress.v1`, `version: 1`. Existing saves must still load. Add new fields as **optional with defaults** in `parseProgress` (as `lessons` and the totals were). A breaking change needs a new version **and** a migration from v1, never a silent reset. |
| Economy invariants | `lib/economy.ts` | `coins + savings + totalSpent === totalEarned`. No negative balances. Whole-number coins only. Failed actions return the original state. Rewards are paid once: the mission/lesson record is the guard, and the ledger id `reward:<key>` is a secondary check (the ledger is capped at 40). |
| Content schema | `sanity/schemaTypes/*` | Do not rename or remove fields, change field types, or change enum values (`reviewStatus`, `engine`, `tag`, `difficulty`, illustration list) that published documents already use. Add new fields as optional. Removing one needs a content migration plan. Keep Studio validation as strict as `lib/content/validate.ts` (shared rules in `lib/content/rules.ts`), so Studio never accepts content the game drops. |
| GROQ ↔ types ↔ validators | `lib/sanity/queries.ts`, `lib/types.ts`, `lib/content/validate.ts`, Studio schema | Change them together. The visibility filter `reviewStatus == "approved"` plus the `published` perspective must stay. |
| Content fallback | `lib/content/resolve.ts` | Dev falls back to demo content. Production never shows demo content. Keep both behaviors and the `source` labels. |
| Exported functions | `lib/**` | Keep public function signatures and return shapes. Add optional parameters instead of changing required ones. If you must change one, update every caller and test in the same change. |
| Env vars | `.env.example` | Do not rename existing variables. Never expose a token through a `NEXT_PUBLIC_` name. |
| Seed script | `scripts/seed-sanity.ts` | Dry run by default. Writes only the ids it lists. Never deletes. |

The server/client boundary is also a contract. `lib/content/load.ts` and `lib/sanity/*` stay `server-only`. Client components must not import them or read secrets.

## 3. Test after every change

Run all of these after **every** change, before you commit or open a PR. Report the results honestly, including failures.

```bash
npm run test        # Vitest unit tests (must all pass)
npm run typecheck   # tsc --noEmit (must be clean)
npm run lint        # ESLint (must be clean)
npm run build       # for changes to app/, components/, next.config.ts, sanity config, or dependencies
```

- **Logic changes** in `lib/` must come with new or updated tests in `tests/`. Bug fixes need a test that fails before the fix and passes after.
- **UI changes** have no automated tests yet. Run `npm run dev`, then open and use the affected screen: town (`/`), each mission (`/missions/needs-vs-wants`, `/missions/savings-quest`, `/missions/lemonade-stand`), lessons, and savings controls. Check desktop and phone widths, and that progress survives a reload.
- **Content and schema changes:** open `/studio` (with a project id), check that the document still validates, then confirm the town shows it after approve + publish. Without a project id, confirm demo mode still works.
- Never skip, delete, or weaken a test to make a change pass. Fix the code, or explain why the test itself is wrong.
- Documentation-only changes still run `npm run test`, `npm run typecheck`, and `npm run lint` to confirm the tree is green.

## 4. Keep the docs in sync

- After each change, add an entry to the change log in [MEMORY.md](MEMORY.md) and update its "Current state" section if needed.
- If you change routes, data flow, folders, the stack, env vars, or a store's shape, update [ARCHITECTURE.md](ARCHITECTURE.md) in the same commit.
- If you change gameplay, economy, or content-editing behavior, update [README.md](README.md).

## 5. Code conventions

- Read `node_modules/next/dist/docs/` before writing Next.js code (see [AGENTS.md](AGENTS.md)). This Next.js version has breaking changes.
- Game rules go in pure functions in `lib/`. Components call them and never compute balances, rewards, or scores themselves.
- Match the surrounding code: TypeScript `strict`, `@/` imports, Tailwind classes, and the existing component helpers in `ui.tsx`.
- Child-safety copy rules: fictional game coins only, no real financial advice, no personal data collection. Wants are never framed as failures.
- Keep changes small and focused. Don't refactor unrelated code in the same change.
