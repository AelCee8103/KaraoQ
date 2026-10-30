"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Music2,
  Tv,
  Smartphone,
  Eye,
  Radio,
  Sparkles,
  Trash2,
  Plus,
  LogOut,
  Flame,
  Clock,
  Heart,
  Smile,
  AlertCircle,
} from "lucide-react";
import { YouTubePlayer } from "@/features/player/YouTubePlayer";
import { SearchBar } from "@/features/youtube/SearchBar";
import { VideoCard } from "@/features/youtube/VideoCard";
import { useRoomRealtime } from "@/features/rooms/useRoomRealtime";
import { useAuth } from "@/features/auth/AuthContext";
import { apiClient } from "@/lib/apiClient";
import {
  Room,
  RoomMember,
  QueueItem,
  PlaybackStatus,
  KaraokeVideo,
  SearchResponse,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FALLBACK_KARAOKE_SONGS } from "@/server/core/youtube";

const REACTION_EMOJIS = ["🔥", "🎤", "👏", "💖", "🎉", "⭐", "🚀", "💃"];

function GuestViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("id") || "";
  const initialNickname = searchParams.get("nick") || "Singer";

  const { user, profile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentMember, setCurrentMember] = useState<RoomMember | null>(null);

  // Guest Mode: Remote (default, no video relay) vs Watch Along (embedded player kept in sync)
  const [mode, setMode] = useState<"remote" | "watchAlong">("remote");

  // Search in guest view
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<KaraokeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isKicked, setIsKicked] = useState(false);

  // Realtime hook
  const {
    isConnected,
    playbackState,
    activeReactions,
    singerAnnouncement,
    sendReaction,
    requestPlaybackState,
  } = useRoomRealtime({
    roomId,
    userId: user?.id || profile?.id,
    nickname: profile?.username || initialNickname,
    isHost: false,
    onQueueChanged: () => fetchQueue(),
    onMembersChanged: () => fetchRoomDetails(),
  });

  useEffect(() => {
    if (mode === "watchAlong" && isConnected) {
      requestPlaybackState();
    }
  }, [mode, isConnected, requestPlaybackState]);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiClient.get<{ room: Room; members: RoomMember[] }>(`/rooms/${roomId}`);
      setRoom(res.room);

      const me = res.members.find(
        (m) => m.user_id === user?.id || m.user_id === profile?.id
      );
      if (me) {
        if (me.status === "kicked") {
          setIsKicked(true);
        }
        setCurrentMember(me);
      }
    } catch {
      // Mock room for preview
      if (!room) {
        setRoom({
          id: roomId,
          host_id: "host-id",
          name: "Friday Karaoke Room",
          room_key: "KARAQ7",
          status: "open",
          max_guests: 12,
          settings: { maxSongsPerGuest: 3, allowGuestReorder: true, blockExplicit: false },
          current_item_id: null,
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }
  }, [roomId, user, profile, room]);

  const fetchQueue = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiClient.get<QueueItem[]>(`/rooms/${roomId}/queue`);
      setQueue(res);
    } catch {
      if (queue.length === 0) {
        setQueue([
          {
            id: "q-1",
            room_id: roomId,
            added_by: "host",
            video_id: FALLBACK_KARAOKE_SONGS[0].id,
            title: FALLBACK_KARAOKE_SONGS[0].title,
            channel_title: FALLBACK_KARAOKE_SONGS[0].channelTitle,
            thumbnail_url: FALLBACK_KARAOKE_SONGS[0].thumbnailUrl,
            duration_seconds: FALLBACK_KARAOKE_SONGS[0].durationSeconds,
            position: 1000,
            status: "playing",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [roomId, queue.length]);

  useEffect(() => {
    fetchRoomDetails();
    fetchQueue();
  }, [fetchRoomDetails, fetchQueue]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults(FALLBACK_KARAOKE_SONGS);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient.get<SearchResponse>("/youtube/search", { q });
      setSearchResults(res.items);
    } catch {
      const filtered = FALLBACK_KARAOKE_SONGS.filter((s) =>
        s.title.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered.length > 0 ? filtered : FALLBACK_KARAOKE_SONGS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToQueue = async (video: KaraokeVideo) => {
    try {
      const res = await apiClient.post<{ item: QueueItem; isDuplicate: boolean }>(
        `/rooms/${roomId}/queue`,
        {
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          durationSeconds: video.durationSeconds,
        }
      );
      setQueue((prev) => [...prev, res.item]);
      setIsSearchOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add song to queue");
    }
  };

  const handleRemoveMySong = async (itemId: string) => {
    try {
      await apiClient.delete(`/rooms/${roomId}/queue/${itemId}`);
      setQueue((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      setQueue((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await apiClient.post(`/rooms/${roomId}/leave`);
    } catch {
      // ignore
    }
    router.push("/rooms");
  };

  // Estimated wait time calculation in seconds
  const calculateWaitTime = (index: number): string => {
    if (index === 0) return "Playing Now";
    const sumSeconds = queue
      .slice(0, index)
      .reduce((acc, curr) => acc + (curr.duration_seconds || 240), 0);
    const mins = Math.ceil(sumSeconds / 60);
    return `~${mins} min wait`;
  };

  if (isKicked) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground">
          Removed from Room
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You have been removed from this karaoke room by the host and cannot rejoin this session.
        </p>
        <Button variant="primary" onClick={() => router.push("/rooms")}>
          Return to Rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5 py-2">
      {/* Floating Reaction Bursts */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 text-4xl animate-bounce"
            style={{ left: `${15 + (Math.random() * 70)}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Header Room Card */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg text-foreground truncate max-w-[200px]">
              {room?.name || "Karaoke Room"}
            </h1>
            <Badge variant="cyan" className="text-xs">
              {room?.room_key}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Joined as <span className="font-semibold text-foreground">{profile?.username || initialNickname}</span>
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeaveRoom}
          className="text-xs text-muted-foreground hover:text-danger flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave</span>
        </Button>
      </div>

      {/* Mode Switcher: Remote vs Watch Along */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-raised border border-border">
        <button
          onClick={() => setMode("remote")}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === "remote"
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Remote Mode</span>
        </button>

        <button
          onClick={() => setMode("watchAlong")}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === "watchAlong"
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Watch Along (Sync)</span>
        </button>
      </div>

      {/* Watch Along Embedded Synchronized Player */}
      {mode === "watchAlong" && (
        <Card className="p-3 overflow-hidden">
          {playbackState?.videoId ? (
            <>
              <YouTubePlayer
                videoId={playbackState.videoId}
                autoPlay={playbackState.status === "playing"}
                syncTimestamp={playbackState.positionSeconds}
                isWatchAlong={true}
              />
              <div className="mt-2 text-center text-xs text-muted-foreground">
                Synchronized with Host Player (&lt;1.5s drift auto-correction)
              </div>
            </>
          ) : (
            <div className="aspect-video rounded-2xl bg-surface-raised border border-border flex items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? "Waiting for the host playback state..."
                  : "Watch Along is unavailable while realtime is disconnected."}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Now Playing Banner */}
      <Card className="p-4 glass-panel-glow border-primary/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary-soft flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-accent-cyan">
              Now Singing on Stage
            </span>
            <p className="font-semibold text-sm text-foreground truncate">
              {playbackState?.title || queue[0]?.title || "Party is warming up"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Singer: {playbackState?.singerNickname || queue[0]?.added_by_profile?.username || "Host"}
            </p>
          </div>
        </div>

        <Button
          variant="neon"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Song</span>
        </Button>
      </Card>

      {/* Quick Reaction Emoji Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-surface-raised border border-border">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="w-10 h-10 rounded-xl hover:bg-surface text-xl flex items-center justify-center active:scale-125 transition-transform"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Room Queue List */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary-soft" />
            <h3 className="font-display font-bold text-base text-foreground">
              Live Queue ({queue.length})
            </h3>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-xs font-semibold text-primary-soft hover:underline"
          >
            + Add Song
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {queue.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground">The queue is currently empty!</p>
              <Button variant="primary" size="sm" onClick={() => setIsSearchOpen(true)}>
                Pick the First Song
              </Button>
            </div>
          ) : (
            queue.map((item, index) => {
              const isMine =
                item.added_by === user?.id ||
                item.added_by === profile?.id ||
                item.added_by_profile?.username === profile?.username;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    index === 0
                      ? "bg-primary/10 border-primary/40"
                      : "bg-surface-raised border-border/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{item.added_by_profile?.username || (isMine ? "You" : "Guest")}</span>
                        <span>•</span>
                        <span className="text-accent-cyan">{calculateWaitTime(index)}</span>
                      </div>
                    </div>
                  </div>

                  {isMine && index > 0 && (
                    <button
                      onClick={() => handleRemoveMySong(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-danger ml-2"
                      title="Remove my song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add Song Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search & Queue a Karaoke Song"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <SearchBar onSearch={handleSearch} autoFocus placeholder="Song, artist, or lyrics..." />

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {(searchResults.length > 0 ? searchResults : FALLBACK_KARAOKE_SONGS).map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-raised border border-border/80 hover:border-primary/40 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-14 h-9 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {song.channelTitle} • {song.formattedDuration}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddToQueue(song)}
                  className="text-xs h-8 px-3 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Queue
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function GuestViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <GuestViewContent />
    </Suspense>
  );
}
