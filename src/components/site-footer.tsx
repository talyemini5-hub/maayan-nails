import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { InstagramIcon } from "@/components/ui/icons";
import type { BusinessInfo } from "@/lib/data/business-settings";

export function SiteFooter({ business }: { business: BusinessInfo }) {
  return (
    <footer className="bg-charcoal text-ivory mt-24 pb-24 md:pb-10">
      <Container className="py-14 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-brand text-xl tracking-widest mb-3">MAAYAN NAILS</p>
          <p className="text-sm text-ivory/70 leading-relaxed">
            סטודיו לציפורניים באופקים. הציפורניים שלך, בדיוק כמו שאת אוהבת.
          </p>
        </div>
        <div className="text-sm space-y-2 text-ivory/80">
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden /> {business.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" aria-hidden /> {business.phone}
          </p>
          <a
            href={business.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-rose-gold w-fit"
          >
            <InstagramIcon className="size-4 shrink-0" /> maayan.nails.art@
          </a>
        </div>
        <nav className="text-sm space-y-2 text-ivory/80" aria-label="ניווט תחתון">
          <Link href="/appointments/new" className="block hover:text-rose-gold w-fit">קביעת תור</Link>
          <Link href="/my-appointments" className="block hover:text-rose-gold w-fit">התורים שלי</Link>
          <Link href="/gallery" className="block hover:text-rose-gold w-fit">גלריה</Link>
          <Link href="/admin" className="block hover:text-rose-gold w-fit text-ivory/40">כניסת מנהלת</Link>
        </nav>
      </Container>
      <Container>
        <p className="text-xs text-ivory/40 border-t border-ivory/10 pt-6">
          © {new Date().getFullYear()} Maayan Nails. כל הזכויות שמורות.
        </p>
      </Container>
    </footer>
  );
}
