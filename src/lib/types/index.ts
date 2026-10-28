export * from "./database.ts";

export interface KaraokeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  durationSeconds: number;
  formattedDuration: string;
  isVerifiedKaraoke: boolean;
  isEmbeddable: boolean;
}

export interface SearchResponse {
  items: KaraokeVideo[];
  nextPageToken?: string | null;
  totalResults?: number;
  isCached?: boolean;
  isRestingQuota?: boolean;
}

export type PlaybackStatus = "unstarted" | "playing" | "paused" | "buffering" | "ended" | "cued";

export interface PlaybackState {
  currentQueueItemId: string | null;
  videoId: string | null;
  status: PlaybackStatus;
  positionSeconds: number;
  updatedAt: number; // timestamp in ms
  title?: string;
  singerNickname?: string;
}

export interface BroadcastPlaybackPayload {
  state: PlaybackState;
  sender: "host";
}

export interface BroadcastReactionPayload {
  id: string;
  emoji: string;
  senderNickname: string;
  timestamp: number;
}

export interface BroadcastSingerPayload {
  nickname: string;
  title: string;
  queueItemId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserPreferences {
  volume: number;
  recentSearches: string[];
  themeAccent?: string;
  watchAlongMode?: boolean;
}
