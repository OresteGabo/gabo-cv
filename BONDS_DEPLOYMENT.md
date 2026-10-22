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
- Existing owner login for JSON deployments; invite-only accounts with revocable sessions in database mode
- Responsive layout suitable for installation from a phone browser

## PDF purchase import

In the private portfolio, choose **Add purchase → Choose PDF**, or drop one PDF
into the highlighted upload area. New-purchase fields appear only after a
successful PDF import. Manual-entry and calendar-prefill paths do not populate
new purchases, and no issuance template is loaded. The browser checks
the filename/MIME type, size, header, ending and parsed PDF structure. It rejects
scripts, attachments and interactive annotations; passive signature widgets are
allowed after checking their actions. Flatten annotated PDFs before importing.
For bonds it requires a bond identity, at least two recognizable terms and BNR/result context,
and extracts BNR result fields and coupon dates. RSE equity purchase contract notes
are detected automatically and extract shares, executed price, dates and fees for review. Scanned pages use local English
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
These also exercise the real reader with malformed PDFs, compressed JavaScript,
attachments and signatures. Both the browser API and worker use PDF.js's legacy
compatibility build, including the Map-method polyfills required by Safari.
Reader exceptions are mapped to fixed application messages. Raw exception text,
stack traces and document content are never displayed as upload errors, and
cleanup failures cannot replace the original user-facing error.
Import saves into the signed-in user’s portfolio. Existing bundled documents
and original equity JSON records remain private to the owner account. New share imports
are saved separately for each signed-in account.

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

## Optional portfolio market data

Portfolio bond rows show RSE listed closing prices instead of a prominent Edit
button. Editing remains in **Settings → More actions → Edit purchase details**.
Prices are matched to the exact bond series, using the outstanding-bond ISIN
mapping when available. Reopened series match their original issue. Multiple
listed prices are shown as a range, and comparisons use percentage points
against the recorded purchase price. RSE bond rows do not supply execution
dates, so the UI says **Trade date not provided**. A fetch/observation date is
never presented as a trade date. Zero-price placeholder rows are ignored.

The stock-performance page is **/stocks**. Its link has prefetch disabled.
Holdings load through the existing authenticated equities API, which returns
only the current account's authorized positions. Prices and history are public
market data. Current valuation uses active RWF shares, compares against cash
cost including purchase fees, and excludes dividends and selling fees. No
automatic currency conversion is applied.

The public RSE pages provide current quotes rather than a complete historical
time series. `equity_market_observations` stores at most one public closing
quote per ticker and source date, updated only by a newer observation. Snapshots
are collected daily by the protected Vercel job described below and optionally
when the stock page requests quotes. History is read in a later optional request. Month/year filters
show recorded quotes alongside purchase-cost anchors and today's estimated
value. A graph can render before two quote dates have accumulated: purchase
cash cost is a stepped line, recorded RSE values are dots/solid segments, and
cost-to-quote or latest-quote comparisons are dashed. Today's marker explicitly
retains the actual source quote date, and is never saved as a new observation.
Repeat purchases are combined per company, with average cash cost per share
calculated as total cost including fees divided by total shares. Only shares
bought by each plotted date contribute to that date's value. Same-day purchases
use a same-day comparison; filtered ranges carry earlier cost into the range.
Missing months are not backfilled or treated as zero returns. The
schema is installed by the existing production prebuild migration. A missing
database/history table leaves current quote valuation usable.

Optional requests wait until primary portfolio requests complete, document
load finishes, the page is visible, resources are quiet, and an idle slot is
available. Only one optional request runs at a time. Portfolio uploads,
purchase dialogs, saves, deletion and account/settings panels suspend optional
requests. Fetches are low priority and aborted on navigation or foreground
work. HTML parsing and pagination happen on the server; the browser compares
small parsed price rows with the securities already in the portfolio.
The chart chunk loads only on the stock page after data becomes available.

RSE HTTP responses are cached for 15 minutes, with per-process request
deduplication and a short failure backoff. Pagination is capped, concurrency
is bounded, and requests time out. Recent cached successes may be shown with
a Cached label if the source is unavailable. Sources, observation/publication
times, no-trade rows, missing data, partial coverage, timeouts, and retry states
are shown separately from saved portfolio records. Nothing in market data
updates purchase principal, coupon schedules, or owner credentials.

Run `npm run test:market` for parsing, matching, valuation, history persistence,
source failures, caching, pagination, and idle scheduling tests.

## Accounts and invitations

### Invite a friend to create an account

