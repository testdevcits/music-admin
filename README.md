# Music Platform admin dashboard

React/Vite frontend kept separate from the backend. It lets an authenticated admin list and disable users, create catalog records, create songs, upload audio and covers, set a license, and publish processed music.

## Local development

```bash
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:4000/api/v1
npm install
npm run dev
```

Create the first administrator from the backend's seed script before signing in. The backend `.env` must allow this dashboard's origin in `CORS_ORIGINS`.

## Vercel

Import `admin-dashboard/` as a second Vercel project. Add this production environment variable:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND.vercel.app/api/v1
```

Deploy with `npx vercel --prod`, then add the resulting dashboard URL to the backend project's `CORS_ORIGINS` and redeploy that backend. The frontend uses a session-only access token; a refresh, browser close, or sign-out requires a fresh login.
# music-admin
