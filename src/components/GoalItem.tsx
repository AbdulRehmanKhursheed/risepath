import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';

type Props = {
  text: string;
  completed: boolean;
  onToggle: () => void;
};

export function GoalItem({ text, completed, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, completed && styles.rowCompleted]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={[styles.text, completed && styles.textCompleted]} numberOfLines={2}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingVertical: theme.spacing.md + 4,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  rowCompleted: {
    opacity: 0.85,
    borderColor: theme.colors.borderSoft,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: theme.colors.accent,
    marginRight: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  check: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
});
