"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">
          Something went off-key
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {error.message || "An unexpected error occurred while processing playback or data."}
        </p>
      </div>
      <Button variant="primary" onClick={() => reset()} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </Button>
    </div>
  );
}
