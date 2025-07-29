"use client";
import Image from "next/image";
import styles from "./home.module.scss";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PopUp from "./pwapopup";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import { NotificationManager } from "../utils/NotificationManager";
import * as useMilestones from "./hooks/useMilestones";
import { useRouter } from "next/navigation";
import NewComponent from "./components/NewComponent";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

// Types pour le feed simplifié (une activité par personne)
interface FriendActivity {
  user_id: number;
  name: string;
  username: string;
  profilePicture: string;
  latest_activity: {
    date: string;
    readable_date: string;
    time: string;
    distance_km: number;
    total_km: number;
    next_milestone: {
      km: number;
      content_citation: string;
      book: string;
      chapter: string;
      message: string;
      next_destination: string;
      img: string;
    } | null;
    progress_percentage: number;
    activity_id: string;
    can_react: boolean;
    reactions: Array<{
      emoji: string;
      count: number;
      users: Array<any>;
    }>;
  };
  is_current_user: boolean;
}

interface DashboardData {
  progression: {
    current_distance: number;
    total_objective: number;
    global_percentage: number;
    remaining_km: number;
    next_milestone: any;
    milestone_progress: number;
    weekly_average: number;
    current_streak: number;
    is_on_track: boolean;
  };
  trophies: {
    total: number;
    unlocked: number;
    completion_percentage: number;
    next_trophy: any;
  };
  active_events: Array<{
    id: number;
    title: string;
    target_km: number;
    days_remaining: number;
    is_participating: boolean;
    user_progress?: {
      user_km: number;
      progress_percentage: number;
    };
  }>;
  friends_activity: FriendActivity[];
  recent_reactions: Array<{
    reactor_name: string;
    emoji: string;
    time_ago: string;
  }>;
  groups: {
    total: number;
    pending_invitations: number;
    active_groups: Array<any>;
  };
  quick_stats: {
    current_streak: number;
    weekly_average: number;
    monthly_total: number;
    is_on_track: boolean;
    friends_count: number;
  };
}

