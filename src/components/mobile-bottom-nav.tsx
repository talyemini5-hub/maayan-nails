"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarPlus, ListChecks, Images, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/appointments/new", label: "קביעת תור", icon: CalendarPlus },
  { href: "/my-appointments", label: "התורים שלי", icon: ListChecks },
  { href: "/gallery", label: "גלריה", icon: Images },
  { href: "/auth", label: "פרופיל", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ivory/95 backdrop-blur border-t border-nude/50 pb-[env(safe-area-inset-bottom)]"
      aria-label="ניווט תחתון"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[0.65rem]",
                  active ? "text-burgundy" : "text-charcoal-soft"
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
