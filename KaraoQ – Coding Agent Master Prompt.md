# KaraoQ – Coding Agent Master Prompt

Paste everything below the line into your coding agent (Claude Code, Cursor, Codex, etc.). Read the **Decisions to confirm** section first.

---

## 0. Decisions to confirm before you paste

Four parts of the original idea need a small adjustment to work legally and technically. The prompt below already bakes these in.

1. **"Streaming the host's video" becomes synchronized playback, not video relay.** YouTube's Terms forbid capturing or re-streaming its video, and pushing video over WebRTC from a phone is fragile anyway. Instead, the host's player is the source of truth (video ID, play state, timestamp). Guests who choose "Watch along" get their own YouTube IFrame player kept in sync. Guests who don't just see the queue and search. This also satisfies "not disturbing the host video".
2. **Auth is Puter, data is Supabase.** Supabase cannot natively verify Puter sessions. The prompt uses a thin server-side bridge: the browser sends the Puter token to a Next.js route handler, which verifies it against Puter and then talks to Supabase using the service role key. Row Level Security is locked down so the browser never writes to Supabase directly except through Realtime subscriptions.
3. **YouTube Data API quota is small** (10,000 units a day, and each search costs 100, so roughly 100 searches a day). The prompt requires server-side caching and quota-aware fallbacks.

**4. Deployment is Puter-first, which moves the backend.** Puter's free static hosting serves files only, so Next.js must be exported as a static site and the server logic (auth bridge, Supabase writes, YouTube key) runs in Puter Serverless Workers instead of Next.js route handlers. The same code still builds for Vercel. Section 3.5 spells out how.

---

## 1. Role and goal

You are a senior full-stack engineer and product designer. Build **KaraoQ**, a production-quality portfolio project: a karaoke-focused web app that works like a stripped-down YouTube for karaoke, plus **Rooms**, where one person's device acts as the karaoke TV and friends on their own phones join with a room key and add songs to a shared queue.

The project must showcase modern frontend and backend engineering. Prioritise clean architecture, type safety, accessibility, performance and a polished nightlife UI. Work in phases (see section 14), commit at each phase, and keep the app runnable at all times.

## 2. Tech stack (fixed)

- **Next.js (latest stable, App Router)** with **TypeScript in strict mode**. Use Server Components by default and Client Components only where needed (player, realtime, Puter.js).
- **Tailwind CSS** with design tokens as CSS variables, plus **shadcn/ui** (Radix primitives) for accessible components. **Framer Motion** for tasteful motion. **lucide-react** icons.
- **Puter.js** (`@heyputer/puter.js`) for authentication and user-side cloud features. Every file importing it needs `"use client"`. If Next.js is v15 or older, enable Turbopack. Serve over HTTP(S) only, never `file://`.
- **Supabase** (Postgres + Realtime) for all app data. Use `@supabase/supabase-js` on the server with the service role key, and the anon key in the browser only for Realtime channels.
- **YouTube Data API v3** (server-side only) for search and metadata, and the **YouTube IFrame Player API** for playback.
- **TanStack Query** for client data fetching and caching, **Zod** for all input validation, **Zustand** for small client state (player, room).
- **Testing:** Vitest + Testing Library for units, Playwright for key end-to-end flows. **Tooling:** ESLint, Prettier, Husky pre-commit.
- Deployable to Puter first (free hosting plus a Puter Worker backend) and to Vercel as a second target, from one codebase (see 3.5). Provide `.env.example` and a README.

## 3. Architecture decisions

### 3.1 Auth bridge (Puter → Supabase)

- Sign in with `puter.auth.signIn()` from a user click (it opens a popup). Check state with `puter.auth.isSignedIn()` and read the profile with `puter.auth.getUser()`.
- The client sends the Puter auth token to the backend (a Puter Worker or a Next.js route handler, see 3.5) in an `Authorization: Bearer` header. The server verifies it by calling Puter's `whoami` endpoint, caches the result briefly, and derives a stable `puter_user_id` and `username`.
- On first verified request, upsert a row in `profiles`. All writes go through the backend layer (see 3.5), which verifies the user first and then uses the Supabase service role.
- Enable RLS on every table with **no public write policies**. Browsers may only subscribe to Realtime broadcasts for rooms they have joined (see 3.3).
- Never expose the service role key or the YouTube key to the client.

### 3.2 Playback model (host is the TV)