This is the primary onboarding flow. Sign in as the owner and select
**Portfolio → Invite a friend → Create private invitation**. The email is
optional: leave it empty so the recipient can choose their email, or enter an
email to restrict the invitation to that address. Copy the generated
`/join#invite=...` link and share it privately with the intended friend.

The link opens an account-creation form. The recipient chooses an email and a
password, confirms the password, and is signed in to their new private portfolio.
Their account is saved directly in Postgres, with a scrypt password hash and a
normal user role. They can import PDFs, save/edit/delete their own purchases,
sign out and back in, and see those bonds in the simulator. No friend password
or hash needs to be given to the owner or added to Vercel. PDF extraction happens
on the recipient's device; the reviewed bond data is saved to their account.

Each invitation is random, expires in 48 hours, and creates one account only.
An unbound link is a bearer invitation: anyone holding it can claim that one
account, so send it directly to the intended recipient. Only token hashes are
stored. Creating a replacement link invalidates the previous one, and successful
registration closes it automatically. Only the owner can issue or cancel links;
normal users cannot promote themselves or access the owner's data.

### Review and delete test accounts

Sign in as the main owner and open **Portfolio → Manage accounts**. The list
shows the protected owner and every registered account, including disabled
accounts. It contains emails, status, and creation dates; it never returns
password hashes or session tokens. Select **Delete account**, type that
account's email, and confirm permanent deletion. This removes the database
account, its saved purchases, and all its sessions atomically. Other portfolios
remain unchanged. The deleted email can be invited again as a new, empty account.
Only the owner can list or delete accounts, and the owner cannot be deleted.
The optional legacy account configured in Vercel is shown separately; revoke
that account by removing its friend credential variables and redeploying.

Each row also shows the total bond principal (face value of all saved purchases,
including sold and matured records), with each currency totaled separately,
the number of saved purchases, and the latest added purchase's bond name,
ISIN/security code, trade date, and added date. Latest means most recently saved,
so importing an older trade still shows that recent account activity. The
figures refresh when opening deletion confirmation and are repeated before the
permanent-delete button. Summaries use the owner's existing JSON portfolio when
applicable and the database for registered users; they remain owner-only.

### Friend access with an email and password hash

