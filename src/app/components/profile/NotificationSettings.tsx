"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { NotificationManager } from "../../../utils/NotificationManager";

interface NotificationStatus {
  supported: boolean;
  permission: string;
  subscribed: boolean;
  platform: string;
  iosInfo?: any; // Simplifié pour éviter les conflits TypeScript
}

export default function NotificationSettings() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<NotificationStatus>({
    supported: false,
    permission: 'denied',
    subscribed: false,
    platform: 'Unknown'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const currentStatus = await NotificationManager.getNotificationStatus();
    setStatus(currentStatus);
  };

  const handleEnableNotifications = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setMessage('');

    try {
      console.log('🔔 Démarrage activation notifications pour user:', user.id);
      
      const success = await NotificationManager.subscribe(user.id, token);
      
      if (success) {
        setMessage('✅ Notifications activées avec succès !');
        console.log('✅ Notifications activées avec succès');
        
        // Attendre un peu avant de vérifier le statut
        setTimeout(async () => {
          await checkNotificationStatus();
        }, 2000);
      } else {
        setMessage('❌ Impossible d\'activer les notifications');
        console.error('❌ Échec activation notifications');
      }
    } catch (error) {
      console.error('❌ Erreur activation notifications:', error);
      
      // Messages d'erreur plus spécifiques
      if (error.message.includes('iOS non compatible')) {
        setMessage(`⚠️ ${error.message}`);
      } else if (error.message.includes('Permission')) {
        setMessage('❌ Permission de notifications refusée. Vérifiez les paramètres de votre navigateur.');
      } else if (error.message.includes('Service Worker')) {
        setMessage('❌ Service Worker non disponible. Vérifiez que vous êtes sur HTTPS.');
      } else if (error.message.includes('Erreur serveur')) {
        setMessage('❌ Erreur de communication avec le serveur. Réessayez dans quelques instants.');
      } else {
        setMessage(`❌ Erreur lors de l'activation: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setMessage('');

    try {
      const success = await NotificationManager.unsubscribe(user.id, token);
      
      if (success) {
        setMessage('✅ Notifications désactivées');
        await checkNotificationStatus();
      } else {
        setMessage('❌ Impossible de désactiver les notifications');
      }
    } catch (error) {
      console.error('Erreur désactivation notifications:', error);
      setMessage('❌ Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    try {
      const success = await NotificationManager.sendServerNotification(
        user.id,
        token,
        'Test de notification depuis vos paramètres !',
        'test'
      );
      
      if (success) {
        setMessage('✅ Notification test envoyée');
      } else {
        setMessage('❌ Échec envoi notification test');
      }
    } catch (error) {
      setMessage('❌ Erreur envoi test');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInfo = () => {
    const { platform, supported, permission, iosInfo } = status;
    
    if (!supported) {
      return {
        icon: '❌',
        text: 'Notifications non supportées sur ce navigateur',
        color: '#ff4444'
      };
    }

    if (iosInfo?.isIOS) {
      if (!iosInfo.isSafari) {
        return {
          icon: '⚠️',
          text: 'iOS - Notifications disponibles uniquement dans Safari',
          color: '#FF9500'
        };
      }
      
      if (!iosInfo.isStandalone) {
        return {
          icon: '⚠️',
          text: 'iOS - App doit être installée sur l\'écran d\'accueil',
          color: '#FF9500'
        };
      }
      
      if (!iosInfo.isVersionCompatible) {
        return {
          icon: '⚠️',
          text: `iOS ${iosInfo.iosVersion} - Minimum iOS 16.4 requis`,
          color: '#FF9500'
        };
      }
      
      return {
        icon: '📱',
        text: `iOS ${iosInfo.iosVersion} Safari - Notifications disponibles`,
        color: '#007AFF'
      };
    }

    if (platform.includes('Android')) {
      return {
        icon: '🤖',
        text: 'Android - Notifications push supportées',
        color: '#34C759'
      };
    }

    return {
      icon: '💻',
      text: `${platform} - Notifications supportées`,
      color: '#007AFF'
    };
  };

  const platformInfo = getPlatformInfo();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔔 Paramètres des notifications</h2>
      
      {/* Informations plateforme */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        border: `2px solid ${platformInfo.color}20`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{platformInfo.icon}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Plateforme détectée : {status.platform}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {platformInfo.text}
            </p>
          </div>
        </div>
      </div>

      {/* État actuel */}
      <div style={{ marginBottom: '20px' }}>
        <h3>État actuel</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{status.supported ? '✅' : '❌'}</span>
            <span>Support navigateur</span>
          </li>
          <li style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{status.permission === 'granted' ? '✅' : 
                   status.permission === 'denied' ? '❌' : '⚠️'}</span>
            <span>Permission accordée</span>
          </li>
          <li style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{status.subscribed ? '✅' : '❌'}</span>
            <span>Abonnement actif</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!status.subscribed && status.supported && (
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            style={{
              padding: '15px',
              backgroundColor: '#00C8A0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Activation...' : '🔔 Activer les notifications'}
          </button>
        )}

        {status.subscribed && (
          <>
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              style={{
                padding: '15px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Désactivation...' : '🔕 Désactiver les notifications'}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={loading}
              style={{
                padding: '15px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Envoi...' : '🧪 Envoyer notification test'}
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '8px',
          border: message.includes('✅') ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        }}>
          {message}
        </div>
      )}

      {/* Informations spécifiques iOS */}
      {status.iosInfo?.isIOS && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h4>📱 Informations iOS</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Notifications disponibles depuis iOS 16.4</li>
            <li>Nécessite Safari (pas Chrome iOS)</li>
            <li>L'app doit être ajoutée à l'écran d'accueil</li>
            <li><strong>⚠️ Fonctionnalité en bêta - désactivée par défaut</strong></li>
          </ul>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #dee2e6'
          }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              🔧 Pour activer les notifications iOS :
            </p>
            <ol style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px' }}>
              <li>Ouvrez <strong>Réglages</strong> sur votre iPhone</li>
              <li>Allez dans <strong>Safari</strong></li>
              <li>Tapez <strong>Avancé</strong></li>
              <li>Tapez <strong>Fonctionnalités expérimentales</strong></li>
              <li>Activez <strong>"Notifications"</strong></li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}