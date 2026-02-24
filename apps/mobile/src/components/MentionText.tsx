import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';

interface MentionTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Regex to match [@username](user:id) format
const MENTION_REGEX = /\[@(\w+)\]\(user:(\d+)\)/g;

export function MentionText({ text, style, numberOfLines }: MentionTextProps) {
  const navigation = useNavigation<NavigationProp>();
  const { colors: themeColors } = useTheme();

  const handleMentionPress = (username: string) => {
    navigation.navigate('UserProfile', { username });
  };

  // Parse the text and split into parts
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</Text>
      );
    }

    // Add the mention as a clickable element
    const username = match[1];
    parts.push(
      <Text
        key={`mention-${match.index}`}
        style={{ color: themeColors.textHeading, fontWeight: '600' }}
        onPress={() => handleMentionPress(username)}
      >
        @{username}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(<Text key={`text-${lastIndex}`}>{text.slice(lastIndex)}</Text>);
  }

  // If no mentions found, just return the plain text
  if (parts.length === 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts}
    </Text>
  );
}
