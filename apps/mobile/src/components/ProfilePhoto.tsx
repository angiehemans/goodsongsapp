import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { fixImageUrl } from '@/utils/imageUrl';

interface ProfilePhotoProps {
  src?: string | null;
  alt?: string;
  size?: number;
  fallback?: string;
  onPress?: () => void;
}

export function ProfilePhoto({
  src,
  alt,
  size = 40,
  fallback = '?',
  onPress,
}: ProfilePhotoProps) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);
  const [imageError, setImageError] = useState(false);
  const initials = fallback.charAt(0).toUpperCase();

  // Reset error state when src changes (important for FlatList reuse)
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const imageUri = fixImageUrl(src);

  const renderFallback = () => (
    <View style={[styles.fallback, themedStyles.fallback, containerStyle]}>
      <Text style={[styles.fallbackText, themedStyles.fallbackText, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );

  const content = imageUri && !imageError ? (
    <FastImage
      source={{ uri: imageUri }}
      style={[styles.image, themedStyles.image, containerStyle]}
      accessibilityLabel={alt}
      onError={() => setImageError(true)}
      resizeMode={FastImage.resizeMode.cover}
    />
  ) : (
    renderFallback()
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const createThemedStyles = (themeColors: SemanticColors) =>
  StyleSheet.create({
    image: {
      backgroundColor: themeColors.bgSurfaceAlt,
    },
    fallback: {
      backgroundColor: themeColors.borderDefault,
    },
    fallbackText: {
      color: themeColors.textSecondary,
    },
  });

const styles = StyleSheet.create({
  image: {},
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '600',
  },
});
