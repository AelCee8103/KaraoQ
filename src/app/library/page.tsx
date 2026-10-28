"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Library,
  Heart,
  History,
  ListMusic,
  Plus,
  Play,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Playlist, Favourite, PlayHistoryItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export default function LibraryPage() {
  const router = useRouter();
  const { isAuthenticated, signIn, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"favourites" | "playlists" | "history">("favourites");
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Playlist Modal
  const [isNewPlaylistOpen, setIsNewPlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [isCreatingPl, setIsCreatingPl] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const [favs, pls, hist] = await Promise.all([
          apiClient.get<Favourite[]>("/library/favourites").catch(() => []),
          apiClient.get<Playlist[]>("/library/playlists").catch(() => []),
          apiClient.get<PlayHistoryItem[]>("/library/history").catch(() => []),
        ]);
        setFavourites(favs);
        setPlaylists(pls);
        setHistory(hist);
      } catch (err) {
        console.warn("Library data fetch warning:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    setIsCreatingPl(true);
    try {
      const created = await apiClient.post<Playlist>("/library/playlists", {
        name: playlistName.trim(),
      });
      setPlaylists((prev) => [created, ...prev]);
      setIsNewPlaylistOpen(false);
      setPlaylistName("");
    } catch {
      // preview fallback
      const mock: Playlist = {
        id: "pl-" + Math.random().toString(36).substring(7),
        owner_id: user?.uuid || "user-id",
        name: playlistName.trim(),
        description: null,
        is_public: false,
        created_at: new Date().toISOString(),
      };
      setPlaylists((prev) => [mock, ...prev]);
      setIsNewPlaylistOpen(false);
      setPlaylistName("");
    } finally {
      setIsCreatingPl(false);
    }
  };

  const handleRemoveFavourite = async (videoId: string, title: string) => {
    try {
      await apiClient.post("/library/favourites", { videoId, title });
      setFavourites((prev) => prev.filter((f) => f.video_id !== videoId));
    } catch {
      setFavourites((prev) => prev.filter((f) => f.video_id !== videoId));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-surface-raised border border-border flex items-center justify-center text-primary-soft shadow-glow">
          <Library className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-foreground">
            Your Personal Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with Puter to save your favourite tracks, custom playlists, and singing history.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={signIn}>
          Sign In with Puter
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">
              Karaoke Library
            </h1>
            <p className="text-xs text-muted-foreground">
              Your saved playlists, favourites, and stage history
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border">
          <button
            onClick={() => setActiveTab("favourites")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "favourites"
                ? "bg-primary text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favourites ({favourites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "playlists"
                ? "bg-primary text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-primary text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Tab: Favourites */}
      {activeTab === "favourites" && (
        <section>
          {favourites.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-4">
              <Heart className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-semibold text-foreground">No favourite songs yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click the heart icon on any track in Search or Solo Player to add it here.
                </p>
              </div>
              <Link href="/search">
                <Button variant="outline" size="sm">
                  Search Karaoke Songs
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favourites.map((fav) => (
                <Card
                  key={fav.id}
                  className="p-3.5 flex flex-col justify-between hover:border-primary/40 group"
                >
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-raised mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          fav.thumbnail_url ||
                          `https://i.ytimg.com/vi/${fav.video_id}/mqdefault.jpg`
                        }
                        alt={fav.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Link
                        href={`/watch?v=${fav.video_id}`}
                        className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-glow">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </Link>
                    </div>

                    <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
                      {fav.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{fav.channel_title}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                    <Link
                      href={`/watch?v=${fav.video_id}`}
                      className="text-xs font-semibold text-primary-soft hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Sing</span>
                    </Link>
                    <button
                      onClick={() => handleRemoveFavourite(fav.video_id, fav.title)}
                      className="text-muted-foreground hover:text-danger p-1"
                      title="Remove from favourites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: Playlists */}
      {activeTab === "playlists" && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewPlaylistOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Playlist</span>
            </Button>
          </div>

          {playlists.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-4">
              <ListMusic className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-semibold text-foreground">No playlists yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create themed karaoke sets for parties, duets, or genres.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewPlaylistOpen(true)}
              >
                Create First Playlist
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl) => (
                <Link key={pl.id} href={`/library/playlists?id=${pl.id}`}>
                  <Card className="p-5 hover:border-primary/50 transition-all flex flex-col justify-between h-40">
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-1">
                        {pl.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pl.description || "Custom karaoke playlist"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span>{pl.items?.length || 0} songs</span>
                      <span className="text-accent-cyan font-medium">Open Playlist →</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: History */}
      {activeTab === "history" && (
        <section>
          {history.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-4">
              <History className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-semibold text-foreground">No singing history yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Songs you play or queue in rooms will automatically appear here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        item.thumbnail_url ||
                        `https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`
                      }
                      alt={item.title || "Track"}
                      className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.channel_title} • Played on {new Date(item.played_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Link href={`/watch?v=${item.video_id}`}>
                    <Button variant="secondary" size="sm" className="text-xs h-8 px-3">
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Sing Again
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* New Playlist Modal */}
      <Modal
        isOpen={isNewPlaylistOpen}
        onClose={() => setIsNewPlaylistOpen(false)}
        title="Create Karaoke Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Playlist Name
            </label>
            <Input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="e.g. 90s Rock Singalongs"
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary" isLoading={isCreatingPl} className="w-full mt-2">
            Create Playlist
          </Button>
        </form>
      </Modal>
    </div>
  );
}
