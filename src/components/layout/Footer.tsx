import React from "react";
import Link from "next/link";
import { Mic, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-surface/50 backdrop-blur-md mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-bold text-foreground text-sm">
            Karao<span className="text-primary">Q</span>
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            © {new Date().getFullYear()} Synchronized Karaoke Rooms
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary-soft transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary-soft transition-colors">
            Terms of Service
          </Link>
          <span className="text-xs text-muted-foreground">Powered by Supabase and YouTube</span>
        </div>
      </div>
    </footer>
  );
}
