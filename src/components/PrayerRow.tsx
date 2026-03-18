import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { formatPrayerTime } from '../hooks/usePrayerTimes';
import { PRAYER_SURAHS } from '../constants/prayerSurahs';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuranNav } from '../contexts/QuranNavContext';
import type { PrayerName } from '../hooks/usePrayerTimes';

type PrayerStatus = 'prayed' | 'missed' | 'upcoming';

type Props = {
  name: string;
  prayerKey: PrayerName;
  time: Date;
  status: PrayerStatus;
  onPress: () => void;
};

export function PrayerRow({ name, prayerKey, time, status, onPress }: Props) {
  const { t } = useLanguage();
  const { openSurah } = useQuranNav();
  const [expanded, setExpanded] = useState(false);
  const surah = PRAYER_SURAHS[prayerKey];

  const STATUS_CONFIG = {
    prayed: {
      label: t.prayed,
      icon: '✓',
      bg: theme.colors.successMuted,
      color: theme.colors.success,
      border: 'rgba(26, 122, 60, 0.3)',
    },
    missed: {
      label: t.missed,
      icon: '○',
      bg: theme.colors.errorMuted,
      color: theme.colors.error,
      border: 'rgba(184, 48, 37, 0.3)',
    },
    upcoming: {
      label: t.upcoming,
      icon: '→',
      bg: 'rgba(122, 90, 64, 0.08)',
      color: theme.colors.textMuted,
      border: theme.colors.border,
    },
  };

  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.row, { borderColor: config.border }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.left}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.time}>{formatPrayerTime(time)}</Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeIcon, { color: config.color }]}>{config.icon}</Text>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          {surah && (
            <TouchableOpacity
              style={styles.surahToggle}
              onPress={() => setExpanded((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.surahToggleText}>{expanded ? '▲' : '▼'} Surah</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {expanded && surah && (
        <View style={styles.surahCard}>
          <View style={styles.surahHeader}>
            <Text style={styles.surahName}>{surah.surah}</Text>
            <Text style={styles.surahNameAr}>{surah.surahAr}</Text>
          </View>
          <Text style={styles.surahBenefit}>{surah.benefit}</Text>
          <Text style={styles.surahNote}>{surah.note}</Text>
          <TouchableOpacity
            style={styles.readBtn}
            onPress={() => openSurah(surah.number)}
            activeOpacity={0.8}
          >
            <Text style={styles.readBtnText}>📖 Read Surah →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: theme.typography.fontBody,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: theme.typography.fontBodyBold,
  },
  surahToggle: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  surahToggleText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
  },
  surahCard: {
    backgroundColor: theme.colors.backgroundSoft,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: 2,
    borderWidth: 1,
    borderColor: theme.colors.accentMuted,
  },
  surahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  surahName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  surahNameAr: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  surahBenefit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 21,
    fontFamily: theme.typography.fontBody,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  surahNote: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
    marginBottom: 10,
  },
  readBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.sm,
  },
  readBtnText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
});
