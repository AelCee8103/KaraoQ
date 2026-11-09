"use client";

import React, { useEffect, useRef, useState } from "react";
import { PlaybackStatus } from "@/lib/types";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface YouTubePlayerProps {
  videoId: string | null;
  autoPlay?: boolean;
  onStateChange?: (status: PlaybackStatus, positionSeconds: number) => void;
  onEnded?: () => void;
  onError?: (errorCode: number) => void;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
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
  className = "",
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const videoIdRef = useRef(videoId);
  const autoPlayRef = useRef(autoPlay);
  const onStateChangeRef = useRef(onStateChange);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const [isApiReady, setIsApiReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    videoIdRef.current = videoId;
    autoPlayRef.current = autoPlay;
    onStateChangeRef.current = onStateChange;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [videoId, autoPlay, onStateChange, onEnded, onError]);

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

  // Initialize once, then load subsequent songs through the existing iframe.
  useEffect(() => {
    if (!isApiReady || !containerRef.current) return;

    if (playerRef.current) {
      if (!videoIdRef.current) {
        playerRef.current.stopVideo?.();
        loadedVideoIdRef.current = null;
        return;
      }
      if (videoIdRef.current && loadedVideoIdRef.current !== videoIdRef.current) {
        setErrorMessage(null);
        if (autoPlayRef.current) {
          playerRef.current.loadVideoById(videoIdRef.current);
        } else {
          playerRef.current.cueVideoById(videoIdRef.current);
        }
        loadedVideoIdRef.current = videoIdRef.current;
      }
      return;
    }

    if (!videoIdRef.current) return;

    setErrorMessage(null);
    const playerElementId = `yt-player-${Math.random().toString(36).substring(7)}`;
    const playerDiv = document.createElement("div");
    playerDiv.id = playerElementId;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(playerDiv);
    loadedVideoIdRef.current = videoIdRef.current;

    try {
      playerRef.current = new window.YT.Player(playerElementId, {
        videoId: videoIdRef.current,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoPlayRef.current ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            if (autoPlayRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            const ytState = event.data;
            let status: PlaybackStatus = "unstarted";

            if (ytState === 1) status = "playing";
            else if (ytState === 2) status = "paused";
            else if (ytState === 3) status = "buffering";
            else if (ytState === 0) {
              status = "ended";
              onEndedRef.current?.();
            } else if (ytState === 5) status = "cued";

            const currentTime = event.target.getCurrentTime ? event.target.getCurrentTime() : 0;
            onStateChangeRef.current?.(status, currentTime);
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
            onErrorRef.current?.(errorCode);
          },
        },
      });
    } catch (err) {
      console.error("Failed to construct YouTube player:", err);
      playerRef.current = null;
      loadedVideoIdRef.current = null;
    }
  }, [isApiReady, videoId]);

  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
      playerRef.current = null;
      loadedVideoIdRef.current = null;
    };
  }, []);

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
    <div className={`relative isolate w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border shadow-2xl ${className}`}>
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

    </div>
  );
}
