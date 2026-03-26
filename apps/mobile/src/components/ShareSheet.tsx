import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Linking,
  Share,
} from 'react-native';
import {
  IconBrandThreads,
  IconLink,
  IconShare2,
  IconX,
} from '@tabler/icons-react-native';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';

interface SharePayload {
  text: string;
  url: string;
  image_url: string | null;
  threads_intent_url: string;
  instagram_intent_url: string | null;
}

export interface ShareSheetRef {
  show: (payload: SharePayload) => void;
}

export const ShareSheet = forwardRef<ShareSheetRef>(function ShareSheet(_, ref) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useImperativeHandle(ref, () => ({
    show: (p: SharePayload) => {
      setPayload(p);
      setVisible(true);
    },
  }));

  const handleClose = useCallback(() => {
    setVisible(false);
    setPayload(null);
  }, []);

  const handleThreads = useCallback(() => {
    if (payload?.threads_intent_url) {
      // Replace + with %20 — some backends encode spaces as + which Threads shows literally
      Linking.openURL(payload.threads_intent_url.replace(/\+/g, '%20'));
    }
    handleClose();
  }, [payload, handleClose]);

  const handleShare = useCallback(async () => {
    if (!payload) return;
    handleClose();
    try {
      await Share.share({
        message: `${payload.text}\n\n${payload.url}`,
        url: payload.url,
      });
    } catch {
      // User cancelled
    }
  }, [payload, handleClose]);

  const handleCopyLink = useCallback(async () => {
    if (!payload) return;
    handleClose();
    try {
      await Share.share({ message: payload.url, url: payload.url });
    } catch {
      // User cancelled
    }
  }, [payload, handleClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, themedStyles.sheet]} onPress={() => {}}>
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, themedStyles.handle]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, themedStyles.title]}>Share</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconX size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {payload?.threads_intent_url && (
              <TouchableOpacity style={[styles.option, themedStyles.option]} onPress={handleThreads}>
                <View style={[styles.optionIcon, themedStyles.optionIconThreads]}>
                  <IconBrandThreads size={22} color="#fff" />
                </View>
                <Text style={[styles.optionLabel, themedStyles.optionLabel]}>Threads</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.option, themedStyles.option]} onPress={handleShare}>
              <View style={[styles.optionIcon, themedStyles.optionIconDefault]}>
                <IconShare2 size={22} color={colors.textHeading} />
              </View>
              <Text style={[styles.optionLabel, themedStyles.optionLabel]}>Share...</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.option, themedStyles.option]} onPress={handleCopyLink}>
              <View style={[styles.optionIcon, themedStyles.optionIconDefault]}>
                <IconLink size={22} color={colors.textHeading} />
              </View>
              <Text style={[styles.optionLabel, themedStyles.optionLabel]}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.bgSurface,
    },
    handle: {
      backgroundColor: colors.borderDefault,
    },
    title: {
      color: colors.textHeading,
    },
    option: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    optionLabel: {
      color: colors.textHeading,
    },
    optionIconThreads: {
      backgroundColor: '#000',
    },
    optionIconDefault: {
      backgroundColor: colors.bgSurfaceHover,
    },
  });

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  option: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    gap: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
});
