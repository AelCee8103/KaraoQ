import type { KaraokeVideo, SearchResponse } from "../../lib/types/index.ts";
import type { ServerContext } from "./types.ts";
import { recordQuotaUsage, isQuotaResting } from "./quotaGuard.ts";

// Curated allowlist of known quality karaoke channels
export const CURATED_KARAOKE_CHANNELS = [
  "Sing King",
  "Sing King Karaoke",
  "KaraFun Karaoke",
  "KaraFun",
  "Sing2Music",
  "Sing2Piano",
  "Sing2Guitar",
  "CCKaraoke",
  "KaraokeOnVEVO",
  "Stingray Karaoke",
  "Sunfly Karaoke",
  "Zoom Karaoke",
  "Party Tyme Karaoke",
  "The Voice Karaoke",
];

// Fallback curated popular songs (used when API key is missing or quota is exhausted)
export const FALLBACK_KARAOKE_SONGS: KaraokeVideo[] = [
  {
    id: "fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Karaoke Version)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg",
    durationSeconds: 358,
    formattedDuration: "5:58",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "L_LUpnjgPso",
    title: "Journey – Don't Stop Believin' (Karaoke with Lyrics)",
    channelTitle: "KaraFun Karaoke",
    channelId: "UCbqcG1rdt9hQK13P4wzp46Q",
    thumbnailUrl: "https://i.ytimg.com/vi/L_LUpnjgPso/mqdefault.jpg",
    durationSeconds: 251,
    formattedDuration: "4:11",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "nfWlot6h_JM",
    title: "Taylor Swift – Shake It Off (Karaoke Instrumental)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/nfWlot6h_JM/mqdefault.jpg",
    durationSeconds: 219,
    formattedDuration: "3:39",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "hT_nvWreIhg",
    title: "OneRepublic – Counting Stars (Karaoke Lyrics)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg",
    durationSeconds: 257,
    formattedDuration: "4:17",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "09R8_2nJtjg",
    title: "Maroon 5 – Sugar (Karaoke Instrumental)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg",
    durationSeconds: 235,
    formattedDuration: "3:55",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi, Daddy Yankee – Despacito (Karaoke Version)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
    durationSeconds: 228,
    formattedDuration: "3:48",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "kffacxfA7G4",
    title: "Justin Bieber – Baby (Karaoke with Lyrics)",
    channelTitle: "Sing King",
    channelId: "UCwTRjvjVge31Mr-9S4aeclQ",
    thumbnailUrl: "https://i.ytimg.com/vi/kffacxfA7G4/mqdefault.jpg",
    durationSeconds: 216,
    formattedDuration: "3:36",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
  {
    id: "ZbZSe6N_BXs",
    title: "Pharrell Williams – Happy (Karaoke Instrumental)",
    channelTitle: "KaraFun Karaoke",
    channelId: "UCbqcG1rdt9hQK13P4wzp46Q",
    thumbnailUrl: "https://i.ytimg.com/vi/ZbZSe6N_BXs/mqdefault.jpg",
    durationSeconds: 233,
    formattedDuration: "3:53",
    isVerifiedKaraoke: true,
    isEmbeddable: true,
  },
];

// ISO 8601 duration parser (e.g., PT3M45S -> 225)
export function parseIsoDuration(durationStr: string): { seconds: number; formatted: string } {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { seconds: 0, formatted: "0:00" };

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted = "";
  if (hours > 0) {
    formatted += `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    formatted += `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return { seconds: totalSeconds, formatted };
}

export function isChannelVerified(channelTitle: string): boolean {
  if (!channelTitle) return false;
  const lower = channelTitle.toLowerCase();
  return CURATED_KARAOKE_CHANNELS.some((name) => lower.includes(name.toLowerCase()));
}

export async function searchKaraokeVideos(
  ctx: ServerContext,
  query: string,
  pageToken?: string | null
): Promise<SearchResponse> {
  const normalizedQuery = query.trim();
  const cacheKey = `search:${normalizedQuery.toLowerCase()}:${pageToken || "first"}`;

  // Check Supabase DB search cache
  try {
    const { data: cachedRow } = await ctx.supabase
      .from("search_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cachedRow && new Date(cachedRow.expires_at) > new Date()) {
      return {
        ...(cachedRow.payload as SearchResponse),
        isCached: true,
      };
    }
  } catch {
    // If cache lookup fails, proceed to live API
  }

  // Quota resting check
  if (isQuotaResting()) {
    const filtered = FALLBACK_KARAOKE_SONGS.filter((s) =>
      s.title.toLowerCase().includes(normalizedQuery.toLowerCase())
    );
    return {
      items: filtered.length > 0 ? filtered : FALLBACK_KARAOKE_SONGS,
      isRestingQuota: true,
    };
  }

  const apiKey = ctx.youtubeApiKey || process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Return filtered fallback songs if no API key configured
    const filtered = FALLBACK_KARAOKE_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        normalizedQuery.toLowerCase().includes("karaoke")
    );
    return {
      items: filtered.length > 0 ? filtered : FALLBACK_KARAOKE_SONGS,
      isCached: false,
    };
  }

  // Ensure query includes "karaoke" for high quality bias
  const searchQuery = normalizedQuery.toLowerCase().includes("karaoke")
    ? normalizedQuery
    : `${normalizedQuery} karaoke`;

  try {
    // Step 1: search.list (Cost: 100 quota units)
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", searchQuery);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("videoCategoryId", "10"); // Music
    searchUrl.searchParams.set("safeSearch", "moderate");
    searchUrl.searchParams.set("maxResults", "20");
    searchUrl.searchParams.set("key", apiKey);
    if (pageToken) {
      searchUrl.searchParams.set("pageToken", pageToken);
    }

    const searchRes = await fetch(searchUrl.toString());
    recordQuotaUsage(100);

    if (!searchRes.ok) {
      console.warn("YouTube search API response error:", searchRes.statusText);
      return { items: FALLBACK_KARAOKE_SONGS, isRestingQuota: true };
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    const videoIds = items.map((i: { id?: { videoId?: string } }) => i.id?.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      return { items: [], nextPageToken: searchData.nextPageToken || null };
    }

    // Step 2: videos.list for durations & embed status (Cost: 1 quota unit)
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "contentDetails,status,snippet");
    videosUrl.searchParams.set("id", videoIds.join(","));
    videosUrl.searchParams.set("key", apiKey);

    const videosRes = await fetch(videosUrl.toString());
    recordQuotaUsage(1);

    const videosData = videosRes.ok ? await videosRes.json() : { items: [] };
    const videoDetailsMap = new Map<string, { duration: string; embeddable: boolean; snippet?: any }>();

    (videosData.items || []).forEach((v: any) => {
      videoDetailsMap.set(v.id, {
        duration: v.contentDetails?.duration || "PT0S",
        embeddable: v.status?.embeddable !== false,
        snippet: v.snippet,
      });
    });

    const results: KaraokeVideo[] = [];

    for (const item of items) {
      const vId = item.id?.videoId;
      if (!vId) continue;

      const details = videoDetailsMap.get(vId);
      if (details && !details.embeddable) continue; // Skip non-embeddable videos

      const title = item.snippet?.title || "";
      const channelTitle = item.snippet?.channelTitle || "";
      const isVerified = isChannelVerified(channelTitle);

      // Exclude non-karaoke tags if not requested
      const lowerTitle = title.toLowerCase();
      if (
        (lowerTitle.includes("reaction") ||
          lowerTitle.includes("official music video") ||
          lowerTitle.includes("live concert")) &&
        !lowerTitle.includes("karaoke")
      ) {
        continue;
      }

      const { seconds, formatted } = parseIsoDuration(details?.duration || "PT3M30S");

      results.push({
        id: vId,
        title,
        channelTitle,
        channelId: item.snippet?.channelId || "",
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${vId}/mqdefault.jpg`,
        durationSeconds: seconds,
        formattedDuration: formatted,
        isVerifiedKaraoke: isVerified,
        isEmbeddable: true,
      });
    }

    const payload: SearchResponse = {
      items: results,
      nextPageToken: searchData.nextPageToken || null,
      totalResults: searchData.pageInfo?.totalResults,
    };

    // Save to cache with 24 hours TTL
    try {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      await ctx.supabase.from("search_cache").upsert({
        cache_key: cacheKey,
        payload,
        expires_at: expiresAt,
      });
    } catch {
      // Non-critical cache write failure
    }

    return payload;
  } catch (err) {
    console.error("YouTube search error:", err);
    return { items: FALLBACK_KARAOKE_SONGS, isRestingQuota: true };
  }
}

export async function getVideoDetails(
  ctx: ServerContext,
  videoIds: string[]
): Promise<KaraokeVideo[]> {
  if (videoIds.length === 0) return [];

  const apiKey = ctx.youtubeApiKey || process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return FALLBACK_KARAOKE_SONGS.filter((s) => videoIds.includes(s.id));
  }

  try {
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "contentDetails,status,snippet");
    videosUrl.searchParams.set("id", videoIds.join(","));
    videosUrl.searchParams.set("key", apiKey);

    const res = await fetch(videosUrl.toString());
    recordQuotaUsage(1);

    if (!res.ok) return [];

    const data = await res.json();
    return (data.items || []).map((v: any) => {
      const { seconds, formatted } = parseIsoDuration(v.contentDetails?.duration || "PT3M30S");
      return {
        id: v.id,
        title: v.snippet?.title || "",
        channelTitle: v.snippet?.channelTitle || "",
        channelId: v.snippet?.channelId || "",
        thumbnailUrl:
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        durationSeconds: seconds,
        formattedDuration: formatted,
        isVerifiedKaraoke: isChannelVerified(v.snippet?.channelTitle || ""),
        isEmbeddable: v.status?.embeddable !== false,
      };
    });
  } catch (err) {
    console.error("Error fetching video details:", err);
    return [];
  }
}
