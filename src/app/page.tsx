"use client";
import Image from "next/image";
import styles from "./home.module.scss";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PopUp from "./pwapopup";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [activeMenu, setActiveMenu] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (token) {
      setIsLoggedIn(true); // User is logged in
      setUsername(storedUsername); // Set the username from localStorage
    }
  }, []);

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
      <div className={styles.home}>
      
       <video autoPlay muted loop src="./home/walk.webm"></video>

        {isLoggedIn ? (
          <div className={styles.logged}>
            <h1>Mordor Walk</h1>
            <p>
              Rejoignez l'aventure, seul ou entre amis, qui atteindra le Mordor
              grâce à ses performances sportives ?
            </p>
            <p className={styles.welcome}>
              <strong>Bienvenue</strong>, {username}
            </p>{" "}
            {/* Display user's name or other info */}
            <Link className={styles.btnStroke} href="/profile">
              Configurer mon profil
            </Link>
            <Link className={styles.btnStroke} href="/map">
              Découvrir la carte
            </Link>
            <button onClick={handleLogout}>Déconnexion</button>
          </div>
        ) : (
          <div className={styles.formInner}>
            <div className={styles.formInner__title}>
              <h1>Mordor Walk</h1>
              <p>
                Rejoignez l'aventure, seul ou entre amis, qui atteindra le
                Mordor grâce à ses performances sportives ?
              </p>
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
        )}
      </div>
    </>
  );
}
