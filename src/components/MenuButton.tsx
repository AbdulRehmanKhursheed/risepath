import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSidebar } from '../contexts/SidebarContext';
import { theme } from '../constants/theme';

export function MenuButton() {
  const { openSidebar } = useSidebar();

  return (
    <TouchableOpacity
      testID="menu-button"
      accessibilityLabel="Open menu"
      style={styles.btn}
      onPress={openSidebar}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  icon: {
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 22,
  },
});
