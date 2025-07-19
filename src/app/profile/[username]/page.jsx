"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import OverviewComponent from "../../components/profile/OverviewComponent";
import FeedProfile from "../../components/profile/FeedComponent";

import { useLoading } from "../../../context/LoadingContext";
import { useAuth } from "../../../context/AuthContext";

import styles from "../profile.module.scss";
import Link from "next/link";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

const Profile = () => {
  const { username } = useParams(); // Récupère le username depuis l'URL
  const router = useRouter();
  const { user, token } = useAuth();

  const [activeMenu, setActiveMenu] = useState("activities");

  const [profile, setProfile] = useState(null);
  const [popupType, setPopupType] = useState(null);
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isLoadingFriendship, setIsLoadingFriendship] = useState(false);

  const { setLoading } = useLoading();

  // Déterminer si c'est son propre profil ou celui d'un autre

  useEffect(() => {
    setLoading(true);

    const fetchProfile = async () => {
      try {
        let response;

        // Charger le profil d'un autre utilisateur
        response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/getUserByUsername`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              username: username,
            },
          }
        );

        setProfile(response.data);
        setIsFriend(response.data.is_friend);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching profile:", error);

        // Si l'utilisateur n'existe pas, rediriger
        if (error.response?.status === 404) {
          router.push("/profile");
        }
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [username, user?.id, token]);

  // ================== GESTION DES AMIS ==================
  const handleAddFriend = async () => {
    if (!profile?.id) return;

    setIsLoadingFriendship(true);
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/addFriend`,
        {
          userId: user?.id,
          friendId: profile.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setIsFriend(true);
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setIsLoadingFriendship(false);
    }
  };

  const handleRemoveFriendProfile = async () => {
    if (!profile?.id) return;

    setIsLoadingFriendship(true);
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/removeFriend`,
        {
          userId: user?.id,
          friendId: profile.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setIsFriend(false);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setIsLoadingFriendship(false);
    }
  };

  // ================== FONCTIONS EXISTANTES (INCHANGÉES) ==================
  const handlePopup = (type) => {
    setPopupType(type);
    if (type == "followed") {
      handleFriends();
    }
    if (type == "followers") {
      handleFollowers();
    }
  };

  const handleRemoveFriend = async (friend_id) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/removeFriend`,
        {
          userId: user?.id,
          friendId: friend_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response) {
        setLoading(false);
        setFriends((prevFriends) =>
          prevFriends.filter((friend) => friend.id !== friend_id)
        );
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching friends:", error);
    }
  };

  const handleFriends = async () => {
    try {
      const targetUserId = isOwnProfile ? user?.id : profile?.id;
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: targetUserId,
          },
        }
      );
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleFollowers = async () => {
    try {
      const targetUserId = isOwnProfile ? user?.id : profile?.id;
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFollowers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: targetUserId,
          },
        }
      );
      setFollowers(response.data);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <>
      <div className={styles.profile}>
        <div className={styles.profileContent}>
          <div className={styles.profileEdit__first}>
            <div className={styles.profilePicture}>
              <img src={profile.picture || "../../profile.svg"} alt="Profile" />
            </div>

            <div className={styles.profileDetails}>
              <h3>
                {profile.name} {profile.firstname}
              </h3>
              <p>@{profile.username}</p>
              <p>Membre depuis {profile.registration_date}</p>
              <p className={styles.followers}>
                <button onClick={() => handlePopup("followed")}>
                  {profile.friends_count} suivi(s)
                </button>
                |
                <button onClick={() => handlePopup("followers")}>
                  {profile.followers_count} le suive(nt)
                </button>
              </p>

              {/* Bouton d'amitié pour les autres profils */}
              {!isOwnProfile && (
                <div style={{ marginTop: "15px" }}>
                  {isFriend ? (
                    <button
                      onClick={handleRemoveFriendProfile}
                      disabled={isLoadingFriendship}
                      style={{
                        background: "#ff4444",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: isLoadingFriendship ? "not-allowed" : "pointer",
                        opacity: isLoadingFriendship ? 0.7 : 1,
                        width: "100%",
                      }}
                    >
                      {!isFriend ? "..." : "👥 Ne plus suivre"}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddFriend}
                      disabled={isFriend}
                      style={{
                        background: "#00c8a0",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: isFriend ? "not-allowed" : "pointer",
                        opacity: isFriend ? 0.7 : 1,
                        width: "100%",
                      }}
                    >
                      {isFriend ? "..." : "➕ Suivre"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {activeMenu === "activities" && (
            <FeedProfile
              targetUserId={profile.id}
              targetUsername={username}
              isOwnProfile={false}
              profileData={profile}
              showUserInfo={true}
            />
          )}
          {activeMenu === "overview" && <OverviewComponent />}
        </div>

        {/* Reste du code des popups inchangé */}
        {popupType && (
          <div className={styles.popup}>
            <div className={styles.popupInner}>
              {popupType == "followed" && (
                <h3>{profile.friends_count} suivi(s)</h3>
              )}
              {popupType == "followers" && (
                <h3>{profile.followers_count} le suivent</h3>
              )}
              <button
                className={styles.close}
                onClick={() => setPopupType(null)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 8L15 15M8 8L1 1M8 8L1 15M8 8L15 1"
                    stroke="#F7EBFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {popupType == "followed" && (
                <ul>
                  {friends &&
                    Object.values(friends).map((friend) => (
                      <li key={friend.id}>
                        <img src={friend.picture || "/profile.svg"} alt="" />
                        <div>
                          <p className={styles.username}>{friend.username}</p>
                          <p className={styles.distance}>
                            {Math.floor(friend.current_year_total)}km / 1400km
                          </p>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progress}
                              style={{
                                width: `${
                                  (friend.totalDistance / 1400) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        {isOwnProfile && (
                          <button
                            className={styles.remove}
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            <svg
                              width="21"
                              height="18"
                              viewBox="0 0 21 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M16.6369 6.02992L14.6617 7.77742L11.4964 4.96492L13.4715 3.21742C13.8007 2.92492 14.3494 2.92492 14.6617 3.21742L16.6369 4.97242C16.966 5.24992 16.966 5.73742 16.6369 6.02992ZM2.53223 12.9374L11.0237 5.38492L14.189 8.19742L5.69754 15.7499H2.53223V12.9374ZM14.0286 3.77992L12.7287 4.93492L14.7039 6.68992L16.0038 5.53492L14.0286 3.77992ZM12.9651 8.24992L10.9731 6.47992L3.37631 13.2449V14.9999H5.35146L12.9651 8.24992Z"
                                fill="#00C8A0"
                              />
                            </svg>
                            Retirer
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              )}
              {popupType == "followers" && (
                <ul>
                  {followers &&
                    Object.values(followers).map((friend) => (
                      <li key={friend.id}>
                        <img src={friend.picture || "/profile.svg"} alt="" />
                        <div>
                          <p className={styles.username}>{friend.username}</p>
                          <p className={styles.distance}>
                            {Math.floor(friend.current_year_total)}km / 1400km
                          </p>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progress}
                              style={{
                                width: `${
                                  (friend.current_year_total / 1400) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
