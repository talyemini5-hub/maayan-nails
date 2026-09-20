"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/admin/dashboard", label: "דשבורד" },
  { href: "/admin/appointments", label: "תורים" },
  { href: "/admin/calendar", label: "יומן" },
  { href: "/admin/services", label: "שירותים ומחירים" },
  { href: "/admin/gallery", label: "גלריה" },
  { href: "/admin/reviews", label: "ביקורות" },
  { href: "/admin/customers", label: "לקוחות" },
  { href: "/admin/stats", label: "סטטיסטיקות" },
  { href: "/admin/settings", label: "הגדרות" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-sm transition-colors whitespace-nowrap",
              isActive ? "bg-burgundy text-ivory" : "text-charcoal-soft hover:bg-cream"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
