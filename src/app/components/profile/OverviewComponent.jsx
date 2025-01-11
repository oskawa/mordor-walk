import { useState, useEffect } from "react";
import axios from "axios";
import StravaConnect from "../parts/StravaConnect";
import styles from "./overview.module.scss";
import PopUp from "../../pwapopup";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function OverviewComponent() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [activeMenu, setActiveMenu] = useState("edit");

  const [formData, setFormData] = useState({
    profilePicture: "",
    name: "",
    firstname: "",
  });

  useEffect(() => {
    // Fetch user profile on component mount
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    console.log(localToken);
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

        setFormData({
          profilePicture: response.data.profilePicture,
          name: response.data.name,
          firstname: response.data.firstname,
        });
      } catch (error) {
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
        const blob = await fetch(uploadedImageUrl).then((res) => res.blob());
        formData.append("file", blob);
        formData.append("name", "profile-picture.jpg");

        // const test = await axios.get(
        //   `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/check-capabilities`,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${localToken}`,
        //     },
        //   }
        // );

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
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
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

  const checkStravaConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        setIsStravaConnected(false);
        // setLoading(false);
        return;
      }

      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/checkStravaConnection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId,
          },
        }
      );

      if (response.data) {
        setIsStravaConnected(true);
      } else {
        setIsStravaConnected(false);
      }
    } catch (error) {
      console.error(
        "Error checking Strava connection:",
        error.response?.data || error.message || error
      );
      setIsStravaConnected(false);
    } finally {
      // setLoading(false);
    }
  };

  const exchangeCodeForToken = async (code) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post("/api/strava/callback", {
        code,
        userId,
        token,
      });
      console.log("Strava data saved successfully:", response.data);
      // setLoading(false);
      setIsStravaConnected(true);
    } catch (error) {
      console.error(
        "Error handling Strava callback:",
        error.response?.data || error.message || error
      );
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    const code = urlParams.get("code");

    if (stravaCallback && code) {
      exchangeCodeForToken(code);
    } else {
      checkStravaConnection();
    }
  }, []);

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <div className={styles.profile}>
        <div className={styles.profileEdit}>
          <div className={styles.profileEdit__first}>
            <div className={styles.profilePicture}>
              <img
                src={
                  formData.profilePicture ||
                  profile.picture ||
                  "/default-profile.png"
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
                  {formData.profilePicture && (
                    <div>
                      <img
                        src={formData.profilePicture}
                        alt="Preview"
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.profileDetails}>
              <h3>
                {profile.name} {profile.firstname}
              </h3>
              <p>@{profile.username}</p>
              <p>Membre depuis {profile.registration_date}</p>
              <p>
                {profile.friends_count} suivis | {profile.followers_count} vous
                suivent
              </p>
            </div>
          </div>
          <div className={styles.profileEdit__second}>
            <div className={styles.profileEdit__buttons}>
              <button
                onClick={() => setActiveMenu("edit")}
                className={activeMenu === "edit" ? `${styles.active}` : ""}
              >
                Edition du profil
              </button>
              <button
                onClick={() => setActiveMenu("stravaedit")}
                className={
                  activeMenu === "stravaedit" ? `${styles.active}` : ""
                }
              >
                Connexion Strava
              </button>
            </div>
            {activeMenu === "edit" && (
              <div className={styles.profileEdit__firstEdit}>
                <p>
                  <strong>Name:</strong>
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
                  <strong>Full Name:</strong>
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
            )}
            {activeMenu === "stravaedit" && (
              <div className={styles.profileEdit__strava}>
                {!isStravaConnected && <StravaConnect />}
                {isStravaConnected && <p>Vous êtes bien connectés à Strava</p>}
              </div>
            )}
          </div>
        </div>
        <div className={styles.profilEdit__more}>
          <div className={styles.profileEdit__moreLogout}>
            <PopUp />
          </div>
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
    </div>
  );
}
