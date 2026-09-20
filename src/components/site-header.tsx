"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/#services", label: "שירותים" },
  { href: "/#pricing", label: "מחירון" },
  { href: "/gallery", label: "גלריה" },
  { href: "/#about", label: "עלינו" },
  { href: "/#location", label: "מיקום" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur border-b border-nude/40">
      <Container className="flex h-16 sm:h-20 items-center justify-between">
        <Link href="/" className="font-brand text-xl sm:text-2xl tracking-widest text-charcoal">
          MAAYAN NAILS
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="ניווט ראשי">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-charcoal-soft hover:text-burgundy transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button href="/appointments/new" size="md">קביעת תור</Button>
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center size-11 -me-2 rounded-full hover:bg-cream"
          aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      {open && (
        <nav className="md:hidden border-t border-nude/40 bg-ivory" aria-label="ניווט נייד">
          <Container className="flex flex-col py-4 gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-charcoal-soft hover:text-burgundy border-b border-nude/20 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Button href="/appointments/new" size="lg" className="mt-4 w-full">
              קביעת תור
            </Button>
          </Container>
        </nav>
      )}
    </header>
  );
}
