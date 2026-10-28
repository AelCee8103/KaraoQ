"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchBar } from "@/features/youtube/SearchBar";
import { VideoCard } from "@/features/youtube/VideoCard";
import { KaraokeVideo, SearchResponse } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Sparkles, Music2, Loader2, ArrowRight } from "lucide-react";
import { FALLBACK_KARAOKE_SONGS } from "@/server/core/youtube";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<KaraokeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestingQuota, setIsRestingQuota] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSongs = useCallback(async (searchQuery: string, pageToken?: string) => {
    if (!searchQuery.trim()) {
      setResults(FALLBACK_KARAOKE_SONGS);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.get<SearchResponse>("/youtube/search", {
        q: searchQuery,
        pageToken,
      });

      if (pageToken) {
        setResults((prev) => [...prev, ...res.items]);
      } else {
        setResults(res.items);
      }

      setNextPageToken(res.nextPageToken || null);
      setIsRestingQuota(!!res.isRestingQuota);
      setHasSearched(true);
    } catch (err) {
      console.warn("Search failed, serving fallback tracks:", err);
      const filtered = FALLBACK_KARAOKE_SONGS.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered.length > 0 ? filtered : FALLBACK_KARAOKE_SONGS);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      fetchSongs(initialQuery);
    } else {
      setResults(FALLBACK_KARAOKE_SONGS);
    }
  }, [initialQuery, fetchSongs]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(newQuery.trim())}`);
    } else {
      router.push("/search");
      setResults(FALLBACK_KARAOKE_SONGS);
      setHasSearched(false);
    }
  };

  const handleLoadMore = () => {
    if (nextPageToken && !isLoading) {
      fetchSongs(query, nextPageToken);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-4">
      {/* Search Header */}
      <div className="flex flex-col items-center text-center gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground">
          Find Karaoke Tracks
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Filtered to verified instrumentals and lyrics. High-pitch, pop, rock, or classics.
        </p>
        <SearchBar initialQuery={query} onSearch={handleSearch} autoFocus={!initialQuery} />
      </div>

      {/* Quota Resting Notice */}
      {isRestingQuota && (
        <div className="glass-panel-glow border-highlight-amber/40 rounded-2xl p-4 flex items-center gap-3 text-highlight-amber max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs sm:text-sm">
            YouTube Search API is resting for the day. Serving cached & curated popular tracks!
          </p>
        </div>
      )}

      {/* Search Results / Curated List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary-soft" />
            <h2 className="text-lg sm:text-xl font-bold font-display text-foreground">
              {hasSearched ? `Results for "${query}"` : "Popular & Trending Tracks"}
            </h2>
          </div>
          <Badge variant="cyan" className="text-xs font-medium">
            {results.length} songs
          </Badge>
        </div>

        {isLoading && results.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Searching for backing tracks...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="min-h-[30vh] glass-panel rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3">
            <p className="text-muted-foreground text-sm">
              No karaoke tracks found for &ldquo;{query}&rdquo;. Try another song or artist name.
            </p>
            <Button variant="outline" size="sm" onClick={() => handleSearch("")}>
              Browse Popular Picks
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onAddToRoomQueue={() => router.push(`/rooms?addVideo=${video.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {nextPageToken && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={handleLoadMore}
              isLoading={isLoading}
              className="px-6 flex items-center gap-2"
            >
              <span>Load More Songs</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
