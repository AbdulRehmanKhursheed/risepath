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
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] =
    React.useState<CalculationMethodId>(calculationMethod);
  const [selectedMadhab, setSelectedMadhab] = React.useState<MadhabId>(madhab);

  React.useEffect(() => {
    setSelectedMethod(calculationMethod);
    setSelectedMadhab(madhab);
  }, [visible, calculationMethod, madhab]);

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
            <Text style={styles.sectionLabel}>{t.calculationMethod}</Text>
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
});
