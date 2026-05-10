import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../constants/theme';

type Lang = 'en' | 'ur' | 'ar';

type LegendEntry = {
  symbol: string;
  nameEn: string;
  nameUr: string;
  meaningEn: string;
  meaningUr: string;
  // 'must' = strong rule (pause required / forbidden);
  // 'soft' = preference; 'info' = informational marker.
  tone: 'must' | 'soft' | 'info';
};

// Sourced from the King Fahd Glorious Quran Printing Complex Mushaf legend
// (Hafs an Asim). The same set is documented at qul.tarteel.ai and used
// across major Quran apps. Order: most-frequent and strongest rules first.
const WAQF_ENTRIES: LegendEntry[] = [
  {
    symbol: 'مـ',
    nameEn: 'Waqf Lazim',
    nameUr: 'وقفِ لازم',
    meaningEn: 'Must pause. Continuing here can change the meaning of the verse.',
    meaningUr: 'یہاں ٹھہرنا لازم ہے۔ اگر نہ ٹھہریں تو معنی بدل سکتا ہے۔',
    tone: 'must',
  },
  {
    symbol: 'لا',
    nameEn: 'La Waqf',
    nameUr: 'لا (وقف ممنوع)',
    meaningEn: "Do NOT pause here. If you must breathe, go back a few words and continue.",
    meaningUr: 'یہاں ٹھہرنا منع ہے۔ سانس لینے کی ضرورت ہو تو پیچھے سے پڑھ کر ملا کر پڑھیں۔',
    tone: 'must',
  },
  {
    symbol: 'قلى',
    nameEn: 'Al-Waqf Awla',
    nameUr: 'وقفِ اولیٰ',
    meaningEn: 'Pausing is preferred, though continuing is allowed.',
    meaningUr: 'یہاں ٹھہرنا بہتر ہے۔ ملا کر پڑھنا بھی جائز ہے۔',
    tone: 'soft',
  },
  {
    symbol: 'صلى',
    nameEn: 'Al-Wasl Awla',
    nameUr: 'وصلِ اولیٰ',
    meaningEn: 'Continuing is preferred, though pausing is allowed.',
    meaningUr: 'یہاں ملا کر پڑھنا بہتر ہے۔ ٹھہرنا بھی جائز ہے۔',
    tone: 'soft',
  },
  {
    symbol: 'ج',
    nameEn: 'Waqf Jaaiz',
    nameUr: 'وقفِ جائز',
    meaningEn: 'Pause is permitted. Both pausing and continuing are equal.',
    meaningUr: 'ٹھہرنا اور ملانا دونوں جائز ہیں۔',
    tone: 'soft',
  },
  {
    symbol: 'ط',
    nameEn: 'Waqf Mutlaq',
    nameUr: 'وقفِ مطلق',
    meaningEn: 'Absolute pause. The breath stops here completely.',
    meaningUr: 'مکمل وقف کریں۔ سانس یہاں توڑ دیں۔',
    tone: 'soft',
  },
  {
    symbol: 'ز',
    nameEn: 'Waqf Mujawwaz',
    nameUr: 'وقفِ مجوز',
    meaningEn: 'Pause is permissible (less common; continuing is generally preferred).',
    meaningUr: 'ٹھہرنا جائز ہے، لیکن ملا کر پڑھنا عموماً بہتر ہے۔',
    tone: 'soft',
  },
  {
    symbol: 'ص',
    nameEn: 'Waqf Murakhkhas',
    nameUr: 'وقفِ مرخص',
    meaningEn: 'Pause is permitted only when needed (e.g. running out of breath).',
    meaningUr: 'صرف ضرورت پر، جیسے سانس ختم ہونے پر، ٹھہریں۔',
    tone: 'soft',
  },
  {
    symbol: 'ق',
    nameEn: 'Qad Qila',
    nameUr: 'قد قیل',
    meaningEn: '"It has been said" — some scholars said to pause; continuing is more common.',
    meaningUr: 'کچھ علماء نے یہاں ٹھہرنے کو کہا ہے۔ ملا کر پڑھنا زیادہ مشہور ہے۔',
    tone: 'soft',
  },
  {
    symbol: '∴ ⋯ ∴',
    nameEn: "Mu'anaqah",
    nameUr: 'معانقہ',
    meaningEn: 'Embracing pause: stop at ONE of the two marked spots, not both.',
    meaningUr: 'دونوں میں سے کسی ایک جگہ ٹھہریں، دونوں پر نہیں۔',
    tone: 'must',
  },
];

