import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(50, "Room name is too long").trim(),
  maxGuests: z.number().int().min(2).max(50).default(12),
  settings: z
    .object({
      maxSongsPerGuest: z.number().int().min(1).max(20).default(3),
      allowGuestReorder: z.boolean().default(true),
      blockExplicit: z.boolean().default(false),
      fairPlayOrdering: z.boolean().default(false),
    })
    .default({
      maxSongsPerGuest: 3,
      allowGuestReorder: true,
      blockExplicit: false,
      fairPlayOrdering: false,
    }),
});

export const joinRoomSchema = z.object({
  roomKey: z
    .string()
    .length(6, "Room key must be exactly 6 characters")
    .regex(/^[A-HJ-NP-Z2-9]{6}$/i, "Invalid room key format")
    .transform((val) => val.toUpperCase()),
  nickname: z.string().min(1, "Nickname is required").max(30, "Nickname is too long").trim(),
});

export const addQueueItemSchema = z.object({
  videoId: z.string().min(1, "Video ID is required").max(20),
  title: z.string().min(1, "Title is required").max(200),
  channelTitle: z.string().max(100).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().nonnegative().default(0),
});

export const updateQueueItemSchema = z.object({
  action: z.enum(["reorder", "skip", "remove", "play"]).optional(),
  position: z.number().optional(),
  status: z.enum(["queued", "playing", "played", "skipped", "removed"]).optional(),
});

export const updatePlaybackSchema = z.object({
  currentQueueItemId: z.string().uuid().nullable().optional(),
  videoId: z.string().nullable().optional(),
  status: z.enum(["unstarted", "playing", "paused", "buffering", "ended", "cued"]),
  positionSeconds: z.number().nonnegative(),
  title: z.string().optional(),
  singerNickname: z.string().optional(),
});

export const kickMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(60).trim(),
  description: z.string().max(250).optional().nullable(),
  isPublic: z.boolean().default(false),
});

export const addPlaylistItemSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  channelTitle: z.string().max(100).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().nonnegative().default(0),
});

export const addFavouriteSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  channelTitle: z.string().max(100).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().nonnegative().default(0),
});

export const youtubeSearchSchema = z.object({
  q: z.string().min(1, "Query is required").max(100),
  pageToken: z.string().optional().nullable(),
});

export const youtubeVideosSchema = z.object({
  ids: z.string().min(1, "Video IDs are required"),
});
