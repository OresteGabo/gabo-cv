# Owner purchase storage fix

Recording a pending October bond after settlement is valid. RWF 1,200,000 plus RWF 11,000 commission saves as a submitted purchase with total cash cost RWF 1,211,000. The failure is in the owner storage path: it selected the bundled JSON file even when a database connection existed. Vercel's deployed application directory cannot be rewritten at runtime.

## Deployment

Vercel inspection confirmed `gabo-bonds` (Neon) is connected to `gabo-cv` Production and `DATABASE_URL` is present. No database credentials were revealed or changed. `BONDS_PORTFOLIO_DATABASE` is absent, so the old owner path defaults to JSON despite the connected database. No new database is needed for this project.

1. Ensure Vercel Production has `BONDS_DATABASE_URL` or `DATABASE_URL` for the existing Neon/Postgres database. Do not put the connection string in Git or the mobile app.
2. Publish these website changes and rebuild. `npm run build` applies the schema and imports `.data/bonds-portfolio.json` into the owner database once. The import preserves record IDs and timestamps, skips existing records, and runs in the schema transaction. Later builds do not restore deleted records or overwrite edits.
3. For this first deployment, `BONDS_SKIP_DATABASE_MIGRATIONS` must be unset or `0`. A deployment that skips preparation will not import the existing JSON records. A restricted runtime role can be restored after preparation succeeds.
4. Retry the pending purchase from Calendar. No mobile update is required for this storage fix. A newly connected database can require signing in again.

Connected storage is authoritative for all accounts. With no database, local file mode remains available for development and existing owner-only production login can still read its bundled portfolio; Vercel purchase writes require a database. The original JSON files are kept as backup and are never deleted or rewritten by the import.

The catalog also preserves `submitted`, `sold` and `matured` status rather than activating records merely because an issuance is recognized.

## Verified locally

All 38 account/import/storage regression tests pass using an isolated PGlite database, including a read-only deployment, the exact October amount after settlement, entry several months later, owner/member separation, pending catalog status, one-time seed behavior, edits/deletions surviving repeat builds, and rollback after a bad seed. TypeScript checking passes. The existing bundled portfolio also imports into an isolated database with both record IDs preserved. No production records were created or changed.
