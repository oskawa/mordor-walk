"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./trophees.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function TrophiesComponent() {
  const [trophies, setTrophies] = useState([]);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId"));
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    if (userId && token) {
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserTrophies`,
          {
            params: { userId: userId },
            headers: {
              Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
            },
          }
        )
        .then((response) => {
          setTrophies(response.data);
        })
        .catch((error) => {
          console.error("Error searching trophies:", error);
        });
    }
  }, [userId, token]);
  const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const handleShare = async (image, name) => {
    const blob = await fetchImageAsBlob(image);
    if (!blob) return;

    if (navigator.share) {
      navigator
        .share({
          title: `Check out my new trophy: ${name}! 🏆`,
          text: `I just unlocked "${name}" in my app!`,
          url: image, // This works if the image is hosted online
          files: [
            new File([blob], "file.png", {
              type: blob.type,
            }),
          ],
        })
        .then(() => console.log("Shared successfully"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  const fetchImageAsBlob = async (imageUrl) => {
    try {
      // Fetch the image as a Blob using Axios
      const response = await axios.get(imageUrl, {
        responseType: "blob", // Important: ensures binary data
        headers: {
          Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
        },
      });

      return response.data; // Blob object
    } catch (error) {
      console.error("Error fetching image:", error);
      alert("Failed to fetch image.");
    }
  };

  const handleInstagramShare = async (image) => {
    const blob = await fetchImageAsBlob(image);
    if (!blob) return;

    // Convert Blob to Base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1]; // Get only Base64 content

      // Use Instagram Intent for sharing
      const intentUrl = `intent://story?source_application=com.yourapp&sticker_image=${base64data}#Intent;package=com.instagram.android;end;`;
      window.location.href = intentUrl;
    };
  };

  return (
    <div className={styles.trophees}>
      <div className={styles.heading}>
        <h1>Mes trophées</h1>
        <p>
          Afin de rester motivé, retrouvez vos trophées ici et partagez les
          fièrement sur les réseaux sociaux !
        </p>
      </div>
      <div className={styles.trophiesInner}>
        <h3>2025</h3>
        <hr />
        <ul className={styles.trophiesList}>
          {trophies.map((trophy, index) => (
            <li
              key={index}
              className={`trophy ${
                trophy.hasTrophie ? `${styles.unlocked}` : `${styles.locked}`
              }`}
            >
              <img src={trophy.image} alt={trophy.name} />
              <p>{trophy.km} km</p>
              <h4>{trophy.name}</h4>
              {isMobile && (
                <>
                  <button
                    onClick={() => handleShare(trophy.image, trophy.name)}
                  >
                    Share
                  </button>
                  <button onClick={() => handleInstagramShare(trophy.image)}>
                    Share to Instagram Story
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
