import "./globals.scss";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LoadingProvider } from "../context/LoadingContext";
import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mordor Walk",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",

  // ✅ Configuration spécifique iOS (pas dans manifest)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mordor Walk",
  },

  // ✅ Les icônes sont gérées par manifest.ts
  // Plus besoin de les redéfinir ici !
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* ✅ Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />

        {/* ✅ PWA meta tags spécifiques (pas dans manifest) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mordor Walk" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#00C8A0" />
        <meta name="msapplication-TileColor" content="#00C8A0" />

        {/* ✅ Icônes Apple spécifiques (iOS a besoin de ces liens directs) */}
        <link rel="apple-touch-icon" href="/favicon/icon-180x180.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/favicon/icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/icon-180x180.png"
        />
      </head>

      <body>
        <StravaRedirectHandler />
        <AuthProvider>
          <LoadingProvider>
            <Header />
            <AuthGuard>{children}</AuthGuard>
            <Footer />
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
