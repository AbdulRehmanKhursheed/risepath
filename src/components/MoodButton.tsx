import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';

const MOODS = ['😔', '😐', '🙂', '😄', '🔥'];

type Props = {
  mood: number;
  selected: boolean;
  onPress: () => void;
};

export function MoodButton({ mood, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected && styles.buttonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.emoji, selected && styles.emojiSelected]}>
        {MOODS[mood - 1]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  buttonSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2.5,
  },
  emoji: {
    fontSize: 28,
    opacity: 0.9,
  },
  emojiSelected: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
});
