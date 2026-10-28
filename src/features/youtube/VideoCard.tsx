"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Plus,
  Heart,
  ShieldCheck,
  ListPlus,
  Check,
  Radio,
} from "lucide-react";
import { KaraokeVideo } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/features/auth/AuthContext";

export interface VideoCardProps {
  video: KaraokeVideo;
  onAddToRoomQueue?: (video: KaraokeVideo) => void;
  onPlaySolo?: (video: KaraokeVideo) => void;
  isFavourited?: boolean;
}

export function VideoCard({
  video,
  onAddToRoomQueue,
  onPlaySolo,
  isFavourited: initialFavourited = false,
}: VideoCardProps) {
  const { isAuthenticated, signIn } = useAuth();
  const [favourited, setFavourited] = useState(initialFavourited);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      await signIn();
      return;
    }

    setIsFavLoading(true);
    try {
      const res = await apiClient.post<{ isFavourited: boolean }>("/library/favourites", {
        videoId: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
      });
      setFavourited(res.isFavourited);
    } catch (err) {
      console.warn("Favourite toggle error:", err);
    } finally {
      setIsFavLoading(false);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToRoomQueue) {
      onAddToRoomQueue(video);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden group flex flex-col justify-between p-3.5 hover:border-primary/50 transition-all duration-200">
      <div>
        {/* Video Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-raised mb-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-background/90 text-[10px] font-semibold text-foreground">
            {video.formattedDuration}
          </div>

          {video.isVerifiedKaraoke && (
            <div className="absolute top-1.5 left-1.5">
              <Badge variant="cyan" className="text-[10px] py-0 px-1.5">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                Verified
              </Badge>
            </div>
          )}

          {/* Quick Play Overlay */}
          <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
            {onPlaySolo ? (
              <button
                onClick={() => onPlaySolo(video)}
                className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white shadow-glow hover:scale-110 transition-transform"
                title="Play Solo"
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </button>
            ) : (
              <Link
                href={`/watch?v=${video.id}`}
                className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white shadow-glow hover:scale-110 transition-transform"
                title="Play Solo"
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </Link>
            )}

            {onAddToRoomQueue && (
              <button
                onClick={handleAddClick}
                className="w-10 h-10 rounded-full bg-accent-cyan text-background flex items-center justify-center shadow-glow-cyan hover:scale-110 transition-transform font-bold"
                title="Add to Room Queue"
              >
                {addedNotice ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Video Metadata */}
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 group-hover:text-primary-soft transition-colors leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="truncate">{video.channelTitle}</span>
        </p>
      </div>

      {/* Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
        <Link
          href={`/watch?v=${video.id}`}
          className="text-xs font-semibold text-primary-soft hover:underline flex items-center gap-1"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Sing Solo</span>
        </Link>

        <div className="flex items-center gap-1">
          {onAddToRoomQueue && (
            <button
              onClick={handleAddClick}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-accent-cyan hover:bg-surface-raised transition-colors text-xs flex items-center gap-1"
              title="Add to Room Queue"
            >
              {addedNotice ? (
                <span className="text-success flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Added
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Queue
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleToggleFavourite}
            disabled={isFavLoading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-surface-raised transition-colors"
            title="Favourite"
          >
            <Heart
              className={`w-4 h-4 ${
                favourited ? "fill-danger text-danger" : "stroke-current"
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
