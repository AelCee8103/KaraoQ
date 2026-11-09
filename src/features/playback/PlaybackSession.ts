"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCallback, useEffect, useRef } from "react";
import { KaraokeVideo, QueueItem, Room, RoomMember } from "@/lib/types";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/features/auth/AuthContext";

export type PlaybackMode = "idle" | "solo" | "room";

export function isRoomSessionActive(
  room: Pick<Room, "status" | "expires_at"> & Partial<Pick<Room, "host_id">>,
  members: RoomMember[],
  userIds: string[],
  now = Date.now()
): boolean {
  const expiresAt = Date.parse(room.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now || room.status === "ended") {
    return false;
  }

  return members.some(
    (member) => member.status === "active" && userIds.includes(member.user_id)
  );
}

export function isRoomSessionInvalidationError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    ["ROOM_NOT_FOUND", "ROOM_ENDED", "HTTP_404"].includes(error.code)
  );
}

interface PlaybackSessionState {
  mode: PlaybackMode;
  soloCurrent: KaraokeVideo | null;
  soloQueue: KaraokeVideo[];
  room: Pick<Room, "id" | "room_key" | "name" | "status"> | null;
  roomIsHost: boolean;
  setSoloCurrent: (video: KaraokeVideo) => void;
  addSoloToQueue: (video: KaraokeVideo) => void;
  removeSoloFromQueue: (videoId: string) => void;
  clearSoloQueue: () => void;
  clearSoloSession: () => void;
  startRoom: (room: Room, isHost?: boolean) => void;
  endRoom: () => void;
}

export const usePlaybackSession = create<PlaybackSessionState>()(
  persist(
    (set) => ({
      mode: "idle",
      soloCurrent: null,
      soloQueue: [],
      room: null,
      roomIsHost: false,
      setSoloCurrent: (video) => set({ mode: "solo", soloCurrent: video }),
      addSoloToQueue: (video) =>
        set((state) => ({
          mode: "solo",
          soloQueue: state.soloQueue.some((item) => item.id === video.id)
            ? state.soloQueue
            : [...state.soloQueue, video],
        })),
      removeSoloFromQueue: (videoId) =>
        set((state) => ({ soloQueue: state.soloQueue.filter((item) => item.id !== videoId) })),
      clearSoloQueue: () => set({ soloQueue: [] }),
      clearSoloSession: () => set({ mode: "idle", soloCurrent: null, soloQueue: [] }),
      startRoom: (room, isHost = false) =>
        set({
          mode: "room",
          room: { id: room.id, room_key: room.room_key, name: room.name, status: room.status },
          roomIsHost: isHost,
          soloCurrent: null,
          soloQueue: [],
        }),
      endRoom: () => set({ mode: "idle", room: null, roomIsHost: false }),
    }),
    {
      name: "karaoq-playback-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        mode: state.mode,
        soloCurrent: state.soloCurrent,
        soloQueue: state.soloQueue,
        room: state.room,
        roomIsHost: state.roomIsHost,
      }),
    }
  )
);

/**
 * Revalidates the persisted room session without changing it when the room is
 * still active. This keeps the shell blocking only while the server confirms
 * the membership, even when another client ends the room.
 */
export function useReconcileRoomSession() {
  const { user, profile, isLoading } = useAuth();
  const mode = usePlaybackSession((state) => state.mode);
  const room = usePlaybackSession((state) => state.room);
  const endRoom = usePlaybackSession((state) => state.endRoom);
  const requestInFlight = useRef(false);
  const lastCheckedRoomId = useRef<string | null>(null);

  const reconcile = useCallback(async () => {
    if (isLoading || mode !== "room" || !room || !user) return;
    if (requestInFlight.current) return;
    requestInFlight.current = true;

    try {
      const response = await apiClient.get<{ room: Room; members: RoomMember[] }>(
        `/rooms/${room.id}`
      );
      const userIds = [user.id, profile?.id].filter((id): id is string => Boolean(id));
      if (
        !response?.room ||
        !Array.isArray(response.members) ||
        !isRoomSessionActive(response.room, response.members, userIds)
      ) {
        endRoom();
      }
      lastCheckedRoomId.current = room.id;
    } catch (error) {
      // Only definitive server responses invalidate a session. A transient
      // network/server error must not strand an active room behind the shell.
      if (isRoomSessionInvalidationError(error)) {
        endRoom();
      }
    } finally {
      requestInFlight.current = false;
    }
  }, [endRoom, isLoading, mode, profile?.id, room, user]);

  useEffect(() => {
    if (mode !== "room" || !room || isLoading || !user) {
      lastCheckedRoomId.current = null;
      return;
    }

    if (lastCheckedRoomId.current !== room.id) {
      void reconcile();
    }

    const interval = window.setInterval(() => void reconcile(), 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", reconcile);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, mode, reconcile, room, user]);
}

export function queueItemToVideo(item: QueueItem): KaraokeVideo {
  return {
    id: item.video_id,
    title: item.title,
    channelTitle: item.channel_title || "",
    channelId: "",
    thumbnailUrl: item.thumbnail_url || `https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`,
    durationSeconds: item.duration_seconds,
    formattedDuration: `${Math.floor(item.duration_seconds / 60)}:${String(item.duration_seconds % 60).padStart(2, "0")}`,
    isVerifiedKaraoke: false,
    isEmbeddable: true,
  };
}
