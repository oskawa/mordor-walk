import "./globals.css";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
import Link from "next/link";
export const metadata = {
  title: "Mordor Walk",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <StravaRedirectHandler />

      <body>
        <header className="header">
          <Link href="/">
            <h1>Mordor Walk</h1>
          </Link>
        </header>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
