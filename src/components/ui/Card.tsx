import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow, children, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-2xl border transition-all duration-200",
          glow ? "glass-panel-glow" : "glass-panel",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
