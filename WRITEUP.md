# MoneyVerse build notes

This is the honest account of how this app was made for a Sanity “vibe-code” path. It is not a claim that a hosted Sanity dataset was connected in the coding environment. No project id or token was available there.

## What was prompted

The request was a polished financial-literacy game for ages 8–12: needs versus wants, a 100-to-150 coin savings goal, and a lemonade stand, with fictional currency only. The stack asked for Next.js, TypeScript, Tailwind, and Sanity as the source of lesson and mission content, with a playable demo if credentials were missing.

The first build did that. Schemas, GROQ, and an embedded Studio were written, and the game fell back to `lib/content/demo.ts` whenever the project id was missing, the dataset was empty, or the request failed. The town labeled that state “Demo lessons.” That fallback was honest in the interface, and it also meant the running game did not depend on Sanity. The play engines lived in TypeScript. Studio was the default desk with two document lists.

## What changed after that critique

A review workflow is now part of the content model. Missions and lessons have `reviewStatus` (`draft`, `inReview`, `approved`) and a reviewer note players never see. Studio actions are “Send for review” and “Approve.” The desk groups drafts, items in review, and approved documents. The game query loads only published documents that are approved. In production, a missing project, a failed request, or zero approved missions leaves the town empty and says why. Local `npm run dev` still falls back to demo lessons so the game can be tried without credentials.

Studio customization that belongs to this game:

- `CoinField` replaces the plain number input for coin amounts and labels them as fictional game coins.
- The mission document has a Play preview that lists steps, supply prices, and quiz questions before publish.

`defineLive` from `next-sanity/live` is mounted in the root layout. When a project id is set, publishing an approved mission can refresh the town without a redeploy. Stega encoding is turned off for these fetches so invisible characters cannot break the game’s validation.

The seed script writes the built-in missions and lessons as `approved`.

## What this still is not

There is no Sanity App SDK surface and no external API workflow. Approval sets a field on the draft. A person still uses Studio’s Publish action before the town can see it. Customer counts, scoring, and the three play styles remain TypeScript. An editor can change copy, amounts, and whether a document is approved. They cannot invent a fourth play style from Studio alone.

No dataset was created from this environment. Connecting one is a project id, a CORS origin, and `npm run seed:sanity` with a server-only write token. Until that happens, local development keeps showing demo lessons, and a production build shows the empty state.
