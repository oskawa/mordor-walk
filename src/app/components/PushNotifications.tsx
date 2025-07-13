// components/PushNotifications.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface PushNotificationsProps {
  vapidPublicKey: string; // À passer depuis vos variables d'environnement
}

interface NotificationState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  subscription: PushSubscription | null;
}

export default function PushNotifications({ vapidPublicKey }: PushNotificationsProps) {
  const { user, token } = useAuth();
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    isSubscribed: false,
    isSupported: false,
    subscription: null
  });

  // Vérifier le support des notifications
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setNotificationState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied'
      }));
    };

    checkSupport();
  }, []);

  // Vérifier l'abonnement existant
  useEffect(() => {
    if (!notificationState.isSupported || !user) return;

    checkExistingSubscription();
  }, [notificationState.isSupported, user]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setNotificationState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription
      }));

      console.log('🔔 Abonnement existant:', !!subscription);
    } catch (error) {
      console.error('❌ Erreur vérification abonnement:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!notificationState.isSupported) {
      console.log('❌ Notifications non supportées');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setNotificationState(prev => ({
        ...prev,
        permission
      }));

      console.log('🔔 Permission notifications:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Erreur demande permission:', error);
      return false;
    }
  };

  const subscribeUser = async (): Promise<boolean> => {
    if (!notificationState.isSupported || !user || !token) {
      console.log('❌ Conditions non remplies pour abonnement');
      return false;
    }

    try {
      // Demander la permission si nécessaire
      if (notificationState.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Obtenir l'enregistrement du service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Créer l'abonnement
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('✅ Abonnement créé:', subscription);

      // Envoyer l'abonnement au serveur
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/subscribePush`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent,
          }),
        }
      );

      if (response.ok) {
        setNotificationState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription
        }));

        console.log('✅ Abonnement sauvegardé sur le serveur');
        
        // Afficher une notification de test
        showTestNotification();
        
        return true;
      } else {
        throw new Error('Erreur sauvegarde serveur');
      }

    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      return false;
    }
  };

  const unsubscribeUser = async (): Promise<boolean> => {
    if (!notificationState.subscription || !token) return false;

    try {
      // Désabonner côté client
      const success = await notificationState.subscription.unsubscribe();
      
      if (success) {
        // Supprimer côté serveur
        await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/unsubscribePush`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setNotificationState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null
        }));

        console.log('✅ Désabonnement réussi');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur désabonnement:', error);
      return false;
    }
  };

  const showTestNotification = () => {
    if (notificationState.permission === 'granted') {
      new Notification('🎉 Notifications activées !', {
        body: 'Vous recevrez maintenant les notifications de Mordor Walk',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification',
        silent: false
      });
    }
  };

  const sendTestNotification = async () => {
    if (!token || !user) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/sendNotification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            message: 'Ceci est une notification de test depuis votre serveur !',
            type: 'general',
            data: {
              testMode: true,
              timestamp: Date.now()
            }
          }),
        }
      );

      console.log('📤 Notification de test envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi test:', error);
    }
  };

  // UI du composant
  if (!notificationState.isSupported) {
    return (
      <div className="notification-settings">
        <div className="alert alert-warning">
          <h3>❌ Notifications non supportées</h3>
          <p>Votre navigateur ne supporte pas les notifications push.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="notification-header">
        <h3>🔔 Notifications Push</h3>
        <p>Recevez des notifications pour vos nouvelles étapes et succès !</p>
      </div>

      <div className="notification-status">
        <div className="status-item">
          <strong>Permission :</strong>
          <span className={`status ${notificationState.permission}`}>
            {getPermissionText(notificationState.permission)}
          </span>
        </div>

        <div className="status-item">
          <strong>Abonnement :</strong>
          <span className={`status ${notificationState.isSubscribed ? 'granted' : 'denied'}`}>
            {notificationState.isSubscribed ? '✅ Actif' : '❌ Inactif'}
          </span>
        </div>
      </div>

      <div className="notification-actions">
        {notificationState.permission === 'denied' && (
          <div className="alert alert-error">
            <p>Les notifications sont bloquées. Débloquez-les dans les paramètres de votre navigateur.</p>
          </div>
        )}

        {notificationState.permission === 'default' && (
          <button 
            onClick={requestPermission}
            className="btn btn-primary"
          >
            📱 Autoriser les notifications
          </button>
        )}

        {notificationState.permission === 'granted' && !notificationState.isSubscribed && (
          <button 
            onClick={subscribeUser}
            className="btn btn-success"
          >
            🔔 Activer les notifications
          </button>
        )}

        {notificationState.isSubscribed && (
          <div className="subscribed-actions">
            <button 
              onClick={unsubscribeUser}
              className="btn btn-danger"
            >
              🔕 Désactiver les notifications
            </button>
            
            <button 
              onClick={sendTestNotification}
              className="btn btn-secondary"
            >
              🧪 Tester une notification
            </button>
          </div>
        )}
      </div>

      {/* Informations détaillées pour le debug */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>🔧 Informations techniques</summary>
          <pre>{JSON.stringify(notificationState, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// Fonctions utilitaires

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getPermissionText(permission: NotificationPermission): string {
  switch (permission) {
    case 'granted':
      return '✅ Autorisées';
    case 'denied':
      return '❌ Bloquées';
    case 'default':
      return '⏳ En attente';
    default:
      return '❓ Inconnue';
  }
}