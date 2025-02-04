import "./globals.scss";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LoadingProvider } from "../context/LoadingContext";
import Loader from "./components/Loader";
import LoaderWrapper from "./components/LoaderWrapper";
export const metadata = {
  title: "Mordor Walk",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com"/>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <StravaRedirectHandler />

      <body>
        <LoadingProvider>
          <Header />
          <AuthGuard>{children}</AuthGuard>
          <Footer />
          <LoaderWrapper /> {/* This will show the loader globally */}
        </LoadingProvider>
      </body>
    </html>
  );
}
