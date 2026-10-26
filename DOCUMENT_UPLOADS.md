# Purchase confirmation PDFs

The mobile app uploads the original PDF before confirming an imported bond or share purchase. Upload failure leaves the purchase unchanged. If the subsequent purchase write fails, the PDF remains in Documents and retrying the review reuses it. Upload and purchase confirmation are sequential operations, not one database transaction.

Uploads use authenticated, same-origin POST /api/bonds/documents requests, in 512 KiB chunks (maximum 10 MiB PDF). Partial uploads stay hidden and expire after one day, cleaned on that account's next upload. Completed uploads are deduplicated by account and SHA-256. The existing Documents GET and download routes include private uploaded PDFs as well as the owner's bundled documents. Account deletion purges both staged and completed uploads. Storage uses the existing Neon/Postgres connection; no extra storage service or credentials are required.

## Deploy manually

Publish these changes together with the existing owner/database and statement changes:

- db/bonds-schema.sql
- lib/bonds/uploaded-documents.ts
- lib/bonds/auth-store.ts
- app/api/bonds/documents/route.ts
- app/api/bonds/documents/[id]/route.ts

The normal prebuild database preparation applies the two new tables. Deploy the API before using the rebuilt mobile app. An older server returns an error for the upload and the app keeps the pending purchase unchanged. Existing purchases whose PDFs were discarded by earlier app versions cannot have those PDFs recovered automatically.

Tests: node --test tests/uploaded-documents.test.mjs tests/account-deletion.test.mjs tests/pending-owner-purchases.test.mjs tests/statement-items.test.mjs
