import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { IconX, IconExternalLink } from "@tabler/icons-react-native";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import {
  StreamingPlatform,
  StreamingLinks,
  STREAMING_PLATFORMS,
} from "@/utils/api";

interface StreamingLinksModalProps {
  visible: boolean;
  onClose: () => void;
  streamingLinks?: StreamingLinks;
  bandLinks?: Array<{ platform: string; url: string }>;
  songName: string;
  bandName: string;
  songlinkUrl?: string;
  isBandLinks?: boolean;
}

export function StreamingLinksModal({
  visible,
  onClose,
  streamingLinks,
  bandLinks,
  songName,
  bandName,
  songlinkUrl,
  isBandLinks = false,
}: StreamingLinksModalProps) {
  const { colors: themeColors } = useTheme();
  const themedStyles = useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  // Get available links (streaming links or band links)
  const availableLinks = useMemo(() => {
    if (isBandLinks && bandLinks) {
      return bandLinks.map(({ platform, url }) => ({
        platform,
        url,
        name:
          STREAMING_PLATFORMS[platform as StreamingPlatform]?.name || platform,
        color:
          STREAMING_PLATFORMS[platform as StreamingPlatform]?.color || "#666",
      }));
    }
    if (!streamingLinks) return [];
    return (
      Object.entries(streamingLinks) as [
        StreamingPlatform,
        string | undefined,
      ][]
    )
      .filter(([_, url]) => url)
      .map(([platform, url]) => ({
        platform,
        url: url!,
        ...STREAMING_PLATFORMS[platform],
      }));
  }, [streamingLinks, bandLinks, isBandLinks]);

  const handlePlatformPress = (url: string) => {
    Linking.openURL(url);
    onClose();
  };

  const handleViewAllPlatforms = () => {
    if (songlinkUrl) {
      Linking.openURL(songlinkUrl);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, themedStyles.container]}>
        {/* Header */}
        <View style={[styles.header, themedStyles.header]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.title, themedStyles.title]}>Listen to</Text>
            <Text
              style={[styles.subtitle, themedStyles.subtitle]}
              numberOfLines={1}
            >
              {isBandLinks ? bandName : songName}
            </Text>
            {!isBandLinks && (
              <Text
                style={[styles.artistSubtitle, themedStyles.artistSubtitle]}
                numberOfLines={1}
              >
                {bandName}
              </Text>
            )}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {availableLinks.map(({ platform, url, name, color }) => (
            <TouchableOpacity
              key={platform}
              style={[styles.platformItem, themedStyles.platformItem]}
              onPress={() => handlePlatformPress(url)}
              activeOpacity={0.7}
            >
              <View style={styles.platformLeft}>
                <View
                  style={[styles.platformDot, { backgroundColor: color }]}
                />
                <Text style={[styles.platformName, themedStyles.platformName]}>
                  {name}
                </Text>
              </View>
              <IconExternalLink size={20} color={themeColors.iconMuted} />
            </TouchableOpacity>
          ))}

          {songlinkUrl && (
            <>
              <View style={[styles.divider, themedStyles.divider]} />
              <TouchableOpacity
                style={[styles.platformItem, themedStyles.platformItem]}
                onPress={handleViewAllPlatforms}
                activeOpacity={0.7}
              >
                <View style={styles.platformLeft}>
                  <IconExternalLink size={20} color={themeColors.iconMuted} />
                  <Text
                    style={[
                      styles.platformName,
                      themedStyles.platformName,
                      styles.viewAllText,
                    ]}
                  >
                    View all platforms
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    header: {
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      color: colors.textHeading,
    },
    subtitle: {
      color: colors.textPrimary,
    },
    artistSubtitle: {
      color: colors.textMuted,
    },
    platformItem: {
      backgroundColor: colors.bgSurface,
    },
    platformName: {
      color: colors.textPrimary,
    },
    divider: {
      backgroundColor: colors.borderSubtle,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  headerSpacer: {
    width: 40, // Match close button width for centering
  },
  title: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.thecoaMedium,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    marginTop: 4,
    textAlign: "center",
  },
  artistSubtitle: {
    fontSize: theme.fontSizes.base,
    marginTop: 2,
    textAlign: "center",
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  platformItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  platformLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  platformDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  platformName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
  viewAllText: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: theme.spacing.sm,
  },
});
