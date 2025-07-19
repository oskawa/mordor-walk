import { useState } from "react";
import styles from "./notificationcenter.module.scss";

interface Notification {
  id: string;
  type:
    | "reaction"
    | "trophy"
    | "group_invitation"
    | "friend_request"
    | "milestone";
  title: string;
  message: string;
  data?: any;
  created_at: string;
  is_read: boolean;
  icon: string;
  time_ago: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onClose: () => void;
  onRefresh: () => void;
}

export default function NotificationCenter({
  notifications,
  loading,
  onMarkAsRead,
  onClose,
  onRefresh,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.is_read;
    return true;
  });

  // Grouper par type pour l'affichage
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ================== GESTION DES ACTIONS ==================
  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue si pas déjà lu
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Actions selon le type
    switch (notification.type) {
      case "group_invitation":
        // Rediriger vers la page du groupe
        if (notification.data?.group_slug) {
          window.location.href = `/groups/${notification.data.group_slug}`;
        }
        break;

      case "friend_request":
        // Rediriger vers la page profil
        if (notification.data?.user_id) {
          window.location.href = `/profile/${notification.data.username}`;
        }
        break;

      case "reaction":
        // Rediriger vers son profil pour voir l'activité
        window.location.href = `/profile`;
        break;

      case "trophy":
      case "milestone":
        // Rediriger vers la page trophées/achievements
        window.location.href = `/profile?tab=trophies`;
        break;

      default:
        console.log("Action not implemented for type:", notification.type);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.is_read);
    for (const notif of unreadNotifs) {
      onMarkAsRead(notif.id);
    }
  };

  // ================== RENDU DES NOTIFICATIONS ==================
  const renderNotificationIcon = (notification: Notification) => {
    const iconMap = {
      reaction: "👍",
      trophy: "🏆",
      group_invitation: "👥",
      friend_request: "🤝",
      milestone: "🎯",
    };

    return (
      <div
        className={`${styles.notificationIcon} ${styles[notification.type]}`}
      >
        {notification.icon || iconMap[notification.type] || "📱"}
      </div>
    );
  };

  return (
    <div className={styles.notificationCenter}>
      <div className={styles.notificationHeader}>
        <div className={styles.headerLeft}>
          <h3>Notifications</h3>
          <span className={styles.unreadCount}>
            {unreadCount > 0 && `(${unreadCount})`}
          </span>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Fermer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.notificationFilters}>
        <button
          className={filter === "all" ? styles.active : ""}
          onClick={() => setFilter("all")}
        >
          Toutes ({notifications.length})
        </button>
        <button
          className={filter === "unread" ? styles.active : ""}
          onClick={() => setFilter("unread")}
        >
          Non lues ({unreadCount})
        </button>

        {unreadCount > 0 && (
          <button className={styles.markAllRead} onClick={markAllAsRead}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Liste des notifications */}
      <div className={styles.notificationList}>
        {loading && notifications.length === 0 ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Chargement...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <p>
              {filter === "unread"
                ? "Aucune notification non lue"
                : "Aucune notification"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${
                !notification.is_read ? styles.unread : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {renderNotificationIcon(notification)}

              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>
                  {notification.title}
                </div>
                <div className={styles.notificationMessage}>
                  {notification.message}
                </div>
                <div className={styles.notificationTime}>
                  {notification.time_ago}
                </div>
              </div>

              {!notification.is_read && (
                <div className={styles.unreadDot}></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
