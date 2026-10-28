"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Sparkles } from "lucide-react";
import { puterClient } from "@/features/auth/puter";

export interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  initialQuery = "",
  onSearch,
  placeholder = "Search karaoke songs, artists, or lyrics...",
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    // Load recent searches from Puter KV or local storage
    (async () => {
      const stored = await puterClient.kvGet<string[]>("recent_searches");
      if (stored && Array.isArray(stored)) {
        setRecentSearches(stored);
      } else {
        const local = localStorage.getItem("karaoq_recent_searches");
        if (local) {
          try {
            setRecentSearches(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    })();
  }, []);

  const saveRecentSearch = async (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem("karaoq_recent_searches", JSON.stringify(updated));
      await puterClient.kvSet("recent_searches", updated);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      setShowRecent(false);
      onSearch(query.trim());
    }
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setShowRecent(false);
    onSearch(term);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-primary-soft pointer-events-none flex items-center">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowRecent(true);
          }}
          onFocus={() => setShowRecent(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-13 pl-12 pr-12 rounded-2xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-lg transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Recent Searches Dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div
          onMouseLeave={() => setShowRecent(false)}
          className="absolute left-0 right-0 top-full mt-2 glass-panel-glow rounded-2xl py-2 shadow-2xl z-30 border border-border overflow-hidden"
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent Searches
            </span>
            <button
              onClick={() => {
                setRecentSearches([]);
                localStorage.removeItem("karaoq_recent_searches");
              }}
              className="hover:text-danger text-[10px]"
            >
              Clear
            </button>
          </div>
          {recentSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSelectRecent(term)}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-raised hover:text-primary-soft flex items-center gap-2.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{term}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
