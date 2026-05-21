"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Sprout, UserRound } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/plants", label: "식물", icon: Sprout },
  { href: "/mypage", label: "마이", icon: UserRound }
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-100/80 bg-white/90 px-4 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(35,55,40,0.06)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              className={clsx(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.72rem] font-medium transition",
                active ? "bg-leaf-50 text-leaf-700" : "text-neutral-500 hover:bg-neutral-50"
              )}
              href={tab.href}
              key={tab.href}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
