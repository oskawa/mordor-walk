"use client";
import { useState, useEffect, useCallback } from "react";
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
  const [connectionError, setConnectionError] = useState(null);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const { setLoading } = useLoading();

  // ✅ Fonction utilitaire pour obtenir les tokens
  const getAuthTokens = useCallback(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      console.warn("Tokens manquants dans localStorage");
      return null;
    }
    
    return { userId, token };
  }, []);

  // ✅ Version améliorée de la vérification de connexion Strava
  const checkStravaConnection = useCallback(async (showLoading = true) => {
    const tokens = getAuthTokens();
    
    if (!tokens) {
      setIsStravaConnected(false);
      setHasChecked(true);
      setConnectionError("Tokens d'authentification manquants");
      return false;
    }

    try {
      if (showLoading) setLoading(true);
      
      console.log("🔍 Vérification de la connexion Strava...");
      
      const response = await axios.get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/fitness/v1/strava/connection`,
        {
          headers: {
            Authorization: `Bearer ${tokens.token}`,
          },
          timeout: 10000, // 10 secondes de timeout
        }
      );

      console.log("📊 Réponse vérification Strava:", response.data);

      if (response.data?.connected === true) {
        setIsStravaConnected(true);
        setConnectionError(null);
        setRequiresReauth(false);
        
        if (response.data.token_refreshed) {
          console.log("🔄 Token Strava automatiquement rafraîchi");
        }
        
        return true;
      } else {
        // Connexion échouée
        setIsStravaConnected(false);
        setConnectionError(response.data?.message || "Connexion Strava inactive");
        setRequiresReauth(response.data?.requires_reauth || false);
        
        console.warn("❌ Connexion Strava inactive:", {
          reason: response.data?.reason,
          message: response.data?.message,
          requires_reauth: response.data?.requires_reauth
        });
        
        return false;
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la vérification Strava:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      setIsStravaConnected(false);
      
      if (error.response?.status === 401) {
        setConnectionError("Session expirée, veuillez vous reconnecter");
        setRequiresReauth(true);
      } else if (error.response?.status >= 500) {
        setConnectionError("Erreur serveur, veuillez réessayer plus tard");
      } else {
        setConnectionError(error.response?.data?.message || "Erreur de connexion Strava");
      }
      
      return false;
    } finally {
      if (showLoading) setLoading(false);
      setHasChecked(true);
    }
  }, [getAuthTokens, setLoading]);

  // ✅ Version améliorée de l'échange code/token
  const exchangeCodeForToken = useCallback(async (code) => {
    const tokens = getAuthTokens();
    
    if (!tokens) {
      console.error("❌ Impossible d'échanger le code: tokens manquants");
      setConnectionError("Tokens d'authentification manquants");
      setHasChecked(true);
      setIsStravaConnected(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Échange du code Strava pour un token...");
      
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/fitness/v1/strava/callback`,
        {
          code,
          userId: tokens.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 secondes pour l'échange de token
        }
      );

      console.log("✅ Code Strava échangé avec succès:", response.data);
      
      if (response.data?.success) {
        setIsStravaConnected(true);
        setConnectionError(null);
        setRequiresReauth(false);
        
        // Nettoyer l'URL
        const url = new URL(window.location);
        url.searchParams.delete('code');
        url.searchParams.delete('stravaCallback');
        url.searchParams.delete('scope');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.toString());
        
      } else {
        throw new Error(response.data?.message || "Échec de l'échange de code");
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de l'échange du code Strava:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setIsStravaConnected(false);
      setConnectionError(
        error.response?.data?.message || 
        "Erreur lors de la connexion à Strava"
      );
      
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  }, [getAuthTokens, setLoading]);

  // ✅ Fonction pour forcer une nouvelle vérification
  const refreshConnection = useCallback(async () => {
    setHasChecked(false);
    setConnectionError(null);
    await checkStravaConnection(true);
  }, [checkStravaConnection]);

  // ✅ Effet pour le profil utilisateur
  useEffect(() => {
    const fetchProfile = async () => {
      const tokens = getAuthTokens();
      
      if (!tokens) {
        console.warn("Impossible de récupérer le profil: tokens manquants");
        return;
      }

      try {
        setLoading(true);
        
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/me`,
          {
            headers: {
              Authorization: `Bearer ${tokens.token}`,
            },
            timeout: 10000,
          }
        );
        
        setProfile(response.data);
        
      } catch (error) {
        console.error("❌ Erreur lors de la récupération du profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getAuthTokens, setLoading]);

  // ✅ Effet principal pour gérer le callback et la vérification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    // Gestion des erreurs d'autorisation Strava
    if (error) {
      console.warn("❌ Erreur d'autorisation Strava:", error);
      setConnectionError(`Erreur d'autorisation: ${error}`);
      setHasChecked(true);
      setIsStravaConnected(false);
      
      // Nettoyer l'URL
      const url = new URL(window.location);
      url.searchParams.delete('error');
      url.searchParams.delete('stravaCallback');
      window.history.replaceState({}, document.title, url.toString());
      
      return;
    }

    // Callback Strava avec code
    if (stravaCallback && code) {
      console.log("🔄 Callback Strava détecté avec code");
      exchangeCodeForToken(code);
    } else {
      // Vérification normale de la connexion
      checkStravaConnection(true);
    }
  }, [exchangeCodeForToken, checkStravaConnection]);

  // ✅ Vérification périodique de la connexion (toutes les 5 minutes)
  useEffect(() => {
    if (!isStravaConnected) return;

    const interval = setInterval(() => {
      console.log("🔄 Vérification périodique de la connexion Strava");
      checkStravaConnection(false); // Sans afficher le loading
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isStravaConnected, checkStravaConnection]);

  // ✅ Rendu conditionnel amélioré
  if (!profile) {
    return (
      <div className={styles.loading}>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.heading}>
        <h1>Strava</h1>
      </div>
      
      <div className={styles.profileEdit__strava}>
        {!hasChecked && (
          <div className={styles.checking}>
            <p>Vérification de la connexion Strava...</p>
          </div>
        )}
        
        {hasChecked && (
          <>
            {connectionError && (
              <div className={styles.error}>
                <p>❌ {connectionError}</p>
                {!requiresReauth && (
                  <button 
                    onClick={refreshConnection}
                    className={styles.retryButton}
                    disabled={!hasChecked}
                  >
                    🔄 Réessayer
                  </button>
                )}
              </div>
            )}
            
            {!isStravaConnected && (
              <div className={styles.notConnected}>
                <StravaConnect requiresReauth={requiresReauth} />
                {requiresReauth && (
                  <p className={styles.reauthMessage}>
                    ⚠️ Votre session Strava a expiré. Une nouvelle autorisation est nécessaire.
                  </p>
                )}
              </div>
            )}
            
            {isStravaConnected && (
              <div className={styles.connected}>
                <p>✅ Vous êtes connecté à Strava</p>
                <button 
                  onClick={refreshConnection}
                  className={styles.refreshButton}
                >
                  🔄 Vérifier la connexion
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}