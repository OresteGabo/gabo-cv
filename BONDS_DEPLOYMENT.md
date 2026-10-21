# Rwanda Treasury Bond Planner

The bond application is available locally at `/bonds`. In production,
`proxy.ts` rewrites clean requests such as `bonds.orestegabo.dev/simulator` to
the internal `/bonds/simulator` route while leaving `orestegabo.dev` unchanged.
Legacy `/bonds/...` links on the subdomain redirect to their clean equivalent.
Requests to `orestegabo.dev/bonds/...` permanently redirect to the matching
subdomain URL, preserving bookmarks while keeping one public bond-site address.

## Features

- Live 1-40 year projection with editable assumptions
- Net coupon and reinvestment calculations
- 50M, 100M, and 200M RWF milestones
- Annual and monthly schedules
- CSV projection export
- Private real purchase log backed by Neon or a local JSON file
- Saved RSE bond-market observations for recent secondary-market activity
- Protected market snapshot endpoint for scheduled RSE captures
- Invite-only user accounts with revocable HTTP-only sessions
- Responsive layout suitable for installation from a phone browser

## PDF bond import

In the private portfolio, choose **Add purchase → Choose PDF**, or drop one PDF
into the highlighted upload area. New-purchase fields appear only after a
successful PDF import. Manual-entry and calendar-prefill paths do not populate
new purchases, and no issuance template is loaded. The browser checks
the PDF signature and structure, rejects detected JavaScript or embedded files,
and extracts BNR result fields and coupon dates. Scanned pages use local English
OCR. The PDF and recognized text stay on the device; only the reviewed purchase
form is sent to the existing save endpoint. The original PDF is not stored in the
document library by this feature.

Imports start from an empty draft rather than copying personal data from an
issuance template. The investor's allocated principal is read separately from
the total issuance amount. Missing or ambiguous fields need manual entry. OCR
and incomplete schedules remain estimated until the user checks the original
and selects a confirmed schedule. The review checkbox is required before saving.

Limits: 10 MB per PDF, 10 pages total, up to 5 scanned pages, and a two-minute
processing timeout. Clear English BNR result documents are supported; arbitrary
broker layouts may require manual correction. OCR can misread codes, numbers,
and dates, so review remains necessary. Password-protected PDFs must be unlocked
first. This validation does not certify that a document is malware-free; the app
does not execute PDF actions or upload the source file.

`npm run dev` and `npm run build` prepare same-origin PDF/OCR workers, language
data, fonts, and WASM in the ignored `public/bond-import/` directory. No external
OCR service or API key is required. Deploy the generated public assets together
with the app (including when deploying Next.js standalone output). The PDF/OCR
libraries load only after file selection; scans download additional language and
WASM assets on first use. The production CSP permits same-origin workers and
WASM compilation.

Run parser regression checks with `npm run test:bond-import` (Node 22.13+).
Import saves into the signed-in user’s portfolio. Existing bundled documents
and equities remain private to the owner account.

## Portfolio storage

The portfolio API uses the JSON file database by default. The tracked deployment
files are `.data/bonds-portfolio.json` and `.data/equity-portfolio.json`, so a
Git-based deployment can read the portfolio records without a separate database.

This is acceptable only when the repository and deployment project are private.
The website still protects these records from public visitors through the
authenticated API routes, but anyone with repository, build-artifact, or hosting
filesystem access can read the JSON files. Other files inside `.data/` remain
ignored.

Set `BONDS_PORTFOLIO_DATABASE=database` only when you want the portfolio to use
Postgres through `BONDS_DATABASE_URL`. Set `BONDS_FILE_DATABASE_NAME` only if you
want a different file name inside `.data/`.

On Vercel/serverless, runtime writes to project files are not durable. Treat the
tracked JSON files as deploy-time data: update them locally, commit, and deploy.
Use Neon later if you want durable in-app writes without committing portfolio
data.

## Private documents

Authenticated document downloads read files from `private/bonds/documents/`
using metadata from `private/bonds/bond-documents.json`. These files are not
public static assets; visitors must pass the private session check before the
API returns them.

For the current Git-based deployment model, bundling those PDFs with the app is
the simplest way for the website to serve them. This protects them from ordinary
public visitors, but not from people who can access the repository, deployment
artifact, or hosting project filesystem. If repository/build access is part of
your threat model, move the PDFs to private object storage and have the
authenticated API stream them from there instead of committing them.

## Neon setup

1. Create a dedicated database or branch in Neon.
2. Run `db/bonds-schema.sql` in the Neon SQL Editor.
3. Copy `.env.bonds.example` values into `.env.local` for development.
4. Add the same values in Vercel Project Settings > Environment Variables.
5. Set `BONDS_PORTFOLIO_DATABASE=database` when switching production from the
   committed JSON file to Neon.

Run `db/bonds-schema.sql` again when upgrading an existing installation. The
file contains additive migrations for the real transaction ledger and saved RSE
market observations.

