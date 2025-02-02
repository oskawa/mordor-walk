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
            params: { userId: localUserId },
            headers: {
              Authorization: `Bearer ${localToken}`, // Add the Bearer Token in the Authorization header
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

  const handleShare = (imageURL) => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
      // Android Instagram Intent
      const intentUrl = `intent://story?background_image=${encodeURIComponent(
        imageURL
      )}#Intent;package=com.instagram.android;scheme=instagram;end`;
      window.location.href = intentUrl;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      // iOS Instagram Story URL
      const instagramStoryUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(
        imageURL
      )}`;
      window.location.href = instagramStoryUrl;
    } else {
      // Fallback for non-mobile devices
      alert(
        "This feature is only available on mobile devices with Instagram installed."
      );
    }
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
              {/* {isMobile && (
                <button onClick={() => handleShare(trophy.image)}>
                  Share to Instagram Story
                </button>
              )} */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
