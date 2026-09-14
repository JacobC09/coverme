"use client";

import Link from "next/link";
import { CalendarDays, UsersRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const items = [
  { href: "/", label: "Shifts", icon: CalendarDays },
  { href: "/communities", label: "Communities", icon: UsersRound },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const item of items) router.prefetch(item.href);
  }, [router]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-background/95 px-4 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-bold ${
                active ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-950"
              }`}
              href={item.href}
              key={item.href}
              onFocus={() => router.prefetch(item.href)}
              onPointerEnter={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              prefetch
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
