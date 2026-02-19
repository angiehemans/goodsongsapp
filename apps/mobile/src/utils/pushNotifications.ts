import {
  getMessaging,
  getToken,
  requestPermission,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { apiClient } from './api';

// Store the current FCM token for unregistration on logout
let currentToken: string | null = null;

/**
 * Request notification permission from the user
 * Returns true if permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    // Android 13+ requires POST_NOTIFICATIONS permission
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Android notification permission denied');
      return false;
    }
  }

  // Request Firebase messaging permission (mainly for iOS)
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Firebase notification permission denied');
  }

  return enabled;
}

/**
 * Register the device for push notifications
 * Gets the FCM token and sends it to the backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Request permission first
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get FCM token
    const messaging = getMessaging();
    const token = await getToken(messaging);
    console.log('FCM Token obtained:', token.substring(0, 20) + '...');

    // Store token for later unregistration
    currentToken = token;

    // Send token to backend
    await apiClient.registerDeviceToken(token, Platform.OS);
    console.log('Device token registered with backend');

    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

/**
 * Unregister the device from push notifications
 * Call this when the user logs out
 */
export async function unregisterFromPushNotifications(): Promise<void> {
  try {
    if (currentToken) {
      await apiClient.unregisterDeviceToken(currentToken);
      console.log('Device token unregistered from backend');
      currentToken = null;
    }
  } catch (error) {
    console.error('Failed to unregister device token:', error);
  }
}

/**
 * Handle incoming notification data and return navigation params if applicable
 * Always navigates to the Notifications screen so users can see and clear all alerts
 */
function getNavigationFromNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): { screen: string; params?: Record<string, unknown> } | null {
  const data = remoteMessage.data;
  if (!data?.type) return null;

  // All notification types navigate to the Notifications/Alerts screen
  // This allows users to see and clear their in-app notifications
  return {
    screen: 'Main',
    params: { screen: 'Notifications' },
  };
}

/**
 * Set up notification handlers for foreground, background, and app launch
 * Returns a cleanup function
 */
export function setupNotificationHandlers(
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void,
  onForegroundNotification?: (notification: FirebaseMessagingTypes.Notification) => void
): () => void {
  const unsubscribers: (() => void)[] = [];
  const messaging = getMessaging();

  // Handle notification when app is in foreground
  const foregroundUnsubscribe = onMessage(messaging, async (remoteMessage) => {
    console.log('Foreground notification received:', remoteMessage);

    // Call the foreground handler if provided (e.g., to show an in-app alert)
    if (onForegroundNotification && remoteMessage.notification) {
      onForegroundNotification(remoteMessage.notification);
    }
  });
  unsubscribers.push(foregroundUnsubscribe);

  // Handle notification tap when app is in background
  const backgroundUnsubscribe = onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);

    const nav = getNavigationFromNotification(remoteMessage);
    if (nav && onNavigate) {
      onNavigate(nav.screen, nav.params);
    }
  });
  unsubscribers.push(backgroundUnsubscribe);

  // Handle notification tap when app was closed (cold start)
  getInitialNotification(messaging).then((remoteMessage) => {
    if (remoteMessage) {
      console.log('App opened from notification (cold start):', remoteMessage);

      const nav = getNavigationFromNotification(remoteMessage);
      if (nav && onNavigate) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          onNavigate(nav.screen, nav.params);
        }, 1000);
      }
    }
  });

  // Listen for token refresh and update backend
  const tokenRefreshUnsubscribe = onTokenRefresh(messaging, async (token) => {
    console.log('FCM token refreshed');
    currentToken = token;
    try {
      await apiClient.registerDeviceToken(token, Platform.OS);
      console.log('Refreshed token registered with backend');
    } catch (error) {
      console.error('Failed to register refreshed token:', error);
    }
  });
  unsubscribers.push(tokenRefreshUnsubscribe);

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Check if the app has notification permissions
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const messaging = getMessaging();
  const authStatus = await hasPermission(messaging);
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Get the current FCM token (if registered)
 */
export function getCurrentToken(): string | null {
  return currentToken;
}
