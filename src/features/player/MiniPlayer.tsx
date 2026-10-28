"use client";

import React, { useState } from "react";
import { Maximize2, X, Move } from "lucide-react";
import { motion } from "framer-motion";

export interface MiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MiniPlayer({ isOpen, onClose, onExpand, title, children }: MiniPlayerProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      drag
      dragConstraints={{ left: -300, right: 20, top: -400, bottom: 20 }}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-20 right-6 z-50 w-72 sm:w-80 glass-panel-glow rounded-2xl overflow-hidden shadow-2xl border border-primary/40 cursor-grab active:cursor-grabbing"
    >
      {/* Mini Player Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface/90 border-b border-border text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[180px]">
          <Move className="w-3.5 h-3.5 text-primary-soft flex-shrink-0" />
          <span className="truncate font-medium text-foreground">{title || "Now Playing"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onExpand}
            className="p-1 hover:text-primary-soft text-muted-foreground rounded transition-colors"
            title="Expand to Full TV View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-danger text-muted-foreground rounded transition-colors"
            title="Close Mini Player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Player Content Area */}
      <div className="aspect-video w-full bg-black">{children}</div>
    </motion.div>
  );
}
