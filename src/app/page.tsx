"use client";
import Image from "next/image";
import styles from "./home.module.scss";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PopUp from "./pwapopup";
import axios from "axios";
import { url } from "inspector";
import { useLoading } from "../context/LoadingContext";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [activeMenu, setActiveMenu] = useState("login");
  const [feed, setFeed] = useState(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const expiration = localStorage.getItem("expired");

    if (token && expiration) {
      const expirationTime = Number(expiration); // Convert to number
      const currentTime = Date.now(); // Current time in milliseconds
      if (currentTime > expirationTime) {
        // Token has expired
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("expired");
        setIsLoggedIn(false); // Update state to logged out
        setUsername(null); // Clear username state
        setLoading(false);
      } else {
        // Token is valid
        setIsLoggedIn(true);
        setUsername(storedUsername);
        setLoading(false);
      }
    } else {
      setLoading(false);
      setIsLoggedIn(false); // No token found, user is logged out
    }
  }, []);

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
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/retrieveFeed`,
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
          setFeed(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []); // Dependencies

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
    // router.push('/'); // Uncomment if you're using Next.js router
  };

  return (
    <>
      {isLoggedIn ? (
        <div className={styles.home}>
          <div className={styles.heading}>
            <h1>Mes Actus</h1>
            {feed?.connected &&
              feed?.users?.map((fed) => (
                <div className={styles.feed} key={fed.index}>
                  <div className={styles.feedHeading}>
                    <div className={styles.feedHeadingName}>
                      <img src={fed.profilePicture || "/profile.svg"} alt="" />
                      <p className={styles.name}>{fed.name}</p>
                    </div>
                    <hr />
                    <p className={styles.date}>
                      {fed.latest_activity.readable_date}
                    </p>
                  </div>
                  <div className={styles.feedActivity}>
                    <div className={styles.feedActivityDistance}>
                      <p>Distance</p>
                      <p className={styles.feedActivityBold}>
                        {fed.latest_activity.distance_km} km
                      </p>
                    </div>
                    <div className={styles.feedActivityDistance}>
                      <p>Temps</p>
                      <p className={styles.feedActivityBold}>
                        {fed.latest_activity.time}
                      </p>
                    </div>
                  </div>
                  <div
                    className={styles.feedInner}
                    style={{
                      backgroundImage: `url(${fed.latest_activity.next_milestone.img})`,
                    }}
                  ></div>
                  <div className={styles.feedInner__percentageInner}>
                    <div
                      className={styles.feedInner__Percentage}
                      style={{
                        width: `${fed.latest_activity.progress_percentage}%`,
                      }}
                    ></div>
                  </div>
                  <p>{fed.latest_activity.next_milestone.message}</p>
                  <div className={styles.feedInner__next}>
                    <p>
                      Prochaine destination :{" "}
                      {fed.latest_activity.next_milestone.next_destination}(
                      {Math.floor(
                        fed.latest_activity.next_milestone.km -
                          fed.latest_activity.total_km
                      )}{" "}
                      km restants)
                    </p>
                  </div>
                </div>
              ))}
              {feed?.connected == false && <>
              Une fois connecté à Strava, retrouvez ici vos futures milestones ainsi que celles de votre amis ! 
              <br/>
              <br/>
              Rendez vous dans votre profil pour vous connecter, dans l'onglet <strong>Connexion Strava</strong>, ou trouver de nouveaux contacts.
              </>}
          </div>
        </div>
      ) : (
        <div className={styles.homeForm}>
          <div className={styles.formInner}>
            <div className={styles.formInner__title}>
              <img src="./logo.svg" alt="" />
            </div>
            <div className={styles.form}>
              {activeMenu === "login" && (
                <LoginForm setActiveMenu={setActiveMenu} />
              )}
              {activeMenu === "register" && (
                <RegisterForm setActiveMenu={setActiveMenu} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
