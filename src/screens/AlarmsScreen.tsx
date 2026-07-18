import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Pressable,
  AppState,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage, CustomAlarm, MAX_CUSTOM_ALARMS } from '../services/storage';
import {
  scheduleCustomAlarms,
  requestNotificationPermissions,
  hasNotificationPermission,
  canAskNotificationPermissionAgain,
  setupNotificationChannel,
  countAlarmEntries,
  ALARM_MAX_SCHEDULED,
} from '../services/notifications';
import type { Language } from '../constants/translations';
import { TimePicker } from '../components/TimePicker';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

type Locale = 'en' | 'ur' | 'ar';

// Weekday labels, expo convention Sunday=1 … Saturday=7 (index 0 = Sunday).
const WEEKDAYS: Record<Locale, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ur: ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

type Preset = {
  icon: string;
  hour: number;
  minute: number;
  labelEn: string;
  labelUr: string;
  labelAr: string;
};

// Suggested worship reminders. Times are gentle defaults the user edits — the
// point is discovery, not prescription (Tahajjud/Duha times vary by location
// and season, so we deliberately don't compute them from prayer times here).
const PRESETS: Preset[] = [
  { icon: '🌙', hour: 3, minute: 30, labelEn: 'Tahajjud', labelUr: 'تہجد', labelAr: 'تهجد' },
  { icon: '🌤', hour: 9, minute: 0, labelEn: 'Duha', labelUr: 'چاشت', labelAr: 'الضحى' },
  { icon: '📖', hour: 20, minute: 0, labelEn: 'Quran reading', labelUr: 'تلاوتِ قرآن', labelAr: 'تلاوة القرآن' },
  { icon: '📿', hour: 7, minute: 0, labelEn: 'Morning adhkar', labelUr: 'صبح کے اذکار', labelAr: 'أذكار الصباح' },
  { icon: '🌆', hour: 18, minute: 0, labelEn: 'Evening adhkar', labelUr: 'شام کے اذکار', labelAr: 'أذكار المساء' },
];

