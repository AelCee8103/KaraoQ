"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Sparkles,
  Bot,
  Trash2,
  LogOut,
  Sliders,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { puterClient } from "@/features/auth/puter";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

const MOOD_PROMPTS = [
  "High energy 2000s party singalongs",
  "Classic 80s rock & power ballads",
  "Modern Pop and TikTok hits",
  "Chill acoustic duets for two singers",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, signIn, signOut } = useAuth();

  // AI Song Suggestions
  const [mood, setMood] = useState(MOOD_PROMPTS[0]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // KV Preferences
  const [preferredVolume, setPreferredVolume] = useState(80);
  const [savedKvNotice, setSavedKvNotice] = useState(false);

  // Delete Data confirmation
  const [isDeletingData, setIsDeletingData] = useState(false);

  useEffect(() => {
    (async () => {
      const vol = await puterClient.kvGet<number>("preferred_volume");
      if (vol !== null && vol !== undefined) setPreferredVolume(vol);
    })();
  }, []);

  const handleSaveVolume = async (val: number) => {
    setPreferredVolume(val);
    await puterClient.kvSet("preferred_volume", val);
    setSavedKvNotice(true);
    setTimeout(() => setSavedKvNotice(false), 2000);
  };

  const handleGenerateAiSuggestions = async (promptQuery: string) => {
    setIsAiLoading(true);
    setAiError("");
    setAiSuggestions([]);

    try {
      const prompt = `You are a karaoke party DJ. Suggest exactly 5 fun, crowd-pleasing karaoke songs for the mood: "${promptQuery}". Format the output as a numbered list with Song Title - Artist.`;
      const reply = await puterClient.aiChat(prompt);

      if (reply) {
        if (reply.includes("resting") || reply.includes("allowance")) {
          setAiError(reply);
        } else {
          const lines = reply
            .split("\n")
            .map((l) => l.trim().replace(/^\d+\.\s*/, ""))
            .filter((l) => l.length > 3);
          setAiSuggestions(lines.slice(0, 5));
        }
      } else {
        // Fallback recommendations
        setAiSuggestions([
          "Mr. Brightside – The Killers",
          "I Want It That Way – Backstreet Boys",
          "Sweet Caroline – Neil Diamond",
          "Don't Stop Believin' – Journey",
          "Dancing Queen – ABBA",
        ]);
      }
    } catch (err: any) {
      setAiError(err.message || "Puter AI suggestions resting.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteMyData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all your KaraoQ profile data, playlists, and singing history? This action is permanent."
      )
    ) {
      return;
    }

    setIsDeletingData(true);
    try {
      await apiClient.post("/me/delete");
      await signOut();
      router.push("/");
    } catch {
      await signOut();
      router.push("/");
    } finally {
      setIsDeletingData(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-surface-raised border border-border flex items-center justify-center text-primary-soft shadow-glow">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-foreground">
            Sign In to Your Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access your cloud karaoke settings, AI DJ suggestions, and data controls.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={signIn}>
          Continue with Puter
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-8">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8 glass-panel-glow border-primary/30 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-glow"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-display font-bold text-3xl shadow-glow">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
                {profile?.username || user?.username}
              </h1>
              <Badge variant="cyan" className="text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
                Puter Cloud
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              User ID: <span className="font-mono">{user?.uuid || user?.username}</span>
            </p>
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={signOut} className="flex items-center gap-1.5">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </Card>

      {/* Puter AI Song Suggestions Section */}
      <Card className="p-6 sm:p-8 flex flex-col gap-5 border-border/90">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-foreground">
                Puter AI Karaoke Song Suggester
              </h2>
              <Badge variant="primary" className="text-[10px]">
                AI Powered
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask AI for karaoke song recommendations based on your group&apos;s mood or theme
            </p>
          </div>
        </div>

        {/* Quick Mood Pills */}
        <div className="flex flex-wrap gap-2">
          {MOOD_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setMood(p);
                handleGenerateAiSuggestions(p);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                mood === p
                  ? "bg-accent-cyan/20 border border-accent-cyan text-accent-cyan shadow-glow-cyan"
                  : "bg-surface-raised border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Custom AI Input */}
        <div className="flex items-center gap-2">
          <Input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Type a mood (e.g. Disney singalongs, Anime openings, 90s hip-hop)..."
          />
          <Button
            variant="neon"
            size="md"
            onClick={() => handleGenerateAiSuggestions(mood)}
            isLoading={isAiLoading}
            className="flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </div>

        {/* AI Results */}
        {aiError ? (
          <p className="text-xs text-highlight-amber">{aiError}</p>
        ) : aiSuggestions.length > 0 ? (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-xs font-semibold text-primary-soft uppercase tracking-wider">
              AI Recommendations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiSuggestions.map((song, i) => (
                <div
                  key={i}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(song)}`)}
                  className="p-3 rounded-xl bg-surface-raised border border-border/80 hover:border-primary/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-medium text-foreground truncate">{song}</span>
                  <span className="text-accent-cyan ml-2 flex-shrink-0 font-semibold">Search →</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Cloud Preferences (Puter KV) */}
      <Card className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Sliders className="w-5 h-5 text-primary-soft" />
          <h2 className="font-display font-bold text-lg text-foreground">
            Cloud Preferences (Puter KV)
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Default Solo Player Volume ({preferredVolume}%)
            </p>
            <p className="text-xs text-muted-foreground">
              Saved automatically to your Puter cloud key-value storage
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-48">
            <input
              type="range"
              min={0}
              max={100}
              value={preferredVolume}
              onChange={(e) => handleSaveVolume(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-raised rounded-lg cursor-pointer"
            />
            {savedKvNotice && <span className="text-xs text-success font-semibold">Saved!</span>}
          </div>
        </div>
      </Card>

      {/* Privacy & Danger Zone */}
      <Card className="p-6 border-danger/30 flex flex-col gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone & GDPR Data Controls</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Permanently delete your KaraoQ profile, history, playlists, and favourites from our database.
          </p>
        </div>

        <div className="flex justify-start">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteMyData}
            isLoading={isDeletingData}
            className="text-xs"
          >
            Delete My Data & Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
