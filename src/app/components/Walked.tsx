"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./walked.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

interface DataItem {
  km: number; // Distance as a string
  content?: string; // Optional content
  img?: string; // Optional image
}

export default function Walked() {
  const [filteredContent, setFilteredContent] = useState([]);
  const [currentDistance, setCurrentDistance] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        console.error("Missing token or userId in localStorage");
        return;
      }

      // Fetch user data on mount
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId,
            },
          }
        )
        .then((response) => {
          if (response.data.activities?.stats?.total_distance_km) {
            const totalDistance = 1400;
            setCurrentDistance(
              response.data.activities.stats.total_distance_km
            );
          } else {
            console.warn("Unexpected response format", response.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []); // Dependencies

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file from the public folder
        const response = await fetch("/walk.json");
        const data: Record<string, DataItem> = await response.json();
        // Filter the JSON data
        const filtered = Object.values(data)
          .filter((item) => Number(item.km) < currentDistance)
          .map((item) => ({
            content: item.content,
            km: item.km,
            image: item.img,
          })) // Extract the "content"
          .filter(Boolean); // Remove undefined or null contents
        setFilteredContent(filtered);
      } catch (error) {
        console.error("Error fetching JSON data:", error);
      }
    };

    fetchData();
  }, [currentDistance]);

  return (
    <>
      <div className={styles.walkedInner}>
        <div className={styles.walkedInnerText}>
          <h2>Votre timeline de 2025</h2>
          <p>
            Retrouvez votre timeline ici
            <br />
            Dès que vous aurez fait une activité, vous verrez votre timeline
            s'afficher au fur et à mesure...
          </p>
        </div>
        <ul>
          {filteredContent.map((item, index) => (
            <li key={index}>
              <div className={styles.walkedInner__img}>
                <img src={item.image} alt="" />
              </div>
              <div className={styles.walkedInner__km}>{item.km}</div>
              <div className={styles.walkedInner__content}>
                <p>{item.content}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
