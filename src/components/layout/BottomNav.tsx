"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Music2, Users, Library, User } from "lucide-react";
import clsx from "clsx";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Search", href: "/search", icon: Search },
    { label: "Solo", href: "/watch", icon: Music2 },
    { label: "Rooms", href: "/rooms", icon: Users },
    { label: "Library", href: "/library", icon: Library },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel-glow border-t border-border/80 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all duration-150",
                isActive
                  ? "text-primary-soft font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-primary stroke-[2.5]" : "")} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
