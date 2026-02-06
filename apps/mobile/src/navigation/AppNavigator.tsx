import React, { useEffect, useRef } from 'react';
import { AppState, Platform, View, Text, StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';

import { LoadingScreen } from '@/components';
import { useAuthStore } from '@/context/authStore';
import { useScrobbleStore } from '@/context/scrobbleStore';
import { useNotificationStore } from '@/context/notificationStore';
import { scrobbleNative } from '@/utils/scrobbleNative';
import type { NowPlayingTrack } from '@/types/scrobble';
import { theme, colors } from '@/theme';

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
} from '@/screens';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Navigator (Welcome, Login, Signup)
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.grape[0] },
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
  const { accountType } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const isBandAccount = accountType === 'band';

  // Fetch unread count on mount and when app becomes active
  useEffect(() => {
    fetchUnreadCount();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [fetchUnreadCount]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = isBandAccount ? 'bar-chart-2' : 'home';
              break;
            case 'Discover':
              iconName = 'compass';
              break;
            case 'CreateReview':
              iconName = 'plus-circle';
              break;
            case 'CreateEvent':
              iconName = 'calendar';
              break;
            case 'Notifications':
              iconName = 'bell';
              break;
            case 'Profile':
              iconName = isBandAccount ? 'music' : 'user';
              break;
            default:
              iconName = 'circle';
          }

          // Add badge for notifications
          if (route.name === 'Notifications' && unreadCount > 0) {
            return (
              <View>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: colors.grey[5],
        tabBarStyle: {
          backgroundColor: colors.grape[0],
          borderTopColor: colors.grape[2],
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={isBandAccount ? BandDashboardScreen : FeedScreen}
        options={{ tabBarLabel: isBandAccount ? 'Dashboard' : 'Home' }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      {isBandAccount ? (
        <Tab.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ tabBarLabel: 'Event' }}
        />
      ) : (
        <Tab.Screen
          name="CreateReview"
          component={CreateReviewScreen}
          options={{ tabBarLabel: 'Recommend' }}
        />
      )}
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="Profile"
        component={isBandAccount ? MyBandProfileScreen : ProfileScreen}
        options={{ tabBarLabel: isBandAccount ? 'Band' : 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export function AppNavigator() {
  const { isAuthenticated, isLoading, isOnboardingComplete, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!isLoading) {
      BootSplash.hide({ fade: true });
    }
  }, [isLoading]);

  // Listen for native scrobble events so auto-sync works from any screen
  // Also sync pending scrobbles when the app is opened or foregrounded
  const hassynced = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || Platform.OS !== 'android') return;
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
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && hassynced.current) {
        flushPending();
      }
    });

    const scrobbleSub = scrobbleNative.onScrobble(() => {
      useScrobbleStore.getState().refreshPendingCount();
      useScrobbleStore.getState().fetchLocalScrobbles();
      useScrobbleStore.getState().autoSync();
    });

    const nowPlayingSub = scrobbleNative.onNowPlaying((event) => {
      if (event && 'trackName' in event && event.trackName) {
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
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          isOnboardingComplete ? (
            <>
              <RootStack.Screen name="Main" component={MainNavigator} />
              <RootStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="BandProfile"
                component={BandProfileScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="EditBand"
                component={EditBandScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="ScrobblePermission"
                component={ScrobblePermissionScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="ScrobbleSettings"
                component={ScrobbleSettingsScreen}
                options={{ presentation: 'card' }}
              />
              <RootStack.Screen
                name="ReviewDetail"
                component={ReviewDetailScreen}
                options={{ presentation: 'card' }}
              />
            </>
          ) : (
            <>
              <RootStack.Screen name="OnboardingAccountType" component={OnboardingAccountTypeScreen} />
              <RootStack.Screen name="OnboardingFanProfile" component={OnboardingFanProfileScreen} />
              <RootStack.Screen name="OnboardingBandProfile" component={OnboardingBandProfileScreen} />
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
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
