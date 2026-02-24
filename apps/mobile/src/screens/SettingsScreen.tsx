import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '@react-native-vector-icons/feather';
import { Header, TextInput, Button, Card } from '@/components';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/context/themeStore';
import { SemanticColors } from '@/theme/semanticColors';
import { useAuthStore } from '@/context/authStore';
import { useScrobbleStore } from '@/context/scrobbleStore';
import { ScrobbleStatus } from '@/types/scrobble';
import { apiClient, StreamingPlatform, STREAMING_PLATFORMS } from '@/utils/api';
import { LastFmStatus } from '@goodsongs/api-client';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function SettingsScreen({ navigation }: Props) {
  const { user, logout, accountType, refreshUser } = useAuthStore();
  const isBandAccount = accountType === 'band';

  // Theme state
  const { colors } = useTheme();
  const { colorScheme, useSystemTheme, setColorScheme, setUseSystemTheme } = useThemeStore();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  // Last.fm state
  const [lastFmStatus, setLastFmStatus] = useState<LastFmStatus | null>(null);
  const [lastFmLoading, setLastFmLoading] = useState(true);
  const [lastFmUsername, setLastFmUsername] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Streaming platform state
  const [streamingPlatformLoading, setStreamingPlatformLoading] = useState(false);

  useEffect(() => {
    // Only check Last.fm status for fan accounts
    if (!isBandAccount) {
      checkLastFmStatus();
    } else {
      setLastFmLoading(false);
    }
  }, [isBandAccount]);

  const checkLastFmStatus = async () => {
    try {
      setLastFmLoading(true);
      const status = await apiClient.getLastFmStatus();
      setLastFmStatus(status);
    } catch (err) {
      console.error('Failed to check Last.fm status:', err);
      setLastFmStatus({ connected: false, username: null });
    } finally {
      setLastFmLoading(false);
    }
  };

  const handleConnectLastFm = async () => {
    if (!lastFmUsername.trim()) {
      setError('Please enter your Last.fm username');
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      const result = await apiClient.connectLastFm(lastFmUsername.trim());
      setLastFmStatus({
        connected: true,
        username: result.username,
      });
      setLastFmUsername('');
      Alert.alert('Connected!', `Successfully connected to Last.fm as ${result.username}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Last.fm';
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectLastFm = async () => {
    Alert.alert(
      'Disconnect Last.fm',
      'Are you sure you want to disconnect your Last.fm account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setDisconnecting(true);
              await apiClient.disconnectLastFm();
              setLastFmStatus({ connected: false, username: null });
              Alert.alert('Disconnected', 'Successfully disconnected from Last.fm');
            } catch (err) {
              Alert.alert('Error', 'Failed to disconnect from Last.fm');
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  // Email resend countdown timer
  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      Alert.alert('Email Sent', response.message || 'Confirmation email has been sent.');
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send confirmation email';
      Alert.alert('Error', message);
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = user?.can_resend_confirmation && retryAfter === 0;

  // Scrobble state (Android only)
  const isAndroid = Platform.OS === 'android';
  const { status: scrobbleStatus, refreshStatus: refreshScrobbleStatus } =
    useScrobbleStore();

  useFocusEffect(
    React.useCallback(() => {
      if (isAndroid && !isBandAccount) {
        refreshScrobbleStatus();
      }
    }, [isAndroid, isBandAccount, refreshScrobbleStatus])
  );

  const getScrobbleStatusLabel = () => {
    switch (scrobbleStatus) {
      case ScrobbleStatus.active:
        return 'Active';
      case ScrobbleStatus.paused:
        return 'Paused';
      case ScrobbleStatus.permissionNeeded:
        return 'Permission needed';
      default:
        return 'Not set up';
    }
  };

  const getScrobbleStatusColor = () => {
    switch (scrobbleStatus) {
      case ScrobbleStatus.active:
        return colors.success;
      case ScrobbleStatus.paused:
        return colors.textMuted;
      case ScrobbleStatus.permissionNeeded:
        return colors.warning;
      default:
        return colors.textPlaceholder;
    }
  };

  const handleToggleDarkMode = async () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    await setColorScheme(newScheme);
  };

  const handleToggleSystemTheme = async (value: boolean) => {
    await setUseSystemTheme(value);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleStreamingPlatformChange = async (platform: StreamingPlatform | null) => {
    setStreamingPlatformLoading(true);
    try {
      await apiClient.updatePreferredStreamingPlatform(platform);
      await refreshUser();
      Alert.alert(
        'Preferences Updated',
        platform
          ? `${STREAMING_PLATFORMS[platform].name} set as your preferred platform`
          : 'Streaming preference cleared'
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update streaming preference';
      Alert.alert('Error', message);
    } finally {
      setStreamingPlatformLoading(false);
    }
  };

  // Streaming platform options for rendering
  const streamingPlatformOptions: Array<{ key: StreamingPlatform | null; name: string; color?: string }> = [
    { key: null, name: 'No preference' },
    ...Object.entries(STREAMING_PLATFORMS).map(([key, { name, color }]) => ({
      key: key as StreamingPlatform,
      name,
      color,
    })),
  ];

  const renderLastFmSection = () => {
    if (lastFmLoading) {
      return (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Last.fm Connection</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.btnPrimaryBg} />
            <Text style={[styles.loadingText, themedStyles.loadingText]}>Checking Last.fm connection...</Text>
          </View>
        </Card>
      );
    }

    if (lastFmStatus?.connected) {
      return (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Last.fm Connection</Text>
          <View style={styles.connectedContainer}>
            <View style={styles.connectedBadge}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
            <Text style={[styles.usernameText, themedStyles.usernameText]}>
              Connected as <Text style={styles.usernameBold}>{lastFmStatus.username}</Text>
            </Text>
            <Text style={[styles.descriptionText, themedStyles.descriptionText]}>
              Your recently played songs will appear on your dashboard.
            </Text>
            <Button
              title={disconnecting ? 'Disconnecting...' : 'Disconnect'}
              onPress={handleDisconnectLastFm}
              variant="outline"
              disabled={disconnecting}
              style={styles.disconnectButton}
            />
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Last.fm Connection</Text>
        <View style={styles.connectContainer}>
          <Text style={[styles.descriptionText, themedStyles.descriptionText]}>
            Connect your Last.fm account to see your recently played tracks and easily recommend songs you're listening to.
          </Text>
          <TextInput
            placeholder="Your Last.fm username"
            value={lastFmUsername}
            onChangeText={(text: string) => {
              setLastFmUsername(text);
              setError(null);
            }}
            error={error || undefined}
            leftIcon="user"
            containerStyle={styles.input}
          />
          <Button
            title={connecting ? 'Connecting...' : 'Connect Last.fm'}
            onPress={handleConnectLastFm}
            disabled={connecting}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <Header
        title="Settings"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Last.fm Connection - Only for fan accounts */}
        {!isBandAccount && renderLastFmSection()}

        {/* Scrobbling - Android only, fan accounts only */}
        {isAndroid && !isBandAccount && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Listening History</Text>
            <TouchableOpacity
              style={styles.scrobbleRow}
              onPress={() => navigation.navigate('ScrobbleSettings')}
            >
              <View style={styles.scrobbleRowLeft}>
                <Icon name="headphones" size={20} color={colors.textHeading} />
                <View style={styles.scrobbleRowText}>
                  <Text style={[styles.scrobbleRowLabel, themedStyles.scrobbleRowLabel]}>Scrobbling</Text>
                  <View style={styles.scrobbleStatusRow}>
                    <View
                      style={[
                        styles.scrobbleStatusDot,
                        { backgroundColor: getScrobbleStatusColor() },
                      ]}
                    />
                    <Text style={[styles.scrobbleStatusText, themedStyles.scrobbleStatusText]}>
                      {getScrobbleStatusLabel()}
                    </Text>
                  </View>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.iconSubtle} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Appearance Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Appearance</Text>
          <View style={styles.appearanceContainer}>
            <View style={styles.appearanceRow}>
              <View style={styles.appearanceRowLeft}>
                <Icon name="moon" size={20} color={colors.iconDefault} />
                <Text style={[styles.appearanceLabel, themedStyles.appearanceLabel]}>Dark Mode</Text>
              </View>
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={handleToggleDarkMode}
                disabled={useSystemTheme}
                trackColor={{ false: colors.borderDefault, true: colors.btnPrimaryBg }}
                thumbColor={colors.bgApp}
              />
            </View>
            <View style={styles.appearanceRow}>
              <View style={styles.appearanceRowLeft}>
                <Icon name="smartphone" size={20} color={colors.iconDefault} />
                <View>
                  <Text style={[styles.appearanceLabel, themedStyles.appearanceLabel]}>Use System Theme</Text>
                  <Text style={[styles.appearanceDescription, themedStyles.appearanceDescription]}>
                    Automatically match device settings
                  </Text>
                </View>
              </View>
              <Switch
                value={useSystemTheme}
                onValueChange={handleToggleSystemTheme}
                trackColor={{ false: colors.borderDefault, true: colors.btnPrimaryBg }}
                thumbColor={colors.bgApp}
              />
            </View>
          </View>
        </Card>

        {/* Streaming Preferences Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Streaming</Text>
          <Text style={[styles.descriptionText, themedStyles.descriptionText, styles.streamingDescription]}>
            Choose your preferred streaming platform. When available, songs will open directly in this app.
          </Text>
          <View style={styles.streamingContainer}>
            {streamingPlatformOptions.map((option) => {
              const isSelected = (user?.preferred_streaming_platform ?? null) === option.key;
              return (
                <TouchableOpacity
                  key={option.key ?? 'none'}
                  style={[
                    styles.streamingOption,
                    themedStyles.streamingOption,
                    isSelected && styles.streamingOptionSelected,
                    isSelected && themedStyles.streamingOptionSelected,
                  ]}
                  onPress={() => handleStreamingPlatformChange(option.key)}
                  disabled={streamingPlatformLoading}
                  activeOpacity={0.7}
                >
                  <View style={styles.streamingOptionLeft}>
                    {option.color && (
                      <View
                        style={[
                          styles.streamingDot,
                          { backgroundColor: option.color },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.streamingOptionText,
                        themedStyles.streamingOptionText,
                        isSelected && styles.streamingOptionTextSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon name="check" size={18} color={colors.btnPrimaryBg} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Account Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Account</Text>
          <View style={styles.accountRow}>
            <View style={styles.emailLabelRow}>
              <Text style={[styles.accountLabel, themedStyles.accountLabel]}>Email</Text>
              {user?.email_confirmed ? (
                <View style={styles.confirmedBadge}>
                  <Icon name="check" size={10} color="#fff" />
                  <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                </View>
              ) : (
                <View style={styles.unconfirmedBadge}>
                  <Text style={styles.unconfirmedBadgeText}>Unconfirmed</Text>
                </View>
              )}
            </View>
            <Text style={[styles.accountValue, themedStyles.accountValue]}>{user?.email}</Text>
            {!user?.email_confirmed && (
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  themedStyles.resendButton,
                  (!canResend || resendLoading) && styles.resendButtonDisabled,
                ]}
                onPress={handleResendConfirmation}
                disabled={!canResend || resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color={colors.btnPrimaryBg} />
                ) : (
                  <Text style={[styles.resendButtonText, themedStyles.resendButtonText]}>
                    {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend confirmation'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Sign Out Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Sign Out</Text>
          <Text style={[styles.descriptionText, themedStyles.descriptionText]}>
            Sign out of your account on this device
          </Text>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    loadingText: {
      color: colors.textMuted,
    },
    usernameText: {
      color: colors.textSecondary,
    },
    descriptionText: {
      color: colors.textMuted,
    },
    accountLabel: {
      color: colors.textSecondary,
    },
    accountValue: {
      color: colors.textMuted,
    },
    resendButton: {
      backgroundColor: colors.bgSurface,
    },
    resendButtonText: {
      color: colors.btnPrimaryBg,
    },
    scrobbleRowLabel: {
      color: colors.textSecondary,
    },
    scrobbleStatusText: {
      color: colors.textMuted,
    },
    appearanceLabel: {
      color: colors.textSecondary,
    },
    appearanceDescription: {
      color: colors.textMuted,
    },
    streamingOption: {
      backgroundColor: colors.bgSurface,
    },
    streamingOptionSelected: {
      backgroundColor: colors.bgSurfaceAlt,
      borderColor: colors.btnPrimaryBg,
    },
    streamingOptionText: {
      color: colors.textSecondary,
    },
  });

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
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSizes.sm,
  },
  connectedContainer: {
    gap: theme.spacing.sm,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  connectedText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: '#10B981',
  },
  usernameText: {
    fontSize: theme.fontSizes.sm,
  },
  usernameBold: {
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  disconnectButton: {
    marginTop: theme.spacing.sm,
  },
  connectContainer: {
    gap: theme.spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  accountRow: {
    gap: theme.spacing.xs,
  },
  emailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  accountLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    borderRadius: theme.radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  unconfirmedBadge: {
    backgroundColor: '#f6ad55',
    borderRadius: theme.radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  unconfirmedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  accountValue: {
    fontSize: theme.fontSizes.sm,
  },
  resendButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: theme.spacing.md,
    borderColor: '#EF4444',
  },
  scrobbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  scrobbleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  scrobbleRowText: {
    gap: 2,
  },
  scrobbleRowLabel: {
    fontSize: theme.fontSizes.base,
    fontWeight: '500',
  },
  scrobbleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrobbleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrobbleStatusText: {
    fontSize: theme.fontSizes.xs,
  },
  // Appearance section styles
  appearanceContainer: {
    gap: theme.spacing.md,
  },
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appearanceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  appearanceLabel: {
    fontSize: theme.fontSizes.base,
    fontWeight: '500',
  },
  appearanceDescription: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  // Streaming section styles
  streamingDescription: {
    marginBottom: theme.spacing.md,
  },
  streamingContainer: {
    gap: theme.spacing.xs,
  },
  streamingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  streamingOptionSelected: {
    borderWidth: 2,
  },
  streamingOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streamingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  streamingOptionText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '500',
  },
  streamingOptionTextSelected: {
    fontWeight: '600',
  },
});
