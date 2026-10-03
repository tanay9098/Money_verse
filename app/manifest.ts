import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneyVerse",
    short_name: "MoneyVerse",
    description: "A fictional-coin game that helps children practice needs, wants, saving, and profit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8ef",
    theme_color: "#ffc857",
    lang: "en",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
