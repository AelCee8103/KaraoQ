# KaraoQ 🎤✨

**KaraoQ** is a high-energy, synchronized karaoke nightlife web app. One device (TV, tablet, or laptop) acts as the central karaoke stage while guests scan a QR code or enter a 6-character room key from their phones to queue songs, send live emoji reactions, and sing along in synchronized watch-along mode.

Powered by **Puter Cloud OS**, **Supabase (PostgreSQL + Realtime)**, and **YouTube Data API v3**.

---

## 🏗️ Architecture & Dual-Target Deployment

KaraoQ is built from a single codebase supporting two production deployment targets via `DEPLOY_TARGET=puter|vercel`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          KARAOQ ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Client Layer (Next.js App Router + Tailwind CSS + Puter.js) ]       │
│        │                                                               │
│        ├── Realtime Sync ──────► [ Supabase Realtime Channel ]         │
│        │                          (Broadcast, Presence, Postgres DB)   │
│        │                                                               │
│        └── HTTP API Calls ─────► [ apiClient (typed) ]                 │
│                                       │                                │
│                   ┌───────────────────┴──────────────────┐             │
│                   ▼                                      ▼             │
│         [ Puter Target ]                       [ Vercel Target ]       │
│       Puter Serverless Worker                 Next.js Route Handlers   │
│      (workers/dist/worker.js)                 (src/app/api/*)          │
│                   │                                      │             │
│                   └───────────────────┬──────────────────┘             │
│                                       ▼                                │
│                      [ Server Core (src/server/core/) ]                │
│                         - Token Verification (Puter)                   │
│                         - Rooms & Member Auth                          │
│                         - Queue Interleaving & Limits                  │
│                         - YouTube Search Filter & Quota Guard          │
│                         - Playlists & Favourites CRUD                  │
│                                       │                                │
│                      ┌────────────────┴────────────────┐               │
│                      ▼                                 ▼               │
│             [ Supabase Database ]             [ YouTube Data API v3 ]  │
│             (Service-Role Writes)             (Cached + Quota Guard)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Host TV Console (Central Karaoke Screen)**:
   - Official YouTube IFrame Player as the single source of truth for timestamps and auto-advancing queue items.
   - Live room code chip, Web Share API support, and **QR Code Modal** for instant guest onboarding.
   - **Mini-Player Discovery**: The host can search for new tracks in docked mini-player mode without stopping current playback.
   - Host controls: kick guests, lock rooms, reorder queue, and end sessions.

2. **Guest Phone Experience**:
   - **Remote Mode**: Browse, search, view estimated wait times, see live singer announcements, and queue tracks.
   - **Watch-Along Mode**: Synchronized player with automatic drift correction (resyncs if local drift exceeds 1.5s).
   - Real-time floating emoji reaction bursts (`🔥`, `🎤`, `👏`, `💖`, `🎉`, `⭐`).

3. **Curated Karaoke Discovery**:
   - High-quality karaoke biasing heuristics (auto-queries backing tracks and lyrics).
   - Allowlist badge for verified karaoke channels (*Sing King, KaraFun, Sing2Music, Stingray, CCKaraoke*, etc.).
   - **Quota Guard**: Intelligent caching in `search_cache` and daily unit tracking to prevent YouTube quota exhaustion.

4. **Personal Library & Puter Cloud Features**:
   - Sign in seamlessly with Puter popup (`puter.auth.signIn()`).
   - Custom playlists with drag-and-drop reordering.
   - **Puter AI Karaoke Suggester**: Generate personalized song picks tailored to your group's party mood using `puter.ai.chat()`.
   - **Puter KV**: Stores user preferences (volume, theme, and recent searches) securely in Puter cloud storage.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/your-username/KaraoQ.git
cd KaraoQ
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YOUTUBE_API_KEY=your-youtube-data-api-key
```

*Note: In local development, if API keys are omitted, KaraoQ automatically runs in preview mode with built-in curated karaoke tracks and fallback auth.*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Test Suite
```bash
npm test
```

---

## 📦 Deployment Guides

### Deploy Target 1: Puter (Static Site + Serverless Worker)

1. **Install and log in to Puter CLI**:
   ```bash
   npm i -g @heyputer/cli
   puter login
   ```

2. **Bundle and deploy the Puter Worker API**:
   ```bash
   npm run build:worker
   puter worker deploy ./workers/dist/worker.js karaoq-api
   ```

3. **Configure Worker Secrets in Puter KV**:
   ```bash
   node workers/scripts/set-secrets.mjs "<SUPABASE_SERVICE_ROLE_KEY>" "<YOUTUBE_API_KEY>" "<SUPABASE_URL>"
   ```

4. **Build the static site for Puter export**:
   ```bash
   cross-env NEXT_PUBLIC_API_BASE=https://karaoq-api.puter.work npm run build:puter
   ```

5. **Deploy the static site to Puter hosting**:
   ```bash
   puter site deploy ./out karaoq
   ```
   Your app is now live at `https://karaoq.puter.site`!

---

### Deploy Target 2: Vercel

1. Push your repository to GitHub.
2. Import the repository into Vercel.
3. Configure the following Environment Variables in Vercel project settings:
   - `DEPLOY_TARGET=vercel`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `YOUTUBE_API_KEY`
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (recommended for shared YouTube quota tracking across Vercel functions)
4. Deploy! Vercel will execute `npm run build:vercel` and run both the static pages and `/api/*` route handlers seamlessly.

The Supabase server variables are required for production API requests; without them, routes return a configuration error instead of pretending that database writes succeeded. If Upstash is not configured, quota tracking falls back to per-instance memory and is suitable only for local development or low-risk previews.

---

## 🔒 Threat Model & Security

- **Server-Side Token Verification**: Every mutating API request requires a Puter bearer token verified server-side against Puter's identity service. Client-provided user IDs are never trusted.
- **Strict Row Level Security (RLS)**: Public write access is denied on all Supabase tables. All database writes go through the verified backend layer using the Supabase Service Role key.
- **No Secrets in Frontend Bundles**: `SUPABASE_SERVICE_ROLE_KEY` and `YOUTUBE_API_KEY` exist strictly on the backend (or inside the Puter Worker's KV store), completely excluded from client JS bundles.
- **CSPRNG Room Keys**: 6-character room codes are generated using cryptographically secure random bytes with an unambiguous alphanumeric charset (`2-9, A-Z` without `0, O, 1, I`).
- **Enforced Kick & Room Lockout**: Kicked users are barred directly at the API database level, preventing API re-join tampering.

---

## 📜 Database Schema (Supabase)

Run the SQL migration in `supabase/migrations/20261028000000_initial_schema.sql` inside the Supabase SQL editor:
- `profiles`: Puter user mappings and display metadata.
- `rooms`: Active sessions, 6-character room keys, host relations, and lifecycle expiration.
- `room_members`: Active/kicked member states and roles.
- `queue_items`: Fractional-indexed playlist queues with real-time replication.
- `playlists` & `playlist_items`: User-curated sets.
- `favourites` & `play_history`: User activity tracking.
- `search_cache`: 24-hour cache for YouTube query responses.

---

## 📄 Attribution & Links

- **Puter SDK**: [Puter Developer Portal](https://developer.puter.com) (Powered by Puter)
- **YouTube API Services**: Compliant with YouTube API Services Developer Policies and Terms of Service.
