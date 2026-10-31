# Cache probe — converter

Task T17, 2026-10-31. Next.js v16.4.3, production build (`npm run build`, then `next start -H 127.0.0.1`).

## Method

A temporary stand-in for the rate source ran on `127.0.0.1:4599`, outside the repo, counting requests and answering valid, untrusted or failing on demand. `src/server/rate-source.ts` was temporarily pointed at it with `REVALIDATE_SECONDS` shortened to 5, and both edits were reverted afterwards (`git diff -- src/` is empty). The app was stopped and `.next/cache` deleted before each scenario. Requests were made to `GET /api/rates?base=USD&quote=UAH`.

"Count" is the stand-in's request count when that reply came back. A background refresh is counted after the reply that triggered it.

## Scenarios from the task

| Scenario | Expected | Observed | Match |
|---|---|---|---|
| Second request within the interval | 200 twice, stand-in count stays at 1 | 200, 200; count 1, 1 | Yes |
| Untrusted status-200 answer | 502, and the next request reaches the stand-in again | 502, 502; count 1, 2, with the fixed body and no upstream text | Yes |
| Status-200 body that is not JSON | 502, and the next request reaches the stand-in again | 502, 502; count 1, 2, with the fixed body and no upstream text | Yes |
| Past the interval, stand-in answers another status | 200 with the stored rate and its true date | 200, then 200 and 200 with rate `45.436` and date `2026-10-29` while the stand-in answered 503 | Yes |
| Past the interval, stand-in stopped | 200 with the stored rate and its true date | 200, then 200 and 200 with rate `45.436` and date `2026-10-29` | Yes |
| Nothing stored, stand-in stopped | 502 `rate_unavailable` | 502 with the fixed body | Yes |

Every reply carried `Cache-Control: no-store`.

## One further observation

Not in the task's table. Past the interval, the stand-in answered an untrusted status-200 body to the background refresh:

| Request | Stand-in | Observed |
|---|---|---|
| 1 | valid | 200, stored |
| 2, past the interval | untrusted | 200 with the old rate; the refresh replaces the stored answer in the background |
| 3 | untrusted | 502; the bad answer is read and dropped |
| 4 | valid again | 200; the request reached the stand-in, count 3 |

This confirms the negative consequence ADR-0004 already accepts: a malformed answer during a background refresh replaces a good stored rate, and dropping it leaves the pair with nothing stored until the next attempt. Recovery takes one attempt. It needs no decision and no code change.

## Result

All scenarios match ADR-0004 and AC-12. The stand-in was never reachable from outside the machine, and no test or probe scenario called the real rate source.
