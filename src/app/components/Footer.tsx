"use client";
import Link from "next/link";
import styles from "./footer.module.scss";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const [userId, setUserid] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      setUserid(userId);
      setToken(token);
    }
  }, []);
  if (!token || !userId) {
    return;
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
    </footer>
  );
}
