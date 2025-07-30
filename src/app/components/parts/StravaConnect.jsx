import { useState } from "react";

const StravaConnect = ({ requiresReauth = false }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ Utilisation de vos variables d'environnement existantes
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT;

  const handleConnect = () => {
    // ✅ Validation des variables d'environnement
    if (!clientId || !redirectUri) {
      console.error("❌ Configuration Strava manquante:", {
        clientId: !!clientId,
        redirectUri: !!redirectUri,
      });
      alert("Configuration Strava incomplète. Contactez l'administrateur.");
      return;
    }

    setIsConnecting(true);

    try {
      // ✅ Construction améliorée de l'URL avec gestion du callback
      const finalRedirectUri = new URL(redirectUri);
      finalRedirectUri.searchParams.set("stravaCallback", "true");

      const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: finalRedirectUri.toString(),
        scope: "read,activity:read",
        approval_prompt: requiresReauth ? "force" : "auto", // Force reauth si nécessaire
        state: Date.now().toString(), // Protection CSRF basique
      });

      const authUrl = `https://www.strava.com/oauth/authorize?${authParams.toString()}`;

      console.log("🔗 Redirection vers Strava:", authUrl);
      console.log("🔄 Reauth requis:", requiresReauth);

      window.location.href = authUrl;
    } catch (error) {
      console.error("❌ Erreur lors de la connexion Strava:", error);
      alert("Erreur lors de la connexion à Strava. Veuillez réessayer.");
      setIsConnecting(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn-strava"
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          opacity: isConnecting ? 0.6 : 1,
          cursor: isConnecting ? "not-allowed" : "pointer",
          position: "relative",
        }}
      >
        <img src="./images/btn-strava.png" alt="Se connecter avec Strava" />

        {/* ✅ Indicateur de chargement */}
        {isConnecting && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            Connexion...
          </div>
        )}
      </button>

      {/* ✅ Message d'information pour la ré-autorisation */}
      {requiresReauth && (
        <p
          style={{
            fontSize: "12px",
            color: "#e65100",
            marginTop: "8px",
            fontWeight: "500",
          }}
        >
          ⚠️ Autorisation expirée - reconnexion nécessaire
        </p>
      )}
    </div>
  );
};

export default StravaConnect;
