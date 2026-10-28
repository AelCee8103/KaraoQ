import { createClient } from "@supabase/supabase-js";
import { ServerContext } from "@/server/core/types";
import { verifyPuterToken, syncUserProfile } from "@/server/core/auth";
import { searchKaraokeVideos, getVideoDetails } from "@/server/core/youtube";
import {
  createRoom,
  joinRoom,
  getRoomDetails,
  leaveRoom,
  kickMember,
  updateRoomStatus,
} from "@/server/core/rooms";
import {
  getRoomQueue,
  addQueueItem,
  updateQueueItem,
  deleteQueueItem,
} from "@/server/core/queue";
import {
  getUserPlaylists,
  createPlaylist,
  addPlaylistItem,
  getUserFavourites,
  toggleFavourite,
  getUserPlayHistory,
  deleteUserData,
} from "@/server/core/library";

// Global Puter worker reference
declare const puter: {
  kv: {
    get(key: string): Promise<string | null>;
  };
};

async function getSecrets(): Promise<{ supabaseUrl?: string; serviceRoleKey?: string; ytApiKey?: string }> {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let ytApiKey = process.env.YOUTUBE_API_KEY;

  if (typeof puter !== "undefined" && puter.kv) {
    try {
      const kvSupabaseUrl = await puter.kv.get("SUPABASE_URL");
      const kvServiceRoleKey = await puter.kv.get("SUPABASE_SERVICE_ROLE_KEY");
      const kvYtApiKey = await puter.kv.get("YOUTUBE_API_KEY");

      if (kvSupabaseUrl) supabaseUrl = kvSupabaseUrl;
      if (kvServiceRoleKey) serviceRoleKey = kvServiceRoleKey;
      if (kvYtApiKey) ytApiKey = kvYtApiKey;
    } catch {
      // ignore kv read errors
    }
  }

  return { supabaseUrl, serviceRoleKey, ytApiKey };
}

function handleCors(req: Request): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = handleCors(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "");

  const secrets = await getSecrets();
  const supabase = secrets.supabaseUrl && secrets.serviceRoleKey
    ? createClient(secrets.supabaseUrl, secrets.serviceRoleKey)
    : ({} as any);

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || undefined;

  let user;
  if (token && supabase.from) {
    try {
      user = await verifyPuterToken(token, supabase);
    } catch {
      // ignore
    }
  }

  const ctx: ServerContext = {
    supabase,
    youtubeApiKey: secrets.ytApiKey,
    user,
    token,
  };

  try {
    // 1. YouTube Search
    if (path === "/api/youtube/search" && req.method === "GET") {
      const q = url.searchParams.get("q") || "";
      const pageToken = url.searchParams.get("pageToken");
      const data = await searchKaraokeVideos(ctx, q, pageToken);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    // 2. YouTube Videos
    if (path === "/api/youtube/videos" && req.method === "GET") {
      const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
      const data = await getVideoDetails(ctx, ids);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    // 3. Create Room
    if (path === "/api/rooms" && req.method === "POST") {
      const body = await req.json();
      const data = await createRoom(ctx, body);
      return Response.json({ success: true, data }, { status: 201, headers: corsHeaders });
    }

    // 4. Join Room
    if (path === "/api/rooms/join" && req.method === "POST") {
      const body = await req.json();
      const data = await joinRoom(ctx, body);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    // 5. Room Details & Actions: /api/rooms/:id
    const roomMatch = path.match(/^\/api\/rooms\/([^/]+)$/);
    if (roomMatch && req.method === "GET") {
      const roomId = roomMatch[1];
      const data = await getRoomDetails(ctx, roomId);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    const leaveMatch = path.match(/^\/api\/rooms\/([^/]+)\/leave$/);
    if (leaveMatch && req.method === "POST") {
      const roomId = leaveMatch[1];
      const data = await leaveRoom(ctx, roomId);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    const kickMatch = path.match(/^\/api\/rooms\/([^/]+)\/kick$/);
    if (kickMatch && req.method === "POST") {
      const roomId = kickMatch[1];
      const body = await req.json();
      const data = await kickMember(ctx, roomId, body.userId);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    const lockMatch = path.match(/^\/api\/rooms\/([^/]+)\/lock$/);
    if (lockMatch && req.method === "POST") {
      const roomId = lockMatch[1];
      const body = await req.json().catch(() => ({ status: "locked" }));
      const data = await updateRoomStatus(ctx, roomId, body.status || "locked");
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    const endMatch = path.match(/^\/api\/rooms\/([^/]+)\/end$/);
    if (endMatch && req.method === "POST") {
      const roomId = endMatch[1];
      const data = await updateRoomStatus(ctx, roomId, "ended");
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    // 6. Queue Routes
    const queueMatch = path.match(/^\/api\/rooms\/([^/]+)\/queue$/);
    if (queueMatch) {
      const roomId = queueMatch[1];
      if (req.method === "GET") {
        const data = await getRoomQueue(ctx, roomId);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
      if (req.method === "POST") {
        const body = await req.json();
        const data = await addQueueItem(ctx, roomId, body);
        return Response.json({ success: true, data }, { status: 201, headers: corsHeaders });
      }
    }

    const queueItemMatch = path.match(/^\/api\/rooms\/([^/]+)\/queue\/([^/]+)$/);
    if (queueItemMatch) {
      const roomId = queueItemMatch[1];
      const itemId = queueItemMatch[2];
      if (req.method === "PATCH") {
        const body = await req.json();
        const data = await updateQueueItem(ctx, roomId, itemId, body);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
      if (req.method === "DELETE") {
        const data = await deleteQueueItem(ctx, roomId, itemId);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
    }

    // 7. Library Routes
    if (path === "/api/library/playlists") {
      if (req.method === "GET") {
        const data = await getUserPlaylists(ctx);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
      if (req.method === "POST") {
        const body = await req.json();
        const data = await createPlaylist(ctx, body);
        return Response.json({ success: true, data }, { status: 201, headers: corsHeaders });
      }
    }

    const playlistItemMatch = path.match(/^\/api\/library\/playlists\/([^/]+)\/items$/);
    if (playlistItemMatch && req.method === "POST") {
      const playlistId = playlistItemMatch[1];
      const body = await req.json();
      const data = await addPlaylistItem(ctx, playlistId, body);
      return Response.json({ success: true, data }, { status: 201, headers: corsHeaders });
    }

    if (path === "/api/library/favourites") {
      if (req.method === "GET") {
        const data = await getUserFavourites(ctx);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
      if (req.method === "POST") {
        const body = await req.json();
        const data = await toggleFavourite(ctx, body);
        return Response.json({ success: true, data }, { headers: corsHeaders });
      }
    }

    if (path === "/api/library/history" && req.method === "GET") {
      const data = await getUserPlayHistory(ctx);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    // 8. User Sync & Delete
    if (path === "/api/me/sync" && req.method === "POST") {
      const body = await req.json();
      const data = await syncUserProfile(ctx, body);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    if (path === "/api/me/delete" && req.method === "POST") {
      const data = await deleteUserData(ctx);
      return Response.json({ success: true, data }, { headers: corsHeaders });
    }

    return Response.json(
      { success: false, error: { code: "NOT_FOUND", message: `Route not found: ${path}` } },
      { status: 404, headers: corsHeaders }
    );
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message || "Worker error",
        },
      },
      { status: err.statusCode || 500, headers: corsHeaders }
    );
  }
}
