"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { KaraokeVideo, QueueItem, Room } from "@/lib/types";

export type PlaybackMode = "idle" | "solo" | "room";

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
