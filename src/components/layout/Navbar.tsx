"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mic, Search, Music2, Library, Users, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, profile, isAuthenticated, isAnonymous, isLoading, signIn, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-primary-soft to-accent-cyan bg-clip-text text-transparent">
            Karao<span className="text-primary">Q</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Search className="w-4 h-4 text-primary-soft" />
            <span>Search</span>
          </Link>
          <Link
            href="/watch"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Music2 className="w-4 h-4 text-accent" />
            <span>Solo Player</span>
          </Link>
          <Link
            href="/rooms"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Users className="w-4 h-4 text-accent-cyan" />
            <span>Rooms</span>
          </Link>
          <Link
            href="/library"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Library className="w-4 h-4 text-highlight-amber" />
            <span>Library</span>
          </Link>
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-9 h-9 rounded-full bg-surface-raised animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-surface-raised border border-border hover:border-primary/50 transition-all"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={profile?.username || "Singer"}
                    className="w-7 h-7 rounded-full object-cover border border-primary/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary-soft flex items-center justify-center font-bold text-xs">
                    {(profile?.username || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                  {isAnonymous ? "Guest" : profile?.username}
                </span>
              </button>

              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-48 glass-panel-glow rounded-xl py-2 shadow-2xl z-50 border border-border"
                >
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-raised hover:text-primary-soft transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile & Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => signIn()}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue as Guest</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
