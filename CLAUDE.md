# currency-converter

A local, single-user currency converter: one Next.js project with a route handler in front of the rate source. `docs/architecture-map.md` is the full reference; `docs/adr/` holds the reasons.

## Commands

- `npm run dev` — dev server, bound to `127.0.0.1`
- `npm run build`, then `npm start` — production build and server, bound to `127.0.0.1`
- `npm test` — Vitest, once (`npm run test:watch` to watch)
- `npm run test:coverage` — Vitest with coverage; fails below 100% of branches in `src/domain/`
- `npm run lint` — ESLint CLI with `eslint.config.mjs` (`next lint` no longer exists)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format`, `npm run format:check` — Prettier

CI (`.github/workflows/ci.yml`) runs five gates: build, `test:coverage`, lint, typecheck and `format:check`.

## Structure

Dependencies point inward: `app`, `ui` and `server` may import `domain`; `domain` imports nothing from the others. Import across modules with the `@/` alias.

- `src/app/` — Next.js entry points. Composes `ui` and `server`, holds no business logic
- `src/domain/` — pure money logic and shared types. No React, no Next.js, no I/O
- `src/server/` — rate source client: request, validation, mapping failures to error codes. Never imported by client components
- `src/ui/` — React components and their state

## Conventions

- **Money:** amounts and rates are `big.js` values inside `domain`, never `number` arithmetic.
- **External input:** anything from the network is parsed with `zod` at the `server` boundary before use.
- **Errors:** the route handler answers failures as `{ "error": { "code", "message" } }` with a matching HTTP status. `code` is a stable value the UI maps to its error state. Raw upstream errors never reach the browser.
- **Browser to server:** the browser reaches the server only through `/api/rates`.
- **Persistence:** none. The only server-side state is the Next.js `fetch` cache, which is uncached by default, so the rates request must set `next: { revalidate }` itself.
- **Tests:** a test sits next to its source as `*.test.ts(x)`, using Testing Library and jsdom for components. Tests never call the real API: fake the rate source with `server.use(...)` from `test/msw-server.ts`. Unhandled requests fail the test.
- **Styling:** Tailwind CSS 4 utility classes only; theme tokens in `src/app/globals.css`.

## Version pins

Keep TypeScript on `~6.0` and ESLint on 9 until `eslint-config-next`'s dependencies support newer majors. See Constraints in `docs/architecture-map.md`.
