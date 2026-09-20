import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maayan Nails | סטודיו לציפורניים באופקים",
    short_name: "Maayan Nails",
    description: "קביעת תורים למניקור, פדיקור ובניית ציפורניים אצל מעיין, אופקים.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f4",
    theme_color: "#fbf8f4",
    lang: "he",
    dir: "rtl",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "קביעת תור", url: "/appointments/new" },
      { name: "התורים שלי", url: "/my-appointments" },
    ],
  };
}
