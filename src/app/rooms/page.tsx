"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tv, Users, Plus, Key, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/features/auth/AuthContext";

function RoomsDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addVideoParam = searchParams.get("addVideo");
  const { isAuthenticated, signIn, user } = useAuth();

  const [roomKey, setRoomKey] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomKey.trim().toUpperCase();
    if (clean.length !== 6) {
      setError("Room key must be exactly 6 characters");
      return;
    }
    router.push(`/join?key=${clean}`);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 py-4">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <Badge variant="cyan" className="px-3 py-1">
          <Users className="w-3.5 h-3.5 mr-1" />
          Synchronized Karaoke Rooms
        </Badge>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-foreground">
          Sing Together in Real-Time
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
          Join an ongoing karaoke party with a 6-character room code, or launch your own TV console.
        </p>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Host Room Card */}
        <Card className="p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-primary/50 group">
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                Host a Karaoke Stage
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Turn your laptop or TV into the central karaoke screen. Manage queues, kick guests, lock rooms, and generate QR join codes.
              </p>
            </div>
          </div>

          <Link href="/rooms/new">
            <Button variant="primary" size="lg" className="w-full flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Create New Room</span>
            </Button>
          </Link>
        </Card>

        {/* Join Room Card */}
        <Card className="p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-accent-cyan/50">
          <div className="flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                Join with Room Code
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter the 6-character room key displayed on the host screen to join as a singer and queue songs.
              </p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              value={roomKey}
              onChange={(e) => {
                setRoomKey(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="e.g. 7K9X2M"
              maxLength={6}
              className="w-full bg-surface-raised border border-border focus:border-accent-cyan text-foreground placeholder:text-muted-foreground/50 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-display font-bold uppercase transition-all"
            />
            {error && <p className="text-xs text-danger text-center">{error}</p>}
            <Button type="submit" variant="neon" size="lg" className="w-full font-semibold">
              Join Party
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <RoomsDashboardContent />
    </Suspense>
  );
}