Use a separate Neon role for this application when possible. Grant it only
`SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `bond_purchases` and
`bond_market_observations`.

## Accounts and invitations

Before enabling accounts on a deployed website:

1. Configure `BONDS_DATABASE_URL` with a durable Neon/Postgres database.
2. Run the complete `db/bonds-schema.sql`. The migration is additive: existing SQL
   purchases receive `owner_id = 'owner'`; existing bundled JSON records are also
   available only to the owner. Back up the database before applying migrations.
3. Set `BONDS_ADMIN_EMAIL` to your owner email and generate an owner password hash:
   `node scripts/hash-bonds-password.mjs 'a-long-unique-passphrase'`.
   Save the output as `BONDS_ADMIN_PASSWORD_HASH`. Existing `salt:hash` owner
   hashes remain compatible; new hashes use stronger scrypt parameters.
4. Optionally set `BONDS_APP_ORIGIN=https://bonds.orestegabo.dev` for a fixed origin
   behind a proxy. Leave it unset for local development unless it matches the
   actual local URL exactly.
5. Deploy and sign in. Open **Portfolio → Settings → Account creation**, enter
   your friend’s email, and select **Create invitation**. Copy the link and share
   it directly with that friend. The website does not send email.

Invitations are bound to the entered email, expire in 48 hours, and can create
one account only. Successful registration closes account creation automatically.
Creating a new invitation invalidates the previous one. **Close account creation**
revokes any unused link immediately; existing accounts can still sign in. No
public registration switch or source-code removal is needed. Only the owner can
manage invitations. Invitations grant normal user access, never owner access.

Every purchase read, list, update, and delete is scoped on the server to the user
from the session. Owner access does not grant access to friends’ portfolios.
The pre-existing document library and equity portfolio belong only to the owner;
new users see an empty library/equity list. PDF imports remain local to the
browser, with reviewed purchase values saved in that user’s portfolio. Signed-in
users’ real purchases are also loaded in the simulator.

Production accounts require Postgres: there is no fallback to serverless files
for credentials, sessions, invitations, rate limits, or newly registered users’
purchases. The owner’s legacy file portfolio can continue to be read with
`BONDS_PORTFOLIO_DATABASE=file`; runtime changes to that legacy file are still
not durable on Vercel. Switch to database mode only after migrating your owner
portfolio into Postgres. New users use Postgres whenever the connection is set,
regardless of the owner’s legacy storage setting.

Without a database, development keeps its auth file in a project-specific
`gabo-bonds-auth` directory under the OS temporary directory, outside Next’s
watched source tree, and portfolios in ignored `.data/bonds-users/<user-id>.json`
files. Temporary-directory auth data can be cleared by the OS. These are for a single local process;
do not commit them or deploy them as an account database. No default password
or signing secret is built in. `BONDS_SESSION_SECRET` is no longer used. Existing
signed cookies are intentionally invalidated on upgrade: everyone signs in again.
Passwords are hashed with scrypt; session and invitation tokens are random, and
only token hashes are stored. Logout revokes the server session as well as the
cookie. Disabling a user in `bond_users.disabled_at` blocks their sessions, and
changing an owner password hash invalidates existing owner sessions.

There is no automated password-reset or email-verification service in this
version; send the private invitation directly to its intended recipient. Keep
the owner password and database credentials outside Git. Use a least-privilege
app database role with SELECT/INSERT/UPDATE/DELETE on `bond_users`, `bond_sessions`,
`bond_registration`, `bond_auth_attempts`, and `bond_purchases`, plus the existing
market-observation grants. Do not give the browser database credentials.

`npm run test:accounts` runs password, migration, ownership, invitation, session,
CSRF, and rate-limit checks against an embedded PostgreSQL engine. The HTTP suite
requires an isolated development server and `BONDS_AUTH_TEST_URL`; never aim it
at a real portfolio. Expired auth-attempt records are pruned during requests.
Periodically delete expired `bond_sessions` rows as database maintenance.

## RSE market snapshots

The public bond page requests fresh official RSE data on every page load. To
keep a durable record when the RSE bond-market page resets, schedule
`/api/bonds/rse/snapshot` at least once per trading day and set
`BONDS_MARKET_SNAPSHOT_SECRET`.

The endpoint accepts an `Authorization: Bearer <secret>` header, forces a fresh
RSE fetch, and stores any observed bond-market rows in
`bond_market_observations`. Do not pass this secret in a URL query string.

## Domain

1. Add `bonds.orestegabo.dev` in the Vercel project's Domains settings.
2. Copy the exact CNAME target shown by Vercel.
3. In Cloudflare DNS, create a CNAME with name `bonds`, the Vercel target, and
   Proxy status set to **DNS only**.
4. Wait for Vercel to mark the domain as valid and provision HTTPS.

The existing `orestegabo.dev` domain remains assigned to the same Vercel
project and continues serving the portfolio website.

## Security boundary

- All private purchase APIs derive the user from a valid server-side session.
- Sessions use 256-bit random tokens, expire after 12 hours, and are revocable.
- Cookies are HTTP-only, SameSite Strict, and Secure with a host-only `__Host-`
  name in production. No session tokens are put in browser local storage.
- Every mutation checks the complete request origin and uses a bounded JSON body.
- Invitation redemption and consumption are atomic in Postgres; duplicate
  registration cannot create two accounts from one link.
- Login and registration are limited by account identity, IP, and a global budget
  using persistent storage. Proxy IP headers are supplemental; identity and
  global limits still apply if an IP header is spoofed. Hosting firewall limits
  can add protection against distributed abuse.
- Simulator assumptions and cash injections use account-scoped browser storage keys; private purchases
  are fetched from the authenticated, user-scoped API.
- Static files under `private/` and `.data/` remain readable by anyone with
  repository, build-artifact, or host filesystem access; website authorization
  does not change those infrastructure permissions.
