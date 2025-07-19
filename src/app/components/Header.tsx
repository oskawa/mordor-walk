"use client";
import Link from "next/link";
import styles from "./header.module.scss";
import InstallPrompt from "../pwapopup";
import NotificationCenter from "./header/NotificationCenter";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Header() {
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState("");

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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

  const loadNotifications = async () => {
    if (!token || loadingNotifications) return;

    setLoadingNotifications(true);
    try {
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/dashboard/v1/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            limit: 20,
          },
        }
      );

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error("❌ Erreur chargement notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // ================== MARQUER COMME LUE ==================
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/dashboard/v1/notifications/read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Mettre à jour localement
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );

      // Décrémenter le compteur
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("❌ Erreur marquage notification:", error);
    }
  };

  // ================== TOGGLE CENTRE DE NOTIFICATIONS ==================
  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications(); // Charger les notifications à l'ouverture
    }
    setShowNotifications(!showNotifications);
  };

  // ================== CHARGEMENT INITIAL COMPTEUR ==================
  useEffect(() => {
    if (isAuthenticated && token) {
      // Charger seulement le compteur au début
      loadNotifications();

      // Actualiser le compteur toutes les 2 minutes
      const interval = setInterval(() => {
        loadNotifications();
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // ================== FERMER AU CLIC EXTÉRIEUR ==================
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       showNotifications &&
  //       !event.target.closest(`.${styles.notificationContainer}`)
  //     ) {
  //       setShowNotifications(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [showNotifications]);

  // Ne pas afficher le header si pas authentifié
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/">
            <img src="./logo.svg" alt="" />
          </Link>
        </div>
        <div className={styles.headerRight}>
          <div
            className={`${styles.notificationContainer} ${
              showNotifications ? styles.active : ""
            }`}
          >
            <button
              className={styles.notificationButton}
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <svg
                width="20"
                height="24"
                viewBox="0 0 20 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.25 18.5V19.3125C13.25 20.1745 12.9076 21.0011 12.2981 21.6106C11.6886 22.2201 10.862 22.5625 10 22.5625C9.13805 22.5625 8.3114 22.2201 7.70191 21.6106C7.09242 21.0011 6.75001 20.1745 6.75001 19.3125V18.5M18.7181 16.8461C17.4141 15.25 16.4934 14.4375 16.4934 10.0373C16.4934 6.00781 14.4357 4.57223 12.7422 3.875C12.5172 3.78258 12.3055 3.57031 12.2369 3.33926C11.9399 2.3282 11.107 1.4375 10 1.4375C8.89298 1.4375 8.05966 2.32871 7.76563 3.34027C7.69708 3.57387 7.48532 3.78258 7.26036 3.875C5.56477 4.57324 3.50915 6.00375 3.50915 10.0373C3.50661 14.4375 2.58594 15.25 1.28188 16.8461C0.741569 17.5072 1.21485 18.5 2.15989 18.5H17.8452C18.7852 18.5 19.2554 17.5042 18.7181 16.8461Z"
                  stroke="white"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              {/* Badge compteur */}
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Centre de notifications */}
          </div>
          <InstallPrompt />
          <Link href="/profile">
            <div className={styles.headerRight__img}>
              <img src={profilePicture || "./header/profile.svg"} alt="" />
            </div>
          </Link>
        </div>
      </header>
      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          loading={loadingNotifications}
          onMarkAsRead={markAsRead}
          onClose={() => setShowNotifications(false)}
          onRefresh={loadNotifications}
        />
      )}
    </>
  );
}
