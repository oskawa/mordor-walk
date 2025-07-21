"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./new.module.scss";
import { useAuth } from "../../context/AuthContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

interface News {
  title: string;
  content?: string;
  thumbnail: string;
}

export default function NewComponent() {
  const [popupInfo, setPopupInfo] = useState(null);
  const [newsContent, setNewsContent] = useState<News>(null);
  const { user, token } = useAuth();

  // Récupérer les données utilisateur
  useEffect(() => {
    if (!token || !user?.id) return;

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/retrieveNews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        if (response.data.success) {
          setNewsContent(response.data.news);
          console.log(response.data.news);
        }
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
      });
  }, [token, user]);

  return (
    <>
      {newsContent && (
        <div
          className={styles.news}
          style={{ backgroundImage: `url(${newsContent.thumbnail})` }}
          onClick={() => setPopupInfo(true)}
        >
          <h3>Nouvelle actualité</h3>
          <p>{newsContent.title}</p>
        </div>
      )}
      {popupInfo && (
        <div className={styles.poiPopup}>
          <button
            className={styles.closePopup}
            onClick={() => setPopupInfo(null)}
          >
            ×
          </button>

          <div className={styles.popupContent}>
            <img
              className={styles.popupImg}
              src={newsContent.thumbnail}
              alt=""
            />
            <div className={styles.popUpInner}>
              <h4>{newsContent.title}</h4>
              <div
                dangerouslySetInnerHTML={{ __html: newsContent.content }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
