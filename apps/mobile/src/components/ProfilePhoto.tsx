import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme, colors } from '@/theme';
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
  const [imageError, setImageError] = useState(false);
  const initials = fallback.charAt(0).toUpperCase();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const imageUri = fixImageUrl(src);

  const renderFallback = () => (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );

  const content = imageUri && !imageError ? (
    <Image
      source={{ uri: imageUri }}
      style={[styles.image, containerStyle]}
      accessibilityLabel={alt}
      onError={() => setImageError(true)}
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

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.grape[2],
  },
  fallback: {
    backgroundColor: colors.grape[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: colors.grape[7],
    fontWeight: '600',
  },
});
