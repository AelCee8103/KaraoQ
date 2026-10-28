"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Tv,
  Users,
  Copy,
  Check,
  Share2,
  Lock,
  Unlock,
  PowerOff,
  UserX,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
  Search,
  Sparkles,
  Flame,
  Radio,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { YouTubePlayer } from "@/features/player/YouTubePlayer";
import { MiniPlayer } from "@/features/player/MiniPlayer";
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
  PlaybackState,
  KaraokeVideo,
  SearchResponse,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FALLBACK_KARAOKE_SONGS } from "@/server/core/youtube";

function HostConsoleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("id") || "";
  const initialName = searchParams.get("name") || "KaraoQ Room";

  const { user, profile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlaybackStatus>("unstarted");
  const [currentPosition, setCurrentPosition] = useState(0);

  // Mini Player & Host Search state
  const [isSearchingInMini, setIsSearchingInMini] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KaraokeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals & UI helpers
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);

  // Realtime hook
  const {
    isConnected,
    activeReactions,
    singerAnnouncement,
    onlineUsers,
    broadcastPlayback,
    sendSingerAnnouncement,
  } = useRoomRealtime({
    roomId,
    userId: user?.uuid || profile?.id,
    nickname: user?.username || profile?.username || "Host",
    isHost: true,
    onQueueChanged: () => fetchQueue(),
    onMembersChanged: () => fetchRoomDetails(),
  });

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiClient.get<{ room: Room; members: RoomMember[] }>(`/rooms/${roomId}`);
      setRoom(res.room);
      setMembers(res.members);
    } catch {
      // Mock room for offline dev
      if (!room) {
        setRoom({
          id: roomId,
          host_id: user?.uuid || "host-id",
          name: initialName,
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
  }, [roomId, initialName, user, room]);

  const fetchQueue = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiClient.get<QueueItem[]>(`/rooms/${roomId}/queue`);
      setQueue(res);

      if (!currentItem && res.length > 0) {
        const first = res[0];
        setCurrentItem(first);
        sendSingerAnnouncement(
          first.added_by_profile?.username || "Guest",
          first.title,
          first.id
        );
      }
    } catch {
      // Mock queue if empty
      if (queue.length === 0) {
        const mockItem: QueueItem = {
          id: "queue-1",
          room_id: roomId,
          added_by: user?.uuid || "host-id",
          video_id: FALLBACK_KARAOKE_SONGS[0].id,
          title: FALLBACK_KARAOKE_SONGS[0].title,
          channel_title: FALLBACK_KARAOKE_SONGS[0].channelTitle,
          thumbnail_url: FALLBACK_KARAOKE_SONGS[0].thumbnailUrl,
          duration_seconds: FALLBACK_KARAOKE_SONGS[0].durationSeconds,
          position: 1000,
          status: "playing",
          created_at: new Date().toISOString(),
          added_by_profile: profile || undefined,
        };
        setQueue([mockItem]);
        setCurrentItem(mockItem);
      }
    }
  }, [roomId, currentItem, user, profile, queue.length, sendSingerAnnouncement]);

  useEffect(() => {
    fetchRoomDetails();
    fetchQueue();
  }, [fetchRoomDetails, fetchQueue]);

  // Host Heartbeat Broadcast (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentItem) {
        const snapshot: PlaybackState = {
          currentQueueItemId: currentItem.id,
          videoId: currentItem.video_id,
          status: playerStatus,
          positionSeconds: currentPosition,
          updatedAt: Date.now(),
          title: currentItem.title,
          singerNickname: currentItem.added_by_profile?.username || "Host",
        };
        broadcastPlayback(snapshot);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentItem, playerStatus, currentPosition, broadcastPlayback]);

  // Player state change handler
  const handlePlayerStateChange = (status: PlaybackStatus, position: number) => {
    setPlayerStatus(status);
    setCurrentPosition(position);

    if (currentItem) {
      const snapshot: PlaybackState = {
        currentQueueItemId: currentItem.id,
        videoId: currentItem.video_id,
        status,
        positionSeconds: position,
        updatedAt: Date.now(),
        title: currentItem.title,
        singerNickname: currentItem.added_by_profile?.username || "Host",
      };
      broadcastPlayback(snapshot);
    }
  };

  // Auto-advance on video end or skip
  const handleSongEnded = async () => {
    if (!currentItem) return;

    try {
      await apiClient.patch(`/rooms/${roomId}/queue/${currentItem.id}`, {
        status: "played",
        action: "skip",
      });
    } catch {
      // offline dev
    }

    const remaining = queue.filter((i) => i.id !== currentItem.id);
    setQueue(remaining);

    if (remaining.length > 0) {
      const next = remaining[0];
      setCurrentItem(next);
      sendSingerAnnouncement(
        next.added_by_profile?.username || "Guest",
        next.title,
        next.id
      );
    } else {
      setCurrentItem(null);
    }
  };

  const handleSkipSong = () => {
    handleSongEnded();
  };

  const handleRemoveQueueItem = async (itemId: string) => {
    try {
      await apiClient.delete(`/rooms/${roomId}/queue/${itemId}`);
      setQueue((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      setQueue((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleReorderQueueItem = async (itemId: string, direction: "up" | "down") => {
    const index = queue.findIndex((i) => i.id === itemId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;

    setQueue(newQueue);

    try {
      await apiClient.patch(`/rooms/${roomId}/queue/${itemId}`, {
        position: targetIndex * 1000 + 500,
        action: "reorder",
      });
    } catch {
      // ignore
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    try {
      await apiClient.post(`/rooms/${roomId}/kick`, { userId: targetUserId });
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    } catch (err) {
      console.warn("Kick member error:", err);
    }
  };

  const handleToggleLock = async () => {
    if (!room) return;
    const nextStatus = room.status === "locked" ? "open" : "locked";
    try {
      const updated = await apiClient.post<Room>(`/rooms/${roomId}/lock`, { status: nextStatus });
      setRoom(updated);
    } catch {
      setRoom({ ...room, status: nextStatus });
    }
  };

  const handleEndRoom = async () => {
    setIsEndingRoom(true);
    try {
      await apiClient.post(`/rooms/${roomId}/end`);
    } catch {
      // ignore
    }
    router.push("/rooms");
  };

  const handleCopyKey = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.room_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleShareRoom = async () => {
    if (!room) return;
    const joinUrl = `${window.location.origin}/join?key=${room.room_key}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.name} on KaraoQ`,
          text: `Join our karaoke room with key: ${room.room_key}`,
          url: joinUrl,
        });
      } catch {
        // ignore
      }
    } else {
      handleCopyKey();
    }
  };

  // Host Search in Mini Player
  const handleHostSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient.get<SearchResponse>("/youtube/search", { q });
      setSearchResults(res.items);
    } catch {
      setSearchResults(FALLBACK_KARAOKE_SONGS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHostAddSong = async (video: KaraokeVideo) => {
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
      if (!currentItem) {
        setCurrentItem(res.item);
      }
    } catch {
      // Local fallback
      const mockItem: QueueItem = {
        id: "queue-" + Math.random().toString(36).substring(7),
        room_id: roomId,
        added_by: user?.uuid || "host-id",
        video_id: video.id,
        title: video.title,
        channel_title: video.channelTitle,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        position: (queue.length + 1) * 1000,
        status: "queued",
        created_at: new Date().toISOString(),
        added_by_profile: profile || undefined,
      };
      setQueue((prev) => [...prev, mockItem]);
      if (!currentItem) setCurrentItem(mockItem);
    }
  };

  const joinLink = typeof window !== "undefined" ? `${window.location.origin}/join?key=${room?.room_key || ""}` : "";

  return (
    <div className="relative min-h-[85vh] flex flex-col gap-6">
      {/* Floating Reaction Bursts */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 text-5xl animate-bounce"
            style={{ left: `${20 + (Math.random() * 60)}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Singer Announcement Overlay */}
      {singerAnnouncement && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel-glow border-primary rounded-2xl px-6 py-3 shadow-glow-lg flex items-center gap-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-primary-soft" />
          <div>
            <p className="text-xs text-primary-soft font-semibold uppercase tracking-wider">
              Now Singing
            </p>
            <p className="text-base sm:text-lg font-bold font-display text-white">
              {singerAnnouncement.nickname}
            </p>
          </div>
        </div>
      )}

      {/* Top Console Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg sm:text-xl text-foreground truncate max-w-xs sm:max-w-md">
              {room?.name || "Host TV Stage"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"}`} />
                {isConnected ? "Live Connected" : "Connecting..."}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-accent-cyan" />
                {onlineUsers.length || members.length || 1} online
              </span>
            </div>
          </div>
        </div>

        {/* Room Code Chip & Quick Host Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Room Key Chip */}
          <div className="flex items-center bg-surface-raised border border-accent-cyan/40 rounded-xl px-3 py-1.5 shadow-glow-cyan">
            <span className="text-xs text-muted-foreground mr-2 font-semibold">ROOM KEY:</span>
            <span className="font-display font-extrabold text-base tracking-widest text-accent-cyan mr-2">
              {room?.room_key || "------"}
            </span>
            <button
              onClick={handleCopyKey}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Room Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <span>QR Code</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareRoom}
            className="flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            variant={room?.status === "locked" ? "danger" : "secondary"}
            size="sm"
            onClick={handleToggleLock}
            className="flex items-center gap-1.5"
            title={room?.status === "locked" ? "Room is Locked" : "Lock Room"}
          >
            {room?.status === "locked" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="hidden sm:inline">{room?.status === "locked" ? "Locked" : "Lock"}</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleEndRoom}
            className="flex items-center gap-1.5"
            title="End Session"
          >
            <PowerOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Room</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Player Stage & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main TV Player Screen (or Mini mode placeholder) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <MiniPlayer
            isOpen={isSearchingInMini}
            onClose={() => setIsSearchingInMini(false)}
            onExpand={() => setIsSearchingInMini(false)}
            title={currentItem?.title}
          >
            <YouTubePlayer
              videoId={currentItem?.video_id || null}
              autoPlay={true}
              onStateChange={handlePlayerStateChange}
              onEnded={handleSongEnded}
              onProgress={(pos) => setCurrentPosition(pos)}
            />
          </MiniPlayer>

          {/* Host Search while playing trigger */}
          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-soft" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Want to search songs without stopping the video?
              </span>
            </div>
            <Button
              variant={isSearchingInMini ? "neon" : "primary"}
              size="sm"
              onClick={() => setIsSearchingInMini(!isSearchingInMini)}
              className="text-xs whitespace-nowrap"
            >
              {isSearchingInMini ? "Close Search View" : "Search in Mini Player"}
            </Button>
          </Card>

          {/* If Host Search Active in Main Panel */}
          {isSearchingInMini && (
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="font-display font-bold text-base text-foreground">
                Host Song Discovery
              </h3>
              <SearchBar initialQuery={searchQuery} onSearch={handleHostSearch} autoFocus />

              <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-max items-start gap-3 max-h-[70vh] overflow-y-auto pr-1">
                {searchResults.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onAddToRoomQueue={() => handleHostAddSong(video)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Up Next Queue & Room Members */}
        <div className="flex flex-col gap-6">
          {/* Queue Card */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-primary-soft" />
                <h3 className="font-display font-bold text-base text-foreground">
                  Up Next Queue
                </h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSkipSong}
                disabled={queue.length <= 1}
                className="text-xs h-7 px-2.5 flex items-center gap-1"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No songs in queue. Share the room code or search above!
                </p>
              ) : (
                queue.map((item, index) => {
                  const isCurrent = item.id === currentItem?.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-primary/10 border-primary/40 shadow-glow"
                          : "bg-surface-raised border-border/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Queued by {item.added_by_profile?.username || "Guest"}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {index > 1 && (
                          <button
                            onClick={() => handleReorderQueueItem(item.id, "up")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {index > 0 && index < queue.length - 1 && (
                          <button
                            onClick={() => handleReorderQueueItem(item.id, "down")}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveQueueItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-danger"
                          title="Remove from Queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Members List */}
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-accent-cyan" />
                <span>Guests in Room ({members.length})</span>
              </h3>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-raised transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-foreground truncate">{m.nickname}</span>
                    {m.role === "host" && (
                      <Badge variant="amber" className="text-[10px] py-0 px-1.5">
                        Host
                      </Badge>
                    )}
                  </div>

                  {m.role !== "host" && (
                    <button
                      onClick={() => handleKickMember(m.user_id)}
                      className="text-muted-foreground hover:text-danger p-1"
                      title="Kick Guest"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Deep Link Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Scan to Join Karaoke Stage"
      >
        <div className="flex flex-col items-center gap-5 p-4 text-center">
          <div className="p-4 bg-white rounded-2xl shadow-2xl">
            <QRCodeSVG value={joinLink} size={220} level="H" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">ROOM KEY</p>
            <p className="font-display font-black text-3xl tracking-widest text-primary-soft uppercase">
              {room?.room_key}
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            Point your mobile camera at this QR code to instantly join the room and queue songs.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function HostConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <HostConsoleContent />
    </Suspense>
  );
}
