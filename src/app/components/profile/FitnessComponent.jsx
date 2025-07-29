"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./friends.module.scss";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function FitnessComponent() {
  const [profile, setProfile] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    strava: false,
    googlefit: false,
    active_platform: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Platforms configuration
  const platforms = {
    strava: {
      name: "Strava",
      img: "./images/btn-strava.png",
    },
    googlefit: {
      name: "Google Fit",
      img: "./images/btn-google.png",
    },
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    const googlefitCallback = urlParams.get("googlefitCallback");
    const code = urlParams.get("code");

    if (stravaCallback && code) {
      exchangeStravaCodeForToken(code);
    } else if (googlefitCallback && code) {
      exchangeGoogleFitCodeForToken(code);
    } else {
      checkAllConnections();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId },
        }
      );
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllConnections = async () => {
    try {
      setIsLoading(true);

      if (!token || !userId) {
        setConnectionStatus({
          strava: false,
          googlefit: false,
          active_platform: null,
        });
        setHasChecked(true);
        return;
      }

      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/fitness/v1/connection-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setConnectionStatus(response.data);
    } catch (error) {
      console.error("Error checking connections:", error);
      setConnectionStatus({
        strava: false,
        googlefit: false,
        active_platform: null,
      });
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  };

  const connectToStrava = async () => {
    try {
      // Redirect to Strava authorization
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URL;
      const scope = "read,activity:read";

      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${scope}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to Strava:", error);
    }
  };

  const connectToGoogleFit = async () => {
    try {
      // Get Google Fit auth URL from backend
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/googlefit/auth-url`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error("Error getting Google Fit auth URL:", error);
    }
  };

  const exchangeStravaCodeForToken = async (code) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/strava/callback`,
        {
          code,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await checkAllConnections();
    } catch (error) {
      console.error("Error connecting to Strava:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeGoogleFitCodeForToken = async (code) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/googlefit/callback`,
        {
          code,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await checkAllConnections();
    } catch (error) {
      console.error("Error connecting to Google Fit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectPlatform = async (platform) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/fitness/disconnect`,
        {
          userId,
          platform,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await checkAllConnections();
    } catch (error) {
      console.error(`Error disconnecting from ${platform}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFitnessData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/fitness/data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId },
        }
      );

      alert(
        `Données récupérées! Plateforme: ${
          response.data.platform
        }\nActivités: ${
          response.data.data?.stats?.total_activities || 0
        }\nDistance: ${response.data.data?.stats?.total_distance_km || 0} km`
      );
    } catch (error) {
      console.error("Error fetching fitness data:", error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFitnessData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/fitness/refresh`,
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        `Données rafraîchies!\nActivités: ${
          response.data.data?.stats?.total_activities || 0
        }\nDistance: ${response.data.data?.stats?.total_distance_km || 0} km`
      );
    } catch (error) {
      console.error("Error refreshing fitness data:", error);
      alert(
        `Erreur refresh: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlatformButton = (platformKey) => {
    const platform = platforms[platformKey];
    const isConnected = connectionStatus[platformKey];
    const isActive = connectionStatus.active_platform === platformKey;
    const hasAnyConnection = connectionStatus.active_platform !== null;

    return (
      <div key={platformKey} className={styles.platformContainer}>
        <div className={styles.platformInfo}></div>

        <div
          className={styles.platformActions}
          style={{ textAlign: "center", marginBottom: "15px" }}
        >
          {!isConnected ? (
            // Afficher le bouton de connexion seulement si aucune plateforme n'est connectée
            !hasAnyConnection ? (
              <button
                className={styles.connectButton}
                style={{ textAlign: "center" }}
                onClick={() => {
                  if (platformKey === "strava") {
                    connectToStrava();
                  } else if (platformKey === "googlefit") {
                    connectToGoogleFit();
                  }
                }}
                disabled={isLoading}
              >
                {platform.img ? (
                  <img src={platform.img} alt="" />
                ) : (
                  platform.icon
                )}
              </button>
            ) : (
              // Si une autre plateforme est connectée, afficher un message
              <></>
            )
          ) : (
            // Plateforme connectée - afficher les actions de déconnexion
            <div className={styles.connectedActions}>
              <button
                className={styles.disconnectButton}
                onClick={() => disconnectPlatform(platformKey)}
                disabled={isLoading}
              >
                Déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div>
      <div className={styles.heading}>
        <h1>Applications de Fitness</h1>
      </div>

      <div className={styles.profileEdit__fitness}>
        {!hasChecked && <p>Vérification des connexions...</p>}

        {hasChecked && (
          <div className={styles.platformsList}>
            <p className={styles.description}>
              Connectez votre application de fitness préférée pour suivre vos
              activités.
            </p>
            <br />
            {connectionStatus.active_platform && (
              <>
                <div className={styles.switchNote}>
                  <p>
                    <strong>Note :</strong> Vous ne pouvez être connecté qu'à
                    une seule plateforme à la fois. Se connecter à une nouvelle
                    plateforme déconnectera automatiquement l'ancienne.
                  </p>
                </div>

                {/* <div className={styles.debugSection}>
                  <h3>🔧 Section Debug</h3>
                  <div className={styles.debugButtons}>
                    <button
                      className={styles.debugButton}
                      onClick={fetchFitnessData}
                      disabled={isLoading}
                    >
                      📊 Récupérer les données
                    </button>
                    <button
                      className={styles.debugButton}
                      onClick={refreshFitnessData}
                      disabled={isLoading}
                    >
                      🔄 Forcer le refresh
                    </button>
                  </div>
                </div> */}
              </>
            )}
            <br />
            {connectionStatus.active_platform && (
              <span className={styles.currentPlatform}>
                Actuellement connecté à{" "}
                <strong>
                  {" "}
                  {platforms[connectionStatus.active_platform]?.name}
                </strong>
              </span>
            )}
            {Object.keys(platforms).map(renderPlatformButton)}
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <p>Traitement en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
}
