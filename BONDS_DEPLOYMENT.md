# Rwanda Treasury Bond Planner

The bond application is available locally at `/bonds`. In production,
`proxy.ts` rewrites requests from `bonds.orestegabo.dev` to that route while
leaving `orestegabo.dev` unchanged.

## Features

- Live 1-40 year projection with editable assumptions
- Net coupon and reinvestment calculations
- 50M, 100M, and 200M RWF milestones
- Annual and monthly schedules
- CSV projection export
- Private Neon-backed real purchase log
- Signed, HTTP-only owner session
- Responsive layout suitable for installation from a phone browser

## Neon setup

1. Create a dedicated database or branch in Neon.
2. Run `db/bonds-schema.sql` in the Neon SQL Editor.
3. Copy `.env.bonds.example` values into `.env.local` for development.
4. Add the same values in Vercel Project Settings > Environment Variables.

Run `db/bonds-schema.sql` again when upgrading an existing installation. The
file contains additive migrations for the real transaction ledger.

Use a separate Neon role for this application when possible. Grant it only
`SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `bond_purchases`.

## Owner password

Generate the scrypt hash locally:

```bash
node scripts/hash-bonds-password.mjs 'your-long-unique-password'
```

Store the output as `BONDS_ADMIN_PASSWORD_HASH`. Never commit the password,
hash, session secret, or database URL.

## Domain

Add `bonds.orestegabo.dev` in the Vercel project's Domains settings. Vercel
will display the exact DNS record required. For a subdomain this is normally a
CNAME record at your DNS provider.

## Security boundary

- Simulator assumptions are stored only in browser local storage.
- Browser code never receives Neon credentials.
- Purchase APIs require a valid signed owner session.
- Session cookies are HTTP-only, SameSite Strict, and Secure in production.
- Login attempts are throttled per running server instance.
- Database constraints validate financial values again at storage time.

For stronger internet-facing login protection, enable Vercel Firewall rate
limits or Cloudflare rate limiting on `/api/bonds/auth/login`.
