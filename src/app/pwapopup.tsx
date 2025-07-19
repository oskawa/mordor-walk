"use client";
import React, { useState, useEffect } from "react";
import styles from "./pwa.module.scss";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showFirefoxInstructions, setShowFirefoxInstructions] = useState(false);

  useEffect(() => {
    // Détections améliorées
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const firefox = navigator.userAgent.toLowerCase().includes("firefox");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true; // iOS standalone

    setIsIOS(iOS);
    setIsFirefox(firefox);
    setIsStandalone(standalone);

    // Gestion événement beforeinstallprompt (Chrome/Edge uniquement)
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
    // iOS Safari - Instructions manuelles
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Firefox - Instructions manuelles
    if (isFirefox) {
      setShowFirefoxInstructions(true);
      return;
    }

    // Chrome/Edge - Prompt automatique
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
          console.log("✅ Installation acceptée");
        } else {
          console.log("❌ Installation refusée");
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error("❌ Erreur installation:", error);
      }
    }
  };

  // Ne pas afficher si déjà installé
  if (isStandalone) {
    return null;
  }

  // Afficher le bouton si installation possible
  const canInstall = isIOS || isFirefox || deferredPrompt;
  if (!canInstall) {
    return null;
  }

  return (
    <div className={styles.pwa}>
      <button onClick={handleInstallClick} title="Installer l'application">
        <img src="./header/app.svg" alt="Installer l'application" />
      </button>

      {/* Instructions iOS */}
      {showIOSInstructions && (
        <div className="install-modal" style={modalStyle}>
          <div className="install-content" style={contentStyle}>
            <h3>📱 Installer sur iOS</h3>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <p style={{ color: "black" }}>
                <strong>1.</strong> Tapez sur le bouton "Partager"{" "}
                <span style={{ fontSize: "20px" }}>⬆️</span> en bas de Safari
              </p>
              <p style={{ color: "black" }}>
                <strong>2.</strong> Faites défiler et sélectionnez "Sur l'écran
                d'accueil"
              </p>
              <p style={{ color: "black" }}>
                <strong>3.</strong> Tapez "Ajouter" en haut à droite
              </p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                💡 L'app apparaîtra sur votre écran d'accueil comme une vraie
                application
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              style={buttonStyle}
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Instructions Firefox */}
      {showFirefoxInstructions && (
        <div className="install-modal" style={modalStyle}>
          <div className="install-content" style={contentStyle}>
            <h3>🦊 Installer sur Firefox</h3>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <p style={{ color: "black" }}>
                <strong>1.</strong> Cliquez sur le menu ≡ (trois lignes) en haut
                à droite
              </p>
              <p style={{ color: "black" }}>
                <strong>2.</strong> Sélectionnez "Installer cette application"
              </p>
              <p style={{ color: "black" }}>
                <strong>3.</strong> Confirmez l'installation
              </p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                💡 L'app sera accessible depuis votre bureau ou menu
                applications
              </p>
            </div>
            <button
              onClick={() => setShowFirefoxInstructions(false)}
              style={buttonStyle}
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles pour les modales
const modalStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "15px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  maxWidth: "90%",
  maxHeight: "80%",
  overflow: "auto",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  backgroundColor: "#00C8A0",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
  width: "100%",
};

export default function PopUp() {
  return (
    <div>
      <InstallPrompt />
    </div>
  );
}
