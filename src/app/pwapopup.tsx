"use client";
import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Détection iOS et standalone
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // iOS - Instructions Safari
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Android/Desktop avec prompt automatique
    if (deferredPrompt) {
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
    }
  };

  // ✅ VOTRE LOGIQUE ORIGINALE : afficher si iOS OU si prompt disponible
  if (isStandalone) {
    return null; // Déjà installé
  }

  // Afficher le bouton si iOS OU si prompt disponible
  if (!isIOS && !deferredPrompt) {
    return null; // Pas iOS et pas de prompt = pas de bouton
  }

  return (
    <div>
      <button onClick={handleInstallClick}>
        <img src="./header/app.svg" alt="Installer l'application" />
      </button>

      {/* Instructions pour iOS */}
      {showIOSInstructions && (
        <div className="ios-install-instructions" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '90%'
        }}>
          <h3>📱 Installer sur iOS</h3>
          <ol>
            <li>Tapez sur le bouton "Partager" <span style={{fontSize: '18px'}}>⬆️</span></li>
            <li>Sélectionnez "Sur l'écran d'accueil"</li>
            <li>Tapez "Ajouter"</li>
          </ol>
          <button 
            onClick={() => setShowIOSInstructions(false)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#00C8A0',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Compris !
          </button>
        </div>
      )}
    </div>
  );
}

export default function PopUp() {
  return (
    <div>
      <InstallPrompt />
    </div>
  );
}