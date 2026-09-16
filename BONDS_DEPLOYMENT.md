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
- Signed, HTTP-only owner session
- Responsive layout suitable for installation from a phone browser

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

## Owner password

Generate the scrypt hash locally:

```bash
node scripts/hash-bonds-password.mjs 'your-long-unique-password'
```

Store the output as `BONDS_ADMIN_PASSWORD_HASH`. Never commit the password,
hash, session secret, or database URL.

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

- Simulator assumptions are stored only in browser local storage.
- Browser code never receives Neon credentials.
- Purchase APIs require a valid signed owner session.
- Session cookies are HTTP-only, SameSite Strict, and Secure in production.
- Set `BONDS_ADMIN_EMAIL`, `BONDS_ADMIN_PASSWORD_HASH`, and
  `BONDS_SESSION_SECRET` when you want to override the built-in owner account
  and signing secret. The built-in password is stored as a one-way scrypt hash,
  not plaintext.
- Login attempts are throttled per running server instance.
- Database constraints validate financial values again at storage time.

For stronger internet-facing login protection, enable Vercel Firewall rate
limits or Cloudflare rate limiting on `/api/bonds/auth/login`.
