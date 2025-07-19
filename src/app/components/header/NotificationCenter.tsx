import { useState } from "react";
import styles from "./notificationcenter.module.scss";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

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
  const [processingActions, setProcessingActions] = useState<Set<string>>(
    new Set()
  );
  const { user, token } = useAuth();

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.is_read;
    return true;
  });

  // Grouper par type pour l'affichage
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ================== GESTION DES ACTIONS ==================
  const handleNotificationClick = (
    notification: Notification,
    event: React.MouseEvent
  ) => {
    // Ne pas déclencher si on clique sur un bouton d'action
    const target = event.target as HTMLElement;
    if (target.closest(`.${styles.notificationActions}`)) {
      return;
    }

    // Marquer comme lue si pas déjà lu
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Actions selon le type
    switch (notification.type) {
      case "group_invitation":
        if (notification.data?.group_slug) {
          window.location.href = `/groups/${notification.data.group_slug}`;
        }
        break;

      case "friend_request":
        if (notification.data?.requester_username) {
          window.location.href = `/profile/${notification.data.requester_username}`;
        }
        break;

      case "reaction":
        window.location.href = `/profile`;
        break;

      case "trophy":
      case "milestone":
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

  // ================== ACTIONS SPÉCIFIQUES ==================
  const handleFriendRequest = async (
    notification: Notification,
    action: "accept" | "refuse"
  ) => {
    if (!user?.id || !notification.data?.requester_id) {
      console.error("Missing user ID or requester ID");
      return;
    }

    const actionKey = `${notification.id}_${action}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));
    let response;

    try {
      response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/respondToFriendRequest`,
        {
          userId: user?.id,
          requesterId: notification.data.requester_id,
          action: action,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Marquer la notification comme lue
        onMarkAsRead(notification.id);

        // Actualiser les notifications
        onRefresh();

        // Message de succès
        console.log(
          `Demande d'ami ${action === "accept" ? "acceptée" : "refusée"}`
        );
      } else {
        // ✅ VÉRIFIER SI C'EST DU JSON AVANT DE PARSER
        let errorMessage = `Erreur ${response.status}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
        } catch (parseError) {
          console.error("Erreur parsing response:", parseError);
        }

        console.error("Erreur:", errorMessage);
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    } finally {
      setProcessingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleGroupInvitation = async (
    notification: Notification,
    action: "accept" | "refuse"
  ) => {
    if (!user?.id || !notification.data?.group_id) {
      console.error("Missing user ID or group ID");
      return;
    }

    const actionKey = `${notification.id}_${action}`;
    setProcessingActions((prev) => new Set([...prev, actionKey]));

    try {
      const response = await fetch("/wp-json/profile/v1/respondToInvitation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_id: notification.data.group_id,
          action: action,
        }),
      });

      if (response.ok) {
        onMarkAsRead(notification.id);
        onRefresh();
        console.log(
          `Invitation de groupe ${action === "accept" ? "acceptée" : "refusée"}`
        );
      } else {
        // ✅ MÊME PROTECTION ICI
        let errorMessage = `Erreur ${response.status}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
        } catch (parseError) {
          console.error("Erreur parsing response:", parseError);
        }

        console.error("Erreur:", errorMessage);
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    } finally {
      setProcessingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  // ================== RENDU DES ACTIONS ==================
  const renderNotificationActions = (notification: Notification) => {
    const isProcessingAccept = processingActions.has(
      `${notification.id}_accept`
    );
    const isProcessingRefuse = processingActions.has(
      `${notification.id}_refuse`
    );
    const isProcessing = isProcessingAccept || isProcessingRefuse;

    switch (notification.type) {
      case "friend_request":
        return (
          <div className={styles.notificationActions}>
            <button
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={(e) => {
                e.stopPropagation();
                handleFriendRequest(notification, "accept");
              }}
              disabled={isProcessing}
              title="Accepter la demande d'ami"
            >
              {isProcessingAccept ? "⏳" : "✅"}
            </button>
            <button
              className={`${styles.actionButton} ${styles.refuseButton}`}
              onClick={(e) => {
                e.stopPropagation();
                handleFriendRequest(notification, "refuse");
              }}
              disabled={isProcessing}
              title="Refuser la demande d'ami"
            >
              {isProcessingRefuse ? "⏳" : "❌"}
            </button>
          </div>
        );

      case "group_invitation":
        return (
          <div className={styles.notificationActions}>
            <button
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={(e) => {
                e.stopPropagation();
                handleGroupInvitation(notification, "accept");
              }}
              disabled={isProcessing}
              title="Accepter l'invitation"
            >
              {isProcessingAccept ? "⏳" : "✅"}
            </button>
            <button
              className={`${styles.actionButton} ${styles.refuseButton}`}
              onClick={(e) => {
                e.stopPropagation();
                handleGroupInvitation(notification, "refuse");
              }}
              disabled={isProcessing}
              title="Refuser l'invitation"
            >
              {isProcessingRefuse ? "⏳" : "❌"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

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
              } ${
                notification.type === "friend_request" ||
                notification.type === "group_invitation"
                  ? styles.actionableNotification
                  : ""
              }`}
              onClick={(e) => handleNotificationClick(notification, e)}
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

              {/* Boutons d'action pour demandes d'ami et invitations */}
              {renderNotificationActions(notification)}

              {!notification.is_read && (
                <div className={styles.unreadDot}></div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.notificationPush}>
        <Link href="/profile?activeMenu=notifications">
          Pour gérer les notifications push, <span>cliquez ici.</span>
        </Link>
      </div>
    </div>
  );
}
