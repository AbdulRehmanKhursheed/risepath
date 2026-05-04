import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { UPCOMING_EID_DATES, EidDate } from '../constants/eidGuide';
import { PLAY_STORE_URL } from '../constants/appLinks';

const TICK_MS = 60 * 1000;
const SHOW_DAYS_BEFORE = 21; // appear ~3 weeks ahead
const SHOW_DAYS_AFTER = 5;   // linger 5 days after Eid for tashreeq days

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Picks the Eid we are currently inside the visibility window of, or null.
function pickActiveEid(now: Date): EidDate | null {
  const today = startOfDay(now);
  for (const e of UPCOMING_EID_DATES) {
    const eidDay = startOfDay(e.date);
    const windowOpen = new Date(eidDay);
    windowOpen.setDate(windowOpen.getDate() - SHOW_DAYS_BEFORE);
    const windowClose = new Date(eidDay);
    windowClose.setDate(windowClose.getDate() + SHOW_DAYS_AFTER);
    if (today >= windowOpen && today <= windowClose) return e;
  }
  return null;
}

export function EidHubCard() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const navigation = useNavigation();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const eid = useMemo(() => pickActiveEid(now), [now]);

  if (!eid) return null;

  const eidDay = startOfDay(eid.date);
  const today = startOfDay(now);
  const daysUntil = Math.round(
    (eidDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isAdha = eid.type === 'adha';
  const headline = isAdha
    ? isUrdu
      ? 'عیدالاضحی'
      : isArabic
      ? 'عيد الأضحى'
      : 'Eid al-Adha'
    : isUrdu
    ? 'عیدالفطر'
    : isArabic
    ? 'عيد الفطر'
    : 'Eid al-Fitr';

  const ctaText = isUrdu
    ? 'مکمل گائیڈ'
    : isArabic
    ? 'الدليل'
    : 'Full Guide';

  const qurbaniText = isUrdu
    ? 'قربانی'
    : isArabic
    ? 'الأضحية'
    : 'Qurbani';

  const takbirText = isUrdu
    ? 'تکبیرات'
    : isArabic
    ? 'التكبير'
    : 'Takbir';

  const countdownText =
    daysUntil > 0
      ? isUrdu
        ? `${daysUntil} دن باقی`
        : isArabic
        ? `${daysUntil} أيام`
        : `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} away`
      : daysUntil === 0
      ? isUrdu
        ? 'آج کا دن'
        : isArabic
        ? 'اليوم'
        : 'Today'
      : isUrdu
      ? 'مبارک ہو'
      : isArabic
      ? 'مبارك'
      : 'Mubarak';

  const subtitle = isAdha
    ? isUrdu
      ? 'ذوالحجہ کے ۱۰ دن، یوم عرفہ، تکبیرات، قربانی'
      : isArabic
      ? 'العشر، عرفة، التكبير، الأضحية'
      : '10 Days, Arafah, Takbeer & Qurbani'
    : isUrdu
    ? 'زکوٰۃ الفطر، نمازِ عید، تکبیرات'
    : isArabic
    ? 'زكاة الفطر، صلاة العيد، التكبير'
    : 'Zakat al-Fitr, Eid Salah & Takbeer';

  const onShareGreeting = async () => {
    // Authentic salaf greeting (Fath al-Bari, graded hasan) + sourced ayah +
    // app attribution. Plain text — works in WhatsApp, SMS, Messenger, Telegram.
    const greetingArabic = 'تَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُمْ';
    const greeting = isUrdu
      ? 'عید مبارک 🌙\n\nتقبل اللہ منا و منکم\n(اللہ ہم سے اور آپ سے قبول فرمائے)'
      : isArabic
      ? 'عيد مبارك 🌙\n\nتَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُمْ'
      : `Eid Mubarak 🌙\n\n${greetingArabic}\nTaqabbalallahu Minna wa Minkum\n(May Allah accept from us and from you)`;

    const ayah = isAdha
      ? isUrdu
        ? '\n\n"پس اپنے رب کے لیے نماز پڑھیے اور قربانی کیجیے۔" — قرآن ۱۰۸:۲'
        : isArabic
        ? '\n\nفَصَلِّ لِرَبِّكَ وَانْحَرْ — القرآن ١٠٨:٢'
        : '\n\n"So pray to your Lord and sacrifice." — Qur\'an 108:2'
      : isUrdu
      ? '\n\n"اور اللہ کی کبریائی بیان کرو اس ہدایت پر جو اس نے تمہیں دی، اور تاکہ تم شکر گزار بنو۔" — قرآن ۲:۱۸۵'
      : isArabic
      ? '\n\nوَلِتُكَبِّرُوا اللَّهَ عَلَىٰ مَا هَدَاكُمْ — القرآن ٢:١٨٥'
      : '\n\n"That you may magnify Allah for the guidance He has given you." — Qur\'an 2:185';

    const footer = `\n\n— Noor · ${PLAY_STORE_URL}`;

    try {
      await Share.share({ message: `${greeting}${ayah}${footer}` });
    } catch {
      Alert.alert(
        isUrdu ? 'خرابی' : isArabic ? 'خطأ' : 'Error',
        isUrdu ? 'شیئر نہیں ہو سکا' : isArabic ? 'تعذرت المشاركة' : 'Could not share'
      );
    }
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#3A6B3A', '#1F2B1C']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{isAdha ? '🐑' : '🌟'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { fontSize: fs(10) }]}>
              {isUrdu ? 'عید قریب ہے' : isArabic ? 'العيد قريب' : 'EID IS NEAR'}
            </Text>
            <Text style={[styles.title, { fontSize: fs(20) }]} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={[styles.countdown, { fontSize: fs(13) }]}>
              {countdownText}
            </Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { fontSize: fs(12) }]}>{subtitle}</Text>

        {isAdha ? (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => (navigation as any).navigate('Qurbani')}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnPrimaryText, { fontSize: fs(13) }]}>🐑 {qurbaniText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => (navigation as any).navigate('Takbir')}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnPrimaryText, { fontSize: fs(13) }]}>📣 {takbirText}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => (navigation as any).navigate('Eid')}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnSecondaryText, { fontSize: fs(13) }]}>{ctaText} ›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onShareGreeting}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnSecondaryText, { fontSize: fs(13) }]}>
                  {isUrdu ? '📤 شیئر' : isArabic ? '📤 شارك' : '📤 Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => (navigation as any).navigate('Eid')}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnPrimaryText, { fontSize: fs(13) }]}>{ctaText} ›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onShareGreeting}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnSecondaryText, { fontSize: fs(13) }]}>
                {isUrdu ? '📤 شیئر' : isArabic ? '📤 شارك' : '📤 Share'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1C0F06',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -0.4,
    fontWeight: '700',
  },
  countdown: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.typography.fontBody,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
  },
  btnPrimaryText: {
    fontFamily: theme.typography.fontBodyBold,
    color: '#1F2B1C',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  btnSecondaryText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: '#FFFFFF',
  },
});
