# GitHub Copilot instructions for *tactical-pitch-command*

These notes are written for AI coding agents that land in this repo for the
first time. They are not a substitute for human docs, but they do capture the
rhythm and structure of the code so that the agent can make useful edits
without getting lost.

---

## 🧩 Big picture

- This is a **dual‑app repo**:
  1. a **React + Vite** front‑end (currently a placeholder) under `src/`; and
  2. a **Discord bot / server** with game logic that runs separately.

- The bot is not built by Vite. it lives in the same tree but is run with
  `ts‑node` or compiled independently. Its entry point is `src/bot-entry.ts`.
  Most packages in `dependencies` are only needed for the front-end; the bot
  only imports what it uses dynamically (see `await import('discord.js')`).

- Core concepts:
  - **Teams, players, matches, queue, milestones and ratings** are modelled in
    Supabase and mirrored by TypeScript interfaces in
    `src/types/global.ts`.
  - Business logic lives in `src/services/*` and talks to the database through
    thin wrappers in `src/models/*`.
  - Commands are simple factories exporting handlers; they are wired up in
    `bot-entry.ts` using a `CommandRegistry` (see
    `src/bot/commandHandler.ts`).
  - A small deterministic match simulator (`src/match/MatchEngine.ts`) and
    commentary generator produce the event data stored in Supabase.

- Tests for deterministic pieces of the engine are under `src/test` and run
  with **vitest**.  The React UI has very little code and no tests yet.

## 🔧 Developer workflows

| Task | Command | Notes |
|------|---------|-------|
| start front‑end | `npm run dev` | Vite dev server on `localhost:5173` |
| build front‑end | `npm run build` / `npm run build:dev` | output in `dist/` |
| preview built app | `npm run preview` |
| lint | `npm run lint` | uses ESLint config in project root |
| unit tests | `npm run test` / `npm run test:watch` | picks up `src/test/**.ts` |

- **Run the bot locally** by setting the necessary environment variables
  (see `src/config/env.ts`) and executing
  `npx ts-node src/bot-entry.ts` or any other file that imports
  `startBot()`.  The `.env` file in the repo is only an example token and is
  not used by CI.  Bot-specific builds are handled outside of Vite.

- **Register slash commands** with Discord via
  `npx ts-node src/commands/register.ts <TOKEN> <APP_ID> [GUILD_ID]`.  The
  command definitions live in the same file; update them when you add a
  handler.

## 📁 Relevant directories & patterns

```
src/
  bot/             # small runtime helpers: command registry, client wrapper
  commands/        # individual `/join`, `/ranked`, `/host` etc handlers
  services/        # business logic (TeamService, MatchService, ...)
  models/          # thin supabase queries with AppError wrappers
  match/           # simulation engines + utils (ELO, RNG, commentary)
  types/           # shared interfaces & constants (AppError, STAR_DELTAS, ...)
  config/          # env var validation
  utils/           # logger + seedable RNG
  test/            # vitest unit tests + setup file
```

- **Supabase schema** is in `sql/supabase_schema.sql` and migrations under
  `supabase/migrations/...`.  The TypeScript interfaces in
  `src/types/global.ts` mirror the tables; keep them in sync when the schema
  changes.

- The bot services always receive a `SupabaseClient` and `Logger`.  Create a
  new service by following the existing classes (constructor injection, small
  methods, throw `AppError` on user‑facing failures).  Models always return
  `maybeSingle()` results and convert errors to `AppError` before bubbling
  upwards.

- Logging is **structured**.  Never use `console.log` directly; always call
  `createLogger(config.logLevel)` and use `.info/.debug/.error`.

- Errors that should be surfaced to Discord users use `AppError` (see
  `src/types/global.ts`).  Command handlers catch and translate these into
  ephemeral replies.

## 💡 Conventions worth knowing

- The repo uses **ES modules**; import with `import ... from` and files have
  `.ts`/`.tsx` extensions.
- Many bot imports are **dynamic** (`await import('discord.js')`) so that the
  front-end bundle stays small; mimic that if you introduce a new large
  dependency used only by the bot.
- `supabaseClient.createSupabaseClient(config)` lazily builds a singleton.
  Use `getSupabaseClient()` only after initialization to avoid runtime errors.
- When adding a new slash command:
  1. define its shape in `src/commands/register.ts` `COMMANDS` array;
  2. create a handler factory in `src/commands/` (the pattern is
     `export function createFooHandler(...) { return async (ctx) => { ... }}`);
  3. register it in `bot-entry.ts` via `registry.register('foo', ...)`;
  4. re-run the registration script in the target Discord guild(s).
- Use the `AppError.code` values to categorize errors (`TEAM_EXISTS`,
  `ALREADY_QUEUED`, etc.).  Handlers usually inspect the `message` or code
  to choose the reply.
- ORM‑style queries are **not** used; always write explicit Supabase query
  calls (e.g. `.from('teams').select('*')...`).  For complex queries check
  existing model functions for examples.

## 🛠️ Testing & simulation logic

- Core determinism guarantees are in `src/match/SimulationUtils.ts` and
  `src/match/CommentaryEngine.ts`.  The tests in `src/test` exercise those and
  serve as useful reference when modifying them.
- The RNG uses a seeded Mulberry32 implementation (`src/utils/seedableRng.ts`).
  `createMatchRng(matchId)` returns the same sequence for a given match ID.

## ☁️ External integrations

- **Supabase** is the only persistent backend.  Tables used by the bot are:
  `teams`, `players`, `match_queue`, `match_history`, `ratings`,
  `milestone_history`, `milestone_pending_increments`, `seasons`.
- **Discord.js v14** is loaded dynamically at runtime.  Slash command payloads
  are defined in `register.ts`, handlers receive a trimmed context object with
  helper methods for replying.
- The bot optionally exposes a simple HTTP health-check port when
  `HEALTH_PORT` is set.

## 📦 Build & deployment notes

- The frontend build uses Vite's standard config (`vite.config.ts`).  There
  are no special build steps for the bot; it is expected to be run from
  source or compiled separately by the deployment system.
- Environment variables are validated in `src/config/env.ts`; deployment
  pipelines should ensure all required vars (`DISCORD_TOKEN`, `SUPABASE_*`,
  etc.) are provided.

## ✅ What AI agents should do first

1. **Run tests locally** after changes (`npm run test`).  Many PRs will
   modify the simulation logic and tests catch regressions.
2. **Add new command handlers** by copying the pattern from existing files.
3. **Update `COMMANDS` & run register script** whenever commands change.
4. **Log at appropriate level**; use structured logger.
5. **Avoid editing the generic README**; focus on code files instead.


---

> ⚠️ This project has few UI components and a generic starter README.  The
> real work happens in the bot/services layer.  When you are writing code,
> navigate to `src/services` or `src/commands` first and look at nearby
> examples.

Please point out any unclear areas so I can improve these instructions!