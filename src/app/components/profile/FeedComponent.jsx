import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useLoading } from "../../../context/LoadingContext";
import styles from "./feedprofile.module.scss";
import DestinationsProgress from "./ProgressComponent";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

// Emojis autorisés pour les réactions
const ALLOWED_EMOJIS = ["🔥", "💪", "👏", "⚡", "🎯", "🏃‍♂️", "🌟", "🚀"];

export default function FeedProfile({
  targetUserId = null, // ID de l'utilisateur à afficher (null = utilisateur actuel)
  targetUsername = null, // Username de l'utilisateur
  isOwnProfile = true, // Est-ce son propre profil ?
  profileData = null, // Données du profil déjà chargées (optionnel)
  showUserInfo = true, // Afficher les infos utilisateur en en-tête
}) {
  const { user, token } = useAuth();
  const { setLoading } = useLoading();

  const [activities, setActivities] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingReaction, setLoadingReaction] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalStats, setTotalStats] = useState(null);
  const [userProgress, setUserProgress] = useState([]);

  // ================== UTILITAIRE CONVERSION DATE ==================
  const formatDateForAPI = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("❌ Erreur conversion date:", error);
      return "";
    }
  };

  // ================== CHARGEMENT DES DONNÉES ==================
  const loadUserData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      if (profileData) {
        // ✅ Cas 1: Données déjà fournies
        setUserInfo(profileData);
        setActivities(profileData.activities?.activities || []);
        setTotalStats(profileData.activities?.stats || null);
        setUserProgress(profileData.user_progress || []); // ← Ajouter ça
        // Charger les réactions si ce n'est pas son propre profil
        if (!isOwnProfile && profileData.activities?.activities?.length > 0) {
          await loadReactionsForActivities(profileData.activities.activities);
        }
      } else {
        // ✅ Cas 2: Charger les données via API
        let response;

        if (isOwnProfile) {
          response = await axios.get(
            `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { userId: user?.id },
            }
          );
        } else {
          response = await axios.get(
            `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/getUserByUsername`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { username: targetUsername },
            }
          );
        }

        setUserInfo(response.data);
        setActivities(response.data.activities?.activities || []);
        setTotalStats(response.data.activities?.stats || null);
        setUserProgress(response.data.user_progress || []); // ← Ajouter ça
        // Charger les réactions si ce n'est pas son propre profil
        if (!isOwnProfile && response.data.activities?.activities?.length > 0) {
          await loadReactionsForActivities(response.data.activities.activities);
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement données utilisateur:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================== CHARGEMENT DES RÉACTIONS ==================
  const loadReactionsForActivities = async (activitiesList = activities) => {
    if (!activitiesList.length || isOwnProfile) {
      console.log("❌ Conditions not met:", {
        activitiesLength: activitiesList.length,
        isOwnProfile,
      });
      return;
    }

    try {
      const activitiesToProcess = activitiesList.slice(0, 50); // Limiter à 10
      const activityDates = activitiesToProcess
        .map((activity) => formatDateForAPI(activity.start_date))
        .filter((date) => date); // Filtrer les dates invalides

      if (activityDates.length === 0) {
        console.log("❌ Aucune date valide trouvée");
        return;
      }

      // ✅ UNE SEULE requête pour toutes les réactions !
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/getBulk`,
        {
          target_user_id: targetUserId,
          activity_dates: activityDates,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 secondes timeout
        }
      );

      // Mapper les résultats aux activités
      const updatedActivities = activitiesToProcess.map((activity) => {
        const formattedDate = formatDateForAPI(activity.start_date);
        const activityReactions = response.data[formattedDate] || [];

        return {
          ...activity,
          reactions: activityReactions,
          user_reacted: getUserReactionFromList(activityReactions),
        };
      });

      setActivities(updatedActivities);
    } catch (error) {
      console.error("❌ Erreur chargement réactions bulk:", error);
    }
  };

  const getUserReactionFromList = (reactions) => {
    for (const reaction of reactions) {
      if (reaction.users.some((u) => u.user_id === user?.id)) {
        return reaction.emoji;
      }
    }
    return null;
  };

  // ================== SYSTÈME DE RÉACTIONS ==================
  const addReaction = async (activityDate, emoji) => {
    if (isOwnProfile) return; // Pas de réactions sur ses propres activités

    const reactionKey = `${targetUserId}_${activityDate}`;
    setLoadingReaction(reactionKey);

    try {
      const formattedDate = formatDateForAPI(activityDate);
      if (!formattedDate) throw new Error("Format de date invalide");

      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/add`,
        {
          target_user_id: targetUserId,
          activity_date: formattedDate,
          emoji: emoji,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour localement
      updateActivityReaction(activityDate, emoji);
    } catch (error) {
      console.error("❌ Erreur ajout réaction:", error);
    } finally {
      setLoadingReaction(null);
    }
  };

  const removeReaction = async (activityDate) => {
    if (isOwnProfile) return;

    const reactionKey = `${targetUserId}_${activityDate}`;
    setLoadingReaction(reactionKey);

    try {
      const formattedDate = formatDateForAPI(activityDate);
      if (!formattedDate) throw new Error("Format de date invalide");

      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/remove`,
        {
          target_user_id: targetUserId,
          activity_date: formattedDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour localement
      updateActivityReaction(activityDate, null);
    } catch (error) {
      console.error("❌ Erreur suppression réaction:", error);
    } finally {
      setLoadingReaction(null);
    }
  };

  const updateActivityReaction = (activityDate, newEmoji) => {
    setActivities((prevActivities) =>
      prevActivities.map((activity) => {
        if (activity.start_date === activityDate) {
          let updatedReactions = [...(activity.reactions || [])];

          // Supprimer l'ancienne réaction de l'utilisateur
          updatedReactions = updatedReactions
            .map((reaction) => ({
              ...reaction,
              users: reaction.users.filter((u) => u.user_id !== user?.id),
              count: reaction.users.filter((u) => u.user_id !== user?.id)
                .length,
            }))
            .filter((reaction) => reaction.count > 0);

          // Ajouter la nouvelle réaction si elle existe
          if (newEmoji) {
            const existingReaction = updatedReactions.find(
              (r) => r.emoji === newEmoji
            );
            if (existingReaction) {
              existingReaction.users.push({ user_id: user?.id });
              existingReaction.count++;
            } else {
              updatedReactions.push({
                emoji: newEmoji,
                count: 1,
                users: [{ user_id: user?.id }],
              });
            }
          }

          return {
            ...activity,
            reactions: updatedReactions,
            user_reacted: newEmoji,
          };
        }
        return activity;
      })
    );
  };

  // ================== COMPOSANT RÉACTIONS ==================
  const ActivityReactionBar = ({ activity }) => {
    if (isOwnProfile) return null; // Pas de réactions sur ses propres activités

    const reactionKey = `${targetUserId}_${activity.start_date}`;
    const isLoading = loadingReaction === reactionKey;
    const totalReactions = (activity.reactions || []).reduce(
      (sum, r) => sum + r.count,
      0
    );

    return (
      <div
        style={{
          marginTop: "10px",
          padding: "8px",
          background: "rgba(0,0,0,0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Réactions existantes */}

        {activity.reactions && activity.reactions.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginBottom: "8px",
            }}
          >
            {activity.reactions.map((reaction, index) => (
              <span
                key={index}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  width: "auto",
                  border:
                    reaction.emoji === activity.user_reacted
                      ? "2px solid #00c8a0"
                      : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {reaction.emoji} {reaction.count}
              </span>
            ))}
          </div>
        )}

        {/* Boutons d'ajout de réactions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          {ALLOWED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                if (activity.user_reacted === emoji) {
                  removeReaction(activity.start_date);
                } else {
                  addReaction(activity.start_date, emoji);
                }
              }}
              disabled={isLoading}
              style={{
                background:
                  activity.user_reacted === emoji
                    ? "#00c8a0"
                    : "rgba(255,255,255,0.1)",
                border: "none",
                padding: "5px 8px",
                borderRadius: "12px",
                fontSize: "14px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.2s ease",
                width: "auto",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {totalReactions > 0 && (
          <div
            style={{
              marginTop: "6px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {totalReactions} réaction(s)
          </div>
        )}
      </div>
    );
  };

  // ================== FORMATAGE DES DONNÉES ==================
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ================== CHARGEMENT INITIAL ==================
  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token, targetUserId, targetUsername, isOwnProfile]);

  if (!userInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>Chargement...</div>
    );
  }

  return (
    <div className={styles.feedProfile}>
      {/* En-tête utilisateur */}
      {showUserInfo && (
        <div className={styles.userHeader}>
          {/* Statistiques */}
          {totalStats && (
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {totalStats?.total_distance_km?.toFixed(1) || 0} km
                </span>
                <span className={styles.statLabel}>Cette année</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {totalStats.total_activities || 0}
                </span>
                <span className={styles.statLabel}>Activités</span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className={styles.activitiesList}>
        <h3>Les parcours</h3>
        {userProgress ? (
          userProgress.length > 0 ? (
            <DestinationsProgress
              userProgress={userProgress}
              showTitle={!showUserInfo}
            />
          ) : (
            <div className={styles.noDestinations}>
              <p>Aucun parcours configuré</p>
            </div>
          )
        ) : null}
      </div>

      {/* Liste des activités */}
      <div className={styles.activitiesList}>
        <h3>Activités récentes</h3>

        {activities.length === 0 ? (
          <div className={styles.noActivities}>
            <p>Aucune activité trouvée</p>
            {isOwnProfile && (
              <p>Connectez-vous à Strava pour voir vos activités ici !</p>
            )}
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={`${activity.start_date}_${index}`}
              className={styles.activityCard}
            >
              {/* En-tête de l'activité */}
              <div className={styles.activityHeader}>
                <div className={styles.activityInfo}>
                  <h4>{activity.name}</h4>
                  <p className={styles.activityDate}>
                    {formatDate(activity.start_date)}
                  </p>
                </div>
                <div className={styles.activityStats}>
                  <span className={styles.distance}>
                    {(activity.distance / 1000).toFixed(2)} km
                  </span>
                  <span className={styles.duration}>
                    {formatDuration(activity.duration)}
                  </span>
                </div>
              </div>

              {/* Barre de réactions */}
              <ActivityReactionBar activity={activity} />
            </div>
          ))
        )}

        {/* Bouton charger plus */}
        {hasMore && activities.length >= 10 && (
          <button
            className={styles.loadMore}
            onClick={() => {
              // Implémenter la pagination si nécessaire
              setPage((prev) => prev + 1);
            }}
          >
            Charger plus d'activités
          </button>
        )}
      </div>
    </div>
  );
}
