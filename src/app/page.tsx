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
        alert("Your session has expired. Please log in again.");
      } else {
        // Token is valid
        setIsLoggedIn(true);
        setUsername(storedUsername);
      }
    } else {
      setIsLoggedIn(false); // No token found, user is logged out
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
      {isLoggedIn ? (
        <div className={styles.home}>
          <div className={styles.heading}>
            <h1>Mes Actus</h1>
            <p className={styles.header_p}>Emplacement à venir</p>
          </div>
        </div>
      ) : (
        <div className={styles.home}>
          <video autoPlay muted loop src="./home/walk.webm"></video>

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
        </div>
      )}
    </>
  );
}
