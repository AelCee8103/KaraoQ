# KaraoQ

KaraoQ is a synchronized karaoke web app. Users can search songs, sing solo, host rooms, or join rooms as guests. Creating an account is optional and unlocks saved favourites, playlists, history, and profile settings.

## Stack

- Next.js App Router and React
- Supabase Auth, PostgreSQL, and Realtime
- YouTube Data API v3

## Authentication model

KaraoQ starts a Supabase anonymous session for visitors. Anonymous users can search, sing, host rooms, join rooms, and queue songs. Users can upgrade that session to an email/password account from their profile; registered users are required for persistent library features.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YOUTUBE_API_KEY=your-youtube-data-api-key
```

Run the database migrations in `supabase/migrations` before using persistent features. Enable anonymous sign-ins and email/password sign-ins in the Supabase Auth settings.

## Validation

```bash
npm test
npm run build
```
