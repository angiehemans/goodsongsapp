'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader, Paper, Stack, Text, Textarea, TextareaProps } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { apiClient, UserSearchResult } from '@/lib/api';
import styles from './MentionTextarea.module.css';

interface MentionTextareaProps extends Omit<TextareaProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function MentionTextarea({ value, onChange, ...textareaProps }: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [debouncedQuery] = useDebouncedValue(mentionQuery, 200);

  // Search for users when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      apiClient
        .searchUsers(debouncedQuery)
        .then((result) => {
          setSuggestions(result.users);
          setSelectedIndex(0);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Detect @ mentions while typing
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      onChange(newValue);

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
        setMentionQuery('');
        setMentionStartIndex(null);
      }
    },
    [onChange]
  );

  // Insert selected mention
  const insertMention = useCallback(
    (user: UserSearchResult) => {
      if (mentionStartIndex === null) return;

      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const beforeMention = value.slice(0, mentionStartIndex);
      const afterMention = value.slice(cursorPosition);
      const newValue = `${beforeMention}@${user.username} ${afterMention}`;

      onChange(newValue);
      setShowSuggestions(false);
      setMentionQuery('');
      setMentionStartIndex(null);
      setSuggestions([]);

      // Set cursor position after the mention
      const newCursorPosition = mentionStartIndex + user.username.length + 2; // +2 for @ and space
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    },
    [mentionStartIndex, value, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions || suggestions.length === 0) {
        // Call original onKeyDown if provided
        textareaProps.onKeyDown?.(e);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
        case 'Tab':
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
        default:
          // Call original onKeyDown if provided
          textareaProps.onKeyDown?.(e);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, insertMention, textareaProps]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...textareaProps}
      />

      {showSuggestions && (
        <Paper ref={suggestionsRef} className={styles.suggestions} shadow="md" withBorder>
          {isLoading ? (
            <div className={styles.loading}>
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Searching...
              </Text>
            </div>
          ) : suggestions.length === 0 ? (
            <div className={styles.empty}>
              <Text size="sm" c="dimmed">
                {mentionQuery.length < 2 ? 'Type at least 2 characters' : 'No users found'}
              </Text>
            </div>
          ) : (
            <Stack gap={0}>
              {suggestions.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ProfilePhoto
                    src={user.profile_image_url}
                    alt={user.username}
                    size={28}
                    fallback={user.username}
                  />
                  <div className={styles.userInfo}>
                    <Text size="sm" fw={500}>
                      @{user.username}
                    </Text>
                    {user.display_name !== user.username && (
                      <Text size="xs" c="dimmed">
                        {user.display_name}
                      </Text>
                    )}
                  </div>
                </button>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </div>
  );
}
