# Pronto Coffee Co

Pronto Coffee Co now uses a workspace-based layout so the authenticated app, marketing site, and backend can evolve independently.

## Apps

- `apps/server`: Express, MongoDB, and Passport local auth. This is now the API and session layer.
- `apps/web`: React staff app with Tailwind and shadcn-style UI components.
- `apps/marketing`: Astro marketing site that preserves the existing public routes.

## Local development

Use Node 24.

```bash
npm install
npm run dev
```

That starts:

- API server: `http://localhost:3000`
- React staff app: `http://localhost:5173`
- Astro marketing site: `http://localhost:4321`

You can also run each app independently:

```bash
npm run dev:server
npm run dev:web
npm run dev:marketing
```

## Environment variables

Create `apps/server/.env` for local backend development. These are the main variables:

- `DB_STRING`
- `SESSION_SECRET`
- `APP_BASE_URL`
- `FRONTEND_APP_URL`
- `MARKETING_SITE_URL`
- `OAUTH_GOOGLE_CALLBACK_URL`
- `OAUTH_GITHUB_CALLBACK_URL`
- `OAUTH_FACEBOOK_CALLBACK_URL`

For the React app, set `VITE_API_URL` if the API is not running at `http://localhost:3000`.

For the Astro app, set `PUBLIC_APP_URL` if the React app is not running at `http://localhost:5173`.

## Render

The repo includes a `render.yaml` blueprint with separate services for:

- the API
- the React staff app
- the Astro marketing site

Each service uses Render build filters so monorepo changes only redeploy the surfaces that were touched. Render’s current docs describe `buildFilter.paths`, `ignoredPaths`, and root-directory behavior in the [Blueprint spec](https://render.com/docs/blueprint-spec) and [monorepo support guide](https://render.com/docs/monorepo-support).
