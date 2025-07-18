// utils/NotificationManager.js - Version améliorée avec support iOS

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
     * Demander la permission - Compatible iOS 16.4+
     */
    static async requestPermission() {
        if (!('Notification' in window)) {
            console.log('❌ Notifications non supportées');
            return false;
        }

        // Vérifications spécifiques iOS
        const iosInfo = this.getIOSInfo();
        if (iosInfo.isIOS && !iosInfo.isCompatible) {
            console.log('❌ iOS non compatible:', iosInfo.reason);
            return false;
        }

        let permission = Notification.permission;

        if (permission === 'default') {
            try {
                // Pour iOS, la permission doit être demandée lors d'un geste utilisateur
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
     * Obtenir les informations iOS
     */
    static getIOSInfo() {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        
        if (!isIOS) {
            return { isIOS: false, isCompatible: true };
        }

        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone === true;

        // Vérifier la version iOS
        const iosVersion = this.getIOSVersion();
        const isVersionCompatible = iosVersion >= 16.4;

        let reason = '';
        let isCompatible = true;

        if (!isSafari) {
            reason = 'Chrome iOS non supporté, utilisez Safari';
            isCompatible = false;
        } else if (!isStandalone) {
            reason = 'App doit être installée sur l\'écran d\'accueil';
            isCompatible = false;
        } else if (!isVersionCompatible) {
            reason = `iOS ${iosVersion} non supporté, minimum iOS 16.4`;
            isCompatible = false;
        }

        return {
            isIOS: true,
            isSafari,
            isStandalone,
            iosVersion,
            isVersionCompatible,
            isCompatible,
            reason
        };
    }

    /**
     * Obtenir la version iOS
     */
    static getIOSVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
        
        if (match) {
            const major = parseInt(match[1], 10);
            const minor = parseInt(match[2], 10);
            const patch = parseInt(match[3] || '0', 10);
            return parseFloat(`${major}.${minor}${patch > 0 ? `.${patch}` : ''}`);
        }
        
        return 0;
    }

    /**
     * S'abonner aux notifications VAPID avec support iOS
     */
    static async subscribe(userId, token) {
        const registration = await this.initialize();
        if (!registration) return false;

        const iosInfo = this.getIOSInfo();
        if (iosInfo.isIOS && !iosInfo.isCompatible) {
            console.log('❌ iOS non compatible:', iosInfo.reason);
            throw new Error(`iOS non compatible: ${iosInfo.reason}`);
        }

        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
            console.log('❌ Permission refusée');
            throw new Error('Permission de notifications refusée');
        }

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
                        platform: this.detectPlatform(),
                        iosInfo: iosInfo.isIOS ? iosInfo : null
                    })
                }
            );

            if (response.ok) {
                console.log('✅ Abonnement push enregistré');

                // Notification de test adaptée à iOS
                if (iosInfo.isIOS) {
                    this.showIOSTestNotification();
                } else {
                    this.showTestNotification();
                }
                return true;
            } else {
                throw new Error('Erreur serveur');
            }

        } catch (error) {
            console.error('❌ Erreur abonnement push:', error);
            throw error;
        }
    }

    /**
     * Vérifier l'état des notifications avec détails iOS
     */
    static async getNotificationStatus() {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        const iosInfo = this.getIOSInfo();
        const platform = this.detectPlatform();

        if (!isSupported) {
            return { 
                supported: false, 
                permission: 'denied', 
                subscribed: false,
                platform: platform,
                iosInfo: iosInfo.isIOS ? iosInfo : null
            };
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
            platform: platform,
            iosInfo: iosInfo.isIOS ? iosInfo : null
        };
    }

    /**
     * Notification de test pour iOS
     */
    static showIOSTestNotification() {
        if (Notification.permission === 'granted') {
            new Notification('🎉 Notifications iOS activées !', {
                body: 'Félicitations ! Vous recevrez les notifications Mordor Walk sur iOS',
                icon: '/favicon/favicon-192x192.png',
                badge: '/favicon/badge-72x72.png',
                tag: 'ios-test-notification',
                silent: false,
                requireInteraction: false
            });
        }
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
     * Détecter la plateforme avec informations iOS
     */
    static detectPlatform() {
        const ua = navigator.userAgent;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone === true;

        if (/iPad|iPhone|iPod/.test(ua)) {
            const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
            const iosVersion = this.getIOSVersion();
            return `iOS ${iosVersion}${isSafari ? ' Safari' : ' Chrome'}${isStandalone ? ' PWA' : ''}`;
        }
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