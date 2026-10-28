"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { YouTubePlayer } from "@/features/player/YouTubePlayer";
import { VideoCard } from "@/features/youtube/VideoCard";
import { KaraokeVideo, PlaybackStatus } from "@/lib/types";
import { FALLBACK_KARAOKE_SONGS } from "@/server/core/youtube";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Maximize,
  Minimize,
  Heart,
  Plus,
  Play,
  SkipForward,
  Music2,
  Tv,
  ListOrdered,
  Sparkles,
} from "lucide-react";

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoIdParam = searchParams.get("v") || FALLBACK_KARAOKE_SONGS[0].id;

  const [currentVideoId, setCurrentVideoId] = useState(videoIdParam);
  const [currentSong, setCurrentSong] = useState<KaraokeVideo | null>(null);
  const [personalQueue, setPersonalQueue] = useState<KaraokeVideo[]>([]);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);

  useEffect(() => {
    if (videoIdParam) {
      setCurrentVideoId(videoIdParam);
      const found = FALLBACK_KARAOKE_SONGS.find((s) => s.id === videoIdParam);
      if (found) {
        setCurrentSong(found);
      } else {
        // Fetch details from backend
        apiClient
          .get<KaraokeVideo[]>("/youtube/videos", { ids: videoIdParam })
          .then((res) => {
            if (res && res.length > 0) setCurrentSong(res[0]);
          })
          .catch(() => {
            setCurrentSong({
              id: videoIdParam,
              title: "Karaoke Performance",
              channelTitle: "Karaoke Channel",
              channelId: "",
              thumbnailUrl: `https://i.ytimg.com/vi/${videoIdParam}/mqdefault.jpg`,
              durationSeconds: 240,
              formattedDuration: "4:00",
              isVerifiedKaraoke: true,
              isEmbeddable: true,
            });
          });
      }
    }
  }, [videoIdParam]);

  // Load up next suggestions
  useEffect(() => {
    const suggestions = FALLBACK_KARAOKE_SONGS.filter((s) => s.id !== currentVideoId);
    setPersonalQueue(suggestions);
  }, [currentVideoId]);

  const handleNextSong = () => {
    if (personalQueue.length > 0) {
      const next = personalQueue[0];
      setPersonalQueue((prev) => prev.slice(1));
      router.push(`/watch?v=${next.id}`);
    }
  };

  const handleAddToPersonalQueue = (video: KaraokeVideo) => {
    setPersonalQueue((prev) => [...prev, video]);
  };

  const toggleFavourite = async () => {
    if (!currentSong) return;
    try {
      const res = await apiClient.post<{ isFavourited: boolean }>("/library/favourites", {
        videoId: currentSong.id,
        title: currentSong.title,
        channelTitle: currentSong.channelTitle,
        thumbnailUrl: currentSong.thumbnailUrl,
        durationSeconds: currentSong.durationSeconds,
      });
      setIsFavourited(res.isFavourited);
    } catch {
      setIsFavourited(!isFavourited);
    }
  };

  return (
    <div className={`flex flex-col gap-6 max-w-7xl mx-auto ${isKaraokeMode ? "fixed inset-0 z-50 bg-background p-6 overflow-y-auto" : "py-2"}`}>
      {/* Player Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Video View */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative group">
            <YouTubePlayer
              videoId={currentVideoId}
              autoPlay={true}
              onEnded={handleNextSong}
              className={isKaraokeMode ? "max-h-[75vh]" : ""}
            />

            {/* Karaoke Mode Control */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsKaraokeMode(!isKaraokeMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-foreground hover:text-primary-soft text-xs font-semibold shadow-lg border border-border"
              >
                {isKaraokeMode ? (
                  <>
                    <Minimize className="w-3.5 h-3.5" />
                    <span>Exit Full View</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5" />
                    <span>Karaoke Big Stage</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Now Playing Info & Actions */}
          <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="cyan" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Now Singing
                </Badge>
                {currentSong?.isVerifiedKaraoke && (
                  <Badge variant="primary" className="text-xs">
                    Verified Channel
                  </Badge>
                )}
              </div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground truncate">
                {currentSong?.title || "Karaoke Track"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentSong?.channelTitle || "Official Backing Track"}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={isFavourited ? "danger" : "outline"}
                size="sm"
                onClick={toggleFavourite}
                className="flex-1 sm:flex-initial flex items-center gap-1.5"
              >
                <Heart className={`w-4 h-4 ${isFavourited ? "fill-current" : ""}`} />
                <span>{isFavourited ? "Favourited" : "Favourite"}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleNextSong}
                disabled={personalQueue.length === 0}
                className="flex-1 sm:flex-initial flex items-center gap-1.5"
              >
                <SkipForward className="w-4 h-4" />
                <span>Next Track</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Up Next / Solo Queue Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary-soft" />
                <h3 className="font-display font-bold text-base text-foreground">
                  Up Next in Queue
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">{personalQueue.length} songs</span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
              {personalQueue.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Your solo queue is empty. Click any song below to queue it!
                </p>
              ) : (
                personalQueue.map((song, index) => (
                  <div
                    key={song.id + index}
                    onClick={() => router.push(`/watch?v=${song.id}`)}
                    className="flex items-center gap-3 p-2 rounded-xl bg-surface-raised border border-border/60 hover:border-primary/40 cursor-pointer group transition-all"
                  >
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary-soft transition-colors">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {song.channelTitle} • {song.formattedDuration}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Host Room Promo */}
          <Card className="p-5 glass-panel-glow border-accent-cyan/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-accent-cyan">
              <Tv className="w-5 h-5" />
              <h4 className="font-display font-bold text-sm">Singing with Friends?</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a synchronized Room so your friends can scan a QR code and queue their favorite songs from their phones.
            </p>
            <Button
              variant="neon"
              size="sm"
              onClick={() => router.push("/rooms/new")}
              className="w-full text-xs"
            >
              Start Karaoke Room
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
