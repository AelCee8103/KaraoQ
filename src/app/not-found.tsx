"use client";

import React from "react";
import Link from "next/link";
import { MicOff, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-6">
      <div className="w-20 h-20 rounded-3xl bg-surface-raised border border-border flex items-center justify-center text-primary-soft shadow-glow">
        <MicOff className="w-10 h-10" />
      </div>
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-2">
          Track Not Found (404)
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md">
          The stage is dark here. The room or page you are looking for has either expired or never existed.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="primary" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="secondary" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search Songs</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
