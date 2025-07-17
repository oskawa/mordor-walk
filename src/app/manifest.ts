import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mordor Walk",
    short_name: "MordorWalk",
    description: "Seul ou entre amis, allez jusqu'au Mordor",
    start_url: "/",
    display: "standalone",
    background_color: "#00C8A0",
    theme_color: "#00C8A0",
    orientation: "portrait-primary",
    scope: "/",
    lang: "fr",
    dir: "ltr",
    categories: ["fitness", "lifestyle", "health"],

    // ✅ Icônes pour toutes les plateformes
    icons: [
      // Android
      {
        src: "/favicon/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      // Desktop (Windows/macOS)
      {
        src: "/favicon/favicon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      // Badge pour notifications
      {
        src: "/favicon/badge-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "badge",
      },
    ],

    // ✅ Screenshots pour stores
    screenshots: [
      {
        src: "/favicon/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
      },
      {
        src: "/favicon/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
      },
    ],

    // ✅ Raccourcis
    shortcuts: [
      {
        name: "Ma progression",
        short_name: "Progression",
        description: "Voir ma progression vers le Mordor",
        url: "/profile",
        icons: [
          {
            src: "/favicon/shortcut-progress.png",
            sizes: "96x96",
          },
        ],
      },
      {
        name: "Mes amis",
        short_name: "Amis",
        description: "Voir la progression de mes amis",
        url: "/friends",
        icons: [
          {
            src: "/favicon/shortcut-friends.png",
            sizes: "96x96",
          },
        ],
      },
    ],
  };
}
