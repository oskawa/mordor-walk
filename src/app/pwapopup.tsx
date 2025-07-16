"use client";
import React, { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "./actions";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du service worker:",
        error
      );
      setError("Impossible d'enregistrer le service worker");
    }
  }

  async function subscribeToPush() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setError("Clé VAPID manquante");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error);
      setError("Impossible de s'abonner aux notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    setError(null);

    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    } catch (error) {
      console.error("Erreur lors du désabonnement:", error);
      setError("Impossible de se désabonner");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await sendNotification(message);
      setMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setError("Impossible d'envoyer la notification");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div>
      <h3>Notifications</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {subscription ? (
        <>
          <p>Vous ne serez pas déçus ! </p>
          <button onClick={unsubscribeFromPush} disabled={isLoading}>
            {isLoading ? "Chargement..." : "Retirer les notifications"}
          </button>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={sendTestNotification}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? "Envoi..." : "Test"}
          </button>
        </>
      ) : (
        <>
          <p>Promis, on ne vous en envoie pas trop.</p>
          <button onClick={subscribeToPush} disabled={isLoading}>
            {isLoading ? "Chargement..." : "Accepter les notifications"}
          </button>
        </>
      )}
    </div>
  );
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Détection iOS et standalone en une seule fois
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;

    setIsIOS(iOS);
    setIsStandalone(standalone);

    // Gestion de l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
    }
  };

  // Ne pas afficher le bouton si déjà installé ou si pas de prompt disponible
  if (isStandalone || !deferredPrompt) {
    return null;
  }

  return (
    <button onClick={handleInstallClick}>
      <img src="./header/app.svg" alt="Installer l'application" />
    </button>
  );
}

export default function PopUp() {
  return (
    <div>
      <InstallPrompt />
    </div>
  );
}