- The **host device** runs the main YouTube IFrame player. It is the only source of truth for `currentQueueItemId`, `status` (playing, paused, buffering, ended), `positionSeconds` and `updatedAt`.
- The host broadcasts a state snapshot on every change and a heartbeat every 5 seconds.
- **Guests choose:** *Remote mode* (default: queue, search, now-playing card, no video) or *Watch along* (own embedded player, drift-corrected to the host timestamp, correct if drift exceeds 1.5 seconds). Toggling modes never affects the host.
- When the current video ends, the host auto-advances to the next queue item and logs it to history.
- **Host search while playing:** the host can open search in a **mini player** (a draggable, docked corner player, like YouTube's) or can pause. Only one of these at a time, and the queue keeps working either way.
- Do not capture, record or relay YouTube video or audio anywhere.

### 3.3 Realtime

- Use **Supabase Realtime** channels, one per room (`room:{roomId}`): Postgres changes on `queue_items` and `room_members`, Broadcast for playback state and events, and Presence for who is online.
- Subscribe only after the server confirms membership. Use a private channel with an authorisation check if feasible; otherwise treat the room ID as an unguessable UUID and the room key as the join secret.
- Handle reconnects: on reconnect, refetch the queue and members, then resubscribe. Show a small connection-status indicator.

### 3.4 Puter.js usage beyond auth

Use Puter's user-pays model where it genuinely helps, and keep it optional:

- `puter.kv` for per-user UI preferences (theme tweaks, last-used volume, recent searches).
- Optionally `puter.ai.chat()` for a **"Song suggestions"** feature (suggest karaoke songs for a mood or a group's taste), clearly labelled as AI and degrading gracefully if the user's allowance runs out (handle `insufficient_funds`).
- Add a footer link to `https://developer.puter.com` labelled **"Powered by Puter"**.

### 3.5 Deployment: Puter first, Vercel second

Build one codebase with two deploy targets. Deploy to **Puter first** (free hosting, free Worker backend, user-pays for AI and storage) and keep **Vercel** as a supported alternative chosen by a build flag. Never fork the code: isolate every difference behind an adapter.

**Why Puter changes the architecture.** Puter hosts static files on `*.puter.site`. A Next.js app can only run there as a **static export** (`output: 'export'`), which has no route handlers, Server Actions, middleware or image optimiser. So on the Puter target the backend from sections 3.1 and 8 (token verification, Supabase service-role writes, YouTube key) runs in **Puter Serverless Workers** (`*.puter.work`). On the Vercel target the same logic runs in Next.js route handlers.

- **Build flag:** `DEPLOY_TARGET=puter|vercel`. For `puter`, `next.config.ts` sets `output: 'export'`, `images: { unoptimized: true }` and `trailingSlash: true`. Provide scripts `build:puter`, `build:vercel`, `deploy:puter`.
- **Shared core:** all business logic (room rules, queue ordering, validation, YouTube normalisation, quota guard) lives in `src/server/core/` as framework-free TypeScript functions taking `(ctx, input)` and returning typed results. Two thin adapters call it: `src/server/adapters/next` (route handlers) and `workers/api` (a Worker router bundled with esbuild into one `worker.js`). No business logic inside adapters.
- **One client API layer:** a typed `apiClient` picks its base URL at build time: the Worker URL (`NEXT_PUBLIC_API_BASE`) on Puter, `/api` on Vercel. UI code never knows which target it runs on.
- **Routing under static export:** no dynamic server routes. Use client-rendered pages with query parameters on both targets for parity (for example `/rooms/host?id=`, `/rooms/view?id=`, `/watch?v=`, `/join?key=`), and ship a `.puter_site_config` in the exported site root with a `404` rule serving `/index.html` with status `200` so refreshes and shared links never 404. Add a post-build step that confirms the file is present in `out/`, and verify the behaviour on the live site because a malformed config is silently ignored.
- **Secrets on Puter:** a static site cannot hold secrets. Keep `SUPABASE_SERVICE_ROLE_KEY` and `YOUTUBE_API_KEY` only inside the Worker, stored in the Worker owner's key-value store by a one-time `workers/scripts/set-secrets` script, never in the client bundle. Follow Puter's "Keep an API Key Secret" recipe.
- **Caller identity in the Worker:** read Puter's Worker docs (`router`, `puter.workers.exec`) and use the verified caller identity they provide. If it cannot be trusted for this purpose, verify the Puter token against Puter as in 3.1. Never trust a user ID sent by the client. Record the choice in the README.
- **CORS:** the Worker allows only the site origins (the `*.puter.site` domain and `localhost` in development).
- **Realtime is unchanged:** the browser talks to Supabase Realtime directly (anon key, room-scoped channels) on both targets.
- **Rate limiting and cleanup without extras:** on Puter use a KV-based token bucket instead of Upstash, and run room expiry with Supabase `pg_cron` (or lazily on room access). Vercel may use Upstash and Vercel Cron.
- **Use more of Puter's free, open-source capabilities:** `puter.kv` for per-user preferences; `puter.fs` for user data export and import (and optional custom backgrounds); `puter.ai` for optional song suggestions; `puter.apps.create()` to register KaraoQ as a launchable app on puter.com; and `puter.env` to detect when running inside the Puter desktop, where the user is already signed in so the sign-in popup is skipped.
- **Check limits before building on them:** read Puter's Rate Limits and Quotas page. Under the user-pays model users cover their own AI and storage, but confirm how Worker execution and egress are billed, keep payloads small, and cache YouTube results aggressively. Document findings in the README.

**Puter deployment steps (put these in the README):**

1. Install the CLI with `npm i -g @heyputer/cli`, then `puter login`.
2. Bundle and deploy the Worker first: `puter worker deploy ./workers/dist/worker.js karaoq-api`. Run `set-secrets` once.
3. Set `NEXT_PUBLIC_API_BASE=https://karaoq-api.puter.work`, then `npm run build:puter` to produce `out/`.
4. Deploy the site: `puter site deploy ./out karaoq`, live at `https://karaoq.puter.site`.
5. Optional: automate with the `HeyPuter/puter-subdomain-deploy-action` GitHub Action and a `PUTER_TOKEN` secret.
6. Smoke-test on the live origin: sign in, create a room, join from a second device, add and skip a song, refresh a deep link.

**Vercel deployment steps:** set `DEPLOY_TARGET=vercel` and the server variables from section 13 in the project settings, run `npm run build:vercel`, deploy. The Next.js adapter serves `/api/*` and the same core logic runs unchanged.

## 4. Product features

### 4.1 Accounts and profile

- Landing page with "Continue with Puter" CTA. No separate signup form.
- Profile: display name, avatar from Puter, favourites, playlists, recent rooms, singing history.
- Sign out, plus delete-my-data (removes Supabase rows for the user).

### 4.2 Karaoke discovery (the "filtered YouTube")

- Search bar that always biases results to karaoke: append `karaoke` to the query unless already present, set `type=video`, `videoEmbeddable=true`, `videoCategoryId=10` (Music) where useful, and `safeSearch=moderate`.
- Rank and tag results by heuristics: title contains `karaoke`, `instrumental`, `lyrics`, `with lyrics`, or the channel is on a **curated allow-list** of known karaoke channels (stored in config). Show a "Karaoke verified" badge for allow-listed channels. Exclude obvious non-karaoke (e.g. "reaction", "live concert", "official music video") unless nothing else matches.
- Result cards: thumbnail, title, channel, duration, badge, and actions: **Play** (solo mode), **Add to queue**, **Add to playlist**, **Favourite**.
- Home page rows: Trending karaoke (cached), Recently played, Your favourites, Popular in rooms (from `play_history`).
- Debounced search with suggestions from the user's recent searches, infinite scroll or "load more" using `nextPageToken`.

### 4.3 Solo player, playlists and personal queue

- Persistent player with full-screen "karaoke mode" (large video, minimal chrome, big now-playing and up-next).
- Create, rename, reorder (drag and drop) and delete playlists. Personal queue with drag-reorder, remove and clear.

### 4.4 Rooms (the unique feature)

**Host flow**

- Create room: name, optional max guests (default 12), optional settings (see below). The server generates a **6-character room key** (uppercase alphanumeric, no ambiguous characters like `0/O/1/I`) plus a UUID room ID.
- Host console: main player, **Up Next** queue, member list, room key with a copy button, **QR code** that deep-links to `/join/KEY`, and a "Share room" button using the Web Share API.
- Controls: play, pause, skip, seek, volume, reorder queue, remove any queue item, **kick guest**, **lock room** (no new joins), **end room**.
- Settings: "Max songs per guest in queue" (default 3), "Allow guests to reorder their own songs", "Block explicit-tagged titles".
- Host can add songs via search in a mini player or paused mode (see 3.2).

**Guest flow**

- Join via key input or the QR link. Pick a nickname (defaults to the Puter username). Must be signed in with Puter.
- Remote mode: search, add to queue, see queue with who added each song, see the host's now playing, remove their own songs, leave room.
- Optional Watch along mode.
- If kicked, show a clear message and block rejoining that room.

**Queue rules**

- Queue is FIFO by default. Show "estimated wait" per item using song durations.
- Fair-play option (optional toggle): round-robin ordering across guests so one person can't dominate.
- Duplicate protection: warn if the same video is already queued.
- All mutations are server-validated (membership, limits, kicked status, room lock).

**Room lifecycle**

- Rooms auto-expire 12 hours after last activity. A cleanup job (Supabase scheduled function or Vercel cron) removes expired rooms.
- Rate-limit room creation and joins per user.

### 4.5 Extras that make it portfolio-worthy

- **Reactions:** emoji bursts from guests shown over the host screen (throttled).
- **Singer announcement:** when a song starts, show "Now singing: {nickname}" on the host screen.
- **Session recap:** at room end, show a summary (songs played, top contributors).
- **PWA:** installable, with a manifest and offline fallback page.
- **i18n-ready** text structure (English only is fine).

## 5. Design system

**Theme:** a city nightlife party feel. Mostly black, neon fuchsia energy, subtle glow, glassy panels, gentle ambient motion. Dark theme only, but built on tokens so it could be extended.

### 5.1 Colour tokens (suggested palette, final tuning allowed)

| Role | Hex | Use |
| --- | --- | --- |
| Background | `#07050C` | page background (near-black with a violet tint) |
| Surface | `#0F0B18` | cards, panels |
| Surface raised | `#171124` | modals, popovers, hover |
| Border | `#2A2040` | dividers, outlines |
| Primary (Fuchsia) | `#E91EC9` | main CTAs, active states, glow |
| Primary soft | `#FF5CE1` | hover, highlights |
| Accent (Electric violet) | `#7C3AED` | secondary actions, gradients |
| Accent 2 (Cyan neon) | `#22D3EE` | live/online indicators, links, focus ring |
| Highlight (Amber) | `#FBBF24` | "now playing", stars, host badge |
| Success | `#34D399` | joined, connected |
| Danger | `#FB7185` | kick, delete, errors |
| Text | `#F5F3FF` | primary text |
| Text muted | `#A89FC4` | secondary text |

Gradient for hero and CTAs: fuchsia → violet at \~135°. Glow: soft `box-shadow` of fuchsia at low alpha on primary elements; never glow body text.

**Contrast rule:** every text/background pair must meet WCAG AA (4.5:1 body, 3:1 large text and UI components). Verify programmatically.

### 5.2 Typography

- Display: **Space Grotesk** or **Sora** for headings and the logo. Body: **Inter**. Load with `next/font`, no layout shift.
- Fluid type scale using `clamp()`. Lyrics-style big text on the karaoke screen.

### 5.3 Layout and components

- Mobile-first. Guests use phones, hosts often use a laptop or TV, so design a distinct **Host TV view** (large type, high contrast, minimal UI) and a **Guest phone view** (thumb-friendly, bottom navigation, 44px minimum touch targets).
- Core components: top nav, bottom nav (mobile), video card, queue item (with drag handle), player bar, mini player, room code chip + QR, member avatar stack, modal/sheet, toast, skeleton loaders, empty states with personality.
- Motion: subtle (150–250 ms), spring on queue reorder, animated equaliser bars on the now-playing item. **Respect `prefers-reduced-motion`**.
- Ambient background: slow-moving blurred fuchsia/violet blobs or a faint city-skyline silhouette at the bottom of the landing page (SVG, no heavy assets).
- Logo: simple wordmark "KaraoQ" with a microphone or sound-wave glyph in fuchsia.

## 6. Pages and routes

| Route | Purpose |
| --- | --- |
| `/` | Landing (signed out) or Home (signed in) |
| `/search?q=` | Karaoke search results |
| `/watch/[videoId]` | Solo player view |
| `/library` | Playlists, favourites, history |
| `/library/playlists/[id]` | Playlist detail |
| `/rooms/new` | Create room |
| `/rooms/[roomId]/host` | Host console / TV view |
| `/rooms/[roomId]` | Guest view |
| `/join/[key]` | Join by link or QR |
| `/profile` | Profile and settings |
| `/privacy`, `/terms` | Static pages |

Include `not-found`, `error` and `loading` boundaries, and Suspense skeletons.

**Route note:** because the Puter target is a static export, implement the dynamic pages above (`watch`, `playlists`, `rooms`, `join`) as client-rendered pages that read their id or key from the query string, for example `/rooms/host?id=`. Use the same URLs on both targets. Pretty URLs may be added as optional redirects on Vercel only.

## 7. Data model (Supabase / Postgres)

Use migrations in `supabase/migrations`. All tables have `id uuid pk default gen_random_uuid()` and `created_at timestamptz default now()` unless noted. Enable RLS on all, deny by default.

- **profiles**: `puter_user_id text unique not null`, `username`, `avatar_url`, `last_seen_at`.
- **playlists**: `owner_id → profiles`, `name`, `description`, `is_public bool default false`.
- **playlist\_items**: `playlist_id`, `video_id text`, `title`, `channel_title`, `thumbnail_url`, `duration_seconds`, `position int`. Unique `(playlist_id, position)`.
- **favourites**: `user_id`, `video_id`, cached metadata. Unique `(user_id, video_id)`.
- **rooms**: `host_id`, `name`, `room_key text unique`, `status` (`open|locked|ended`), `max_guests int`, `settings jsonb`, `current_item_id uuid null`, `last_activity_at`, `expires_at`.
- **room\_members**: `room_id`, `user_id`, `nickname`, `role` (`host|guest`), `status` (`active|left|kicked`), `joined_at`. Unique `(room_id, user_id)`.
- **queue\_items**: `room_id`, `added_by → profiles`, `video_id`, cached title/channel/thumbnail/duration, `position numeric` (fractional indexing for cheap reorders), `status` (`queued|playing|played|skipped|removed`).
- **play\_history**: `user_id`, `room_id null`, `video_id`, `played_at`.
- **search\_cache**: `cache_key text unique` (normalised query + page token), `payload jsonb`, `expires_at`.

Add indexes on `rooms(room_key)`, `queue_items(room_id, status, position)`, `room_members(room_id, status)`. Provide a seed script and a typed client generated with `supabase gen types`.

## 8. API layer (Next.js route handlers or Server Actions)

Implement each operation below **once** in `src/server/core` and expose it through both adapters (see 3.5): a Worker route on Puter, a Next.js route handler on Vercel. Paths are logical and identical on both.

Every endpoint: verify the Puter token, validate input with Zod, authorise (host/guest/member), rate-limit, return typed JSON errors `{ code, message }`.

- `GET /api/youtube/search`: cached karaoke search (see section 9).
- `GET /api/youtube/videos?ids=`: metadata and durations for ids.
- `POST /api/rooms`: create room. `POST /api/rooms/join`: join by key. `POST /api/rooms/[id]/leave`. `POST /api/rooms/[id]/kick`. `POST /api/rooms/[id]/lock`. `POST /api/rooms/[id]/end`.
- `POST /api/rooms/[id]/queue`: add. `PATCH .../queue/[itemId]`: reorder, skip or remove. `DELETE .../queue/[itemId]`.
- `POST /api/rooms/[id]/playback`: host-only state update (also broadcast).
- Playlists, favourites and history CRUD under `/api/library/*`.
- `POST /api/me/delete`: delete user data.

## 9. YouTube integration details

- Server-side `search.list` then `videos.list` (for duration and embeddability), merged and normalised to one `KaraokeVideo` type.
- **Cache** results in `search_cache` (TTL 24 hours for searches, 7 days for video metadata) and in memory.
- **Quota guard:** track estimated daily units; when above \~90 percent, serve cached results only and show a friendly "search is resting, try a popular pick" state with cached trending songs.
- Skip videos that are not embeddable. Surface a clear message if the player reports an embed error (error 101/150) and auto-skip in rooms.
- Respect YouTube API Services Terms: use the official IFrame player with visible controls where required, no background audio capture, no hiding the player, show attribution where required.

## 10. Security and privacy

- Verify every request server-side. Never trust client-provided user IDs.
- Zod validation, parameterised queries only, strict CORS, secure headers (CSP that allows YouTube and Puter origins, `Referrer-Policy`, `X-Content-Type-Options`).
- Rate limiting (Upstash or an in-DB token bucket) on search, join and queue-add.
- Room keys: generated with a CSPRNG, case-insensitive on entry, brute-force protected (limit failed joins per user and IP).
- Kicked users are blocked at the API level, not just hidden in the UI.
- Store no secrets in the repo. Provide a threat-model note in the README.

## 11. Quality standards (all required)

- **Accessibility:** WCAG 2.2 AA. Full keyboard operation (including queue reorder via buttons, not drag only), visible focus rings in cyan, ARIA live regions for queue changes and toasts, semantic landmarks, alt text, reduced-motion support. Run axe in tests.
- **Performance:** Lighthouse ≥ 90 on Performance, Accessibility, Best Practices and SEO (mobile). Optimise with `next/image`, lazy-loaded players (load the YouTube iframe only when needed), route-level code splitting, minimal client JS, no layout shift.
- **SEO and sharing:** metadata API, OpenGraph and Twitter images, sitemap, robots, structured data on the landing page.
- **Resilience:** optimistic UI with rollback for queue actions, offline and reconnect banners, error boundaries, empty and loading states everywhere.
- **Code quality:** feature-based folders, small pure functions, shared Zod schemas between client and server, no `any`, meaningful names, comments only where intent is non-obvious. Conventional Commits.
- **Testing:** unit tests for queue ordering, key generation, drift correction, quota guard, and Zod schemas. Playwright flows: sign-in mock, create room, guest joins, add song, host skips, kick guest.

## 12. Suggested project structure

```
src/
  app/                      # routes (client-rendered, query-param ids; see section 6)
  features/
    auth/                   # Puter client wrapper, token bridge, hooks
    youtube/                # search UI, result mapping
    player/                 # YT IFrame wrapper, mini player, sync logic
    rooms/                  # host console, guest view, realtime hooks
    library/                # playlists, favourites
  components/ui/            # shadcn primitives + design tokens
  lib/                      # supabase clients, zod schemas, apiClient, utils
  server/
    core/                   # framework-free business logic (rooms, queue, youtube, quota guard)
    adapters/next/          # Next.js route handlers (Vercel target)
  styles/                   # tailwind layers, tokens.css
workers/
  api/                      # Puter Worker router calling server/core (Puter target)
  scripts/                  # esbuild bundle, set-secrets, deploy
supabase/migrations/
tests/ (unit + e2e)
```

Wrap Puter.js in a single `features/auth/puter.ts` module so the rest of the app depends on a small interface that can be mocked in tests.

## 13. Environment variables (`.env.example`)

```
# Build target (build-time)
DEPLOY_TARGET=puter           # puter | vercel

# Public (safe in the browser bundle)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_BASE=         # Puter: https://<worker-name>.puter.work ; Vercel: empty (uses /api)

# Server-only. Vercel: real env vars. Puter: stored in the Worker owner's KV by
# workers/scripts/set-secrets, never bundled into the client
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
UPSTASH_REDIS_REST_URL=       # optional, Vercel only; Puter uses a KV token bucket
UPSTASH_REDIS_REST_TOKEN=
```

## 14. Delivery phases

1. **Foundation:** Next.js + Tailwind + shadcn setup, dual-target build config and the server/core + adapter split (3.5), design tokens, layout shell, landing page, Puter sign-in, auth bridge and profile upsert, Supabase migrations.
2. **Discovery:** YouTube search with caching and karaoke filtering, result cards, solo player, favourites.
3. **Library:** playlists with drag-reorder, personal queue, history.
4. **Rooms core:** create/join by key and QR, queue add/remove/reorder, members, kick, lock.
5. **Realtime playback:** host player as source of truth, broadcast and heartbeat, guest remote mode and watch-along with drift correction, auto-advance, mini player search for host.
6. **Polish:** reactions, singer announcement, recap, PWA, optional AI song suggestions via Puter, animations, empty states.
7. **Hardening:** security headers, rate limits, accessibility audit, Lighthouse, tests, README with architecture diagram, screenshots and a threat-model note. Then deploy to Puter first (Worker, then static site, then smoke tests on the live puter.site origin) and finally verify the Vercel build.

After each phase, summarise what was built, what is untested, and any decision you made that differs from this brief. If something here is ambiguous or conflicts with a platform rule, choose the safest option, document it in the README, and continue.

## 15. Definition of done

- A new user can sign in with Puter, search karaoke songs, play them, and build playlists.
- A host can create a room and share its key or QR code. Two or more guests on separate devices can join, add songs, and see the queue update live within about one second.
- The host player advances through the queue automatically. Kicked guests are really locked out.
- Footer includes a **"Powered by Puter"** link to https://developer.puter.com.
- Meets every item in section 11, is live on a free Puter subdomain (static site plus Worker backend), also builds and deploys on Vercel from the same code, and the README lets a stranger run it in under 10 minutes.
