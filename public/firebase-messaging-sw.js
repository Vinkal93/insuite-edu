// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration (same as main app)
const firebaseConfig = {
    apiKey: "AIzaSyCP811yUI-nYtrCaiA-QoK4L-juMNTOufk",
    authDomain: "insuite-edu.firebaseapp.com",
    projectId: "insuite-edu",
    storageBucket: "insuite-edu.firebasestorage.app",
    messagingSenderId: "304153504703",
    appId: "1:304153504703:web:bc33636220b50f9e478f0a",
    measurementId: "G-LN4Y2TGM51"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'InSuite Edu';
    const notificationOptions = {
        body: payload.notification?.body || 'New notification',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: payload.data?.tag || 'insuite-notification',
        data: payload.data,
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'View' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow('/notices');
            }
        })
    );
});