function makeId(): string {
  return `ca_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}

type Draft = {
  id: string | null;
  label: string;
  icon: string;
  hour: number;
  minute: number;
  days: number[];
};

export function AlarmsScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;
  const isUrdu = locale === 'ur';
  const isArabic = locale === 'ar';

  const [alarms, setAlarms] = useState<CustomAlarm[]>([]);
  const [granted, setGranted] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let mounted = true;
    storage.getCustomAlarms().then((a) => {
      if (mounted) setAlarms(a);
    }).catch(() => {});
    hasNotificationPermission().then((g) => {
      if (mounted) setGranted(g);
    }).catch(() => {});
    // Re-check on foreground so enabling notifications in system settings and
    // coming back dismisses the warning card without reopening the screen.
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      hasNotificationPermission().then((g) => {
        if (mounted) setGranted(g);
      }).catch(() => {});
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const L = {
    en: {
      title: 'My Reminders',
      subtitle: 'Set your own alarms for worship — on your times, not prayer times',
      permTitle: 'Notifications are off',
      permBody: 'Enable notifications so your reminders can reach you.',
      permBtn: 'Enable notifications',
      presets: 'QUICK ADD',
      yours: 'YOUR REMINDERS',
      empty: 'No reminders yet. Add one from a preset above, or create your own.',
      newBtn: '+ New reminder',
      everyDay: 'Every day',
      editTitle: 'Edit reminder',
      addTitle: 'New reminder',
      labelPlaceholder: 'Reminder name (e.g. Tahajjud)',
      repeat: 'REPEAT',
      selectAll: 'Every day',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      limit: `You can have up to ${MAX_CUSTOM_ALARMS} reminders.`,
      slots: `Reminder limit reached — each repeat day uses one of ${ALARM_MAX_SCHEDULED} slots. Turn a reminder off or pick fewer repeat days.`,
      note: 'Reminders repeat automatically. They’re independent of your prayer-time alerts.',
    },
    ur: {
      title: 'میرے ریمائنڈرز',
      subtitle: 'عبادت کے لیے اپنے وقت پر الارم لگائیں — نماز کے اوقات سے الگ',
      permTitle: 'نوٹیفکیشن بند ہیں',
      permBody: 'ریمائنڈرز موصول کرنے کے لیے نوٹیفکیشن آن کریں۔',
      permBtn: 'نوٹیفکیشن آن کریں',
      presets: 'فوری شامل کریں',
      yours: 'آپ کے ریمائنڈرز',
      empty: 'ابھی کوئی ریمائنڈر نہیں۔ اوپر سے کوئی منتخب کریں یا اپنا بنائیں۔',
      newBtn: '+ نیا ریمائنڈر',
      everyDay: 'روزانہ',
      editTitle: 'ریمائنڈر میں ترمیم',
      addTitle: 'نیا ریمائنڈر',
      labelPlaceholder: 'نام (مثلاً تہجد)',
      repeat: 'تکرار',
      selectAll: 'روزانہ',
      save: 'محفوظ کریں',
      cancel: 'منسوخ',
      delete: 'حذف کریں',
      limit: `زیادہ سے زیادہ ${MAX_CUSTOM_ALARMS} ریمائنڈرز رکھ سکتے ہیں۔`,
      slots: `ریمائنڈر کی حد پوری ہو گئی — تکرار کا ہر دن ${ALARM_MAX_SCHEDULED} میں سے ایک سلاٹ استعمال کرتا ہے۔ کوئی ریمائنڈر بند کریں یا تکرار کے دن کم کریں۔`,
      note: 'ریمائنڈرز خودبخود دہرائے جاتے ہیں۔ یہ نماز کے الرٹس سے الگ ہیں۔',
    },
    ar: {
      title: 'تذكيراتي',
      subtitle: 'اضبط منبهاتك للعبادة في أوقاتك — مستقلة عن أوقات الصلاة',
      permTitle: 'الإشعارات متوقفة',
      permBody: 'فعّل الإشعارات حتى تصلك تذكيراتك.',
      permBtn: 'تفعيل الإشعارات',
      presets: 'إضافة سريعة',
      yours: 'تذكيراتك',
      empty: 'لا توجد تذكيرات بعد. أضف واحداً من الأعلى أو أنشئ تذكيرك.',
      newBtn: '+ تذكير جديد',
      everyDay: 'كل يوم',
      editTitle: 'تعديل التذكير',
      addTitle: 'تذكير جديد',
      labelPlaceholder: 'اسم التذكير (مثل تهجد)',
      repeat: 'التكرار',
      selectAll: 'كل يوم',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      limit: `يمكنك إضافة حتى ${MAX_CUSTOM_ALARMS} تذكيرات.`,
      slots: `اكتمل حد التذكيرات — كل يوم تكرار يستهلك خانة من ${ALARM_MAX_SCHEDULED}. عطّل تذكيراً أو قلّل أيام التكرار.`,
      note: 'تتكرر التذكيرات تلقائياً وهي مستقلة عن تنبيهات أوقات الصلاة.',
    },
  }[locale];

  const presetLabel = (p: Preset) => (isUrdu ? p.labelUr : isArabic ? p.labelAr : p.labelEn);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    // After a permanent denial the request dialog never re-shows — send the
    // user to app settings instead of a button that silently does nothing.
    if (!(await canAskNotificationPermissionAgain().catch(() => true))) {
      Linking.openSettings().catch(() => {});
      return false;
    }
    const ok = await requestNotificationPermissions();
    setGranted(ok);
    if (ok) await setupNotificationChannel();
    return ok;
  }, []);

  const persist = useCallback(
    async (next: CustomAlarm[]) => {
      setAlarms(next);
      try {
        await storage.setCustomAlarms(next);
        await scheduleCustomAlarms(next, locale as Language);
      } catch {
        // Best-effort: the in-memory list is already updated for this session.
      }
    },
    [locale]
  );

  const daysSummary = (days: number[]): string => {
    const set = new Set(days);
    if (days.length === 0 || days.length >= 7) return L.everyDay;
    const sep = isUrdu || isArabic ? '، ' : ', ';
    return ALL_DAYS.filter((d) => set.has(d))
      .map((d) => WEEKDAYS[locale][d - 1])
      .join(sep);
  };

  const openPreset = async (p: Preset) => {
    if (alarms.length >= MAX_CUSTOM_ALARMS) {
      Alert.alert('', L.limit);
      return;
    }
    if (!granted) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    setDraft({
      id: null,
      label: presetLabel(p),
      icon: p.icon,
      hour: p.hour,
      minute: p.minute,
      days: [...ALL_DAYS],
    });
    setEditorOpen(true);
  };

  const openNew = async () => {
    if (alarms.length >= MAX_CUSTOM_ALARMS) {
      Alert.alert('', L.limit);
      return;
    }
    if (!granted) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    setDraft({ id: null, label: '', icon: '⏰', hour: 6, minute: 0, days: [...ALL_DAYS] });
    setEditorOpen(true);
  };

  const openEdit = (a: CustomAlarm) => {
    setDraft({ id: a.id, label: a.label, icon: a.icon, hour: a.hour, minute: a.minute, days: [...a.days] });
    setEditorOpen(true);
  };

  const toggleAlarm = (id: string) => {
    const next = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    const nowEnabled = next.find((a) => a.id === id)?.enabled;
    if (nowEnabled && countAlarmEntries(next) > ALARM_MAX_SCHEDULED) {
      Alert.alert('', L.slots);
      return;
    }
    persist(next);
  };

  const deleteAlarm = (id: string) => {
    persist(alarms.filter((a) => a.id !== id));
    setEditorOpen(false);
    setDraft(null);
  };

  const saveDraft = () => {
    if (!draft) return;
    const label = draft.label.trim() || (isUrdu ? 'ریمائنڈر' : isArabic ? 'تذكير' : 'Reminder');
    const days = draft.days.length === 0 ? [...ALL_DAYS] : draft.days;
    let next: CustomAlarm[];
    if (draft.id) {
      next = alarms.map((a) =>
        a.id === draft.id ? { ...a, label, icon: draft.icon, hour: draft.hour, minute: draft.minute, days } : a
      );
    } else {
      next = [
        ...alarms,
        {
          id: makeId(),
          label,
          icon: draft.icon,
          hour: draft.hour,
          minute: draft.minute,
          days,
          enabled: true,
          createdAt: Date.now(),
        },
      ];
    }
    // The scheduler can only hold ALARM_MAX_SCHEDULED pending entries (one per
    // repeat day). Block the save here — with the editor still open so the
    // user can trim days — rather than letting reminders silently not fire.
    if (countAlarmEntries(next) > ALARM_MAX_SCHEDULED) {
      Alert.alert('', L.slots);
      return;
    }
    persist(next);
    setEditorOpen(false);
    setDraft(null);
  };

  const toggleDraftDay = (weekday: number) => {
    if (!draft) return;
    // An empty list renders as "every day", so expand it before toggling —
    // otherwise tapping a chip that looks selected would select ONLY that day.
    const base = draft.days.length === 0 ? ALL_DAYS : draft.days;
    const set = new Set(base);
    if (set.has(weekday)) set.delete(weekday);
    else set.add(weekday);
    setDraft({ ...draft, days: Array.from(set).sort((a, b) => a - b) });
  };

  const draftEveryDay = !!draft && (draft.days.length === 0 || draft.days.length >= 7);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(200,120,10,0.18)', 'rgba(26,122,60,0.08)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>⏰</Text>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{L.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{L.subtitle}</Text>
        </LinearGradient>

        {!granted && (
          <View style={styles.permCard}>
            <Text style={[styles.permTitle, { fontSize: fs(14) }]}>🔕 {L.permTitle}</Text>
            <Text style={[styles.permBody, { fontSize: fs(12) }]}>{L.permBody}</Text>
            <TouchableOpacity style={styles.permBtn} onPress={ensurePermission} activeOpacity={0.85}>
              <Text style={[styles.permBtnText, { fontSize: fs(13) }]}>{L.permBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick-add presets */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.presets}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
        >
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.labelEn}
              style={styles.presetTile}
              onPress={() => openPreset(p)}
              activeOpacity={0.85}
            >
              <Text style={styles.presetIcon}>{p.icon}</Text>
              <Text style={[styles.presetLabel, { fontSize: fs(12) }]} numberOfLines={1}>
                {presetLabel(p)}
              </Text>
              <Text style={[styles.presetTime, { fontSize: fs(10) }]}>{formatTime(p.hour, p.minute)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* User reminders */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.yours}</Text>
        {alarms.length === 0 ? (
          <Text style={[styles.empty, { fontSize: fs(13) }]}>{L.empty}</Text>
        ) : (
          <View style={styles.list}>
            {alarms.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.alarmRow}
                onPress={() => openEdit(a)}
                activeOpacity={0.8}
              >
                <Text style={styles.alarmIcon}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.alarmTime, { fontSize: fs(20) }, !a.enabled && styles.dim]}
                    allowFontScaling={false}
                  >
                    {formatTime(a.hour, a.minute)}
                  </Text>
                  <Text style={[styles.alarmLabel, { fontSize: fs(13) }, !a.enabled && styles.dim]} numberOfLines={1}>
                    {a.label}
                  </Text>
                  <Text style={[styles.alarmDays, { fontSize: fs(11) }, !a.enabled && styles.dim]} numberOfLines={1}>
                    {daysSummary(a.days)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleAlarm(a.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: a.enabled }}
                  accessibilityLabel={a.label}
                >
                  <View style={[styles.switch, a.enabled && styles.switchOn]}>
                    <View style={[styles.knob, a.enabled && styles.knobOn]} />
                  </View>
                </Pressable>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.newBtn} onPress={openNew} activeOpacity={0.85}>
          <Text style={[styles.newBtnText, { fontSize: fs(14) }]}>{L.newBtn}</Text>
        </TouchableOpacity>

        <Text style={[styles.footNote, { fontSize: fs(11) }]}>{L.note}</Text>
        <AdBanner unitId={AD_UNITS.bannerGuides} size="rectangle" />
      </ScrollView>

      {/* Editor modal */}
      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditorOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {draft && (
              <>
                <Text style={[styles.sheetTitle, { fontSize: fs(17) }]}>
                  {draft.id ? L.editTitle : L.addTitle}
                </Text>

                <TextInput
                  style={[styles.input, { fontSize: fs(15) }]}
                  value={draft.label}
                  onChangeText={(t) => setDraft({ ...draft, label: t })}
                  placeholder={L.labelPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={40}
                  textAlign={isUrdu || isArabic ? 'right' : 'left'}
                />

                <TimePicker
                  hour={draft.hour}
                  minute={draft.minute}
                  onChange={(hour, minute) => setDraft({ ...draft, hour, minute })}
                />

                <Text style={[styles.sectionLabel, styles.repeatLabel, { fontSize: fs(11) }]}>{L.repeat}</Text>
                <TouchableOpacity
                  style={[styles.everyDayBtn, draftEveryDay && styles.everyDayBtnOn]}
                  onPress={() => setDraft({ ...draft, days: [...ALL_DAYS] })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.everyDayText, draftEveryDay && styles.everyDayTextOn, { fontSize: fs(13) }]}>
                    {draftEveryDay ? '✓ ' : ''}
                    {L.selectAll}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dayChips}>
                  {WEEKDAYS[locale].map((label, i) => {
                    const weekday = i + 1;
                    const on = draftEveryDay || draft.days.includes(weekday);
                    return (
                      <TouchableOpacity
                        key={weekday}
                        style={[styles.dayChip, on && styles.dayChipOn]}
                        onPress={() => toggleDraftDay(weekday)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dayChipText, on && styles.dayChipTextOn, { fontSize: fs(12) }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.sheetActions}>
                  {draft.id && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => draft.id && deleteAlarm(draft.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.deleteBtnText, { fontSize: fs(14) }]}>{L.delete}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.saveBtn} onPress={saveDraft} activeOpacity={0.85}>
                    <Text style={[styles.saveBtnText, { fontSize: fs(15) }]}>{L.save}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditorOpen(false)}>
                  <Text style={[styles.cancelBtnText, { fontSize: fs(13) }]}>{L.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: theme.spacing.xl,
  },
  heroEmoji: { fontSize: 40, marginBottom: 4 },
  heroTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  permCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    gap: 6,
  },
  permTitle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text },
  permBody: { fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary },
  permBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  permBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  sectionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  presetRow: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  presetTile: {
    width: 96,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 6,
    gap: 4,
  },
  presetIcon: { fontSize: 26 },
  presetLabel: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  presetTime: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
  },
  empty: {
    marginHorizontal: theme.spacing.xl,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  list: {
    marginHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  alarmIcon: { fontSize: 26 },
  alarmTime: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  alarmLabel: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  alarmDays: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  dim: { opacity: 0.4 },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: theme.colors.accent },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  knobOn: { alignSelf: 'flex-end' },
  newBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  newBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  footNote: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 17,
  },

  /* Editor sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,15,6,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  sheetTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.text,
  },
  repeatLabel: { marginHorizontal: 0, marginTop: theme.spacing.sm },
  everyDayBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  everyDayBtnOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  everyDayText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  everyDayTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dayChipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  dayChipText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  dayChipTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  sheetActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  deleteBtn: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorMuted,
    alignItems: 'center',
  },
  deleteBtnText: { color: theme.colors.error, fontFamily: theme.typography.fontBodyBold },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { color: theme.colors.textMuted, fontFamily: theme.typography.fontBodyMedium },
});
