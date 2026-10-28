"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PlaybackState,
  BroadcastPlaybackPayload,
  BroadcastReactionPayload,
  BroadcastSingerPayload,
  QueueItem,
  RoomMember,
} from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface UseRoomRealtimeOptions {
  roomId: string;
  userId?: string;
  nickname?: string;
  isHost?: boolean;
  onQueueChanged?: () => void;
  onMembersChanged?: () => void;
}

export function useRoomRealtime({
  roomId,
  userId,
  nickname,
  isHost = false,
  onQueueChanged,
  onMembersChanged,
}: UseRoomRealtimeOptions) {
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [activeReactions, setActiveReactions] = useState<BroadcastReactionPayload[]>([]);
  const [singerAnnouncement, setSingerAnnouncement] = useState<BroadcastSingerPayload | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; nickname: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const playbackStateRef = useRef<PlaybackState | null>(null);

  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    if (!roomId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Local fallback simulation when Supabase credentials are not connected
      setIsConnected(true);
      return;
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: userId || `guest-${Math.random().toString(36).substring(7)}` },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    // 1. Playback Broadcast
    channel.on(
      "broadcast",
      { event: "playback_update" },
      ({ payload }: { payload: BroadcastPlaybackPayload }) => {
        if (payload?.state) {
          setPlaybackState(payload.state);
        }
      }
    );

    channel.on("broadcast", { event: "playback_request" }, async () => {
      if (!isHost || !playbackStateRef.current) return;
      await channel.send({
        type: "broadcast",
        event: "playback_update",
        payload: { state: playbackStateRef.current, sender: "host" } as BroadcastPlaybackPayload,
      });
    });

    // 2. Reaction Broadcast
    channel.on(
      "broadcast",
      { event: "reaction" },
      ({ payload }: { payload: BroadcastReactionPayload }) => {
        if (payload) {
          setActiveReactions((prev) => [...prev.slice(-15), payload]);
          setTimeout(() => {
            setActiveReactions((prev) => prev.filter((r) => r.id !== payload.id));
          }, 3000);
        }
      }
    );

    // 3. Singer Announcement Broadcast
    channel.on(
      "broadcast",
      { event: "singer_announcement" },
      ({ payload }: { payload: BroadcastSingerPayload }) => {
        if (payload) {
          setSingerAnnouncement(payload);
          setTimeout(() => setSingerAnnouncement(null), 5000);
        }
      }
    );

    // 4. Postgres DB Changes
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_items", filter: `room_id=eq.${roomId}` },
        () => {
          onQueueChanged?.();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => {
          onMembersChanged?.();
        }
      );

    // 5. Presence Tracking
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: { userId: string; nickname: string }[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) users.push({ userId: p.userId, nickname: p.nickname || "Singer" });
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          if (userId && nickname) {
            await channel.track({ userId, nickname, isHost });
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, nickname, isHost, onQueueChanged, onMembersChanged]);

  // Host sends playback snapshot
  const broadcastPlayback = useCallback(
    async (state: PlaybackState) => {
      playbackStateRef.current = state;
      setPlaybackState(state);
      if (channelRef.current && isConnected) {
        await channelRef.current.send({
          type: "broadcast",
          event: "playback_update",
          payload: { state, sender: "host" } as BroadcastPlaybackPayload,
        });
      }
    },
    [isConnected]
  );

  const requestPlaybackState = useCallback(async () => {
    if (channelRef.current && isConnected && !isHost) {
      await channelRef.current.send({
        type: "broadcast",
        event: "playback_request",
        payload: { requester: userId || "guest" },
      });
    }
  }, [isConnected, isHost, userId]);

  // Send emoji reaction
  const sendReaction = useCallback(
    async (emoji: string) => {
      const payload: BroadcastReactionPayload = {
        id: Math.random().toString(36).substring(7),
        emoji,
        senderNickname: nickname || "Guest",
        timestamp: Date.now(),
      };
      setActiveReactions((prev) => [...prev.slice(-15), payload]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== payload.id));
      }, 3000);

      if (channelRef.current && isConnected) {
        await channelRef.current.send({
          type: "broadcast",
          event: "reaction",
          payload,
        });
      }
    },
    [nickname, isConnected]
  );

  // Send Singer Announcement
  const sendSingerAnnouncement = useCallback(
    async (singerNickname: string, songTitle: string, queueItemId: string) => {
      const payload: BroadcastSingerPayload = {
        nickname: singerNickname,
        title: songTitle,
        queueItemId,
      };
      setSingerAnnouncement(payload);
      setTimeout(() => setSingerAnnouncement(null), 5000);

      if (channelRef.current && isConnected) {
        await channelRef.current.send({
          type: "broadcast",
          event: "singer_announcement",
          payload,
        });
      }
    },
    [isConnected]
  );

  return {
    isConnected,
    playbackState,
    onlineUsers,
    activeReactions,
    singerAnnouncement,
    broadcastPlayback,
    requestPlaybackState,
    sendReaction,
    sendSingerAnnouncement,
  };
}