const OTHER_ENTRIES: LegendEntry[] = [
  {
    symbol: '۩',
    nameEn: 'Sajdah',
    nameUr: 'سجدۂ تلاوت',
    meaningEn: 'A prostration ayah. Reader (and listener) should perform sajdat al-tilawah.',
    meaningUr: 'یہ آیتِ سجدہ ہے۔ پڑھنے اور سننے والے دونوں پر سجدہ تلاوت لازم ہے۔',
    tone: 'must',
  },
  {
    symbol: '۞',
    nameEn: 'Rub' + " al-Hizb",
    nameUr: 'ربع الحزب',
    meaningEn: 'Marks every quarter of a hizb (one-eighth of a juz).',
    meaningUr: 'ربع الحزب کی نشانی۔ ہر حزب کے چوتھائی پر آتی ہے۔',
    tone: 'info',
  },
  {
    symbol: 'ع',
    nameEn: "Ruku'",
    nameUr: 'رکوع',
    meaningEn: "End of a ruku' — a thematic section used as a stopping point in salah.",
    meaningUr: 'رکوع کا اختتام۔ نماز میں ایک سیکشن ختم کرنے کی نشانی۔',
    tone: 'info',
  },
  {
    symbol: '﴿ ﴾',
    nameEn: 'Verse Marker',
    nameUr: 'نشانیٔ آیت',
    meaningEn: 'Marks the end of an ayah. The number inside is the ayah number.',
    meaningUr: 'آیت کا اختتام۔ درمیان میں نمبر آیت کا ہوتا ہے۔',
    tone: 'info',
  },
];

const TONE_COLORS: Record<LegendEntry['tone'], { fg: string; bg: string }> = {
  must: { fg: '#B83025', bg: 'rgba(184, 48, 37, 0.10)' },
  soft: { fg: '#C8780A', bg: 'rgba(200, 120, 10, 0.10)' },
  info: { fg: '#1A7A3C', bg: 'rgba(26, 122, 60, 0.10)' },
};

export function WaqfLegendModal({
  visible,
  onClose,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  language: Lang;
}) {
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  const renderRow = (e: LegendEntry, idx: number) => {
    const tc = TONE_COLORS[e.tone];
    return (
      <View
        key={`${e.nameEn}-${idx}`}
        style={[styles.row, { borderColor: tc.bg, backgroundColor: tc.bg }]}
      >
        <View style={[styles.symbolBox, { borderColor: tc.fg }]}>
          <Text style={[styles.symbol, { color: tc.fg }]}>{e.symbol}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, { color: tc.fg }]}>
            {isUrdu ? e.nameUr : e.nameEn}
          </Text>
          <Text style={styles.rowMeaning}>
            {isUrdu ? e.meaningUr : e.meaningEn}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isUrdu ? 'علاماتِ قراءت' : isArabic ? 'علامات الوقف' : 'Reading Marks'}
            </Text>
            <Text style={styles.subtitle}>
              {isUrdu
                ? 'یہ نشانیاں بتاتی ہیں کہ کہاں ٹھہرنا ہے، کہاں ملانا ہے، اور کہاں سجدہ کرنا ہے۔'
                : isArabic
                ? 'تخبرك هذه العلامات أين تتوقف وأين تواصل وأين تسجد.'
                : 'These marks tell you where to pause, where to keep going, and where to prostrate.'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionTitle}>
              {isUrdu ? 'وقف کی علامات' : 'Pause / Stop Marks'}
            </Text>
            {WAQF_ENTRIES.map(renderRow)}

            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>
              {isUrdu ? 'دیگر نشانیاں' : 'Other Markers'}
            </Text>
            {OTHER_ENTRIES.map(renderRow)}

            <Text style={styles.footnote}>
              {isUrdu
                ? 'یہ علامات کنگ فہد قرآن کمپلیکس مدینہ منورہ کے مصحف پر مبنی ہیں (روایتِ حفص عن عاصم)۔'
                : 'Based on the King Fahd Quran Printing Complex Mushaf, Madinah (Hafs an Asim recitation).'}
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>
              {isUrdu ? 'بند کریں' : isArabic ? 'إغلاق' : 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 15, 6, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: theme.spacing.lg,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  title: {
    fontSize: 20,
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  symbolBox: {
    width: 56,
    minHeight: 56,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  symbol: {
    fontFamily: theme.typography.fontQuranUthmani,
    fontSize: 26,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyBold,
  },
  rowMeaning: {
    fontSize: 13,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  footnote: {
    fontSize: 11,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 16,
  },
  closeBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
  },
});
