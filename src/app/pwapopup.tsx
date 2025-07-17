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
    // Détection iOS améliorée
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;

    setIsIOS(iOS);
    setIsStandalone(standalone);

    // Gestion de l'événement beforeinstallprompt (uniquement Android/Chrome)
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
    if (isIOS) {
      // Sur iOS, afficher les instructions
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      // Android/Chrome avec prompt automatique
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
    } else {
      // Desktop sans prompt automatique - instructions manuelles
      alert(`Pour installer l'application sur votre ordinateur :

Chrome/Edge :
1. Cliquez sur l'icône ⬇️ dans la barre d'adresse
2. Ou Menu (⋮) → "Installer Mordor Walk"

Firefox :
1. Menu (☰) → "Installer cette application"

L'application apparaîtra dans votre menu Démarrer !`);
    }
  };

  // Ne pas afficher si déjà installé
  if (isStandalone) {
    return null;
  }

  // Afficher le bouton si iOS OU si prompt disponible OU si on est sur desktop
  const isDesktop = !(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const shouldShowButton = isIOS || deferredPrompt || isDesktop;

  if (!shouldShowButton) {
    return null;
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

export default InstallPrompt;