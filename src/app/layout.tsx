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
