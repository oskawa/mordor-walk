"use client";

import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import LoaderWrapper from "./components/LoaderWrapper";
export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Pages qui ne nécessitent pas d'authentification
  const publicRoutes = ["/"];

  if (isLoading) {
    // Afficher un loader pendant la vérification
    return <LoaderWrapper />;
  }
  console.log(isLoading)

  // Si on est sur une route publique, toujours afficher le contenu
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Si on n'est pas authentifié et qu'on est sur une route protégée,
  // ne rien afficher (la redirection se fait dans AuthContext)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
