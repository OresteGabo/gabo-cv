# Statement reminders and accepted purchase PDFs

The mobile Add purchase screen accepts BNR bond results, RSE share purchase contracts, and BK Capital client statements. Statements check existing purchases and save missing-document reminders; they do not invent bond principal, price, coupons, share settlement dates or fee breakdowns. Deposits, transfers, sales and fees are never imported as additional purchases.

## Publish together

The statement feature requires these website files:

- `app/api/bonds/statement-items/route.ts`
- `lib/bonds/statement-items.ts`
- `lib/bonds/auth-store.ts` (account deletion cleanup)
- `lib/bonds/pdf-import-parser.ts` (OCR July-label fix)
- `db/bonds-schema.sql` (reminder storage plus the owner migration marker)
- `tests/statement-items.test.mjs`

Keep the owner-storage changes from `OWNER_PURCHASE_STORAGE.md` in the same deployment: `lib/bonds/db.ts`, `lib/bonds/catalog.ts`, `scripts/prepare-bond-database.mjs`, `scripts/owner-portfolio-seed.mjs`, `.env.bonds.example`, and `tests/pending-owner-purchases.test.mjs`.

Vercel Production already has the `gabo-bonds` Neon database connected and `DATABASE_URL` configured. Run the normal build with schema preparation enabled (`BONDS_SKIP_DATABASE_MIGRATIONS` unset or `0`) for this deployment. No new database or mobile API origin is needed. Existing owner records are imported once without overwriting edits or restoring deletions.

## Behavior

`POST /api/bonds/statement-items` receives a bounded array of observed statement purchases with strict validation, session scope and origin checks. Existing confirmed purchases are marked recorded. Unrecorded items are stored once per account/transaction identity. `GET` returns unresolved reminders. They stay outside investment tables/totals and disappear from the missing list when the corresponding confirmation is saved. Repeating a statement cannot add a second reminder. Deleting an invited account removes its reminders as well.

Bond statements provide debits, not proof of principal or coupon terms. Matching compares the debit to actual executed cost excluding commission, with up to seven days between settlement and statement posting. Share matches require the BK Capital contract reference, ticker, trade date, quantity, price and total. Ambiguous matches remain reminders.

All testing uses isolated PGlite or disposable localhost data. No production transactions were created or changed and no private sample PDFs were committed.
