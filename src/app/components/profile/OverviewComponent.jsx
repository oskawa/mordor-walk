import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

import styles from "./overview.module.scss";
import PopUp from "../../pwapopup";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../../context/LoadingContext";
import PushNotifications from "../PushNotifications";


export default function OverviewComponent() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const { user, token, logout, updateUser } = useAuth();
  
  const { setLoading } = useLoading();

 

  const [formData, setFormData] = useState({
    profilePicture: "",
    name: "",
    firstname: "",
  });

  console.log(user)

  const date = new Date();
  const year = date.getFullYear();

  useEffect(() => {
    if (!token || !user?.id) return;

    setLoading(true);

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: user.id,
            },
          }
        );
        setProfile(response.data);
        setLoading(false);
        setFormData({
          profilePicture: response.data.profilePicture || user.picture || "",
          name: response.data.name || user.name || "",
          firstname: response.data.firstname || user.firstname || "",
        });
      } catch (error) {
        setLoading(false);
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [token, user]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let uploadedImageUrl;

      if (
        formData.profilePicture !== undefined &&
        formData.profilePicture !== ""
      ) {
        uploadedImageUrl = formData.profilePicture;
      }

      // If profile picture is a file, upload it
      if (uploadedImageUrl && uploadedImageUrl.startsWith("data:image")) {
        const formDataUpload = new FormData();
        const mimeType = uploadedImageUrl.split(";")[0].split(":")[1];

        const blob = await fetch(uploadedImageUrl).then((res) => res.blob());

        formDataUpload.append("file", blob);
        formDataUpload.append("name", "profile-picture.jpg");

        const uploadResponse = await axios.post(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/wp/v2/media`,
          formDataUpload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: user.id,
          },
        }
      );

      // Mettre à jour le user dans le context
      updateUser({
        name: requestData.name,
        firstname: requestData.firstname,
        picture: uploadedImageUrl || formData.profilePicture,
      });

      setIsEditing(false);
      setLoading(false);
      // Plus besoin de reload, les données sont mises à jour via le context
    } catch (error) {
      console.error("Error saving profile:", error);
      setLoading(false);
      alert("Une erreur s'est produite lors de la sauvegarde du profil.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div>
      <div className={styles.profile}>
        <div className={styles.profileEdit}>
          <div className={styles.profileEdit__second}>
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
              </div>
            )}
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
                        (profile.activities.stats.current_year_total / 1400) *
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

            {/* 🔔 Section Notifications Push */}
            <PushNotifications
              vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}
            />
          </div>
        </div>
        <div className={styles.profilEdit__more}>
          <div className={styles.profileEdit__moreLogout}>
            <button onClick={logout}>Se déconnecter</button>
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

// 🔔 Fonctions utilitaires
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getPermissionText(permission) {
  switch (permission) {
    case 'granted':
      return '✅ Autorisées';
    case 'denied':
      return '❌ Bloquées';
    case 'default':
      return '⏳ En attente';
    default:
      return '❓ Inconnue';
  }
}