This optional manual alternative is under **Advanced: manual Vercel account**.
Share `https://bonds.orestegabo.dev/create-password` after deploying this feature.
The friend enters an email and chooses and confirms a password. The browser uses
Web Crypto PBKDF2-HMAC-SHA256 with 600,000 iterations and a fresh 16-byte random
salt, following [OWASP's PBKDF2 work factor](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
and the [Web Crypto derivation API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits).
The password is not sent to an endpoint, stored in browser storage, or
included in the copy output. The generated verifier is compatible with server
verification; existing scrypt owner passwords remain compatible.

The friend sends only the email and hash privately to the owner. Configure two
Production variables in Vercel: `BONDS_FRIEND_EMAIL` and
`BONDS_FRIEND_PASSWORD_HASH`, then redeploy. Do not change the existing
`BONDS_ADMIN_EMAIL` or `BONDS_ADMIN_PASSWORD_HASH`. No passwords or real password
hashes belong in this public repository. The setup page is a public hash utility,
not a registration endpoint; using its link does not create an account or grant
access. Only the configured friend can sign in. Removing either friend variable
and redeploying disables their sessions; replacing the hash invalidates existing
sessions while preserving their purchases. The friend's ID is derived from the
normalized email and remains stable across password changes and deployments.

Synchronized friend purchases require Postgres. The Vercel Neon integration's
`DATABASE_URL` is accepted automatically; `BONDS_DATABASE_URL` takes precedence
when explicitly configured. Production is the only environment connected by the
setup performed for this project. `npm run build` prepares `db/bonds-schema.sql`
atomically before compiling, under an advisory lock to serialize concurrent
builds. A failed migration fails the new build, preserving the previous live
deployment. The script never uploads existing portfolio JSON. A standalone
`npm run db:prepare:bonds` is also available. Set
`BONDS_SKIP_DATABASE_MIGRATIONS=1` only after separately applying migrations if
the application uses a restricted runtime role without DDL permissions.

The friend receives normal account access and an isolated database portfolio;
owner documents, equities, invitations, and purchases remain unavailable to them.
The owner can keep the existing JSON portfolio while the friend uses Postgres;
no automatic migration of the owner's existing private records is performed.
If the database has not been connected, friend sign-in explains that storage is
not ready instead of pretending to save records to serverless files.

### Owner access and database invitations

The existing production JSON deployment works without a database. Configure only
`BONDS_ADMIN_EMAIL` and `BONDS_ADMIN_PASSWORD_HASH` as private Vercel environment
variables. The old password was exposed in public Git history, so this repair
replaces it with a new random password, delivered locally outside the repository
at `/private/tmp/gabo-bonds-owner-login.txt`. The matching private Vercel import
file is `/private/tmp/gabo-bonds-owner.env`. Import that file into Vercel's
Production environment and redeploy. Neither file, the password, nor its verifier
is committed or included in public assets. Save the password in a password
manager, since the OS may clear temporary files.
Owner sign-in reads the existing JSON portfolio, documents, and equities. Unknown
accounts cannot sign in, and new account creation is closed until persistent
storage is connected. Setting `BONDS_PORTFOLIO_DATABASE=database` explicitly
continues to require a database; a database outage never falls back to JSON auth.

`npm run build` generates a random, private signing key for this owner-only mode.
The ignored `.data/bonds-deployment-key.json` is traced into the server deployment
and standalone output, never the public assets or Git. Every function in that
deployment uses the same key, so owner sessions do not depend on temporary files
or a particular server instance. Rebuilding rotates the key and invalidates prior
sessions. Do not share server build artifacts. Run the build through the npm
script so preparation runs; a missing key fails closed.

Owner-only sessions expire after one hour. Logout clears the browser cookie;
without shared storage it cannot revoke a copied cookie on every server instance.
Password changes and a new build invalidate those sessions. Sign-in has no
attempt-based lockout. Database registration retains shared rate limits and
database sessions support server-side revocation. Every mode requires both private
owner credential variables; there is no fallback to credentials exposed in Git.

Before enabling multi-user accounts on a deployed website:

1. Connect Neon in Vercel (which supplies `DATABASE_URL`), or configure
   `BONDS_DATABASE_URL` with a durable Neon/Postgres database.
2. Deploy through `npm run build` to prepare the complete `db/bonds-schema.sql`,
   or apply it separately with `npm run db:prepare:bonds`. The migration is additive: existing SQL
   purchases receive `owner_id = 'owner'`; existing bundled JSON records are also
   available only to the owner. Back up the database before applying migrations.
3. Set `BONDS_ADMIN_EMAIL` to your owner email and generate an owner password hash:
   `node scripts/hash-bonds-password.mjs 'a-long-unique-passphrase'`.
   Save the output as `BONDS_ADMIN_PASSWORD_HASH`. Existing `salt:hash` owner
   hashes remain compatible; new hashes use stronger scrypt parameters.
4. Optionally set `BONDS_APP_ORIGIN=https://bonds.orestegabo.dev` for a fixed origin
   behind a proxy. Leave it unset for local development unless it matches the
   actual local URL exactly.
5. Deploy and sign in. Open **Portfolio → Invite a friend**, optionally enter
   your friend’s email, and select **Create private invitation**. Copy the link and share
   it directly with that friend. The website does not send email.

Invitations are bound to the entered email when supplied, expire in 48 hours, and can create
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

Multi-user production accounts require Postgres: there is no fallback to serverless files
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
do not commit them or deploy them as an account database. Every mode requires
private owner credentials and rejects the old predictable signing secret.
`BONDS_SESSION_SECRET` is no longer used. Old signed cookies are intentionally
invalidated on upgrade: everyone signs in again.
Passwords are hashed with scrypt; session and invitation tokens are random, and
only token hashes are stored. Database logout revokes the server session as well
as the cookie. Disabling a user in `bond_users.disabled_at` blocks their sessions, and
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

If sign-in returns “Check the account database configuration”, inspect the
deployment's function logs for `[bonds-auth]`. The diagnostic includes the failing
stage, configuration presence (booleans only), and a safe failure category.
`missing_table` or `missing_column` means the connected database needs the latest
schema; `insufficient_database_permissions` means the application role needs the
grants listed above. `missing_BONDS_DATABASE_URL` means the running deployment
does not have that exact variable name. Verify the variable is enabled for the
deployment's Production/Preview environment and redeploy after changing it.
Diagnostics never log raw errors, passwords, emails, session tokens, or connection
strings. An unclassified error still requires checking the database connection
and hosting environment; it does not establish that a password is incorrect.

## Daily equity prices

`vercel.json` schedules `/api/bonds/rse/daily` every day at 18:00 UTC
(20:00 in Kigali). On Hobby, Vercel may invoke it within that hour.
The schedule runs on Production after deploying this commit, without a visitor.
Set a private random `CRON_SECRET` in Vercel's Production environment and redeploy;
Vercel sends it automatically as an Authorization Bearer header. A missing or
incorrect secret returns 401 and never fetches or writes data. Do not put it in
a URL, client code, or Git. The database connection already used for accounts is
also used for public price history; no additional service is needed.

The job fetches only the equity table, bypasses quote caches, retries an unusable
upstream response once, and waits for database writes before reporting success.
Each RSE symbol has one row per **published market date**, including unchanged
prices on a new date. Repeated runs update that date without duplicate rows;
older fetches cannot overwrite newer ones. An unchanged publication date is not
stamped with today's date. Undated, stale, partial, empty or failed sources are
not persisted. Missing database configuration and collection errors return 503.
Vercel does not automatically retry a failed cron invocation; inspect the Cron
Jobs/function logs for `[rse-daily]` and invoke it again after fixing the issue.
Logs contain status, market date and row count only, never credentials.

Build migrations create `equity_market_observations` and the singleton
`equity_market_collection` health record (last attempt, last successful attempt,
latest market date, status). Runtime roles need SELECT/INSERT/UPDATE permissions
on these tables. The health record retains one row, including when the same RSE
market date is checked repeatedly. Price rows contain no accounts or holdings
and are shared across portfolios. Optional page visits can also save dated quotes.

Raw daily observations are retained. Month/year requests return daily rows;
histories over 400 observations per symbol return each month's first and last
actual observations. Their original dates are preserved, with no fixed
400-day cutoff. The client requests only held symbols and the selected range,
after holdings and quotes load and the page is idle. Empty history and failures
leave the holdings/current valuation usable. Collection starts with available
RSE updates; historical daily prices cannot be invented or backfilled from a
current closing quote.

## RSE bond market snapshots

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
- Database sessions use 256-bit random tokens, expire after 12 hours, and are
  revocable. Owner-only JSON sessions use a private deployment signing key and
  expire after one hour, with the logout limitations described above.
- Cookies are HTTP-only, SameSite Strict, and Secure with a host-only `__Host-`
  name in production. No session tokens are put in browser local storage.
- Every mutation checks the complete request origin and uses a bounded JSON body.
- Invitation redemption and consumption are atomic in Postgres; duplicate
  registration cannot create two accounts from one link.
- Database registration is limited by account identity, IP, and a global budget
  using persistent storage. Sign-in retries have no 15-minute lockout.
  Proxy IP headers are supplemental; identity and
  global limits still apply if an IP header is spoofed. Hosting firewall limits
  can add protection against distributed abuse.
- Simulator assumptions and cash injections use account-scoped browser storage keys; private purchases
  are fetched from the authenticated, user-scoped API.
- Static files under `private/` and `.data/` remain readable by anyone with
  repository, build-artifact, or host filesystem access; website authorization
  does not change those infrastructure permissions.

## Purchase PDF imports

The portfolio's **Add purchase** dialog detects a BNR bond result or a single
RSE equity purchase contract note. It reads the PDF on the device, then sends
only reviewed purchase fields to the authenticated API. Original PDF bytes and
extracted text are never stored by this flow. Documents remains the existing
private document library; importing a purchase does not archive its PDF there.
Unknown equity symbols require entering the RSE ticker during review. Sale notes,
unsupported currencies/exchanges, unrelated PDFs, ambiguous multi-note files,
scripts and attachments are rejected with fixed messages.

Build migrations add `equity_purchases` and a bond duplicate index. Equity
purchases use the connected account database, including for the owner. Existing
owner equity JSON remains visible only to the owner and also participates in
duplicate detection. Local development without a database uses separate files
under the ignored `.data/bonds-users/` directory. Account deletion removes both
bond and equity purchases. Manage Accounts includes share count, cash cost and
the latest company alongside bond activity.

Duplicate identities are scoped to the account and enforced by database unique
indexes (or the local file write queue). Renaming a PDF does not bypass them.
Bond identity uses security, currency, market, settlement date, principal and
executed price; secondary-market identity also includes trade date. For primary
allocations, changing fees or the default trade date does not create a second
allocation. Equity checks use transaction values plus available contract-note
and trade-report identifiers. Distinct dates, quantities or executed prices
remain separate purchases unless an existing contract/report identifies the
same transaction. Historical duplicates are retained, with one indexed record
per legacy group preventing further repeats. No saved purchase is deleted by
the migration.
