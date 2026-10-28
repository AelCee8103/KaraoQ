"use client";

import React, { useEffect, useRef, useState } from "react";
import { PlaybackStatus } from "@/lib/types";
import { AlertCircle, Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";

export interface YouTubePlayerProps {
  videoId: string | null;
  autoPlay?: boolean;
  onStateChange?: (status: PlaybackStatus, positionSeconds: number) => void;
  onEnded?: () => void;
  onError?: (errorCode: number) => void;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  syncTimestamp?: number; // target position in seconds for sync
  isWatchAlong?: boolean;
  className?: string;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function YouTubePlayer({
  videoId,
  autoPlay = true,
  onStateChange,
  onEnded,
  onError,
  onProgress,
  syncTimestamp,
  isWatchAlong = false,
  className = "",
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize or update player
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current) return;

    setErrorMessage(null);

    const playerElementId = `yt-player-${Math.random().toString(36).substring(7)}`;
    const playerDiv = document.createElement("div");
    playerDiv.id = playerElementId;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(playerDiv);

    try {
      playerRef.current = new window.YT.Player(playerElementId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: isWatchAlong ? 0 : 1, // Minimal controls for watch along
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            if (autoPlay) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            const ytState = event.data;
            let status: PlaybackStatus = "unstarted";

            // YouTube Player States: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
            if (ytState === 1) status = "playing";
            else if (ytState === 2) status = "paused";
            else if (ytState === 3) status = "buffering";
            else if (ytState === 0) {
              status = "ended";
              onEnded?.();
            } else if (ytState === 5) status = "cued";

            const currentTime = event.target.getCurrentTime ? event.target.getCurrentTime() : 0;
            onStateChange?.(status, currentTime);
          },
          onError: (event: any) => {
            const errorCode = event.data;
            let msg = "Failed to load video player.";
            if (errorCode === 101 || errorCode === 150) {
              msg = "This video cannot be played in an embedded player. Skipping...";
            } else if (errorCode === 100) {
              msg = "Video was removed or marked private.";
            }
            setErrorMessage(msg);
            onError?.(errorCode);
          },
        },
      });
    } catch (err) {
      console.error("Failed to construct YouTube player:", err);
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [isApiReady, videoId, autoPlay, isWatchAlong]);

  // Track progress and report heartbeat
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (currentTime !== undefined && duration !== undefined) {
            onProgress?.(currentTime, duration);
          }
        } catch {
          // Player not fully active
        }
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [onProgress]);

  // Drift Correction for Watch Along Mode (Master Brief Section 3.2: correct if drift exceeds 1.5s)
  useEffect(() => {
    if (!isWatchAlong || syncTimestamp === undefined || !playerRef.current) return;

    try {
      const localTime = playerRef.current.getCurrentTime();
      if (localTime !== undefined) {
        const drift = Math.abs(localTime - syncTimestamp);
        if (drift > 1.5) {
          playerRef.current.seekTo(syncTimestamp, true);
        }
      }
    } catch {
      // ignore
    }
  }, [syncTimestamp, isWatchAlong]);

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {
      // ignore
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  };

  if (!videoId) {
    return (
      <div
        className={`w-full aspect-video rounded-2xl bg-surface-raised border border-border flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <p className="text-muted-foreground text-sm font-medium">No song currently selected</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border shadow-2xl ${className}`}>
      {errorMessage ? (
        <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center p-6 text-center gap-3 z-20">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm font-medium text-foreground">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-semibold text-foreground hover:bg-surface"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : null}

      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Mute & Fullscreen Overlay for Watch Along */}
      {isWatchAlong && (
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-background/80 backdrop-blur-md text-foreground hover:text-primary-soft transition-colors shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
