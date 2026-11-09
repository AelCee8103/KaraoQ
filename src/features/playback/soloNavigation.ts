import { PlaybackMode } from "./PlaybackSession";

export function confirmLeavingSolo(mode: PlaybackMode): boolean {
  if (mode !== "solo" || typeof window === "undefined") return true;
  return window.confirm(
    "Your solo playback is still running. Stay here, or leave solo playback and continue to Rooms?"
  );
}
