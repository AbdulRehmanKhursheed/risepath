import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../contexts/SidebarContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { theme } from '../constants/theme';
import { PLAY_STORE_URL } from '../constants/appLinks';

const SIDEBAR_WIDTH = 290;
const ANIM_DURATION = 260;

type NavItem = {
  name: string;
  icon: string;
  labelEn: string;
  labelUr: string;
  labelAr: string;
};

const NAV_ITEMS: NavItem[] = [
  { name: 'Tasbih', icon: '📿', labelEn: 'Tasbih Counter',   labelUr: 'تسبیح کاؤنٹر',  labelAr: 'عدّاد التسبيح' },
  { name: 'Learn',  icon: '✎', labelEn: 'Kalimas & Duas',   labelUr: 'کلمے اور دعائیں', labelAr: 'الكلمات والأدعية' },
  { name: 'Eid',    icon: '🌙', labelEn: 'Eid Guide',        labelUr: 'عید گائیڈ',     labelAr: 'دليل العيد' },
  { name: 'Hajj',   icon: '🕋', labelEn: 'Hajj Guide',       labelUr: 'حج گائیڈ',     labelAr: 'دليل الحج' },
  { name: 'Umrah',  icon: '✪', labelEn: 'Umrah Guide',      labelUr: 'عمرہ گائیڈ',   labelAr: 'دليل العمرة' },
  { name: 'Janaza', icon: '☪', labelEn: 'Janaza Guide',     labelUr: 'جنازہ گائیڈ',   labelAr: 'دليل الجنازة' },
  { name: 'Qibla',  icon: '◎', labelEn: 'Qibla Direction',  labelUr: 'قبلہ سمت',     labelAr: 'اتجاه القبلة' },
  { name: 'Mood',   icon: '☺', labelEn: 'Mood Coach',       labelUr: 'موڈ کوچ',      labelAr: 'مرشد المزاج' },
  { name: 'Stats',  icon: '▦', labelEn: 'My Stats',         labelUr: 'میرے اعداد',    labelAr: 'إحصائياتي' },
];

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { language, setLanguage } = useLanguage();
  const { simpleMode, toggleSimpleMode, fs } = useSimpleMode();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const navLabel = (item: NavItem) =>
    isUrdu ? item.labelUr : isArabic ? item.labelAr : item.labelEn;
  const nextLanguage = (): 'en' | 'ur' | 'ar' => {
    if (language === 'en') return 'ur';
    if (language === 'ur') return 'ar';
    return 'en';
  };
  const nextLangLabel = () => {
    const n = nextLanguage();
    if (n === 'en') return 'English';
    if (n === 'ur') return 'اردو';
    return 'العربية';
  };

  // Keep mounted so animation can play out on close
  const [mounted, setMounted] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SIDEBAR_WIDTH,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen]);

  if (!mounted) return null;

  const navigateTo = (screenName: string) => {
    closeSidebar();
    setTimeout(() => {
      (navigation as any).navigate(screenName);
    }, 50);
  };

  const onShareApp = async () => {
    try {
      await Share.share({
        message: isUrdu
          ? `Noor — مسلم ساتھی\nنماز، قبلہ، حج/عمرہ/جنازہ گائیڈ اور روزانہ روحانی ٹریکنگ\n${PLAY_STORE_URL}`
          : `Noor — Muslim Companion\nPrayer, Qibla, Hajj/Umrah/Janaza guides and daily spiritual tracking\n${PLAY_STORE_URL}`,
      });
    } catch {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'شیئر نہیں ہو سکا' : 'Could not share app');
    }
  };

  const onRateApp = async () => {
    try {
      const supported = await Linking.canOpenURL(PLAY_STORE_URL);
      if (supported) {
        await Linking.openURL(PLAY_STORE_URL);
      } else {
        Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'لنک نہیں کھل سکا' : 'Could not open store link');
      }
    } catch {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'لنک نہیں کھل سکا' : 'Could not open store link');
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Content Disclaimer Modal */}
      <Modal
        visible={disclaimerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisclaimerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isUrdu ? 'اہم نوٹ' : 'About Noor'}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>
                {isUrdu
                  ? 'قرآنی آیات العثمانی اسکرپٹ (عربی)، Saheeh International (انگریزی)، اور مودودی (اردو) ترجمہ سے لی گئی ہیں۔\n\nاحادیث اور دعائیں اعلیٰ درجے کی کتب سے لی گئی ہیں۔ جہاں کوئی روایت کمزور یا محل نظر ہو، وہاں نوٹ شامل ہے۔\n\nیہ ایپ ایک تعلیمی اور حوصلہ افزائی کا ذریعہ ہے، کسی مستند عالم کا متبادل نہیں۔ کسی بھی شرعی مسئلہ کے لیے اپنے عالم سے رابطہ کریں۔'
                  : 'Quran text is sourced from the Uthmani script (Arabic), Saheeh International (English), and Maududi (Urdu) editions.\n\nHadith references and duas have been compiled from authenticated sources. Where a narration is known to be disputed or weak, a note is included.\n\nThis app is an educational and motivational aid — it is not a substitute for a qualified Islamic scholar. For religious rulings, always consult your local scholar.\n\nAll data is stored only on your device. We do not collect or share personal information. See PRIVACY_POLICY.md for full details.'}
              </Text>
              <Text style={styles.modalVersion}>Noor v1.0.0</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setDisclaimerVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>
                {isUrdu ? 'بند کریں' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dim overlay — tap to close */}
      <TouchableWithoutFeedback onPress={closeSidebar}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        />
      </TouchableWithoutFeedback>

      {/* Sliding panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX }],
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(200,120,10,0.10)', 'rgba(26,122,60,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>☾</Text>
            </View>
            <View>
              <Text style={[styles.appName, { fontSize: fs(22) }]}>Noor</Text>
              <Text style={[styles.appTagline, { fontSize: fs(12) }]}>
                {isUrdu ? 'آپ کا اسلامی ساتھی' : 'Your Muslim Companion'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>
          {isUrdu ? 'مزید خصوصیات' : 'MORE FEATURES'}
        </Text>

        {/* Nav items */}
        <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.item}
              onPress={() => navigateTo(item.name)}
              activeOpacity={0.8}
            >
              <View style={styles.itemIconWrap}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.itemLabel, { fontSize: fs(15) }]}>
                {navLabel(item)}
              </Text>
              <Text style={styles.itemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* About & Disclaimer */}
        <TouchableOpacity
          style={styles.aboutBtn}
          onPress={() => setDisclaimerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.aboutBtnText}>
            {isUrdu ? 'ℹ  اہم نوٹ / ڈس کلیمر' : 'ℹ  About & Content Disclaimer'}
          </Text>
        </TouchableOpacity>

        {/* Growth actions */}
        <View style={styles.growthRow}>
          <TouchableOpacity style={styles.growthBtn} onPress={onShareApp} activeOpacity={0.85}>
            <Text style={styles.growthBtnText}>{isUrdu ? '📤 ایپ شیئر کریں' : '📤 Share App'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.growthBtn} onPress={onRateApp} activeOpacity={0.85}>
            <Text style={styles.growthBtnText}>{isUrdu ? '⭐ ریٹنگ دیں' : '⭐ Rate App'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer: language + simple mode toggles */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => setLanguage(nextLanguage())}
              activeOpacity={0.8}
            >
              <Text style={styles.footerBtnIcon}>🌐</Text>
              <Text style={[styles.footerBtnText, { fontSize: fs(12) }]}>
                {nextLangLabel()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerBtn, simpleMode && styles.footerBtnActive]}
              onPress={toggleSimpleMode}
              activeOpacity={0.8}
            >
              <Text style={styles.footerBtnIcon}>Aa</Text>
              <Text style={[styles.footerBtnText, { fontSize: fs(12) }]}>
                {isUrdu ? 'بڑا فونٹ' : 'Large Text'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 15, 6, 0.50)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#1C0F06',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 20,
    color: theme.colors.accent,
  },
  appName: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  itemsScroll: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  itemIcon: {
    fontSize: 16,
    color: theme.colors.accent,
  },
  itemLabel: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  itemArrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 0,
    paddingTop: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footerBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  footerBtnIcon: {
    fontSize: 15,
  },
  footerBtnText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  aboutBtn: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  aboutBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
  },
  growthRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  growthBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  growthBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
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
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    marginBottom: theme.spacing.lg,
  },
  modalScroll: {
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  modalVersion: {
    marginTop: theme.spacing.lg,
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 15,
  },
});
