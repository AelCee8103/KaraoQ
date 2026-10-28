import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "cyan" | "amber" | "success" | "danger" | "muted";
}

export function Badge({ className, variant = "primary", children, ...props }: BadgeProps) {
  const variants = {
    primary: "bg-primary/15 text-primary-soft border-primary/30",
    cyan: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30",
    amber: "bg-highlight-amber/15 text-highlight-amber border-highlight-amber/30",
    success: "bg-success/15 text-success border-success/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    muted: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