// Emojis autorisés pour les réactions
const ALLOWED_EMOJIS = ["🔥", "💪", "👏", "⚡", "🎯", "🏃‍♂️", "🌟", "🚀"];

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState("login");
  const [loadingReaction, setLoadingReaction] = useState<string | null>(null);

  const { isAuthenticated, user, token, isLoading: authLoading } = useAuth();
  const { setLoading } = useLoading();

  const { newMilestoneUnlocked, updateUserDistance, closeMilestone } =
    useMilestones.useMilestones();

  const router = useRouter();

  // ================== UTILITAIRE CONVERSION DATE ==================
  const formatDateForAPI = (dateString: string): string => {
    try {
      // Convertir différents formats vers Y-m-d H:i:s
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        console.error("❌ Date invalide:", dateString);
        return "";
      }

      // Format attendu par l'API PHP: Y-m-d H:i:s
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      console.log("🔄 Date convertie:", dateString, "->", formatted);
      return formatted;
    } catch (error) {
      console.error("❌ Erreur conversion date:", error);
      return "";
    }
  };

  // ================== CHARGEMENT DES DONNÉES DASHBOARD ==================
  const loadDashboardData = async (showLoader = true) => {
    if (!token || !user?.id) return;

    if (showLoader) setLoading(true);
    setIsRefreshing(!showLoader);

    try {
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/dashboard/v1/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            destination_id: "default",
          },
        }
      );

      const data = response.data;
      console.log("📊 Dashboard data:", data);

      setDashboardData(data);
      setLastUpdated(new Date().toLocaleTimeString());

      // Mettre à jour le système de milestones existant
      if (data.progression?.current_distance) {
        updateUserDistance(data.progression.current_distance);
      }

      console.log("✅ Dashboard data loaded");
    } catch (error) {
      console.error("❌ Erreur dashboard:", error);
    } finally {
      if (showLoader) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ================== CHARGEMENT DES RÉACTIONS POUR UNE ACTIVITÉ ==================
  const loadActivityReactions = async (
    targetUserId: number,
    activityDate: string
  ) => {
    try {
      const formattedDate = formatDateForAPI(activityDate);
      if (!formattedDate) return [];

      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/getBulk`,
        {
          target_user_id: targetUserId,
          activity_dates: formattedDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 secondes timeout
        }
      );

      return response.data || [];
    } catch (error) {
      console.error("❌ Erreur chargement réactions:", error);
      return [];
    }
  };

  // ================== SYSTÈME DE RÉACTIONS ==================
  const addReaction = async (
    targetUserId: number,
    activityDate: string,
    emoji: string
  ) => {
    const reactionKey = `${targetUserId}_${activityDate}`;
    setLoadingReaction(reactionKey);

    try {
      const formattedDate = formatDateForAPI(activityDate);
      if (!formattedDate) {
        throw new Error("Format de date invalide");
      }

      console.log("🔄 Ajout réaction:", {
        target_user_id: targetUserId,
        activity_date: formattedDate,
        emoji: emoji,
      });

      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/add`,
        {
          target_user_id: targetUserId,
          activity_date: formattedDate,
          emoji: emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Réaction ajoutée:", response.data);

      // Recharger les données pour voir la nouvelle réaction
      await loadDashboardData(false);
    } catch (error) {
      console.error("❌ Erreur ajout réaction:", error);

      if (error.response?.data) {
        console.error("Détails erreur:", error.response.data);
      }
    } finally {
      setLoadingReaction(null);
    }
  };

  const removeReaction = async (targetUserId: number, activityDate: string) => {
    const reactionKey = `${targetUserId}_${activityDate}`;
    setLoadingReaction(reactionKey);

    try {
      const formattedDate = formatDateForAPI(activityDate);
      if (!formattedDate) {
        throw new Error("Format de date invalide");
      }

      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/reactions/v1/remove`,
        {
          target_user_id: targetUserId,
          activity_date: formattedDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Réaction supprimée");

      // Recharger les données
      await loadDashboardData(false);
    } catch (error) {
      console.error("❌ Erreur suppression réaction:", error);
    } finally {
      setLoadingReaction(null);
    }
  };

  // ================== COMPOSANT RÉACTIONS SIMPLIFIÉ ==================
  const ReactionBar = ({ friend }: { friend: FriendActivity }) => {
    const reactionKey = `${friend.user_id}_${friend.latest_activity.date}`;
    const isLoading = loadingReaction === reactionKey;
    const [reactions, setReactions] = useState(
      friend.latest_activity.reactions || []
    );
    const [userReaction, setUserReaction] = useState<string | null>(null);

    // Charger les réactions au montage
    useEffect(() => {
      if (friend.latest_activity.can_react) {
        loadActivityReactions(friend.user_id, friend.latest_activity.date).then(
          (loadedReactions) => {
            setReactions(loadedReactions);

            // Trouver si l'utilisateur actuel a déjà réagi
            const currentUserReaction = loadedReactions.find((r) =>
              r.users.some((u) => u.user_id === user?.id)
            );
            setUserReaction(
              currentUserReaction ? currentUserReaction.emoji : null
            );
          }
        );
      }
    }, [friend.user_id, friend.latest_activity.date]);

    if (!friend.latest_activity.can_react) {
      return null; // Pas de réactions sur ses propres activités
    }

    const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

    return (
      <div
        style={{
          marginTop: "10px",
          padding: "8px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px",
        }}
      >
        {/* Réactions existantes */}
        {reactions.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginBottom: "8px",
            }}
          >
            {reactions.map((reaction, index) => (
              <span
                key={index}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  border:
                    reaction.emoji === userReaction
                      ? "2px solid #00c8a0"
                      : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {reaction.emoji} {reaction.count}
              </span>
            ))}
          </div>
        )}

        {/* Boutons pour ajouter des réactions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {ALLOWED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                if (userReaction === emoji) {
                  removeReaction(friend.user_id, friend.latest_activity.date);
                  setUserReaction(null);
                } else {
                  addReaction(
                    friend.user_id,
                    friend.latest_activity.date,
                    emoji
                  );
                  setUserReaction(emoji);
                }
              }}
              disabled={isLoading}
              style={{
                background:
                  userReaction === emoji ? "#00c8a0" : "rgba(255,255,255,0.1)",
                border: "none",
                padding: "6px 10px",
                borderRadius: "16px",
                fontSize: "16px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Total des réactions */}
        {totalReactions > 0 && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {totalReactions} réaction(s)
          </div>
        )}
      </div>
    );
  };

  // ================== REFRESH MANUEL ==================
  const handleRefresh = async () => {
    try {
      // Refresh Strava data
      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/forceRefresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.log("⚠️ Force refresh not available");
    }

    await loadDashboardData(false);
  };

  // ================== NAVIGATION VERS PROFIL ==================
  const navigateToProfile = (userId, username) => {
    if (userId === user?.id) {
      // Rediriger vers son propre profil
      router.push("/profile");
    } else {
      // Rediriger vers le profil de l'utilisateur
      router.push(`/profile/${username}`);
    }
  };

  // ================== CHARGEMENT INITIAL ==================
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, token, user?.id]);

  // ================== AUTO-REFRESH ==================
  useEffect(() => {
    if (!dashboardData) return;

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [dashboardData]);

  // ================== NOTIFICATIONS PWA ==================
  useEffect(() => {
    if (isAuthenticated && user) {
      NotificationManager.getNotificationStatus().then((status) => {
        console.log("📊 Statut notifications:", status);
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker enregistré:", registration);
        })
        .catch((error) => {
          console.error("❌ Erreur Service Worker:", error);
        });
    }
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <div className={styles.home}>
          <div className={styles.heading}>
            <NewComponent />
            <h1>Mes Actus</h1>

            {dashboardData && (
              <>
                {dashboardData?.active_events &&
                  dashboardData.active_events.length > 0 && (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "15px",
                        background: "rgba(0, 200, 160, 0.1)",
                        borderRadius: "10px",
                      }}
                    >
                      <h3
                        style={{
                          color: "#00c8a0",
                          marginBottom: "10px",
                          fontSize: "16px",
                        }}
                      >
                        🎯 Événements en cours
                      </h3>
                      {dashboardData.active_events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          style={{ marginBottom: "10px", fontSize: "14px" }}
                        >
                          <strong>{event.title}</strong> - {event.target_km} km
                          <br />
                          <small>
                            Se termine dans {event.days_remaining} jour(s)
                          </small>
                          {event.is_participating && event.user_progress && (
                            <div style={{ marginTop: "5px" }}>
                              <div
                                style={{
                                  width: "100%",
                                  height: "4px",
                                  background: "rgba(255,255,255,0.2)",
                                  borderRadius: "2px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${event.user_progress.progress_percentage}%`,
                                    height: "100%",
                                    background: "#00c8a0",
                                  }}
                                />
                              </div>
                              <small>
                                {event.user_progress.user_km} /{" "}
                                {event.target_km} km
                              </small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Réactions récentes */}
                {dashboardData?.recent_reactions &&
                  dashboardData.recent_reactions.length > 0 && (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "10px",
                        background: "rgba(255, 215, 0, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <h4
                        style={{
                          color: "#FFD700",
                          marginBottom: "8px",
                          fontSize: "14px",
                        }}
                      >
                        👍 Réactions récentes
                      </h4>
                      {dashboardData.recent_reactions
                        .slice(0, 3)
                        .map((reaction, index) => (
                          <div
                            key={index}
                            style={{ fontSize: "12px", marginBottom: "4px" }}
                          >
                            {reaction.emoji}{" "}
                            <strong>{reaction.reactor_name}</strong> •{" "}
                            {reaction.time_ago}
                          </div>
                        ))}
                    </div>
                  )}

                {/* Feed des amis - Une activité par personne */}
                {dashboardData?.friends_activity?.map((friend) => (
                  <div className={styles.feed} key={friend.user_id}>
                    <div className={styles.feedHeading}>
                      <div className={styles.feedHeadingName}>
                        <img
                          src={friend.profilePicture || "/profile.svg"}
                          alt={friend.name}
                          onClick={() =>
                            navigateToProfile(friend.user_id, friend.username)
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <p
                          className={styles.name}
                          onClick={() =>
                            navigateToProfile(friend.user_id, friend.username)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {friend.name}
                        </p>
                        {friend.is_current_user && (
                          <span
                            style={{
                              fontSize: "10px",
                              background: "#00c8a0",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              marginLeft: "5px",
                            }}
                          >
                            Vous
                          </span>
                        )}
                      </div>
                      <hr />
                      <p className={styles.date}>
                        {friend.latest_activity?.readable_date}
                      </p>
                    </div>

                    <div className={styles.feedActivity}>
                      <div className={styles.feedActivityDistance}>
                        <p>Distance</p>
                        <p className={styles.feedActivityBold}>
                          {friend.latest_activity?.distance_km} km
                        </p>
                      </div>
                      <div className={styles.feedActivityDistance}>
                        <p>Temps</p>
                        <p className={styles.feedActivityBold}>
                          {friend.latest_activity?.time || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Image et progression milestone */}
                    {friend.latest_activity?.next_milestone && (
                      <>
                        <div
                          className={styles.feedInner}
                          style={{
                            backgroundImage: `url(${friend.latest_activity.next_milestone.img})`,
                          }}
                        ></div>
                        <div className={styles.feedInner__percentageInner}>
                          <div
                            className={styles.feedInner__Percentage}
                            style={{
                              width: `${friend.latest_activity.progress_percentage}%`,
                            }}
                          ></div>
                        </div>
                        <p>{friend.latest_activity.next_milestone.message}</p>
                        <div className={styles.feedInner__next}>
                          <p>
                            Prochaine destination :{" "}
                            {
                              friend.latest_activity.next_milestone
                                .next_destination
                            }{" "}
                            (
                            {friend.latest_activity.next_milestone.km &&
                            friend.latest_activity.total_km
                              ? Math.floor(
                                  friend.latest_activity.next_milestone.km -
                                    friend.latest_activity.total_km
                                )
                              : "?"}{" "}
                            km restants)
                          </p>
                        </div>
                      </>
                    )}

                    {/* Barre de réactions */}
                    <ReactionBar friend={friend} />
                  </div>
                ))}

                {/* Message si pas d'amis */}
                {dashboardData &&
                  dashboardData.friends_activity?.length === 0 && (
                    <div
                      className={styles.alone}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      <p>Aucune activité récente trouvée.</p>
                      <p style={{ fontSize: "14px", marginTop: "10px" }}>
                        Connectez-vous à Strava ou à Google Fit et ajoutez des
                        amis pour voir leurs activités ici !
                      </p>
                      <Link
                        className={styles.btnConnect}
                        href="/profile?activeMenu=stravaedit"
                      >
                        Me connecter
                      </Link>
                    </div>
                  )}
              </>
            )}

            {/* Statistiques détaillées */}
            {/* {dashboardData && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "10px",
                }}
              >
                <h4 style={{ color: "#00c8a0", marginBottom: "10px" }}>
                  📈 Vos statistiques
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <strong>Progression annuelle:</strong>
                    <br />
                    {dashboardData.progression.current_distance} /{" "}
                    {dashboardData.progression.total_objective} km (
                    {dashboardData.progression.global_percentage.toFixed(1)}%)
                  </div>
                  <div>
                    <strong>Moyenne hebdo:</strong>
                    <br />
                    {dashboardData.quick_stats.weekly_average.toFixed(1)} km
                  </div>
                  <div>
                    <strong>Ce mois:</strong>
                    <br />
                    {dashboardData.quick_stats.monthly_total} km
                  </div>
                  <div>
                    <strong>Trophées:</strong>
                    <br />
                    {dashboardData.trophies.unlocked} /{" "}
                    {dashboardData.trophies.total}
                  </div>
                </div>

                {dashboardData.progression.is_on_track ? (
                  <p
                    style={{
                      color: "#4CAF50",
                      marginTop: "10px",
                      fontSize: "12px",
                    }}
                  >
                    ✅ Vous êtes dans les temps pour finir l'année !
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#FF9800",
                      marginTop: "10px",
                      fontSize: "12px",
                    }}
                  >
                    ⚠️ Un petit effort pour rattraper le planning !
                  </p>
                )}
              </div>
            )} */}
          </div>
        </div>
      ) : (
        // Vue non connectée - Formulaires de connexion/inscription
        <div className={styles.homeForm}>
          <div className={styles.formInner}>
            <div className={styles.formInner__title}>
              <img src="./logo.svg" alt="" />
            </div>
            <div className={styles.form}>
              {activeMenu === "login" && (
                <LoginForm setActiveMenu={setActiveMenu} />
              )}
              {activeMenu === "register" && (
                <RegisterForm setActiveMenu={setActiveMenu} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
