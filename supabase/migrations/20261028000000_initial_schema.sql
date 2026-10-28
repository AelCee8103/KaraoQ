-- KaraoQ Initial Schema Migration

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puter_user_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Playlists Table
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Playlist Items Table
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (playlist_id, position)
);

-- 4. Favourites Table
CREATE TABLE IF NOT EXISTS public.favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, video_id)
);

-- 5. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'ended')),
    max_guests INTEGER DEFAULT 12,
    settings JSONB DEFAULT '{"maxSongsPerGuest": 3, "allowGuestReorder": true, "blockExplicit": false}'::jsonb,
    current_item_id UUID,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '12 hours'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Room Members Table
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'guest')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'kicked')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (room_id, user_id)
);

-- 7. Queue Items Table
CREATE TABLE IF NOT EXISTS public.queue_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    position NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'playing', 'played', 'skipped', 'removed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Play History Table
CREATE TABLE IF NOT EXISTS public.play_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    video_id TEXT NOT NULL,
    title TEXT,
    channel_title TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    played_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Search Cache Table
CREATE TABLE IF NOT EXISTS public.search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_room_key ON public.rooms(room_key);
CREATE INDEX IF NOT EXISTS idx_queue_items_room_status_pos ON public.queue_items(room_id, status, position);
CREATE INDEX IF NOT EXISTS idx_room_members_room_status ON public.room_members(room_id, status);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires_at ON public.search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_favourites_user ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user ON public.play_history(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Default Read-Only Policies for authenticated/anon clients (Writes go through Service Role only)
-- Public read for search_cache, room public status, etc.
CREATE POLICY "Public profiles can be read by anyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public rooms can be read by anyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Room members can be read by anyone in room" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "Queue items can be read by anyone in room" ON public.queue_items FOR SELECT USING (true);
CREATE POLICY "Public playlists can be read by anyone" ON public.playlists FOR SELECT USING (is_public = true);

-- Realtime publication setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
