import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '@react-native-vector-icons/feather';
import { Header, Button, Card } from '@/components';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { useScrobbleStore } from '@/context/scrobbleStore';
import { scrobbleNative } from '@/utils/scrobbleNative';
import { ScrobbleStatus } from '@/types/scrobble';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function ScrobbleSettingsScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  const {
    status,
    appSettings,
    lastScrobbleTime,
    recentScrobbles,
    recentScrobblesLoading,
    refreshStatus,
    fetchRecentScrobbles,
    toggleScrobbling,
    toggleApp,
  } = useScrobbleStore();

  useFocusEffect(
    React.useCallback(() => {
      refreshStatus();
      fetchRecentScrobbles();
    }, [refreshStatus, fetchRecentScrobbles])
  );

  // Listen for native scrobble events
  useEffect(() => {
    const subscription = scrobbleNative.onScrobble(() => {
      useScrobbleStore.getState().refreshPendingCount();
    });
    return () => subscription.remove();
  }, []);

  const handleSetUp = () => {
    navigation.navigate('ScrobblePermission');
  };

  const handleOpenSystemSettings = async () => {
    await scrobbleNative.openPermissionSettings();
  };

  const handleToggleScrobbling = async () => {
    await toggleScrobbling();
  };

  const handleToggleApp = async (packageName: string, enabled: boolean) => {
    await toggleApp(packageName, enabled);
  };

  const formatLastScrobble = (timestamp: number | null): string => {
    if (!timestamp) return 'No scrobbles yet';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const formatPlayedAt = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Not set up state
  if (status === ScrobbleStatus.notSetUp) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title="Scrobbling"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.section}>
            <View style={styles.setupIcon}>
              <Icon name="headphones" size={40} color={themeColors.btnPrimaryBg} />
            </View>
            <Text style={[styles.setupTitle, themedStyles.setupTitle]}>Track Your Listening</Text>
            <Text style={[styles.setupDescription, themedStyles.setupDescription]}>
              Automatically keep track of what you listen to across your
              favorite music apps. Scrobbles are synced to your GoodSongs
              profile.
            </Text>
            <Button
              title="Set Up Scrobbling"
              onPress={handleSetUp}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Permission needed state
  if (status === ScrobbleStatus.permissionNeeded) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title="Scrobbling"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.section}>
            <View style={styles.warningRow}>
              <Icon name="alert-triangle" size={20} color={themeColors.warning} />
              <Text style={[styles.warningText, themedStyles.warningText]}>
                Notification access has been revoked. Scrobbling won't work
                until you re-enable it.
              </Text>
            </View>
            <Button
              title="Open System Settings"
              onPress={handleOpenSystemSettings}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active / Paused states
  const isActive = status === ScrobbleStatus.active;

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <Header
        title="Scrobbling"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Enable/Disable Toggle */}
        <Card style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, themedStyles.toggleLabel]}>Scrobbling</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    isActive ? styles.statusDotActive : themedStyles.statusDotPaused,
                  ]}
                />
                <Text style={[styles.statusText, themedStyles.statusText]}>
                  {isActive ? 'Active \u2014 Listening for music' : 'Paused'}
                </Text>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={handleToggleScrobbling}
              trackColor={{
                false: themeColors.borderDefault,
                true: themeColors.btnPrimaryBg,
              }}
              thumbColor={themeColors.bgApp}
            />
          </View>

          {lastScrobbleTime && (
            <Text style={[styles.lastScrobble, themedStyles.lastScrobble]}>
              Last scrobble: {formatLastScrobble(lastScrobbleTime)}
            </Text>
          )}
        </Card>

        {/* App Filter */}
        <Card style={[styles.section, !isActive && styles.sectionDisabled]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Tracked Apps</Text>
          <Text style={[styles.sectionDescription, themedStyles.sectionDescription]}>
            Choose which music apps to track.
          </Text>
          {appSettings.map((app) => (
            <View key={app.packageName} style={[styles.appRow, themedStyles.appRow]}>
              <Text
                style={[
                  styles.appName,
                  themedStyles.appName,
                  !isActive && themedStyles.textDisabled,
                ]}
              >
                {app.displayName}
              </Text>
              <Switch
                value={app.enabled}
                onValueChange={(val) => handleToggleApp(app.packageName, val)}
                disabled={!isActive}
                trackColor={{
                  false: themeColors.borderDefault,
                  true: themeColors.btnPrimaryBg,
                }}
                thumbColor={themeColors.bgApp}
              />
            </View>
          ))}
        </Card>

        {/* Sync Info */}
        <Card style={[styles.section, !isActive && styles.sectionDisabled]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Sync</Text>
          <View style={styles.syncInfo}>
            <Icon name="refresh-cw" size={16} color={isActive ? themeColors.success : themeColors.textMuted} />
            <Text style={[styles.syncText, themedStyles.syncText, !isActive && themedStyles.textDisabled]}>
              Scrobbles sync automatically
            </Text>
          </View>
        </Card>

        {/* Scrobble Log */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Scrobble Log</Text>
          {recentScrobblesLoading && recentScrobbles.length === 0 ? (
            <View style={styles.logLoading}>
              <ActivityIndicator size="small" color={themeColors.btnPrimaryBg} />
              <Text style={[styles.logLoadingText, themedStyles.logLoadingText]}>Loading...</Text>
            </View>
          ) : recentScrobbles.length === 0 ? (
            <Text style={[styles.logEmpty, themedStyles.logEmpty]}>
              No synced scrobbles yet. Scrobbles will appear here once they've been saved.
            </Text>
          ) : (
            recentScrobbles.map((scrobble, index) => (
              <View
                key={scrobble.id}
                style={[
                  styles.logRow,
                  index > 0 && styles.logRowBorder,
                  index > 0 && themedStyles.logRowBorder,
                ]}
              >
                <View style={styles.logRowLeft}>
                  <Text style={[styles.logTrackName, themedStyles.logTrackName]} numberOfLines={1}>
                    {scrobble.track_name}
                  </Text>
                  <Text style={[styles.logArtistName, themedStyles.logArtistName]} numberOfLines={1}>
                    {scrobble.artist_name}
                  </Text>
                </View>
                <Text style={[styles.logTime, themedStyles.logTime]}>
                  {formatPlayedAt(scrobble.played_at)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* System Settings Link */}
        <TouchableOpacity
          style={styles.systemLink}
          onPress={handleOpenSystemSettings}
        >
          <Icon name="settings" size={16} color={themeColors.textMuted} />
          <Text style={[styles.systemLinkText, themedStyles.systemLinkText]}>
            Manage notification access
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    sectionDescription: {
      color: colors.textMuted,
    },
    setupTitle: {
      color: colors.textHeading,
    },
    setupDescription: {
      color: colors.textMuted,
    },
    warningText: {
      color: colors.textSecondary,
    },
    toggleLabel: {
      color: colors.textHeading,
    },
    statusDotPaused: {
      backgroundColor: colors.textMuted,
    },
    statusText: {
      color: colors.textMuted,
    },
    lastScrobble: {
      color: colors.textMuted,
    },
    appRow: {
      borderTopColor: colors.borderSubtle,
    },
    appName: {
      color: colors.textSecondary,
    },
    textDisabled: {
      color: colors.textMuted,
    },
    syncText: {
      color: colors.textSecondary,
    },
    logLoadingText: {
      color: colors.textMuted,
    },
    logEmpty: {
      color: colors.textMuted,
    },
    logRowBorder: {
      borderTopColor: colors.borderSubtle,
    },
    logTrackName: {
      color: colors.textPrimary,
    },
    logArtistName: {
      color: colors.textMuted,
    },
    logTime: {
      color: colors.textPlaceholder,
    },
    systemLinkText: {
      color: colors.textMuted,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.xs,
    lineHeight: 32,
  },
  sectionDescription: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },

  // Setup state
  setupIcon: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  setupTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  setupDescription: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Warning state
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    fontSize: theme.fontSizes.sm,
    flex: 1,
    lineHeight: 20,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#10b981', // success green - consistent across themes
  },
  statusText: {
    fontSize: theme.fontSizes.sm,
  },
  lastScrobble: {
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.sm,
  },

  // App rows
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
  },
  appName: {
    fontSize: theme.fontSizes.base,
  },

  // Sync
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  syncText: {
    fontSize: theme.fontSizes.sm,
  },

  // Scrobble log
  logLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  logLoadingText: {
    fontSize: theme.fontSizes.sm,
  },
  logEmpty: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  logRowBorder: {
    borderTopWidth: 1,
  },
  logRowLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  logTrackName: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  logArtistName: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  logTime: {
    fontSize: theme.fontSizes.xs,
  },

  // System link
  systemLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
  },
  systemLinkText: {
    fontSize: theme.fontSizes.sm,
  },
});
