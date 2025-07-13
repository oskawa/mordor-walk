"use client";
import Image from "next/image";
import styles from "./home.module.scss";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PopUp from "./pwapopup";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Home() {
  const { isAuthenticated, user, token, isLoading: authLoading } = useAuth();
  const [activeMenu, setActiveMenu] = useState("login");
  const [feed, setFeed] = useState(null);
  const { setLoading } = useLoading();

  // Fetch du feed uniquement si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      return;
    }

    setLoading(true);

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/retrieveFeed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: user.id,
          },
        }
      )
      .then((response) => {
        console.log(response.data);
        setFeed(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker enregistré:", registration);
        })
        .catch((error) => {
          console.error("❌ Erreur Service Worker:", error);
        });
    }
  }, []);

  // Pendant le chargement de l'authentification, afficher un loader
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        // Vue connectée - Affichage du feed
        <div className={styles.home}>
          <div className={styles.heading}>
           
            <h1>Mes Actus</h1>
            {feed?.connected &&
              feed?.users?.map((fed, index) => (
                <div className={styles.feed} key={index}>
                  <div className={styles.feedHeading}>
                    <div className={styles.feedHeadingName}>
                      <img src={fed.profilePicture || "/profile.svg"} alt="" />
                      <p className={styles.name}>{fed.name}</p>
                    </div>
                    <hr />
                    <p className={styles.date}>
                      {fed.latest_activity?.readable_date}
                    </p>
                  </div>
                  <div className={styles.feedActivity}>
                    <div className={styles.feedActivityDistance}>
                      <p>Distance</p>
                      <p className={styles.feedActivityBold}>
                        {fed.latest_activity?.distance_km} km
                      </p>
                    </div>
                    <div className={styles.feedActivityDistance}>
                      <p>Temps</p>
                      <p className={styles.feedActivityBold}>
                        {fed.latest_activity?.time}
                      </p>
                    </div>
                  </div>
                  <div
                    className={styles.feedInner}
                    style={{
                      backgroundImage: `url(${fed.latest_activity?.next_milestone?.img})`,
                    }}
                  ></div>
                  <div className={styles.feedInner__percentageInner}>
                    <div
                      className={styles.feedInner__Percentage}
                      style={{
                        width: `${fed.latest_activity?.progress_percentage}%`,
                      }}
                    ></div>
                  </div>
                  <p>{fed.latest_activity?.next_milestone?.message}</p>
                  <div className={styles.feedInner__next}>
                    <p>
                      Prochaine destination :{" "}
                      {fed.latest_activity?.next_milestone?.next_destination} (
                      {Math.floor(
                        fed.latest_activity?.next_milestone?.km -
                          fed.latest_activity?.total_km
                      )}{" "}
                      km restants)
                    </p>
                  </div>
                </div>
              ))}
            {feed?.connected === false && (
              <>
                Une fois connecté à Strava, retrouvez ici vos futures milestones
                ainsi que celles de vos amis !
                <br />
                <br />
                Rendez vous dans votre profil pour vous connecter, dans l'onglet{" "}
                <strong>Connexion Strava</strong>, ou trouver de nouveaux
                contacts.
              </>
            )}
          </div>
        </div>
      ) : (
        // Vue non connectée - Formulaires de connexion/inscription
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
