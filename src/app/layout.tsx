import type { Metadata, Viewport } from "next";
import { Heebo, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maayan Nails | בניית ציפורניים ולק ג׳ל באופקים",
    template: "%s | Maayan Nails",
  },
  description:
    "סטודיו לציפורניים באופקים - בניית ציפורניים, לק ג׳ל, מניקור ופדיקור. קביעת תור אונליין בקלות. הכרמים 104, אופקים.",
  applicationName: "Maayan Nails",
  keywords: ["ציפורניים אופקים", "מניקור אופקים", "לק ג׳ל", "בניית ציפורניים", "פדיקור אופקים", "Maayan Nails"],
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "Maayan Nails",
    title: "Maayan Nails | סטודיו לציפורניים באופקים",
    description: "הציפורניים שלך, בדיוק כמו שאת אוהבת. קביעת תור אונליין למניקור, פדיקור ובניית ציפורניים.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Maayan Nails | סטודיו לציפורניים באופקים",
    description: "הציפורניים שלך, בדיוק כמו שאת אוהבת.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
