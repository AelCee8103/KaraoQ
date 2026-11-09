"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlaybackSession, useReconcileRoomSession } from "@/features/playback/PlaybackSession";
import { SoloPlayback } from "@/features/player/SoloPlayback";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, room, roomIsHost } = usePlaybackSession();
  useReconcileRoomSession();
  const isRoomRoute = pathname.startsWith("/rooms/host") || pathname.startsWith("/rooms/view");
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Background ambient light effects */}
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      {/* Header */}
      <Navbar />
      {mode === "room" && room && !isRoomRoute && (
        <div className="sticky top-16 z-30 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <Link
            href={`/rooms/${room.id.includes("-") ? "view" : "view"}?id=${room.id}`}
            className="block rounded-xl border border-accent-cyan/40 bg-surface-raised/95 px-4 py-3 text-sm text-foreground shadow-lg hover:border-accent-cyan"
          >
            You are currently in <strong>{room.name}</strong>. Return to your room to continue the session.
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 relative z-10">
        <SoloPlayback />
        {mode === "room" && room && !isRoomRoute ? (
          <div className="min-h-[55vh] flex flex-col items-center justify-center text-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-accent-cyan/10 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan">
              <span className="text-2xl">♪</span>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl text-foreground">
                You are in a karaoke room
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Return to <strong>{room.name}</strong> to continue the shared session. End or leave the room before browsing elsewhere.
              </p>
            </div>
            <Link
              href={`/rooms/${roomIsHost ? "host" : "view"}?id=${room.id}`}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-110"
            >
              Return to Room
            </Link>
          </div>
        ) : children}
      </main>

      {/* Mobile Bottom Bar */}
      <BottomNav />

      {/* Footer */}
      <Footer />
    </div>
  );
}
