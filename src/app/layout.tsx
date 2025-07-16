import "./globals.scss";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LoadingProvider } from "../context/LoadingContext";
import { AuthProvider } from "../context/AuthContext";
import Loader from "./components/Loader";
import LoaderWrapper from "./components/LoaderWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Application PWA",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mon App",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-152x152.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mon App" />

        {/* Icônes iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-180x180.png"
        />

        {/* Splash screens iOS (optionnel) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone5_splash.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />

        {/* Meta tags Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <StravaRedirectHandler />

      <body>
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
