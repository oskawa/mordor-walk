import "./globals.scss";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
export const metadata = {
  title: "Mordor Walk",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <StravaRedirectHandler />

      <body>
        <Header />
        {/* <AuthGuard>{children}</AuthGuard> */}
        {children}
        <Footer />
      </body>
    </html>
  );
}
