// utils/NotificationManager.js

export class NotificationManager {

    /**
     * Initialiser le système de notifications
     */
    static async initialize() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('❌ Push notifications non supportées');
            return false;
        }

        // Enregistrer le service worker
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker enregistré');
            return registration;
        } catch (error) {
            console.error('❌ Erreur Service Worker:', error);
            return false;
        }
    }

    /**
     * Demander la permission pour les notifications
     */
    static async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        let permission = Notification.permission;

        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        return permission === 'granted';
    }

    /**
     * S'abonner aux notifications push
     */
    static async subscribe(userId, token) {
        const registration = await this.initialize();
        if (!registration) return false;

        const hasPermission = await this.requestPermission();
        if (!hasPermission) return false;

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                )
            });

            // Envoyer l'abonnement au backend
            await fetch(
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
                        userAgent: navigator.userAgent
                    })
                }
            );

            console.log('✅ Abonnement push enregistré');
            return true;
        } catch (error) {
            console.error('❌ Erreur abonnement push:', error);
            return false;
        }
    }

    /**
     * Se désabonner des notifications
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
     * Planifier une notification d'inactivité
     */
    static async scheduleInactivityNotification(userId, token, lastActivityDate) {
        const daysSinceActivity = Math.floor(
            (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        let message = null;
        let scheduleIn = null; // en heures

        if (daysSinceActivity >= 7) {
            message = "🏃‍♂️ Ça fait une semaine qu'on ne vous a pas vu ! Reprenez votre quête vers le Mordor !";
            scheduleIn = 24; // dans 24h
        } else if (daysSinceActivity >= 3) {
            message = "⏰ Votre aventure vous attend ! Il est temps de reprendre la route.";
            scheduleIn = 48; // dans 48h
        }

        if (message && scheduleIn) {
            await fetch(
                `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/scheduleNotification`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId,
                        message,
                        scheduleIn,
                        type: 'inactivity'
                    })
                }
            );
        }
    }

    /**
     * Notifier une activité d'ami
     */
    static async notifyFriendActivity(userId, token, friendName, activityType, distance) {
        const message = `🎉 ${friendName} vient de faire une ${activityType} de ${distance}km ! Suivez son exemple !`;

        await fetch(
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
                    type: 'friend_activity',
                    data: { friendName, activityType, distance }
                })
            }
        );
    }

    /**
     * Utilitaire pour convertir la clé VAPID
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