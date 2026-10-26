# Shared share price history

Publish `lib/bonds/equity-trade-observations.ts`, `app/api/bonds/rse/equity-history/route.ts` and the updated `db/bonds-schema.sql` with the website. The existing database preparation step adds the lookup index. Include `tests/equity-trade-observations.test.mjs` in source control.

The history API now has a separate `tradeObservations` array and `tradeHistoryAvailable` flag. Its original `observations` array remains exchange closes only, so existing website valuations and closing-price charts retain their meaning. The mobile app combines the two only for its recorded-price chart, with exchange closes taking priority on a shared date. Latest quotes use their published market date, never today's retrieval date.

Existing RSE/RWF contract-backed purchases across accounts and the bundled owner contracts supply prices immediately. New saved contract imports contribute on the next history request. No PDF rescanning, duplicate storage, scheduled backfill, or full portfolio downloads are required. Private contract/account identifiers, filenames, quantities and costs never enter the response. No production records were altered during development.

A contract trade is a reported execution, not an independently verified official close. Purchases require broker and contract references to contribute. The existing purchase validation still checks price, quantity and fee totals. Missing dates stay missing. Multiple distinct execution prices on a date yield a daily median and low/high range; repeated uploads of the same price do not weight it. Histories above 400 days per ticker retain monthly endpoints and extrema. The underlying purchases remain complete. Account deletion removes that account's contributions automatically.

The app marks contract observations, uses actual date spacing, and draws dashed guides instead of a filled daily-history area when contract prices are present. Current portfolio valuation continues to use official market quotes.

Verification: `node --test tests/equity-trade-observations.test.mjs tests/bond-market.test.mjs`; `npx tsc --noEmit --incremental false`.
