import "./globals.css";
import StravaRedirectHandler from "./components/StravaRedirectHandler";
import AuthGuard from "./authguard";
export const metadata = {
  title: "Mordor Walk",
  description: "Allez vous réussir à aller jusqu'au Mordor cette année ?",
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="fr">
      <StravaRedirectHandler />

      <body><AuthGuard>{children}</AuthGuard></body>
    </html>
  );
}
