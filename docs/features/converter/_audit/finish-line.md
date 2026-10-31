# Finish line — converter

AC-16 counts the feature as finished only when every box below is ticked. The owner ticks the manual boxes during `review`. `implement` ticks none of them.

## Automated gates

CI runs these on every pull request. To run them locally:

| Gate | Command |
|---|---|
| Build | `npm run build` |
| Tests, with 100% branch coverage of `src/domain/` | `npm run test:coverage` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Format check | `npm run format:check` |

The worked examples calculated ahead of the code run as part of the tests, in `src/domain/worked-examples.test.ts`.

- [ ] All five gates pass in CI on the final change

## Owner's manual checks

Start the app with `npm run build`, then `npm start`, and open <http://127.0.0.1:3000>.

- [ ] **One pair in both directions.** Compare USD to UAH and UAH to USD on the screen with the rate source: `https://api.frankfurter.dev/v2/rates?base=USD&quotes=UAH` and `https://api.frankfurter.dev/v2/rates?base=UAH&quotes=USD`
- [ ] **Keyboard walk.** Using only the keyboard, reach and operate the amount, both currencies and the swap control. Focus is always visible, and every field has a Ukrainian label
- [ ] **Another device.** Try to open `http://<this machine's address>:3000` from another device on the same network. It must fail to connect
- [ ] **Read the change.** Read the whole diff of this feature

## Security review

Limited to these three items by spec §6.1.

- [ ] **Local-only access.** `npm run dev` and `npm start` bind to `127.0.0.1` (`package.json`), and `lsof -nP -iTCP:3000 -sTCP:LISTEN` shows only that address while the app runs
- [ ] **Supported-currency check.** `GET /api/rates` refuses a currency outside the list before any request reaches the rate source (`src/app/api/rates/route.ts`)
- [ ] **Rate source text off the screen.** Failures answer a fixed body, with the reason on the server console only, and the screen shows only its own message (`src/app/api/rates/route.ts`, `src/ui/rates-api.ts`)
