import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import { Header, TextInput, Button, Card } from '@/components';
import { theme, colors } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { apiClient } from '@/utils/api';
import { LastFmStatus } from '@goodsongs/api-client';

export function SettingsScreen({ navigation }: any) {
  const { user, logout, accountType } = useAuthStore();
  const isBandAccount = accountType === 'band';

  // Last.fm state
  const [lastFmStatus, setLastFmStatus] = useState<LastFmStatus | null>(null);
  const [lastFmLoading, setLastFmLoading] = useState(true);
  const [lastFmUsername, setLastFmUsername] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const renderLastFmSection = () => {
    if (lastFmLoading) {
      return (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Last.fm Connection</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Checking Last.fm connection...</Text>
          </View>
        </Card>
      );
    }

    if (lastFmStatus?.connected) {
      return (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Last.fm Connection</Text>
          <View style={styles.connectedContainer}>
            <View style={styles.connectedBadge}>
              <Icon name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
            <Text style={styles.usernameText}>
              Connected as <Text style={styles.usernameBold}>{lastFmStatus.username}</Text>
            </Text>
            <Text style={styles.descriptionText}>
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
        <Text style={styles.sectionTitle}>Last.fm Connection</Text>
        <View style={styles.connectContainer}>
          <Text style={styles.descriptionText}>
            Connect your Last.fm account to see your recently played tracks and easily recommend songs you're listening to.
          </Text>
          <TextInput
            placeholder="Your Last.fm username"
            value={lastFmUsername}
            onChangeText={(text) => {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Settings"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Last.fm Connection - Only for fan accounts */}
        {!isBandAccount && renderLastFmSection()}

        {/* Account Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{user?.email}</Text>
          </View>
        </Card>

        {/* Sign Out Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Sign Out</Text>
          <Text style={styles.descriptionText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
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
    color: colors.grape[5],
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
    color: theme.colors.success,
  },
  usernameText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[7],
  },
  usernameBold: {
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
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
  accountLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    color: colors.grape[7],
  },
  accountValue: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  logoutButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.error,
  },
});
