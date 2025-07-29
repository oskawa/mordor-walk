"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FriendsComponent from "../components/profile/FriendsComponent";
import OverviewComponent from "../components/profile/OverviewComponent";
import StravaComponent from "../components/profile/StravaComponent";
import FitnessComponent from "../components/profile/FitnessComponent";
import NotificationSettings from "../components/profile/NotificationSettings";
import FeedProfile from "../components/profile/FeedComponent";
import { useSearchParams } from "next/navigation";
import { useLoading } from "../../context/LoadingContext";

import styles from "./profile.module.scss";
import Link from "next/link";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

const Profile = () => {
  // const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [activeMenu, setActiveMenu] = useState(
    searchParams.get("activeMenu") || "activities"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [popupType, setPopupType] = useState(null);
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);

  const { setLoading } = useLoading();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    if (stravaCallback) {
      setActiveMenu("stravaedit");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    // Fetch user profile on component mount
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/me`,
          {
            headers: {
              Authorization: `Bearer ${localToken}`,
            },
            params: {
              userId: localUserId,
            },
          }
        );
        setProfile(response.data);
        setLoading(false);
        // setFormData({
        //   profilePicture: response.data.profilePicture,
        //   name: response.data.name,
        //   firstname: response.data.firstname,
        // });
      } catch (error) {
        setLoading(false);
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

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
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/removeFriend`,
        {
          userId: localUserId,
          friendId: friend_id,
        },
        {
          headers: {
            Authorization: `Bearer ${localToken}`,
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
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    try {
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: {
            Authorization: `Bearer ${localToken}`,
          },
          params: {
            userId: localUserId,
          },
        }
      );
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleFollowers = async () => {
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    try {
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFollowers`,
        {
          headers: {
            Authorization: `Bearer ${localToken}`,
          },
          params: {
            userId: localUserId,
          },
        }
      );
      setFollowers(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <>
      <div className={styles.profile}>
        <nav>
          <ul>
            <li
              className={activeMenu == "activities" ? styles.active : ""}
              onClick={() => setActiveMenu("activities")}
            >
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16H5V11C5 10.7167 5.096 10.4793 5.288 10.288C5.48 10.0967 5.71733 10.0007 6 10H10C10.2833 10 10.521 10.096 10.713 10.288C10.905 10.48 11.0007 10.7173 11 11V16H14V7L8 2.5L2 7V16ZM0 16V7C0 6.68333 0.0709998 6.38333 0.213 6.1C0.355 5.81667 0.550667 5.58333 0.8 5.4L6.8 0.9C7.15 0.633333 7.55 0.5 8 0.5C8.45 0.5 8.85 0.633333 9.2 0.9L15.2 5.4C15.45 5.58333 15.646 5.81667 15.788 6.1C15.93 6.38333 16.0007 6.68333 16 7V16C16 16.55 15.804 17.021 15.412 17.413C15.02 17.805 14.5493 18.0007 14 18H10C9.71667 18 9.47933 17.904 9.288 17.712C9.09667 17.52 9.00067 17.2827 9 17V12H7V17C7 17.2833 6.904 17.521 6.712 17.713C6.52 17.905 6.28267 18.0007 6 18H2C1.45 18 0.979333 17.8043 0.588 17.413C0.196666 17.0217 0.000666667 16.5507 0 16Z"
                  fill="white"
                />
              </svg>
              Activités
            </li>
            <li
              onClick={() => setActiveMenu("stravaedit")}
              className={activeMenu === "stravaedit" ? `${styles.active}` : ""}
            >
              <svg
                width="14"
                height="12"
                viewBox="0 0 14 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 4V5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V9C4 9.53043 4.21071 10.0391 4.58579 10.4142C4.96086 10.7893 5.46957 11 6 11H11C11.5304 11 12.0391 10.7893 12.4142 10.4142C12.7893 10.0391 13 9.53043 13 9V7C13 6.64894 12.9076 6.30406 12.732 6.00003C12.5565 5.696 12.304 5.44353 12 5.268V4.17C13.165 4.582 14 5.693 14 6.999V8.999C14 9.79465 13.6839 10.5577 13.1213 11.1203C12.5587 11.6829 11.7956 11.999 11 11.999H6C5.20435 11.999 4.44129 11.6829 3.87868 11.1203C3.31607 10.5577 3 9.79465 3 8.999V7C3 6.20435 3.31607 5.44129 3.87868 4.87868C4.44129 4.31607 5.20435 4 6 4H9Z"
                  fill="#F7EBFF"
                />
                <path
                  d="M5 8V7H8C8.53043 7 9.03914 6.78929 9.41421 6.41421C9.78929 6.03914 10 5.53043 10 5V3C10 2.46957 9.78929 1.96086 9.41421 1.58579C9.03914 1.21071 8.53043 1 8 1H3C2.46957 1 1.96086 1.21071 1.58579 1.58579C1.21071 1.96086 1 2.46957 1 3V5C1.00001 5.35106 1.09243 5.69594 1.26796 5.99997C1.4435 6.304 1.69597 6.55647 2 6.732V7.83C1.41492 7.623 0.90841 7.23969 0.550228 6.73286C0.192046 6.22603 -0.000188056 5.62062 1.38047e-07 5V3C1.38047e-07 2.20435 0.316071 1.44129 0.87868 0.87868C1.44129 0.316071 2.20435 0 3 0H8C8.79565 0 9.55871 0.316071 10.1213 0.87868C10.6839 1.44129 11 2.20435 11 3V5C11 5.79565 10.6839 6.55871 10.1213 7.12132C9.55871 7.68393 8.79565 8 8 8H5Z"
                  fill="#F7EBFF"
                />
              </svg>
              Connexion
            </li>
            <li
              className={activeMenu == "overview" ? styles.active : ""}
              onClick={() => setActiveMenu("overview")}
            >
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16H5V11C5 10.7167 5.096 10.4793 5.288 10.288C5.48 10.0967 5.71733 10.0007 6 10H10C10.2833 10 10.521 10.096 10.713 10.288C10.905 10.48 11.0007 10.7173 11 11V16H14V7L8 2.5L2 7V16ZM0 16V7C0 6.68333 0.0709998 6.38333 0.213 6.1C0.355 5.81667 0.550667 5.58333 0.8 5.4L6.8 0.9C7.15 0.633333 7.55 0.5 8 0.5C8.45 0.5 8.85 0.633333 9.2 0.9L15.2 5.4C15.45 5.58333 15.646 5.81667 15.788 6.1C15.93 6.38333 16.0007 6.68333 16 7V16C16 16.55 15.804 17.021 15.412 17.413C15.02 17.805 14.5493 18.0007 14 18H10C9.71667 18 9.47933 17.904 9.288 17.712C9.09667 17.52 9.00067 17.2827 9 17V12H7V17C7 17.2833 6.904 17.521 6.712 17.713C6.52 17.905 6.28267 18.0007 6 18H2C1.45 18 0.979333 17.8043 0.588 17.413C0.196666 17.0217 0.000666667 16.5507 0 16Z"
                  fill="white"
                />
              </svg>
              Informations
            </li>

            <li
              className={activeMenu == "friends" ? styles.active : ""}
              onClick={() => setActiveMenu("friends")}
            >
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1.8C7.05701 1.8 6.15264 2.17928 5.48584 2.85442C4.81905 3.52955 4.44444 4.44522 4.44444 5.4C4.44444 6.35478 4.81905 7.27045 5.48584 7.94558C6.15264 8.62072 7.05701 9 8 9C8.94299 9 9.84736 8.62072 10.5142 7.94558C11.181 7.27045 11.5556 6.35478 11.5556 5.4C11.5556 4.44522 11.181 3.52955 10.5142 2.85442C9.84736 2.17928 8.94299 1.8 8 1.8ZM2.66667 5.4C2.66667 3.96783 3.22857 2.59432 4.22876 1.58162C5.22896 0.568927 6.58551 0 8 0C9.41449 0 10.771 0.568927 11.7712 1.58162C12.7714 2.59432 13.3333 3.96783 13.3333 5.4C13.3333 6.83217 12.7714 8.20568 11.7712 9.21838C10.771 10.2311 9.41449 10.8 8 10.8C6.58551 10.8 5.22896 10.2311 4.22876 9.21838C3.22857 8.20568 2.66667 6.83217 2.66667 5.4ZM4.44444 14.4C3.7372 14.4 3.05892 14.6845 2.55883 15.1908C2.05873 15.6972 1.77778 16.3839 1.77778 17.1C1.77778 17.3387 1.68413 17.5676 1.51743 17.7364C1.35073 17.9052 1.12464 18 0.888889 18C0.653141 18 0.427048 17.9052 0.260349 17.7364C0.0936505 17.5676 0 17.3387 0 17.1C0 15.9065 0.468253 14.7619 1.30175 13.918C2.13524 13.0741 3.2657 12.6 4.44444 12.6H11.5556C12.7343 12.6 13.8648 13.0741 14.6983 13.918C15.5317 14.7619 16 15.9065 16 17.1C16 17.3387 15.9064 17.5676 15.7397 17.7364C15.573 17.9052 15.3469 18 15.1111 18C14.8754 18 14.6493 17.9052 14.4826 17.7364C14.3159 17.5676 14.2222 17.3387 14.2222 17.1C14.2222 16.3839 13.9413 15.6972 13.4412 15.1908C12.9411 14.6845 12.2628 14.4 11.5556 14.4H4.44444Z"
                  fill="white"
                />
              </svg>
              Contacts
            </li>
            {/* NOUVEAU: Onglet Notifications */}
            <li
              className={activeMenu == "notifications" ? styles.active : ""}
              onClick={() => setActiveMenu("notifications")}
            >
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 18C8.55228 18 9 17.5523 9 17H7C7 17.5523 7.44772 18 8 18ZM14 13V8C14 5.24 12.36 2.95 10 2.18V1.5C10 0.67 9.33 0 8.5 0C7.67 0 7 0.67 7 1.5V2.18C4.64 2.95 3 5.24 3 8V13L1 15V16H15V15L14 13ZM12 14H4V8C4 5.79 5.79 4 8 4C10.21 4 12 5.79 12 8V14Z"
                  fill="white"
                />
              </svg>
              Notifications
            </li>
          </ul>
        </nav>
        <div className={styles.profileContent}>
          <div className={styles.profileEdit__first}>
            <div className={styles.profilePicture}>
              <img src={profile.picture || "./profile.svg"} alt="Profile" />
              {isEditing && (
                <div className={styles.editImage}>
                  <label htmlFor="picture">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M-0.00488281 13.2069V15.4998C-0.00488281 15.6325 0.0477957 15.7596 0.141564 15.8534C0.235332 15.9472 0.362509 15.9998 0.495117 15.9998H2.79312C2.92547 15.9998 3.05241 15.9473 3.14612 15.8538L12.5941 6.40585L9.59412 3.40585L0.142118 12.8538C0.0482818 12.9474 -0.00458943 13.0744 -0.00488281 13.2069ZM10.8321 2.16685L13.8321 5.16685L15.2921 3.70685C15.4796 3.51932 15.5849 3.26501 15.5849 2.99985C15.5849 2.73468 15.4796 2.48038 15.2921 2.29285L13.7071 0.706849C13.5196 0.519378 13.2653 0.414062 13.0001 0.414062C12.735 0.414062 12.4806 0.519378 12.2931 0.706849L10.8321 2.16685Z"
                        fill="black"
                      />
                    </svg>
                  </label>
                  <input
                    id="picture"
                    name="picture"
                    className={styles.inputFile}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                  />
                  {formData.profilePicture && <div></div>}
                </div>
              )}
            </div>
            <div className={styles.profileDetails}>
              <h3>
                {profile.name} {profile.firstname}
              </h3>
              <p>@{profile.username}</p>
              <p>Membre depuis {profile.registration_date}</p>
              <p className={styles.followers}>
                <button onClick={() => handlePopup("followed")}>
                  {profile.friends_count} suivis
                </button>
                |
                <button onClick={() => handlePopup("followers")}>
                  {profile.followers_count} vous suivent
                </button>
              </p>
            </div>
          </div>
          {activeMenu === "activities" && (
            <FeedProfile isOwnProfile={true} showUserInfo={true} />
          )}
          {activeMenu === "overview" && <OverviewComponent />}
          {activeMenu === "friends" && <FriendsComponent />}
          {activeMenu === "stravaedit" && <FitnessComponent />}
          {activeMenu === "notifications" && <NotificationSettings />}
        </div>
        {popupType && (
          <div className={styles.popup}>
            <div className={styles.popupInner}>
              {popupType == "followed" && (
                <h3>{profile.friends_count} suivis</h3>
              )}
              {popupType == "followers" && (
                <h3>{profile.followers_count} vous suivent</h3>
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
