"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MiniPlayer } from "./MiniPlayer";
import { YouTubePlayer } from "./YouTubePlayer";
import { usePlaybackSession } from "@/features/playback/PlaybackSession";

export function SoloPlayback() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, soloCurrent, soloQueue, setSoloCurrent, removeSoloFromQueue, clearSoloSession } =
    usePlaybackSession();
  const [isVisible, setIsVisible] = useState(true);
  const isWatchRoute = pathname === "/watch";

  const advance = useCallback(() => {
    const next = soloQueue[0];
    if (next) {
      removeSoloFromQueue(next.id);
      setSoloCurrent(next);
    } else {
      clearSoloSession();
    }
  }, [soloQueue, removeSoloFromQueue, setSoloCurrent, clearSoloSession]);

  if (mode !== "solo" || !soloCurrent) return null;

  return (
    <MiniPlayer
      isOpen={!isWatchRoute && isVisible}
      isHidden={!isWatchRoute && !isVisible}
      title={soloCurrent.title}
      onClose={() => setIsVisible(false)}
      onExpand={() => {
        setIsVisible(true);
        router.push(`/watch?v=${soloCurrent.id}`);
      }}
    >
      <YouTubePlayer
        videoId={soloCurrent.id}
        autoPlay
        onEnded={advance}
        onError={advance}
      />
    </MiniPlayer>
  );
}
