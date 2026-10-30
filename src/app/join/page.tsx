"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Key, User, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/apiClient";
import { Room, RoomMember } from "@/lib/types";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keyParam = searchParams.get("key") || "";

  const { isAuthenticated, signIn, user, profile } = useAuth();

  const [roomKey, setRoomKey] = useState(keyParam.toUpperCase());
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (keyParam) {
      setRoomKey(keyParam.toUpperCase());
    }
  }, [keyParam]);

  useEffect(() => {
    if (user && !nickname) {
      setNickname(profile?.username || "Singer");
    }
  }, [user, profile, nickname]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = roomKey.trim().toUpperCase();
    if (cleanKey.length !== 6) {
      setError("Room key must be exactly 6 characters");
      return;
    }

    if (!isAuthenticated) {
      await signIn();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await apiClient.post<{ room: Room; member: RoomMember }>("/rooms/join", {
        roomKey: cleanKey,
        nickname: nickname.trim() || profile?.username || "Guest",
      });

      router.push(`/rooms/view?id=${res.room.id}&nick=${encodeURIComponent(nickname || profile?.username || "Guest")}`);
    } catch (err: any) {
      console.warn("Join failed:", err);
      setError(err?.message || "Unable to join this room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="p-6 sm:p-8 glass-panel-glow border-accent-cyan/30">
        <div className="text-center flex flex-col items-center gap-3 pb-6 border-b border-border mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shadow-glow-cyan">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">
              Join Karaoke Room
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Connect to the live karaoke stage to queue your songs
            </p>
          </div>
        </div>

        <form onSubmit={handleJoinSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              6-Letter Room Key
            </label>
            <Input
              value={roomKey}
              onChange={(e) => {
                setRoomKey(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="e.g. 7K9X2M"
              maxLength={6}
              className="text-center text-lg tracking-widest font-display font-bold uppercase"
              autoFocus={!keyParam}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Your Singer Nickname
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Freddie Mercury"
              icon={<User className="w-4 h-4" />}
            />
          </div>

          {error && <p className="text-xs text-danger text-center">{error}</p>}

          <Button
            type="submit"
            variant="neon"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 font-semibold flex items-center justify-center gap-2"
          >
            <span>Enter Karaoke Stage</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          {!isAuthenticated && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              You can join as a guest with a nickname; no account is required.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
