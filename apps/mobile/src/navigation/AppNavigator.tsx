import React, { useEffect, useRef } from "react";
import { AppState, Platform, View, Text, StyleSheet } from "react-native";
import BootSplash from "react-native-bootsplash";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/feather";

type IconName = React.ComponentProps<typeof Icon>["name"];

import { LoadingScreen } from "@/components";
import { useAuthStore } from "@/context/authStore";
import { useScrobbleStore } from "@/context/scrobbleStore";
import { useNotificationStore } from "@/context/notificationStore";
import { useThemeStore } from "@/context/themeStore";
import { scrobbleNative } from "@/utils/scrobbleNative";
import {
  registerForPushNotifications,
  setupNotificationHandlers,
} from "@/utils/pushNotifications";
import type { NowPlayingTrack } from "@/types/scrobble";
import { theme } from "@/theme";

import {
  WelcomeScreen,
  LoginScreen,
  SignupScreen,
  FeedScreen,
  DiscoverScreen,
  ProfileScreen,
  SettingsScreen,
  EditProfileScreen,
  NotificationsScreen,
  UserProfileScreen,
  BandProfileScreen,
  CreateReviewScreen,
  CreateEventScreen,
  BandDashboardScreen,
  MyBandProfileScreen,
  EditBandScreen,
  EventDetailsScreen,
  ScrobblePermissionScreen,
  ScrobbleSettingsScreen,
  OnboardingAccountTypeScreen,
  OnboardingFanProfileScreen,
  OnboardingBandProfileScreen,
  ReviewDetailScreen,
} from "@/screens";

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Navigator (Welcome, Login, Signup)
function AuthNavigator() {
  const themeColors = useThemeStore((state) => state.colors);

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.bgApp },
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator (Home, Discover, Profile)
function MainNavigator() {
  const insets = useSafeAreaInsets();
  const { role } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const themeColors = useThemeStore((state) => state.colors);
  const isBandAccount = role === "band";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IconName;

          switch (route.name) {
            case "Home":
              iconName = isBandAccount ? "bar-chart-2" : "home";
              break;
            case "Discover":
              iconName = "compass";
              break;
            case "CreateReview":
              iconName = "plus-circle";
              break;
            case "CreateEvent":
              iconName = "calendar";
              break;
            case "Notifications":
              iconName = "bell";
              break;
            case "Profile":
              iconName = isBandAccount ? "music" : "user";
              break;
            default:
              iconName = "circle";
          }

          // Add badge for notifications
          if (route.name === "Notifications" && unreadCount > 0) {
            return (
              <View>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: themeColors.tabBarActive,
        tabBarInactiveTintColor: themeColors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: themeColors.tabBarBg,
          // borderTopColor: themeColors.textInverse,
          // borderTopWidth: 2,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={isBandAccount ? BandDashboardScreen : FeedScreen}
        options={{ tabBarLabel: isBandAccount ? "Dashboard" : "Home" }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: "Discover" }}
      />
      {isBandAccount ? (
        <Tab.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ tabBarLabel: "Event" }}
        />
      ) : (
        <Tab.Screen
          name="CreateReview"
          component={CreateReviewScreen}
          options={{ tabBarLabel: "Recommend" }}
        />
      )}
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: "Alerts" }}
      />
      <Tab.Screen
        name="Profile"
        component={isBandAccount ? MyBandProfileScreen : ProfileScreen}
        options={{ tabBarLabel: isBandAccount ? "Band" : "Profile" }}
      />
    </Tab.Navigator>
  );
}

// Navigation ref for push notification navigation
const navigationRef =
  React.createRef<NavigationContainerRef<RootStackParamList>>();

// Root Navigator
export function AppNavigator() {
  const { isAuthenticated, isLoading, isOnboardingComplete, loadAuth } =
    useAuthStore();
  const startPolling = useNotificationStore((state) => state.startPolling);
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount,
  );

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!isLoading) {
      BootSplash.hide({ fade: true });
    }
  }, [isLoading]);

  // Start notification polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = startPolling(60000); // Poll every 60 seconds
    return cleanup;
  }, [isAuthenticated, startPolling]);

  // Register for push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated || !isOnboardingComplete) return;

    // Register device for push notifications
    registerForPushNotifications();

    // Set up notification handlers
    const cleanup = setupNotificationHandlers(
      // Navigation handler - called when user taps a notification
      (screen, params) => {
        if (navigationRef.current?.isReady()) {
          // @ts-ignore - dynamic navigation
          navigationRef.current.navigate(screen, params);
        }
      },
      // Foreground notification handler - refresh notification count
      () => {
        fetchUnreadCount();
      },
    );

    return cleanup;
  }, [isAuthenticated, isOnboardingComplete, fetchUnreadCount]);

  // Listen for native scrobble events so auto-sync works from any screen
  // Also sync pending scrobbles when the app is opened or foregrounded
  const hassynced = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || Platform.OS !== "android") return;
    hassynced.current = false;

    // Flush any scrobbles accumulated while the app was closed
    const flushPending = () => {
      const store = useScrobbleStore.getState();
      store.refreshPendingCount().then(() => {
        if (useScrobbleStore.getState().pendingCount > 0) {
          store.syncNow();
        }
      });
    };

    // Sync once on mount (app just opened)
    flushPending();
    hassynced.current = true;

    // Sync again each time the app comes back to the foreground
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && hassynced.current) {
        flushPending();
      }
    });

    const scrobbleSub = scrobbleNative.onScrobble(() => {
      useScrobbleStore.getState().refreshPendingCount();
      useScrobbleStore.getState().fetchLocalScrobbles();
      useScrobbleStore.getState().autoSync();
    });

    const nowPlayingSub = scrobbleNative.onNowPlaying((event) => {
      if (event && "trackName" in event && event.trackName) {
        useScrobbleStore.getState().setNowPlaying(event as NowPlayingTrack);
      } else {
        useScrobbleStore.getState().setNowPlaying(null);
      }
    });

    return () => {
      appStateSub.remove();
      scrobbleSub.remove();
      nowPlayingSub.remove();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          isOnboardingComplete ? (
            <>
              <RootStack.Screen name="Main" component={MainNavigator} />
              <RootStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="BandProfile"
                component={BandProfileScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="EditBand"
                component={EditBandScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="ScrobblePermission"
                component={ScrobblePermissionScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="ScrobbleSettings"
                component={ScrobbleSettingsScreen}
                options={{ presentation: "card" }}
              />
              <RootStack.Screen
                name="ReviewDetail"
                component={ReviewDetailScreen}
                options={{ presentation: "card" }}
              />
            </>
          ) : (
            <>
              <RootStack.Screen
                name="OnboardingAccountType"
                component={OnboardingAccountTypeScreen}
              />
              <RootStack.Screen
                name="OnboardingFanProfile"
                component={OnboardingFanProfileScreen}
              />
              <RootStack.Screen
                name="OnboardingBandProfile"
                component={OnboardingBandProfileScreen}
              />
            </>
          )
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -8,
    top: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
