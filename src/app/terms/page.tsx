import React from "react";
import { Card } from "@/components/ui/Card";
import { Mic } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Mic className="w-6 h-6 text-primary-soft" />
          <h1 className="font-display font-extrabold text-2xl text-foreground">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            By using KaraoQ, you agree to these Terms of Service and to YouTube&apos;s Terms of Service (https://www.youtube.com/t/terms).
          </p>
          <h2 className="text-base font-bold text-foreground font-display">1. Purpose and Usage</h2>
          <p>
            KaraoQ is designed as an interactive karaoke party and playlist organizer for entertainment and educational usage. Users agree not to abuse room rate limits or attempt brute force key guessing.
          </p>
          <h2 className="text-base font-bold text-foreground font-display">2. Content Attribution</h2>
          <p>
            All video and audio tracks belong to their respective creators and copyright owners on YouTube.
          </p>
        </div>
      </Card>
    </div>
  );
}
