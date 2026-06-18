# The Archivist German Learning App

Production-oriented full-stack scaffold built from the Stitch HTML screens in this repository.

## What Is Included

- `frontend/` contains the maintainable app screens and browser-side modules.
- `backend/` contains the Express API, auth/session handling, SQLite persistence, and seed data.
- `docs/architecture.md` captures the screen analysis, backend plan, schema, and API contract.
- The seeded library includes 25 readings: 5 resources each for A1, A2, B1, B2, and C1.

## Main Flows

- Sign in or create an account at `/auth`
- Dashboard at `/dashboard`
- Story library at `/library`
- Reader with click-to-translate at `/read/:slug`
- Vocabulary lexicon at `/vocabulary`
- Flashcard review at `/flashcards`
- Admin content studio at `/admin` for creating stories, essays, letters, and dialogues
- Local-only bulk dictionary imports from Kaikki/Wiktextract datasets via `/admin`

## Run Locally

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`
3. Open:
   `http://localhost:3000`

Demo credentials are seeded automatically:

- Email: `julian@archivist.app`
- Password: `Archivist123!`

## Deploy On Vercel Free

This repo exports the Express app from `api/index.js` and rewrites all app routes to that serverless function. Vercel runs `npm run vercel-build` to copy the HTML pages and browser assets into `public/`, then serves the app from the free serverless runtime.

No cloud storage is required. On Vercel, the SQLite database is created in `/tmp/archivist-data`, so it is ephemeral: demo data is seeded automatically, but new users, sessions, saved words, imports, and admin edits can reset whenever Vercel replaces the serverless instance.

The deployed Vercel app is therefore a resettable demo. Runtime dictionary imports are disabled on Vercel because imported files and SQLite writes are not durable there. To ship more dictionary data without cloud storage, add it to `backend/src/data/seed.js` before deploying.

Use Node 22.5 or newer because the app uses Node's built-in `node:sqlite`.

## Stack

- Frontend: static HTML + Tailwind CDN + ES modules
- Backend: Node.js + Express
- Database: SQLite via Node's built-in `node:sqlite`
- Validation: `zod`
- Auth: server-side sessions stored in SQLite

## Bulk Dictionary Import

Bulk imports are intended for local development or a durable server environment. They are disabled on Vercel free/no-storage deployments.

The admin screen can now import open German dictionary datasets in bulk instead of adding entries word by word.

1. Download a Kaikki German dictionary dataset in `.jsonl` or `.jsonl.gz` format.
2. Place the `.jsonl` or `.jsonl.gz` file inside `backend/data/imports/`.
3. Start the app with `npm run dev`.
4. Sign in as the admin user and open `http://localhost:3000/admin`.
5. In the `Bulk Lexicon Loader` panel, refresh the file list and run the import.

Recommended source:

- Kaikki German machine-readable dictionary: `https://kaikki.org/dictionary/German/`
- Kaikki raw data downloads: `https://kaikki.org/dictionary/rawdata.html`

Notes:

- Imported entries are merged into the existing dictionary tables.
- Inflection forms from the dataset are added to `dictionary_forms`, so click-to-translate works on more surface forms.
- If Wikimedia audio URLs are present in the dataset, they are attached automatically; otherwise the app falls back to browser TTS.
