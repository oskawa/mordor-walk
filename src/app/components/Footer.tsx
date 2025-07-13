"use client";
import Link from "next/link";
import styles from "./footer.module.scss";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Ne pas afficher le footer si pas authentifié
  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <Link href="/" className={pathname === "/" ? styles.active : ""}>
        <img src="./footer/home.svg" alt="" />
        <span>Accueil</span>
      </Link>
      <Link href="/map" className={pathname === "/map" ? styles.active : ""}>
        <img src="./footer/map.svg" alt="" />
        <span>Ma carte</span>
      </Link>
      <Link
        href="/trophees"
        className={pathname === "/trophees" ? styles.active : ""}
      >
        <img src="./footer/cup.svg" alt="" />
        <span>Mes trophées</span>
      </Link>
      <Link
        href="/groups"
        className={pathname === "/groups" ? styles.active : ""}
      >
        <img src="./footer/cup.svg" alt="" />
        <span>Mes groupes</span>
      </Link>
    </footer>
  );
}