"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./friends.module.scss";
import StravaConnect from "../parts/StravaConnect";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../../context/LoadingContext";

export default function StravaComponent() {
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isStravaConnected, setIsStravaConnected] = useState(null);
  const { setLoading } = useLoading();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  useEffect(() => {
    // Fetch user profile on component mount
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    setLoading(true);
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/me`,
          {
            headers: {
              Authorization: `Bearer ${localToken}`,
            },
          }
        );
        setProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);
  // Function to fetch friends

  const checkStravaConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      setLoading(true);
      if (!token || !userId) {
        setIsStravaConnected(false);
        // setLoading(false);
        setLoading(false);
        setHasChecked(true);
        return;
      }

      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/fitness/v1/strava/connection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId,
          },
        }
      );

      if (response.data) {
        setIsStravaConnected(true);
      } else {
        setIsStravaConnected(false);
      }
    } catch (error) {
      console.error(
        "Error checking Strava connection:",
        error.response?.data || error.message || error
      );
      setIsStravaConnected(false);
    } finally {
      // setLoading(false);
      setHasChecked(true);
    }
  };

  const exchangeCodeForToken = async (code) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post("/api/strava/callback", {
        code,
        userId,
        token,
      });
      // setLoading(false);
      setHasChecked(true);
      setIsStravaConnected(true);
    } catch (error) {
      console.error(
        "Error handling Strava callback:",
        error.response?.data || error.message || error
      );
      setHasChecked(true);
      setIsStravaConnected(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    const code = urlParams.get("code");

    if (stravaCallback && code) {
      exchangeCodeForToken(code);
    } else {
      checkStravaConnection();
    }
  }, []);

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }
  return (
    <div>
      <div className={styles.heading}>
        <h1>Strava</h1>
      </div>
      <div className={styles.profileEdit__strava}>
        {!hasChecked && <p>Vérification de la connexion...</p>}
        {hasChecked && (
          <>
            {!isStravaConnected && <StravaConnect />}
            {isStravaConnected && <p>Vous êtes bien connectés à Strava</p>}
          </>
        )}
      </div>
    </div>
  );
}
