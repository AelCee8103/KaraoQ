"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  Users,
  Search,
  Sparkles,
  Play,
  ArrowRight,
  Tv,
  Smartphone,
  ShieldCheck,
  Flame,
  Radio,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const FEATURED_KARAOKE_HITS = [
  {
    id: "yvEcMrstp80",
    title: "Queen - Bohemian Rhapsody (Karaoke Version) with Lyrics On Screen",
    channelTitle: "Zoom Karaoke Official",
    duration: "5:58",
    isVerified: true,
  },
  {
    id: "QMhzP5jhyTc",
    title: "Don't Stop Believin' (Originally Performed By Journey) (Karaoke Version)",
    channelTitle: "Chart Collective - Topic",
    duration: "4:11",
    isVerified: true,
  },
  {
    id: "NbGoWkqp8Uo",
    title: "Shake It Off (Karaoke Version)",
    channelTitle: "Sing Karaoke - Topic",
    duration: "3:39",
    isVerified: true,
  },
  {
    id: "AwlgOglHgbI",
    title: "OneRepublic - Counting Stars | Karaoke Version | Sing2Song",
    channelTitle: "Sing2Song | Karaoke",
    duration: "4:17",
    isVerified: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, signIn, user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean || clean.length !== 6) {
      setJoinError("Room key must be exactly 6 characters");
      return;
    }
    setJoinError("");
    router.push(`/join?key=${clean}`);
  };

  return (
    <div className="flex flex-col items-center gap-16 py-6 md:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
        <Badge variant="cyan" className="px-3.5 py-1 text-xs uppercase tracking-wider font-semibold">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          The Modern Karaoke Nightlife App
        </Badge>

        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] text-foreground">
          Turn Any Screen Into A{" "}
          <span className="bg-gradient-to-r from-primary via-primary-soft to-accent-cyan bg-clip-text text-transparent drop-shadow-sm">
            Karaoke Party
          </span>
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          One device powers the main karaoke screen while everyone queues songs and sings along directly from their phones.
        </p>

        {/* Quick Actions & Room Join */}
        <div className="w-full max-w-md mt-4 flex flex-col gap-4">
          <form onSubmit={handleJoinSubmit} className="relative flex items-center">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError("");
              }}
              placeholder="ENTER 6-LETTER ROOM CODE"
              maxLength={6}
              className="w-full bg-surface-raised border border-border focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-foreground placeholder:text-muted-foreground/50 rounded-2xl px-5 py-4 text-center text-lg tracking-widest font-display font-bold uppercase transition-all"
            />
            <Button
              type="submit"
              variant="neon"
              size="sm"
              className="absolute right-2 px-4 py-2 font-semibold text-xs tracking-wider"
            >
              JOIN
            </Button>
          </form>
          {joinError && <p className="text-xs text-danger text-center">{joinError}</p>}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/rooms/new" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full flex items-center gap-2">
                <Tv className="w-5 h-5" />
                <span>Host a Room</span>
              </Button>
            </Link>

            <Link href="/search" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-soft" />
                <span>Solo Karaoke</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live / Trending Tracks Row */}
      <section className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              Trending Karaoke Picks
            </h2>
          </div>
          <Link
            href="/search"
            className="text-xs sm:text-sm font-medium text-accent-cyan hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_KARAOKE_HITS.map((song) => (
            <Card
              key={song.id}
              className="overflow-hidden hover:border-primary/50 group flex flex-col justify-between p-4"
            >
              <div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-raised mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-background/90 text-[10px] font-semibold text-foreground">
                    {song.duration}
                  </div>
                  <Link
                    href={`/watch?v=${song.id}`}
                    className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-glow">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </Link>
                </div>

                <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 group-hover:text-primary-soft transition-colors">
                  {song.title}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>{song.channelTitle}</span>
                  {song.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan inline" />
                  )}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <Link
                  href={`/watch?v=${song.id}`}
                  className="text-xs font-semibold text-primary-soft hover:underline flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Sing Solo</span>
                </Link>
                <Link
                  href={`/rooms?addVideo=${song.id}`}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  + Add to Room
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How KaraoQ Works */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col gap-3 border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary-soft mb-2">
            <Tv className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">1. Host the TV Console</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create a room on a laptop, tablet, or TV. The host device acts as the single source of truth for high-fidelity playback.
          </p>
        </Card>

        <Card className="p-6 flex flex-col gap-3 border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">2. Guests Join by QR</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Friends scan the QR code or enter the 6-character room key on their phones. No app downloads required.
          </p>
        </Card>

        <Card className="p-6 flex flex-col gap-3 border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-2">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">3. Real-Time Sync & Queue</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Queue songs, send emoji reactions, and watch along in sync with drift-correction right from your own pocket.
          </p>
        </Card>
      </section>

      {/* Account Call to Action Banner */}
      {!isAuthenticated && (
        <section className="w-full max-w-4xl glass-panel-glow rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-5">
          <Badge variant="primary" className="px-3 py-1">
            Zero Passwords Required
          </Badge>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
            Create a free account
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
            Save your favourite karaoke songs and playlists while keeping room hosting and singing available as a guest.
          </p>
          <Button variant="primary" size="lg" onClick={() => signIn()} className="mt-2">
            Continue as Guest
          </Button>
        </section>
      )}
    </div>
  );
}
