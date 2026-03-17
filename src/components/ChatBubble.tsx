import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';

type Props = {
  message: string;
  isUser?: boolean;
};

export function ChatBubble({ message, isUser }: Props) {
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.coachBubble]}>
      <Text style={[styles.text, isUser ? styles.userText : styles.coachText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '90%',
    padding: theme.spacing.lg,
    paddingVertical: theme.spacing.md + 4,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.accentMuted,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 120, 10, 0.3)',
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: theme.typography.fontBody,
  },
  userText: {
    color: theme.colors.text,
  },
  coachText: {
    color: theme.colors.textSecondary,
  },
});
