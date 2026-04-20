import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { theme } from '../constants/theme';
import { TASBIH_PRESETS, TasbihPreset } from '../constants/tasbihPresets';

type Locale = 'en' | 'ur' | 'ar';

const STORAGE_KEY_STATE = 'tasbih_state_v1';
const STORAGE_KEY_LIFETIME = 'tasbih_lifetime_v1';
const STORAGE_KEY_TODAY = 'tasbih_today_v1';

type TasbihState = {
  presetId: string;
  count: number;
  target: number;
};

type TodayState = {
  date: string;
  count: number;
};

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function TasbihScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;
  const isRtl = locale === 'ur' || locale === 'ar';

  const [preset, setPreset] = useState<TasbihPreset>(TASBIH_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(TASBIH_PRESETS[0].defaultTarget);
  const [lifetime, setLifetime] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [rawState, rawLife, rawToday] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_STATE),
        AsyncStorage.getItem(STORAGE_KEY_LIFETIME),
        AsyncStorage.getItem(STORAGE_KEY_TODAY),
      ]);

      if (rawState) {
        const saved: TasbihState = JSON.parse(rawState);
        const matched = TASBIH_PRESETS.find((p) => p.id === saved.presetId) ?? TASBIH_PRESETS[0];
        setPreset(matched);
        setCount(saved.count ?? 0);
        setTarget(saved.target ?? matched.defaultTarget);
      }
      if (rawLife) setLifetime(Number(rawLife) || 0);

      if (rawToday) {
        const t: TodayState = JSON.parse(rawToday);
        if (t.date === todayKey()) setTodayCount(t.count);
        else setTodayCount(0);
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY_STATE,
      JSON.stringify({ presetId: preset.id, count, target }),
    );
  }, [preset, count, target, hydrated]);

  const increment = () => {
    const next = count + 1;
    setCount(next);
    const newLife = lifetime + 1;
    setLifetime(newLife);
    AsyncStorage.setItem(STORAGE_KEY_LIFETIME, String(newLife));

    const tk = todayKey();
    const newToday = todayCount + 1;
    setTodayCount(newToday);
    AsyncStorage.setItem(STORAGE_KEY_TODAY, JSON.stringify({ date: tk, count: newToday }));

    if (next === target) {
      Vibration.vibrate(Platform.OS === 'ios' ? [0, 50, 100, 200] : 400);
    } else {
      Vibration.vibrate(40);
    }
  };

  const reset = () => {
    setCount(0);
    Vibration.vibrate(20);
  };

  const selectPreset = (p: TasbihPreset) => {
    setPreset(p);
    setTarget(p.defaultTarget);
    setCount(0);
  };

  const saveCustomTarget = () => {
    const n = parseInt(customTarget, 10);
    if (!Number.isFinite(n) || n < 1) {
      setTargetModalOpen(false);
      return;
    }
    setTarget(n);
    setCount(0);
    setCustomTarget('');
    setTargetModalOpen(false);
  };

  const progress = useMemo(() => Math.min(1, count / target), [count, target]);
  const translation = locale === 'ur' ? preset.translationUr : locale === 'ar' ? preset.translationAr : preset.translationEn;
  const virtueText = locale === 'ur' ? preset.virtueUr : locale === 'ar' ? preset.virtueAr : preset.virtue;

  const label = {
    en: { today: 'Today', lifetime: 'Lifetime', reset: 'Reset', target: 'Target', custom: 'Custom Target', cancel: 'Cancel', save: 'Save', tap: 'Tap anywhere to count', of: 'of' },
    ur: { today: 'آج', lifetime: 'کل', reset: 'دوبارہ', target: 'ہدف', custom: 'اپنا ہدف', cancel: 'منسوخ', save: 'محفوظ', tap: 'گننے کے لیے ٹیپ کریں', of: 'میں سے' },
    ar: { today: 'اليوم', lifetime: 'الإجمالي', reset: 'إعادة', target: 'الهدف', custom: 'هدف مخصص', cancel: 'إلغاء', save: 'حفظ', tap: 'اضغط في أي مكان للعد', of: 'من' },
  }[locale];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
        >
          {TASBIH_PRESETS.map((p) => {
            const active = p.id === preset.id;
            const label =
              locale === 'ur' ? p.translationUr : locale === 'ar' ? p.translationAr : p.transliteration;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => selectPreset(p)}
                activeOpacity={0.85}
              >
                <Text style={[styles.presetChipText, active && styles.presetChipTextActive, { fontSize: fs(12) }]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.dhikrCard}>
          <Text style={styles.dhikrArabic}>{preset.arabic}</Text>
          <Text style={[styles.dhikrTranslit, { fontSize: fs(14) }]}>{preset.transliteration}</Text>
          <Text style={[styles.dhikrTrans, { fontSize: fs(13), textAlign: isRtl ? 'right' : 'center' }]}>
            {translation}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={increment}
          style={styles.counterButton}
        >
          <LinearGradient
            colors={['rgba(200,120,10,0.16)', 'rgba(26,122,60,0.10)']}
            style={styles.counterGradient}
          >
            <Text style={[styles.counterNumber, { fontSize: fs(92) }]}>{count}</Text>
            <Text style={[styles.counterTarget, { fontSize: fs(14) }]}>
              {label.of} {target}
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.tapHint, { fontSize: fs(11) }]}>{label.tap}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { fontSize: fs(10) }]}>{label.today}</Text>
            <Text style={[styles.statValue, { fontSize: fs(20) }]}>{todayCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { fontSize: fs(10) }]}>{label.lifetime}</Text>
            <Text style={[styles.statValue, { fontSize: fs(20) }]}>{lifetime.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={reset} activeOpacity={0.8}>
            <Text style={[styles.actionBtnText, { fontSize: fs(13) }]}>↺ {label.reset}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setTargetModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { fontSize: fs(13) }]}>◎ {label.target}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.virtueCard}>
          <Text style={[styles.virtueText, { fontSize: fs(12), textAlign: isRtl ? 'right' : 'left' }]}>
            {virtueText}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={targetModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTargetModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: fs(16) }]}>{label.target}</Text>
            <View style={styles.targetOptions}>
              {[33, 99, 100, 300].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.targetOption, target === n && styles.targetOptionActive]}
                  onPress={() => {
                    setTarget(n);
                    setCount(0);
                    setTargetModalOpen(false);
                  }}
                >
                  <Text style={[styles.targetOptionText, target === n && styles.targetOptionTextActive, { fontSize: fs(14) }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.customLabel, { fontSize: fs(12) }]}>{label.custom}</Text>
            <TextInput
              style={styles.customInput}
              keyboardType="number-pad"
              value={customTarget}
              onChangeText={setCustomTarget}
              placeholder="100"
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setTargetModalOpen(false)}
              >
                <Text style={[styles.modalBtnSecondaryText, { fontSize: fs(13) }]}>{label.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={saveCustomTarget}>
                <Text style={[styles.modalBtnText, { fontSize: fs(13) }]}>{label.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.xl, paddingBottom: 40 },
  presetRow: { gap: 8, paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.xl },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  presetChipText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  presetChipTextActive: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  dhikrCard: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  dhikrArabic: {
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 48,
    writingDirection: 'rtl',
  },
  dhikrTranslit: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  dhikrTrans: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  counterButton: {
    borderRadius: theme.borderRadius.xl ?? 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  counterGradient: {
    paddingVertical: 36,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl ?? 24,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  counterNumber: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -2,
  },
  counterTarget: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  progressBarTrack: {
    marginTop: 16,
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  tapHint: {
    marginTop: 14,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 4,
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  virtueCard: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success ?? '#1A7A3C',
  },
  virtueText: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  targetOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  targetOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  targetOptionActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  targetOptionText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  targetOptionTextActive: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  customLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  customInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  modalBtnRow: { flexDirection: 'row', gap: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  modalBtnSecondaryText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBodyMedium,
  },
});
