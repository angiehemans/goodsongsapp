'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Text, TextProps } from '@mantine/core';
import styles from './MentionText.module.css';

interface MentionTextProps extends Omit<TextProps, 'children'> {
  /** The formatted text with [@username](user:id) syntax */
  text: string;
  /** Whether to render as inline span instead of p */
  inline?: boolean;
}

// Regex to match [@username](user:id) format
const MENTION_REGEX = /\[@(\w+)\]\(user:(\d+)\)/g;

interface TextPart {
  type: 'text' | 'mention';
  content: string;
  userId?: number;
  username?: string;
}

function parseFormattedText(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  // Reset regex lastIndex
  MENTION_REGEX.lastIndex = 0;

  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the mention
    parts.push({
      type: 'mention',
      content: `@${match[1]}`,
      userId: parseInt(match[2], 10),
      username: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

export function MentionText({ text, inline = false, ...textProps }: MentionTextProps) {
  const parts = parseFormattedText(text);

  const content = parts.map((part, index) => {
    if (part.type === 'mention' && part.username) {
      return (
        <Link
          key={index}
          href={`/users/${part.username}`}
          className={styles.mention}
        >
          {part.content}
        </Link>
      );
    }
    return <Fragment key={index}>{part.content}</Fragment>;
  });

  return (
    <Text component={inline ? 'span' : 'p'} {...textProps}>
      {content}
    </Text>
  );
}
