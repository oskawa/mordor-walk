// public/sw.js - Version améliorée

const CACHE_NAME = 'mordor-walk-v1.2.0';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/badge-72x72.png',
    '/walk.json',
    '/three/path.svg',
    '/three/albedo.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installé');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache ouvert');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('❌ Erreur cache:', error);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activé');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interception des requêtes avec stratégie Cache First pour les assets
self.addEventListener('fetch', (event) => {
    // Cache first pour les assets statiques
    if (event.request.destination === 'image' || 
        event.request.destination === 'script' || 
        event.request.destination === 'style' ||
        event.request.url.includes('/icon-') ||
        event.request.url.includes('/three/')) {
        
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
    }
    // Network first pour les API calls
    else if (event.request.url.includes('/wp-json/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
    }
});

// Gestion améliorée des notifications push
self.addEventListener('push', (event) => {
    console.log('📱 Push reçu:', event);

    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        console.error('❌ Erreur parsing push data:', e);
        data = {
            title: 'Mordor Walk',
            body: 'Nouvelle notification'
        };
    }

    const title = data.title || 'Mordor Walk';
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        tag: data.type || 'general',
        data: {
            ...data.data,
            notificationTime: Date.now(),
            type: data.type
        },
        actions: data.actions || getDefaultActions(data.type),
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: Date.now(),
        renotify: data.type === 'milestone', // Renotifier pour les milestones importantes
        image: data.image, // Image d'en-tête pour certaines notifications
    };

    // Analytics - tracker les notifications reçues
    trackNotification('received', data.type);

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Gestion améliorée des clics sur notifications
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Clic notification:', event);
    
    const notificationData = event.notification.data || {};
    const action = event.action;
    
    event.notification.close();

    // Analytics - tracker les clics
    trackNotification('clicked', notificationData.type, action);

    // Gestion des actions spécifiques
    if (action === 'close') {
        return;
    }

    if (action === 'share' && notificationData.type === 'milestone') {
        // Partage spécial pour les milestones
        event.waitUntil(shareAchievement(notificationData));
        return;
    }

    // URL de destination selon le type de notification
    let targetUrl = '/';
    
    switch (notificationData.type) {
        case 'milestone':
        case 'achievement':
            targetUrl = '/timeline';
            break;
        case 'friend':
            targetUrl = '/friends';
            break;
        case 'group':
            targetUrl = '/groups';
            break;
        default:
            targetUrl = notificationData.url || '/';
    }

    // Ouvrir ou focuser l'app
    event.waitUntil(
        clients.matchAll({ 
            type: 'window',
            includeUncontrolled: true 
        }).then((clientList) => {
            // Chercher une fenêtre ouverte sur notre domaine
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    // Si on a une page ouverte, la naviguer vers la bonne URL
                    if ('navigate' in client) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }

            // Sinon, ouvrir une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Gestion des erreurs de notification
self.addEventListener('notificationerror', (event) => {
    console.error('❌ Erreur notification:', event);
    trackNotification('error', 'unknown');
});

// Fermeture de notification
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notification fermée:', event.notification.tag);
    trackNotification('closed', event.notification.data?.type);
});

// Synchronisation en arrière-plan améliorée
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    switch (event.tag) {
        case 'sync-activities':
            event.waitUntil(syncActivities());
            break;
        case 'sync-milestones':
            event.waitUntil(syncMilestones());
            break;
        case 'sync-offline-actions':
            event.waitUntil(syncOfflineActions());
            break;
    }
});

// Fonctions utilitaires

function getDefaultActions(type) {
    const baseActions = [
        {
            action: 'open',
            title: 'Ouvrir l\'app',
            icon: '/icon-192x192.png'
        },
        {
            action: 'close',
            title: 'Fermer'
        }
    ];

    if (type === 'milestone') {
        baseActions.splice(1, 0, {
            action: 'share',
            title: 'Partager',
            icon: '/share-icon.png'
        });
    }

    return baseActions;
}

function trackNotification(action, type, extra = null) {
    // Analytics simple - stocker dans IndexedDB ou envoyer à votre API
    console.log(`📊 Notification ${action}: ${type}`, extra);
    
    // Vous pouvez implémenter ici un système de tracking
    // par exemple envoyer les données à Google Analytics
    // ou les stocker localement pour envoi ultérieur
}

async function shareAchievement(data) {
    try {
        if ('share' in navigator) {
            await navigator.share({
                title: `🎯 Nouvelle étape atteinte !`,
                text: `J'ai atteint ${data.milestone_km} km dans mon voyage vers le Mordor ! 🗻`,
                url: window.location.origin
            });
        } else {
            // Fallback - copier dans le presse-papiers
            const text = `🎯 J'ai atteint ${data.milestone_km} km dans mon voyage vers le Mordor ! 🗻 ${window.location.origin}`;
            await navigator.clipboard.writeText(text);
            
            // Afficher une notification de confirmation
            self.registration.showNotification('Partagé !', {
                body: 'Le lien a été copié dans votre presse-papiers',
                icon: '/icon-192x192.png',
                tag: 'share-success',
                silent: true
            });
        }
    } catch (error) {
        console.error('❌ Erreur partage:', error);
    }
}

async function syncActivities() {
    try {
        console.log('🔄 Synchronisation activités en arrière-plan');
        
        // Ici vous pouvez implémenter la logique de sync
        // par exemple vérifier s'il y a de nouvelles activités Strava
        
        const response = await fetch('/wp-json/userconnection/v1/checkNewMilestone', {
            headers: {
                'Authorization': 'Bearer ' + await getStoredToken()
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.has_new_milestone && data.new_milestone) {
                // Afficher une notification pour la nouvelle milestone
                self.registration.showNotification('🎯 Nouvelle étape atteinte !', {
                    body: `Félicitations ! Vous avez atteint ${data.new_milestone.km} km !`,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    tag: 'milestone',
                    data: {
                        type: 'milestone',
                        milestone: data.new_milestone
                    },
                    requireInteraction: true,
                    actions: [
                        { action: 'open', title: 'Voir ma progression' },
                        { action: 'share', title: 'Partager' }
                    ]
                });
            }
        }
    } catch (error) {
        console.error('❌ Erreur sync activités:', error);
    }
}

async function syncMilestones() {
    try {
        console.log('🗺️ Synchronisation milestones');
        
        const response = await fetch('/wp-json/content/v1/milestones');
        
        if (response.ok) {
            const data = await response.json();
            
            // Mettre à jour le cache des milestones
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/api/milestones', new Response(JSON.stringify(data)));
        }
    } catch (error) {
        console.error('❌ Erreur sync milestones:', error);
    }
}

async function syncOfflineActions() {
    try {
        console.log('📡 Synchronisation actions hors ligne');
        
        // Synchroniser les actions effectuées hors ligne
        // par exemple les milestones marquées comme vues
        
    } catch (error) {
        console.error('❌ Erreur sync actions offline:', error);
    }
}

async function getStoredToken() {
    // Récupérer le token depuis le localStorage ou IndexedDB
    // Cette fonction dépend de comment vous stockez le token côté client
    return localStorage.getItem('authToken') || '';
}