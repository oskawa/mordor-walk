"use client";
import Link from "next/link";
import styles from "./header.module.scss";
import PopUp from "../pwapopup";
import { useEffect, useState } from "react";
import axios from "axios";
import { profile } from "console";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Header() {
  const [profilePicture, setProfilePicture] = useState("");
  const [userId, setUserid] = useState("");
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      setUserid(userId);
      setToken(token);
      if (!token || !userId) {
        console.error("Missing token or userId in localStorage");
        return;
      }

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
          console.log(response.data);
          if (response.data.picture) {
            setProfilePicture(response.data.picture);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []);

  if (!token || !userId) {
    return;
  }
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/">
          <img src="./logo.svg" alt="" />
        </Link>
      </div>
      <div className={styles.headerRight}>
        <PopUp />
        <Link href="/profile">
          <div className={styles.headerRight__img}>
            <img src={profilePicture || "./header/profile.svg"} alt="" />
          </div>
        </Link>
      </div>
    </header>
  );
}
