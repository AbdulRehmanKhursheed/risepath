import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { theme } from '../constants/theme';
import {
  CALCULATION_METHODS,
  MADHABS,
  type CalculationMethodId,
  type MadhabId,
} from '../constants/prayerMethods';
import { useLanguage } from '../contexts/LanguageContext';
import { sendTestNotification } from '../services/notifications';
import { storage } from '../services/storage';
import { formatHijri, computeHijriOffsetFromServer } from '../utils/hijri';

type Props = {
  visible: boolean;
  onClose: () => void;
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  onSave: (method: CalculationMethodId, madhab: MadhabId) => void;
};

export function PrayerSettingsModal({
  visible,
  onClose,
  calculationMethod,
  madhab,
  onSave,
}: Props) {
  const { t, language } = useLanguage();
  const [selectedMethod, setSelectedMethod] =
    React.useState<CalculationMethodId>(calculationMethod);
  const [selectedMadhab, setSelectedMadhab] = React.useState<MadhabId>(madhab);
  const [hijriOffset, setHijriOffset] = React.useState(0);
  const [fiqhSchool, setFiqhSchool] = React.useState<'sunni' | 'shia'>('sunni');

  React.useEffect(() => {
    setSelectedMethod(calculationMethod);
    setSelectedMadhab(madhab);
    if (visible) {
      storage.getHijriOffset().then(setHijriOffset);
      storage.getFiqhSchool().then((s) => setFiqhSchool(s ?? 'sunni'));
    }
  }, [visible, calculationMethod, madhab]);

  const changeFiqh = (next: 'sunni' | 'shia') => {
    setFiqhSchool(next);
    storage.setFiqhSchool(next).catch(() => {});
    // Auto-flip the calc method so the user doesn't end up with Sunni + Jafari
    // or Shia + non-Jafari (which both produce wrong prayer times). Commit the
    // new method to the parent immediately so the change sticks even if the
    // user closes the modal without tapping Save.
    let nextMethod = selectedMethod;
    if (next === 'shia' && selectedMethod !== 'Jafari') nextMethod = 'Jafari';
    else if (next === 'sunni' && selectedMethod === 'Jafari') nextMethod = 'Karachi';
    if (nextMethod !== selectedMethod) {
      setSelectedMethod(nextMethod);
      onSave(nextMethod, selectedMadhab);
    }
  };

  const adjustHijri = (delta: number) => {
    const next = Math.max(-3, Math.min(3, hijriOffset + delta));
    setHijriOffset(next);
    storage.setHijriOffset(next).catch(() => {});
  };

  const [autoDetecting, setAutoDetecting] = React.useState(false);
  const autoDetectHijri = async () => {
    setAutoDetecting(true);
    try {
      const fetched = await computeHijriOffsetFromServer();
      if (fetched != null) {
        setHijriOffset(fetched);
        await storage.setHijriOffset(fetched);
      } else {
        Alert.alert(
          language === 'ur' ? 'انٹرنیٹ سے رابطہ نہیں' : language === 'ar' ? 'تعذّر الاتصال' : 'Could not reach server',
          language === 'ur' ? 'دستی طور پر ایڈجسٹ کرنے کے لیے −/+ استعمال کریں۔' : language === 'ar' ? 'استخدم −/+ لتعديل التاريخ يدوياً.' : 'Use −/+ to adjust the date manually.'
        );
      }
    } finally {
      setAutoDetecting(false);
    }
  };

  const hijriPreview = formatHijri(new Date(), language, hijriOffset);

  const handleSave = () => {
    onSave(selectedMethod, selectedMadhab);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.prayerSettings}</Text>
            <Text style={styles.subtitle}>{t.chooseCalcMethod}</Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>
              {language === 'ur' ? 'مسلک' : language === 'ar' ? 'المذهب' : 'School'}
            </Text>
            <Text style={styles.sectionHint}>
              {language === 'ur'
                ? 'نماز کے اوقات اسی کے مطابق مرتب ہوں گے۔'
                : language === 'ar'
                ? 'سيتم ضبط طريقة الحساب وفقاً لاختيارك.'
                : 'Switching here automatically picks the matching calculation method.'}
            </Text>
            <View style={styles.fiqhRow}>
              {(['sunni', 'shia'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.fiqhPill, fiqhSchool === s && styles.fiqhPillActive]}
                  onPress={() => changeFiqh(s)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.fiqhPillText, fiqhSchool === s && styles.fiqhPillTextActive]}>
                    {s === 'sunni'
                      ? (language === 'ur' ? 'سنی' : language === 'ar' ? 'سني' : 'Sunni')
                      : (language === 'ur' ? 'شیعہ' : language === 'ar' ? 'شيعي' : 'Shia')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>{t.calculationMethod}</Text>
            <Text style={styles.sectionHint}>{t.selectRegionMethod}</Text>
            {CALCULATION_METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.option,
                  selectedMethod === m.id && styles.optionSelected,
                ]}
                onPress={() => setSelectedMethod(m.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>{m.label}</Text>
                <Text style={styles.optionRegion}>{m.region}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>
              {t.asrCalculation}
            </Text>
            <Text style={styles.sectionHint}>{t.hanafiBasis}</Text>
            {MADHABS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.option,
                  selectedMadhab === m.id && styles.optionSelected,
                ]}
                onPress={() => setSelectedMadhab(m.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>{m.label}</Text>
                <Text style={styles.optionRegion}>{m.region}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>
              {language === 'ur' ? 'ہجری تاریخ' : language === 'ar' ? 'التاريخ الهجري' : 'Hijri date'}
            </Text>
            <Text style={styles.sectionHint}>
              {language === 'ur'
                ? 'اگر آپ کے علاقے میں اعلان شدہ تاریخ مختلف ہے تو ±3 دن تک ایڈجسٹ کریں۔'
                : language === 'ar'
                ? 'اضبط ±٣ أيام إذا كانت رؤية الهلال في منطقتك مختلفة.'
                : 'If your local moon-sighting date differs from what the app shows, adjust by ±3 days.'}
            </Text>
            <View style={styles.hijriRow}>
              <TouchableOpacity
                style={[styles.hijriStep, hijriOffset <= -3 && styles.hijriStepDisabled]}
                onPress={() => adjustHijri(-1)}
                disabled={hijriOffset <= -3}
                activeOpacity={0.7}
              >
                <Text style={styles.hijriStepText}>−</Text>
              </TouchableOpacity>
              <View style={styles.hijriPreviewWrap}>
                <Text style={styles.hijriPreview}>{hijriPreview}</Text>
                <Text style={styles.hijriOffsetLabel}>
                  {hijriOffset === 0
                    ? (language === 'ur' ? 'کوئی ایڈجسٹمنٹ نہیں' : language === 'ar' ? 'بدون تعديل' : 'No adjustment')
                    : `${hijriOffset > 0 ? '+' : ''}${hijriOffset} ${language === 'ur' ? 'دن' : language === 'ar' ? 'يوم' : hijriOffset === 1 || hijriOffset === -1 ? 'day' : 'days'}`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.hijriStep, hijriOffset >= 3 && styles.hijriStepDisabled]}
                onPress={() => adjustHijri(1)}
                disabled={hijriOffset >= 3}
                activeOpacity={0.7}
              >
                <Text style={styles.hijriStepText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.autoDetectBtn}
              onPress={autoDetectHijri}
              disabled={autoDetecting}
              activeOpacity={0.8}
            >
              <Text style={styles.autoDetectBtnText}>
                {autoDetecting
                  ? (language === 'ur' ? 'انٹرنیٹ سے حاصل کر رہے ہیں…' : language === 'ar' ? 'يتم الجلب…' : 'Fetching…')
                  : (language === 'ur' ? '↻ انٹرنیٹ سے درست کریں' : language === 'ar' ? '↻ ضبط تلقائي' : '↻ Auto-detect from internet')}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>
              Notifications
            </Text>
            <Text style={styles.sectionHint}>
              If reminders aren't firing on your device, your phone may be killing
              background apps. Test below, then if needed allow Noor to run in the
              background and disable battery optimisation in Android Settings.
            </Text>
            <TouchableOpacity
              style={styles.notifTestBtn}
              onPress={async () => {
                const ok = await sendTestNotification();
                Alert.alert(
                  ok ? '✓ Test scheduled' : 'Permission denied',
                  ok
                    ? 'A test notification will fire in 3 seconds. Lock your screen now to confirm it wakes the device.'
                    : 'Please allow notifications for Noor in Settings, then try again.',
                  [
                    { text: 'OK' },
                    !ok && Platform.OS === 'android'
                      ? {
                          text: 'Open Settings',
                          onPress: () => Linking.openSettings().catch(() => {}),
                        }
                      : null,
                  ].filter(Boolean) as any
                );
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.notifTestBtnText}>🔔 Send test notification</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={styles.notifSettingsLink}
                onPress={() => Linking.openSettings().catch(() => {})}
                activeOpacity={0.7}
              >
                <Text style={styles.notifSettingsLinkText}>
                  ⚙️  Open Android notification settings ›
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: theme.typography.fontBody,
  },
  scroll: {
    maxHeight: 400,
    padding: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontBody,
  },
  option: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  optionRegion: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  saveBtn: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
  notifTestBtn: {
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  notifTestBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
  },
  notifSettingsLink: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  notifSettingsLinkText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
  },
  fiqhRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  fiqhPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  fiqhPillActive: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
  },
  fiqhPillText: {
    fontSize: 15,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  fiqhPillTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  hijriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  hijriStep: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hijriStepDisabled: {
    opacity: 0.4,
  },
  hijriStepText: {
    fontSize: 22,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
    lineHeight: 24,
  },
  hijriPreviewWrap: {
    flex: 1,
    alignItems: 'center',
  },
  hijriPreview: {
    fontSize: 15,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  hijriOffsetLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 2,
  },
  autoDetectBtn: {
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  autoDetectBtnText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
});
