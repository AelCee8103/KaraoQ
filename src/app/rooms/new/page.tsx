"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Tv, Sparkles, ShieldCheck, ArrowRight, Settings2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/apiClient";
import { Room, RoomMember } from "@/lib/types";

export default function CreateRoomPage() {
  const router = useRouter();
  const { isAuthenticated, signIn, user } = useAuth();

  const [name, setName] = useState("");
  const [maxGuests, setMaxGuests] = useState(12);
  const [maxSongsPerGuest, setMaxSongsPerGuest] = useState(3);
  const [allowGuestReorder, setAllowGuestReorder] = useState(true);
  const [fairPlayOrdering, setFairPlayOrdering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please give your karaoke room a name");
      return;
    }

    if (!isAuthenticated) {
      await signIn();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await apiClient.post<{ room: Room; member: RoomMember }>("/rooms", {
        name: name.trim(),
        maxGuests,
        settings: {
          maxSongsPerGuest,
          allowGuestReorder,
          blockExplicit: false,
          fairPlayOrdering,
        },
      });

      router.push(`/rooms/host?id=${res.room.id}`);
    } catch (err: any) {
      console.warn("Room creation error:", err);
      // Fallback local room for development testing
      const mockId = "room-" + Math.random().toString(36).substring(7);
      router.push(`/rooms/host?id=${mockId}&name=${encodeURIComponent(name.trim())}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card className="p-6 sm:p-8 glass-panel-glow border-primary/30">
        <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">
              Create Karaoke Stage
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure room limits, fair-play rules, and launch your TV console
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateRoom} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Room Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Neon Tokyo Friday Night"
              error={error}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Max Guests ({maxGuests})
              </label>
              <input
                type="range"
                min={2}
                max={30}
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-raised rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>2 (Duo)</span>
                <span>12 (Standard)</span>
                <span>30 (Party)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Max Songs per Guest ({maxSongsPerGuest})
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={maxSongsPerGuest}
                onChange={(e) => setMaxSongsPerGuest(Number(e.target.value))}
                className="w-full accent-accent-cyan h-2 bg-surface-raised rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>1 song</span>
                <span>3 songs</span>
                <span>10 songs</span>
              </div>
            </div>
          </div>

          {/* Room Settings Toggles */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Allow guests to reorder songs</p>
                <p className="text-xs text-muted-foreground">
                  Guests can move their own queued songs up and down
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowGuestReorder}
                onChange={(e) => setAllowGuestReorder(e.target.checked)}
                className="w-5 h-5 rounded accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Fair-Play Round Robin</p>
                <p className="text-xs text-muted-foreground">
                  Interleave songs across guests so one person doesn&apos;t dominate
                </p>
              </div>
              <input
                type="checkbox"
                checked={fairPlayOrdering}
                onChange={(e) => setFairPlayOrdering(e.target.checked)}
                className="w-5 h-5 rounded accent-accent-cyan cursor-pointer"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2"
          >
            <span>Launch Karaoke Host TV</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
