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

The portfolio API uses the JSON file database by default. The default file is
`.data/bonds-portfolio.json`.

The repository tracks `.data/bonds-portfolio.json` so the current file database
is included when the code is pushed to GitHub and deployed. Other files inside
`.data/` remain ignored.

Set `BONDS_PORTFOLIO_DATABASE=database` only when you want the portfolio to use
Postgres through `BONDS_DATABASE_URL`. Set `BONDS_FILE_DATABASE_NAME` only if you
want a different file name inside `.data/`.

On Vercel/serverless, the committed JSON file is useful as a deployed read
source. Runtime writes to project files are not durable there, so production
changes should be made locally and pushed, or moved later to a durable database
such as Neon.

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

The endpoint accepts either an `Authorization: Bearer <secret>` header or a
`?secret=<secret>` query parameter, forces a fresh RSE fetch, and stores any
observed bond-market rows in `bond_market_observations`.

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
- Login attempts are throttled per running server instance.
- Database constraints validate financial values again at storage time.

For stronger internet-facing login protection, enable Vercel Firewall rate
limits or Cloudflare rate limiting on `/api/bonds/auth/login`.
