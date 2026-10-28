# Redeploying KaraoQ to Puter

KaraoQ is deployed to Puter as **two separate resources**:

1. A **Puter Worker** for the backend API.
2. A **Puter Site** for the static Next.js frontend.

The backend and frontend have separate deployment steps. Redeploy only the part you changed, or run both when in doubt.

## What gets uploaded where?

| Resource | Upload/deploy this | URL normally ends with |
|---|---|---|
| Puter Worker/API | `workers\dist\worker.js` | `.puter.work` |
| Puter Site/frontend | The complete `out` folder | `.puter.site` |

Do **not** upload the project root, `src`, `.next`, `node_modules`, or the `workers` source folder to the Site upload box.

## One-time setup

Open PowerShell in the project directory:

```powershell
cd C:\Users\usele\WebstormProjects\KaraoQ
```

Install dependencies if this is a new machine:

```powershell
npm install
```

Install and authenticate the Puter CLI:

```powershell
npm install --global @heyputer/cli
puter login
```

If PowerShell says that `puter` is not recognized, close and reopen PowerShell. You can also use `npx`:

```powershell
npx @heyputer/cli login
```

Before the first deployment, make sure the Supabase database migration has been run in the Supabase SQL Editor:

```text
supabase\migrations\20261028000000_initial_schema.sql
```

## Backend/API redeployment

Run this after changing files under `workers` or backend code such as `src\server\core`:

```powershell
cd C:\Users\usele\WebstormProjects\KaraoQ
npm run build:worker
puter worker deploy .\workers\dist\worker.js YOUR_WORKER_NAME
```

Replace `YOUR_WORKER_NAME` with the existing Worker name, for example:

```text
sandbox-karaoq-api
```

The build output should be:

```text
C:\Users\usele\WebstormProjects\KaraoQ\workers\dist\worker.js
```

### Backend deployment from Puter Dev Center

If you are using the web interface instead of the CLI:

1. Run `npm run build:worker` locally.
2. Open the existing **Worker/API** app in Puter Dev Center.
3. Use its Worker deployment/upload control.
4. Upload `workers\dist\worker.js`.
5. Deploy or publish the new Worker version.

Do not upload `worker.js` to the static Site app.

### Worker secrets

The Worker needs these server-side values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`

Never put the service-role key or YouTube key in the frontend or commit them to Git. Store them in the Worker owner's Puter KV/secrets configuration. The helper script prints the commands that can be used:

```powershell
node workers\scripts\set-secrets.mjs "YOUR_SUPABASE_SERVICE_ROLE_KEY" "YOUR_YOUTUBE_API_KEY" "https://YOUR_PROJECT.supabase.co"
```

That script displays the `puter kv set` commands; review and run those commands in an authenticated Puter CLI session.

## Frontend/site redeployment

Run this after changing pages, components, styles, or other browser-side code:

```powershell
cd C:\Users\usele\WebstormProjects\KaraoQ
$env:NEXT_PUBLIC_API_BASE = "https://YOUR_WORKER_NAME.puter.work"
npm run build:puter
```

Replace the URL with the actual deployed Worker URL. This value is compiled into the frontend, so the site must be rebuilt whenever the Worker URL changes.

The build creates the static site in:

```text
C:\Users\usele\WebstormProjects\KaraoQ\out
```

### Frontend deployment with the Puter CLI

Deploy the complete `out` directory to the existing Site name:

```powershell
puter site deploy .\out YOUR_SITE_NAME
```

For example:

```powershell
puter site deploy .\out karaoq
```

### Frontend deployment from Puter Dev Center

1. Run `npm run build:puter`.
2. Open the existing **Site** app in Puter Dev Center.
3. Upload/drop the complete `out` folder into the Site deployment area.
4. Deploy or publish the new version.

The folder you upload must contain `index.html` and the `_next` directory. Do not upload only the contents of `out` unless the interface specifically asks for files rather than a folder.

## Deploy both parts

When both frontend and backend changed:

```powershell
cd C:\Users\usele\WebstormProjects\KaraoQ
npm run build:worker
puter worker deploy .\workers\dist\worker.js YOUR_WORKER_NAME

$env:NEXT_PUBLIC_API_BASE = "https://YOUR_WORKER_NAME.puter.work"
npm run build:puter
puter site deploy .\out YOUR_SITE_NAME
```

## Quick verification

After deployment:

1. Open the `.puter.work` Worker URL and confirm it is reachable.
2. Open the `.puter.site` frontend URL in a private/incognito window.
3. Confirm the browser is calling the current Worker URL, not `/api` or an old Worker.
4. Test Puter sign-in, YouTube search, creating/joining a room, and queue operations.
5. If the frontend looks unchanged, perform a hard refresh or open the site in a private window; then confirm that a new `out` folder was uploaded.

## Local development versus production

Use this for local development:

```powershell
npm run dev
```

Local changes are not published automatically. A production change requires rebuilding and redeploying the affected Worker and/or Site as described above.
