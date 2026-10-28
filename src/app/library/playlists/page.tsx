"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListMusic,
  Play,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Music2,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Playlist, PlaylistItem, KaraokeVideo, SearchResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/features/youtube/SearchBar";
import { FALLBACK_KARAOKE_SONGS } from "@/server/core/youtube";

function PlaylistDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistId = searchParams.get("id") || "";

  const { isAuthenticated, signIn, user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<KaraokeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!playlistId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const pls = await apiClient.get<Playlist[]>("/library/playlists");
        const found = pls.find((p) => p.id === playlistId);
        if (found) {
          setPlaylist(found);
          setItems(found.items || []);
        }
      } catch {
        // Mock fallback
        setPlaylist({
          id: playlistId,
          owner_id: user?.uuid || "user-id",
          name: "My Karaoke Mix",
          description: "Top party hits",
          is_public: false,
          created_at: new Date().toISOString(),
        });
        setItems(
          FALLBACK_KARAOKE_SONGS.slice(0, 3).map((s, idx) => ({
            id: `item-${idx}`,
            playlist_id: playlistId,
            video_id: s.id,
            title: s.title,
            channel_title: s.channelTitle,
            thumbnail_url: s.thumbnailUrl,
            duration_seconds: s.durationSeconds,
            position: idx + 1,
            created_at: new Date().toISOString(),
          }))
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [playlistId, isAuthenticated, user]);

  const handleSearchSongs = async (q: string) => {
    try {
      const res = await apiClient.get<SearchResponse>("/youtube/search", { q });
      setSearchResults(res.items);
    } catch {
      setSearchResults(FALLBACK_KARAOKE_SONGS);
    }
  };

  const handleAddSongToPlaylist = async (video: KaraokeVideo) => {
    try {
      const added = await apiClient.post<PlaylistItem>(
        `/library/playlists/${playlistId}/items`,
        {
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          durationSeconds: video.durationSeconds,
        }
      );
      setItems((prev) => [...prev, added]);
      setIsAddSongOpen(false);
    } catch {
      const mock: PlaylistItem = {
        id: "item-" + Math.random().toString(36).substring(7),
        playlist_id: playlistId,
        video_id: video.id,
        title: video.title,
        channel_title: video.channelTitle,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        position: items.length + 1,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, mock]);
      setIsAddSongOpen(false);
    }
  };

  const handleReorder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </Link>

      {/* Playlist Header */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow">
            <ListMusic className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
              {playlist?.name || "Playlist"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} songs • Karaoke Mix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <Link href={`/watch?v=${items[0].video_id}`}>
              <Button variant="primary" size="md" className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-white" />
                <span>Play All</span>
              </Button>
            </Link>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsAddSongOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Songs</span>
          </Button>
        </div>
      </div>

      {/* Items List */}
      <Card className="p-5 flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">This playlist is currently empty.</p>
            <Button variant="primary" size="sm" onClick={() => setIsAddSongOpen(true)}>
              Search Songs to Add
            </Button>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border/80 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                  {index + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    item.thumbnail_url ||
                    `https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`
                  }
                  alt={item.title}
                  className="w-14 h-9 object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.channel_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                <Link href={`/watch?v=${item.video_id}`}>
                  <button
                    className="p-1.5 text-primary-soft hover:text-white rounded-lg hover:bg-primary/20 transition-colors"
                    title="Sing"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </Link>

                {index > 0 && (
                  <button
                    onClick={() => handleReorder(index, "up")}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
                {index < items.length - 1 && (
                  <button
                    onClick={() => handleReorder(index, "down")}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-danger"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Add Song Modal */}
      <Modal
        isOpen={isAddSongOpen}
        onClose={() => setIsAddSongOpen(false)}
        title="Add Karaoke Song to Playlist"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <SearchBar onSearch={handleSearchSongs} autoFocus placeholder="Search song title..." />

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {(searchResults.length > 0 ? searchResults : FALLBACK_KARAOKE_SONGS).map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-raised border border-border/80 gap-3"
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
                      {song.channelTitle}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddSongToPlaylist(song)}
                  className="text-xs h-8 px-3"
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PlaylistDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PlaylistDetailContent />
    </Suspense>
  );
}
