// ============================================
// Firebase Configuration for InSuite Edu
// ============================================

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser,
    type ConfirmationResult
} from 'firebase/auth';
import {
    getMessaging,
    getToken,
    onMessage,
    type Messaging
} from 'firebase/messaging';
import {
    getFirestore,
    enableIndexedDbPersistence,
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCP811yUI-nYtrCaiA-QoK4L-juMNTOufk",
    authDomain: "insuite-edu.firebaseapp.com",
    projectId: "insuite-edu",
    storageBucket: "insuite-edu.firebasestorage.app",
    messagingSenderId: "304153504703",
    appId: "1:304153504703:web:bc33636220b50f9e478f0a",
    measurementId: "G-LN4Y2TGM51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const firestore = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
    }
});

// Store confirmation result for phone OTP verification
let confirmationResult: ConfirmationResult | null = null;

// ============================================
// Auth Helper Functions
// ============================================

// Setup reCAPTCHA verifier for phone auth
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
            console.log('reCAPTCHA expired');
        }
    });
    return recaptchaVerifier;
}

// Send OTP to phone number
export async function sendPhoneOTP(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<boolean> {
    try {
        // Format phone number with country code
        const formattedPhone = phoneNumber.startsWith('+91')
            ? phoneNumber
            : `+91${phoneNumber}`;

        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

// Verify OTP code
export async function verifyPhoneOTP(otp: string): Promise<FirebaseUser | null> {
    try {
        if (!confirmationResult) {
            throw new Error('No OTP request pending');
        }
        const result = await confirmationResult.confirm(otp);
        confirmationResult = null;
        return result.user;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return null;
    }
}

// Email/Password login
export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ user: FirebaseUser | null; error: string | null }> {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error: unknown) {
        const firebaseError = error as { code?: string };
        let message = 'Login failed';
        switch (firebaseError.code) {
            case 'auth/user-not-found':
                message = 'Account not found';
                break;
            case 'auth/wrong-password':
                message = 'Invalid password';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email format';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later.';
                break;
            case 'auth/invalid-credential':
                message = 'Invalid email or password';
                break;
        }
        return { user: null, error: message };
    }
}

// Create new account with email/password
export async function signupWithEmail(
    email: string,
    password: string
): Promise<{ user: FirebaseUser | null; error: string | null }> {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error: unknown) {
        const firebaseError = error as { code?: string };
        let message = 'Signup failed';
        switch (firebaseError.code) {
            case 'auth/email-already-in-use':
                message = 'Email already registered';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email format';
                break;
        }
        return { user: null, error: message };
    }
}

// Logout
export async function logoutUser(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Auth state observer
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

// ============================================
// Firebase Cloud Messaging (FCM)
// ============================================

// Initialize messaging (only works in browser with service worker support)
let messaging: Messaging | null = null;

export function initializeMessaging(): Messaging | null {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.warn('FCM: Service workers not supported');
        return null;
    }

    if (!messaging) {
        try {
            messaging = getMessaging(app);
        } catch (error) {
            console.error('FCM initialization error:', error);
            return null;
        }
    }
    return messaging;
}

// VAPID Key - Replace with your key from Firebase Console
// Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return null;
        }

        // Initialize messaging
        const msg = initializeMessaging();
        if (!msg) return null;

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Get FCM token
        const token = await getToken(msg, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Check current notification permission status
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
    const msg = initializeMessaging();
    if (!msg) return null;

    return onMessage(msg, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
}

// Show local notification (for foreground messages)
export function showLocalNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            ...options
        });
    }
}

// Send notification to topic (requires backend - this is a placeholder)
// In production, this would call your backend API or Firebase Cloud Functions
export async function sendNoticeNotification(notice: {
    title: string;
    content: string;
    category: string;
    targetAudience: string[];
}): Promise<boolean> {
    try {
        // For web-only implementation without backend,
        // we'll show a local notification to the current user
        // In production, you'd call your backend here

        showLocalNotification(`📢 ${notice.title}`, {
            body: notice.content.substring(0, 100) + (notice.content.length > 100 ? '...' : ''),
            tag: `notice-${Date.now()}`,
            data: { category: notice.category, audience: notice.targetAudience }
        });

        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

export type { FirebaseUser, ConfirmationResult, Messaging };
export default app;

