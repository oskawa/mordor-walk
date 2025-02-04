import { useState, useEffect } from "react";
import axios from "axios";

import styles from "./overview.module.scss";
import PopUp from "../../pwapopup";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../../context/LoadingContext";

export default function OverviewComponent() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeMenu, setActiveMenu] = useState("edit");
  const [friends, setFriends] = useState([]);
  const [popupType, setPopupType] = useState(null);
  const { setLoading } = useLoading();

  const [formData, setFormData] = useState({
    profilePicture: "",
    name: "",
    firstname: "",
  });

  const date = new Date();
  const year = date.getFullYear();

  useEffect(() => {
    setLoading(true);
    // Fetch user profile on component mount
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
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
        setFormData({
          profilePicture: response.data.profilePicture,
          name: response.data.name,
          firstname: response.data.firstname,
        });
      } catch (error) {
        setLoading(false);
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    try {
      let uploadedImageUrl;
      console.log(formData.profilePicture);
      if (
        formData.profilePicture !== undefined &&
        formData.profilePicture !== ""
      ) {
        uploadedImageUrl = formData.profilePicture;
      }

      // If profile picture is a file, upload it
      if (uploadedImageUrl && uploadedImageUrl.startsWith("data:image")) {
        const formData = new FormData();
        const mimeType = uploadedImageUrl.split(";")[0].split(":")[1];

        const blob = await fetch(uploadedImageUrl).then((res) => res.blob());
        const file = new File([blob], "profile-picture.jpg", {
          type: mimeType,
        });

        formData.append("file", blob);
        formData.append("name", "profile-picture.jpg");

        const uploadResponse = await axios.post(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/wp/v2/media`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localToken}`,
            },
          }
        );

        uploadedImageUrl = uploadResponse.data.source_url;
      }

      const requestData = { ...formData };
      if (uploadedImageUrl) {
        requestData.profilePicture = uploadedImageUrl;
      }

      // Save profile data
      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/edit-profile`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localToken}`, // Replace with your auth token
          },
          params: {
            userId: localUserId, // Pass the userId as a query parameter
          },
        }
      );

      setIsEditing(false);
      setLoading(false);
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
      setLoading(false);
      alert("An error occurred while saving the profile.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result, // Base64 encoded image
        }));
      };

      reader.readAsDataURL(file); // Convert the file to a Base64 string
    }
  };

  // Handle user logout
  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    // Update the state to reflect the logged-out status
    setIsLoggedIn(false);
    setUsername("");

    // Optionally, redirect to the login page
    router.push("/"); // Uncomment if you're using Next.js router
  };

  const handlePopup = (type) => {
    setPopupType(type);
    handleFriends(type);
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
  const handleFriends = async (type) => {
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
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }
  return (
    <div>
      <div className={styles.profile}>
        <div className={styles.profileEdit}>
          <div className={styles.profileEdit__first}>
            <div className={styles.profilePicture}>
              <img
                src={
                  formData.profilePicture || profile.picture || "./profile.svg"
                }
                alt="Profile"
              />
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
          <div className={styles.profileEdit__second}>
            {activeMenu === "edit" && (
              <>
                <div className={styles.profileEdit__resume}>
                  <h2>Mon profil</h2>
                  <p>
                    Mon parcours {year} :{" "}
                    {profile.activities?.stats?.current_year_total && (
                      <span>
                        {profile.activities.stats.current_year_total} / 1400 km
                      </span>
                    )}
                  </p>
                  <div className={styles.profileEdit__chart}>
                    {profile.activities?.stats?.current_year_total && (
                      <span
                        style={{
                          width: `${
                            (profile.activities.stats.current_year_total /
                              1400) *
                            100
                          }%`,
                        }}
                      ></span>
                    )}
                  </div>
                </div>
                <div className={styles.profileEdit__firstEdit}>
                  <p className={styles.title}>Mes informations :</p>
                  <p>
                    <strong>Nom:</strong>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    ) : (
                      profile.name
                    )}
                  </p>
                  <p>
                    <strong>Prénom:</strong>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                      />
                    ) : (
                      profile.firstname
                    )}
                  </p>
                  <div className={styles.profileActions}>
                    {isEditing ? (
                      <>
                        <button className={styles.btnFill} onClick={handleSave}>
                          Sauvegarder
                        </button>
                        <button
                          className={styles.btnStroke}
                          onClick={() => setIsEditing(false)}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.btnStroke}
                        onClick={() => setIsEditing(true)}
                      >
                        Editer
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={styles.profilEdit__more}>
          <div className={styles.profileEdit__moreLogout}>
            <button onClick={handleLogout}>Se déconnecter</button>
          </div>
          <div className={styles.profileEdit__moreContact}>
            <h4>Support</h4>
            <p>Pour reporter une erreur ou demander de l'aide</p>
            <button>Contactez-nous</button>
          </div>
        </div>
      </div>
      {popupType && (
        <div className={styles.popup}>
          <div className={styles.popupInner}>
            <h3>{profile.friends_count} suivis</h3>
            <button className={styles.close} onClick={() => setPopupType(null)}>
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
                            width: `${(friend.totalDistance / 1400) * 100}%`,
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
          </div>
        </div>
      )}
    </div>
  );
}
