import React from "react";
import { Card } from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <ShieldCheck className="w-6 h-6 text-accent-cyan" />
          <h1 className="font-display font-extrabold text-2xl text-foreground">
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            KaraoQ prioritizes user privacy and minimal data retention. Guest sessions are temporary, while optional accounts use Supabase Auth.
          </p>
          <h2 className="text-base font-bold text-foreground font-display">1. Data We Process</h2>
          <p>
            When you create an account, we receive your email and profile details needed to provide saved playlists and library features. We do not sell, rent, or track your personal information across third-party networks.
          </p>
          <h2 className="text-base font-bold text-foreground font-display">2. YouTube Services</h2>
          <p>
            KaraoQ utilizes YouTube Data API v3 and the official YouTube IFrame Player API. Video streaming and audio playback are executed directly by YouTube according to YouTube&apos;s Terms of Service and Privacy Policy. We do not capture or relay raw video streams.
          </p>
          <h2 className="text-base font-bold text-foreground font-display">3. Data Deletion</h2>
          <p>
            You can delete all your stored profile data, saved playlists, and singing history at any time from the Profile page.
          </p>
        </div>
      </Card>
    </div>
  );
}
