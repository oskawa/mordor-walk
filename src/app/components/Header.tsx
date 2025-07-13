"use client";
import Link from "next/link";
import styles from "./header.module.scss";
import PopUp from "../pwapopup";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Header() {
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) return;

    // Si on a déjà la photo dans user, l'utiliser
    if (user.picture) {
      setProfilePicture(user.picture);
      return;
    }

    // Sinon, la récupérer depuis l'API
    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: user.id,
          },
        }
      )
      .then((response) => {
        if (response.data.picture) {
          setProfilePicture(response.data.picture);
          // Mettre à jour le user dans le context
          updateUser({ picture: response.data.picture });
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [isAuthenticated, token, user]);

  // Ne pas afficher le header si pas authentifié
  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/">
          <img src="./logo.svg" alt="" />
        </Link>
      </div>
      <div className={styles.headerRight}>
        <PopUp />
        <Link href="/profile">
          <div className={styles.headerRight__img}>
            <img src={profilePicture || "./header/profile.svg"} alt="" />
          </div>
        </Link>
      </div>
    </header>
  );
}
