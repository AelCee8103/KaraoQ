"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "neon";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-cyan/80 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:shadow-glow-lg hover:brightness-110",
      secondary:
        "bg-surface-raised border border-border text-foreground hover:bg-border/60 hover:text-white",
      outline:
        "border border-primary/40 text-primary-soft hover:bg-primary/10 hover:border-primary",
      ghost:
        "text-muted-foreground hover:text-foreground hover:bg-surface-raised/80",
      danger:
        "bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 hover:border-danger",
      neon:
        "bg-surface-raised border border-accent-cyan/50 text-accent-cyan shadow-glow-cyan hover:bg-accent-cyan/10",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs h-8 min-h-[32px]",
      md: "px-4 py-2 text-sm h-10 min-h-[40px]",
      lg: "px-6 py-3 text-base h-12 min-h-[48px]",
      icon: "w-10 h-10 p-2 min-h-[40px] min-w-[40px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
