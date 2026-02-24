import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { ProfilePhoto } from "./ProfilePhoto";
import { apiClient, UserSearchResult } from "@/utils/api";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";

interface MentionTextInputProps extends Omit<TextInputProps, "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  minHeight?: number;
  maxHeight?: number;
}

export function MentionTextInput({
  value,
  onChangeText,
  style,
  minHeight = 40,
  maxHeight = 120,
  ...textInputProps
}: MentionTextInputProps) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(
    null,
  );
  const [inputHeight, setInputHeight] = useState(minHeight);
  const inputRef = useRef<TextInput>(null);
  const cursorPositionRef = useRef<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset height when value is cleared
  useEffect(() => {
    if (!value) {
      setInputHeight(minHeight);
    }
  }, [value, minHeight]);

  // Handle content size changes for auto-grow
  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const contentHeight = e.nativeEvent.contentSize.height;
      const newHeight = Math.min(Math.max(minHeight, contentHeight), maxHeight);
      setInputHeight(newHeight);
    },
    [minHeight, maxHeight],
  );

  // Search for users when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (mentionQuery.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const result = await apiClient.searchUsers(mentionQuery);
          setSuggestions(result.users);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [mentionQuery]);

  // Detect @ mentions while typing
  const handleChangeText = useCallback(
    (newValue: string) => {
      onChangeText(newValue);

      // Use the cursor position from the ref (updated by onSelectionChange)
      const cursorPosition = cursorPositionRef.current;

      // Find if we're in a mention context
      const textBeforeCursor = newValue.slice(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1];
        const startIndex = cursorPosition - query.length - 1; // -1 for @
        setMentionQuery(query);
        setMentionStartIndex(startIndex);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setMentionQuery("");
        setMentionStartIndex(null);
      }
    },
    [onChangeText],
  );

  // Track cursor position
  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      cursorPositionRef.current = event.nativeEvent.selection.start;
    },
    [],
  );

  // Insert selected mention
  const insertMention = useCallback(
    (user: UserSearchResult) => {
      if (mentionStartIndex === null) return;

      const cursorPosition = cursorPositionRef.current;
      const beforeMention = value.slice(0, mentionStartIndex);
      const afterMention = value.slice(cursorPosition);
      const newValue = `${beforeMention}@${user.username} ${afterMention}`;

      onChangeText(newValue);
      setShowSuggestions(false);
      setMentionQuery("");
      setMentionStartIndex(null);
      setSuggestions([]);

      // Update cursor position ref
      const newCursorPosition = mentionStartIndex + user.username.length + 2; // +2 for @ and space
      cursorPositionRef.current = newCursorPosition;

      // Keep keyboard open and refocus
      inputRef.current?.focus();
    },
    [mentionStartIndex, value, onChangeText],
  );

  // Close suggestions when tapping outside
  const handleInputBlur = useCallback(
    (e: any) => {
      // Delay hiding to allow tap on suggestion to register
      setTimeout(() => {
        setShowSuggestions(false);
      }, 200);
      // Call any passed-in onBlur handler
      textInputProps.onBlur?.(e);
    },
    [textInputProps.onBlur],
  );

  // Combine onFocus with passed-in handler
  const handleInputFocus = useCallback(
    (e: any) => {
      textInputProps.onFocus?.(e);
    },
    [textInputProps.onFocus],
  );

  const renderSuggestionItem = useCallback(
    ({ item }: { item: UserSearchResult }) => (
      <TouchableOpacity
        style={[styles.suggestionItem, themedStyles.suggestionItem]}
        onPress={() => insertMention(item)}
        activeOpacity={0.7}
      >
        <ProfilePhoto
          src={item.profile_image_url}
          name={item.username}
          size={28}
        />
        <View style={styles.suggestionInfo}>
          <Text style={[styles.suggestionUsername, themedStyles.suggestionUsername]}>@{item.username}</Text>
          {item.display_name !== item.username && (
            <Text style={[styles.suggestionDisplayName, themedStyles.suggestionDisplayName]}>
              {item.display_name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [insertMention, themedStyles],
  );

  // Flatten the style to extract layout props for wrapper vs input props
  const flatStyle = StyleSheet.flatten(style) || {};
  const { flex, flexGrow, flexShrink, flexBasis, alignSelf, ...inputStyle } =
    flatStyle as any;

  // Layout styles go to wrapper, everything else to TextInput
  const wrapperStyle: ViewStyle = {
    flexGrow: flexGrow ?? flex ?? 1,
    flexShrink: flexShrink ?? 1,
    height: inputHeight,
    ...(flexBasis !== undefined && { flexBasis }),
    ...(alignSelf !== undefined && { alignSelf }),
  };

  return (
    <View style={wrapperStyle}>
      <TextInput
        ref={inputRef}
        {...textInputProps}
        style={[inputStyle, { flex: 1 }]}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        onContentSizeChange={handleContentSizeChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        multiline
        scrollEnabled={inputHeight >= maxHeight}
      />

      {/* Suggestions dropdown - absolute positioned above input */}
      {showSuggestions && (
        <View style={[styles.suggestionsContainer, themedStyles.suggestionsContainer]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={themeColors.btnPrimaryBg} />
              <Text style={[styles.loadingText, themedStyles.loadingText]}>Searching...</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, themedStyles.emptyText]}>
                {mentionQuery.length < 2
                  ? "Type at least 2 characters"
                  : "No users found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSuggestionItem}
              keyboardShouldPersistTaps="always"
              style={styles.suggestionsList}
            />
          )}
        </View>
      )}
    </View>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    suggestionsContainer: {
      backgroundColor: colors.bgApp,
      borderColor: colors.borderDefault,
    },
    suggestionItem: {
      borderBottomColor: colors.bgSurfaceAlt,
    },
    suggestionUsername: {
      color: colors.textPrimary,
    },
    suggestionDisplayName: {
      color: colors.textMuted,
    },
    loadingText: {
      color: colors.textMuted,
    },
    emptyText: {
      color: colors.textMuted,
    },
  });

const styles = StyleSheet.create({
  suggestionsContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionUsername: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.thecoaMedium,
  },
  suggestionDisplayName: {
    fontSize: theme.fontSizes.xs,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSizes.sm,
  },
  emptyContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.fontSizes.sm,
  },
});
