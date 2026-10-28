export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RoomStatus = "open" | "locked" | "ended";
export type MemberRole = "host" | "guest";
export type MemberStatus = "active" | "left" | "kicked";
export type QueueItemStatus = "queued" | "playing" | "played" | "skipped" | "removed";

export interface RoomSettings {
  maxSongsPerGuest: number;
  allowGuestReorder: boolean;
  blockExplicit: boolean;
  fairPlayOrdering?: boolean;
}

export interface Profile {
  id: string;
  puter_user_id: string;
  username: string;
  avatar_url: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  items?: PlaylistItem[];
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  position: number;
  created_at: string;
}

export interface Favourite {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface Room {
  id: string;
  host_id: string;
  name: string;
  room_key: string;
  status: RoomStatus;
  max_guests: number;
  settings: RoomSettings;
  current_item_id: string | null;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  profile?: Profile;
}

export interface QueueItem {
  id: string;
  room_id: string;
  added_by: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  position: number;
  status: QueueItemStatus;
  created_at: string;
  added_by_profile?: Profile;
}

export interface PlayHistoryItem {
  id: string;
  user_id: string;
  room_id: string | null;
  video_id: string;
  title: string | null;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  played_at: string;
}
