import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <div className="flex items-end gap-1.5 h-10">
        <div className="w-2 bg-primary rounded-full animate-eq-1" />
        <div className="w-2 bg-primary-soft rounded-full animate-eq-2" />
        <div className="w-2 bg-accent rounded-full animate-eq-3" />
        <div className="w-2 bg-accent-cyan rounded-full animate-eq-1" />
        <div className="w-2 bg-primary rounded-full animate-eq-2" />
      </div>
      <p className="text-sm font-display font-medium text-muted-foreground animate-pulse">
        Tuning microphones...
      </p>
    </div>
  );
}
