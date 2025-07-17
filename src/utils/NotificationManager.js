// utils/NotificationManager.js

export class NotificationManager {

    /**
     * Initialiser le système de notifications - Multi-plateforme
     */
    static async initialize() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('❌ Push notifications non supportées');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('✅ Service Worker enregistré');

            // Vérifier les mises à jour
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Mise à jour Service Worker disponible');
            });

            return registration;
        } catch (error) {
            console.error('❌ Erreur Service Worker:', error);
            return false;
        }
    }

    /**
     * Demander la permission - Compatible toutes plateformes
     */
    static async requestPermission() {
        if (!('Notification' in window)) {
            console.log('❌ Notifications non supportées');
            return false;
        }

        let permission = Notification.permission;

        if (permission === 'default') {
            try {
                permission = await Notification.requestPermission();
            } catch (error) {
                // Fallback pour anciens navigateurs
                permission = await new Promise((resolve) => {
                    Notification.requestPermission((result) => {
                        resolve(result);
                    });
                });
            }
        }

        console.log('🔔 Permission notifications:', permission);
        return permission === 'granted';
    }

    /**
     * S'abonner aux notifications VAPID
     */
    static async subscribe(userId, token) {
        const registration = await this.initialize();
        if (!registration) return false;

        const hasPermission = await this.requestPermission();
        if (!hasPermission) return false;

        try {
            // Vérifier si déjà abonné
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('✅ Déjà abonné aux notifications');
                return true;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                )
            });

            // Envoyer au backend
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/subscribePush`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId,
                        subscription: JSON.stringify(subscription),
                        userAgent: navigator.userAgent,
                        platform: this.detectPlatform()
                    })
                }
            );

            if (response.ok) {
                console.log('✅ Abonnement push enregistré');

                // Notification de test
                this.showTestNotification();
                return true;
            } else {
                throw new Error('Erreur serveur');
            }

        } catch (error) {
            console.error('❌ Erreur abonnement push:', error);
            return false;
        }
    }

    /**
     * Se désabonner
     */
    static async unsubscribe(userId, token) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Informer le backend
                await fetch(
                    `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/unsubscribePush`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    }
                );
            }

            console.log('✅ Désabonnement push effectué');
            return true;
        } catch (error) {
            console.error('❌ Erreur désabonnement:', error);
            return false;
        }
    }

    /**
     * Vérifier l'état des notifications
     */
    static async getNotificationStatus() {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

        if (!isSupported) {
            return { supported: false, permission: 'denied', subscribed: false };
        }

        const permission = Notification.permission;
        let subscribed = false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            subscribed = !!subscription;
        } catch (error) {
            console.error('Erreur vérification subscription:', error);
        }

        return {
            supported: isSupported,
            permission,
            subscribed,
            platform: this.detectPlatform()
        };
    }

    /**
     * Notification de test locale
     */
    static showTestNotification() {
        if (Notification.permission === 'granted') {
            new Notification('🎉 Notifications activées !', {
                body: 'Vous recevrez maintenant les notifications de Mordor Walk',
                icon: '/favicon/favicon-192x192.png',
                badge: '/favicon/badge-72x72.png',
                tag: 'test-notification',
                silent: false,
                requireInteraction: false
            });
        }
    }

    /**
     * Envoyer notification via serveur
     */
    static async sendServerNotification(userId, token, message, type = 'general', data = {}) {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/sendNotification`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId,
                        message,
                        type,
                        data: {
                            ...data,
                            timestamp: Date.now(),
                            platform: this.detectPlatform()
                        }
                    })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
            return false;
        }
    }

    /**
     * Détecter la plateforme
     */
    static detectPlatform() {
        const ua = navigator.userAgent;

        if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        if (/Windows/.test(ua)) return 'Windows';
        if (/Mac/.test(ua)) return 'macOS';
        if (/Linux/.test(ua)) return 'Linux';

        return 'Unknown';
    }

    /**
     * Utilitaire VAPID
     */
    static urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}