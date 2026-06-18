# X-Clash VS Planner - Cloudflare Worker Version

This version is designed for a Cloudflare Worker + static assets + D1 deployment model.

## Project structure

- `public/index.html` - frontend app
- `src/index.ts` - Worker entrypoint handling API routes and asset serving
- `schema.sql` - D1 schema
- `seed.sql` - initial formula seed data
- `wrangler.toml` - Worker + assets + D1 config
- `package.json` - Wrangler dependency and scripts

## Step-by-step deployment

### 1. Upload to GitHub

Upload the entire project so your repo root looks like this:

```text
repo-root/
  public/
    index.html
  src/
    index.ts
  schema.sql
  seed.sql
  wrangler.toml
  package.json
  README.md
```

### 2. Create the D1 database

In Cloudflare dashboard or CLI, create a D1 database.

CLI example:

```bash
npx wrangler d1 create xclash-vs-planner-db
```

Copy the returned database ID.

### 3. Update wrangler.toml

Open `wrangler.toml` and replace:

```toml
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

with your real D1 database ID.

### 4. Apply the schema

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=schema.sql
```

### 5. Seed the formulas

```bash
npx wrangler d1 execute xclash-vs-planner-db --file=seed.sql
```

### 6. In Cloudflare, create the Worker project from Git

Use the Git-connected deployment flow you already have.

Use these build settings:

- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler deploy`
- Path: `/`

This Worker version is built specifically for that deployment model.

### 7. Add environment variable / secret

In Cloudflare project settings, add:

- `ADMIN_SECRET` = your guild leadership formula-edit secret

### 8. Ensure the D1 binding exists

If Cloudflare uses the `wrangler.toml` config, the D1 binding should come from there. If the dashboard prompts for it, add a D1 binding named `DB` to the same database.

### 9. Deploy

Trigger a deploy. The Worker should:

- serve the frontend from `public/`
- handle `GET/POST /api/submissions`
- handle `GET/POST /api/formulas`

## Notes

- Player submissions do not require the admin secret.
- Formula changes require the `x-admin-secret` header from the UI.
- `public/index.html` already points to `/api/submissions` and `/api/formulas`, so no frontend URL changes are needed.
