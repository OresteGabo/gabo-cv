# Portfolio web frontend

The website and mobile app use the same Spring Boot API and Neon PostgreSQL database. The web project contains presentation, calculations, charts and browser PDF parsing. It does not implement authentication, purchase storage, file storage, account administration, market collection or SQL migrations.

API source and deployment: https://github.com/OresteGabo/gabo-portfolio-api

`next.config.ts` forwards every `/api/bonds/*` request to Spring before filesystem routes. The browser/mobile address stays `https://bonds.orestegabo.dev`, preserving secure session cookies and Apple Passwords. The server-rendered market page also calls Spring. There is no legacy backend fallback.

Purchase uniqueness, canonical bond terms, final purchase validation and password hashing are owned by Spring. The browser submits reviewed PDF fields and displays API validation errors. Invitations use Spring’s registration flow; the former manual password-hash setup page redirects to the invitation page.

## Configuration

`BONDS_API_ORIGIN` defaults to `https://gabo-portfolio-api-639858675564.europe-west1.run.app`. Production requires an HTTPS origin without a path or embedded credentials. Vercel Production is already configured.

The existing Vercel daily cron forwards `CRON_SECRET` to Spring's `/api/bonds/rse/daily`. Keep this one shared secret configured privately in Vercel and the API. Database URLs, owner passwords, password hashes and migration secrets belong in the API only.

## Build and release

Run `npm ci`, `npm test` and `npm run build`. Push the website to `main` to deploy through Vercel. Push API changes to its own repository to test and deploy through GitHub Actions and Cloud Run. Compatible API updates need no website or phone rebuild.

The build still copies PDF.js/OCR runtime assets into `public/bond-import`; these support local document extraction in the browser and are required. Private PDFs and legacy `.data` seeds are excluded from Git tracking and Vercel uploads; migrated documents are served by Spring from Neon.

## Local development

Run Spring separately with its local database/profile. Allow `http://bonds.localhost:3000`, `http://localhost:3000` and the API's own local origin in Spring's `GABO_ALLOWED_ORIGINS`. Start the website with `BONDS_API_ORIGIN=http://localhost:8080 npm run dev`. Loopback HTTP is permitted only for development. Do not copy API credentials into this repository.

The previous web-backend sources, local edits and private seed documents were backed up privately under the API project's ignored `backups/` directory before removal. The old hosted database is retained as a migration backup; it no longer receives normal app or website requests.
