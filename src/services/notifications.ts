import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  CalendarRegion,
  EventType,
  getMilestonesFor,
  getQuoteForEvent,
  getUpcomingEvents,
  ResolvedEvent,
  Sect,
} from '../constants/islamicCalendar';
import type { Language } from '../constants/translations';

export type PrayerTime = {
  name: string;
  time: Date;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const PRAYER_ID_PREFIX = 'pr:';

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[]
): Promise<void> {
  // Only cancel prayer reminders — leave sacred-countdown notifications in place.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(PRAYER_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  for (const prayer of prayerTimes) {
    const triggerTime = new Date(prayer.time.getTime() - 5 * 60 * 1000); // 5 min before
    if (triggerTime > new Date()) {
      const id = `${PRAYER_ID_PREFIX}${prayer.name}:${triggerTime.getTime()}`;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: `⏰ ${prayer.name} in 5 minutes`,
          body: 'Time to prepare for prayer.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
          channelId: 'azan-reminders',
        },
      });
    }
  }
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('azan-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('sacred-countdown', {
      name: 'Sacred Events',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('streak-reminders', {
      name: 'Daily Streak',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

const STREAK_ID_PREFIX = 'streak:';
const STREAK_HOUR = 21;
const STREAK_MINUTE = 0;

const STREAK_COPY: Record<Language, { title: string; body: string }> = {
  en: {
    title: '🔥 Keep your streak alive',
    body: 'Don’t let today pass. Mark your prayers and continue your journey with Noor.',
  },
  ur: {
    title: '🔥 اپنا سلسلہ برقرار رکھیں',
    body: 'آج کا دن ضائع نہ ہونے دیں۔ اپنی نمازیں مارک کریں اور نور کے ساتھ سفر جاری رکھیں۔',
  },
  ar: {
    title: '🔥 حافظ على تتابعك',
    body: 'لا تدع اليوم يمر. سجّل صلواتك وواصل رحلتك مع Noor.',
  },
};

export async function scheduleStreakReminder(language: Language = 'en'): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(STREAK_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const copy = STREAK_COPY[language] ?? STREAK_COPY.en;

  await Notifications.scheduleNotificationAsync({
    identifier: `${STREAK_ID_PREFIX}daily`,
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: STREAK_HOUR,
      minute: STREAK_MINUTE,
      channelId: 'streak-reminders',
    },
  });
}

// Sacred Countdown notifications use a stable `sc:` prefix so prayer and
// sacred schedules can be cancelled/recreated independently.
const SACRED_ID_PREFIX = 'sc:';

type MilestoneCopy = {
  title: string;
  body: string;
};

function buildMilestoneCopy(
  event: ResolvedEvent,
  daysAway: number,
  language: Language
): MilestoneCopy {
  const eventName =
    language === 'ur' ? event.nameUr : language === 'ar' ? event.nameAr : event.nameEn;
  const quote = getQuoteForEvent(event.type, daysAway);
  const verse = language === 'ur' ? quote.ur : quote.en;

  const hook = hookFor(event.type, daysAway, language);

  if (daysAway === 0) {
    const celebratoryTitle =
      language === 'ur'
        ? `${event.icon} ${eventName} — آج کا دن`
        : language === 'ar'
        ? `${event.icon} ${eventName} — اليوم`
        : `${event.icon} ${eventName} is today`;
    return {
      title: celebratoryTitle,
      body: `${hook}\n${verse}`.trim(),
    };
  }

  const countdownTitle =
    language === 'ur'
      ? `${event.icon} ${eventName} — ${daysAway} دن باقی`
      : language === 'ar'
      ? `${event.icon} ${eventName} — ${daysAway} يوماً`
      : `${event.icon} ${eventName} in ${daysAway} ${daysAway === 1 ? 'day' : 'days'}`;

  return {
    title: countdownTitle,
    body: `${hook}\n${verse}`.trim(),
  };
}

function hookFor(type: EventType, daysAway: number, language: Language): string {
  const en = hookEn(type, daysAway);
  if (language === 'en') return en;
  return hookLocalized(type, daysAway, language) ?? en;
}

function hookEn(type: EventType, d: number): string {
  switch (type) {
    case 'ramadan_start':
      if (d >= 30) return 'A month to prepare your heart — set your Ramadan goals today.';
      if (d >= 14) return 'Two weeks out. Begin increasing your Qur\'an reading.';
      if (d >= 7)  return 'One week — stock suhoor essentials, plan your reading schedule.';
      if (d >= 3)  return 'A few days left. Make your taraweeh and du\'a list.';
      if (d === 1) return 'Tomorrow is the first fast. Niyyah, suhoor alarm, early night.';
      return 'Ramadan Mubarak. May your fasts be accepted.';
    case 'laylat_al_qadr':
      if (d === 1) return 'Tomorrow could be the Night of Decree. Plan your i\'tikaf, prepare your du\'as.';
      return 'The night better than a thousand months. Stay in worship tonight.';
    case 'eid_fitr':
      if (d >= 7)  return 'A week to Eid — plan your Zakat al-Fitr, outfit, and gifts.';
      if (d >= 3)  return 'A few days. Pay Zakat al-Fitr on behalf of every family member.';
      if (d === 1) return 'Tomorrow is Eid. Takbeer tonight. Eat odd-numbered dates before prayer.';
      return 'Eid Mubarak. Taqabbal Allahu minna wa minkum.';
    case 'dhul_hijjah_start':
      if (d >= 7)  return 'The best ten days of the year begin soon. Plan your worship.';
      if (d === 1) return 'Tomorrow the ten days begin. Fast, give, remember Allah.';
      return 'The sacred ten begin today. No deeds are more beloved than righteous deeds now.';
    case 'arafah':
      if (d >= 7)  return 'The greatest day. Plan to fast if you\'re not on Hajj.';
      if (d === 1) return 'Tomorrow is Arafah. Suhoor early — one year past, one year future forgiven.';
      return 'Arafah. Make du\'a generously today — the best of du\'as.';
    case 'eid_adha':
      if (d >= 7)  return 'A week until Eid al-Adha. Arrange your Qurbani.';
      if (d >= 3)  return 'Prepare Qurbani. Don\'t cut hair or nails from 1st Dhul Hijjah.';
      if (d === 1) return 'Tomorrow is Eid al-Adha. Eat nothing before the prayer.';
      return 'Eid Mubarak. Takbeer, salah, then Qurbani.';
    case 'islamic_new_year':
      if (d === 0) return 'A new Hijri year. Renew your intention for the year ahead.';
      return 'A new Islamic year approaches. Reflect and set your goals.';
    case 'ashura':
      if (d === 1) return 'Tomorrow is Ashura. Fast the 9th and 10th, or 10th and 11th.';
      return 'Fast Ashura — it expiates the sins of the past year.';
    case 'arbaeen':
      return 'Arbaeen: forty days of remembrance.';
    case 'mawlid':
      return 'Send salutations on the Messenger ﷺ — mercy to the worlds.';
    case 'isra_miraj':
      return 'The miraculous night journey. Reflect on the gift of salah — given directly from above.';
    case 'shab_e_barat':
      return 'The night of forgiveness. Make du\'a, seek pardon, renew your heart.';
    default:
      return '';
  }
}

function hookLocalized(type: EventType, d: number, lang: Language): string | null {
  if (lang === 'ur') {
    switch (type) {
      case 'ramadan_start':
        if (d >= 30) return 'دل کی تیاری کا مہینہ قریب ہے — آج اپنے رمضان کے اہداف بنائیں۔';
        if (d >= 14) return 'دو ہفتے باقی۔ قرآن کی تلاوت بڑھانا شروع کریں۔';
        if (d >= 7)  return 'ایک ہفتہ باقی۔ سحری کی تیاری اور پڑھائی کا شیڈول بنائیں۔';
        if (d >= 3)  return 'چند دن باقی۔ تراویح اور دعاؤں کی فہرست بنائیں۔';
        if (d === 1) return 'کل پہلا روزہ ہے۔ نیت، سحری، اور جلدی سونا۔';
        return 'رمضان مبارک۔ آپ کے روزے قبول ہوں۔';
      case 'laylat_al_qadr':
        if (d === 1) return 'کل شبِ قدر ہو سکتی ہے۔ اپنی دعائیں تیار کریں۔';
        return 'ہزار مہینوں سے بہتر رات۔ آج عبادت میں رہیں۔';
      case 'eid_fitr':
        if (d >= 7)  return 'عید میں ایک ہفتہ — زکوٰۃ الفطر، لباس اور تحفے کی تیاری۔';
        if (d >= 3)  return 'چند دن باقی۔ ہر فرد کی طرف سے زکوٰۃ الفطر ادا کریں۔';
        if (d === 1) return 'کل عید ہے۔ آج رات تکبیر۔ نماز سے پہلے طاق تعداد کھجور کھائیں۔';
        return 'عید مبارک۔ تقبل اللہ منا و منکم۔';
      case 'dhul_hijjah_start':
        if (d >= 7)  return 'سال کے بہترین دس دن قریب ہیں۔';
        if (d === 1) return 'کل سے دس دن شروع۔ روزہ، صدقہ، ذکر۔';
        return 'آج سے مقدس دس دن۔ ان دنوں سے بڑھ کر عمل محبوب نہیں۔';
      case 'arafah':
        if (d >= 7)  return 'عظیم ترین دن۔ اگر حج پر نہیں تو روزہ کی منصوبہ بندی کریں۔';
        if (d === 1) return 'کل یومِ عرفہ۔ ایک سال گزشتہ، ایک آئندہ کے گناہ معاف۔';
        return 'یومِ عرفہ۔ آج دل کھول کر دعا کریں۔';
      case 'eid_adha':
        if (d >= 7)  return 'عیدالاضحی میں ایک ہفتہ۔ قربانی کا بندوبست کریں۔';
        if (d >= 3)  return '۱ ذوالحجہ سے بال اور ناخن نہ کاٹیں۔';
        if (d === 1) return 'کل عیدالاضحی۔ نماز سے پہلے کچھ نہ کھائیں۔';
        return 'عید مبارک۔ تکبیر، نماز، پھر قربانی۔';
      case 'ashura':
        if (d === 1) return 'کل عاشورہ ہے۔ ۹ اور ۱۰ یا ۱۰ اور ۱۱ کو روزہ رکھیں۔';
        return 'عاشورہ کا روزہ — پچھلے سال کے گناہوں کا کفارہ۔';
      case 'islamic_new_year':
        return 'نیا ہجری سال قریب۔ غور و فکر اور نیت کی تجدید۔';
      case 'mawlid':
        return 'رسول ﷺ پر درود بھیجیں — رحمۃٌ للعٰلمین۔';
      case 'isra_miraj':
        return 'معجزاتی سفر کی رات۔ نماز کا تحفہ — اللہ سے براہ راست۔';
      case 'shab_e_barat':
        return 'مغفرت کی رات۔ دعا، استغفار، دل کی تجدید۔';
      case 'arbaeen':
        return 'اربعین: چالیس دن کی یاد۔';
      default:
        return '';
    }
  }
  // Arabic falls through to the Qur'an quote alone — intentionally short.
  return null;
}

export async function scheduleSacredCountdownNotifications(
  sect: Sect | null,
  region: CalendarRegion,
  mutedIds: string[],
  language: Language
): Promise<number> {
  // Clean up previous sacred schedules only — leave prayer reminders alone.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(SACRED_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const events = getUpcomingEvents(sect, region).slice(0, 12); // cap to avoid spam
  const now = new Date();
  let scheduled = 0;

  for (const event of events) {
    if (mutedIds.includes(event.id)) continue;

    const milestones = getMilestonesFor(event.type);

    for (const daysAway of milestones) {
      // Trigger: day-of → 6:30am, night-before → 8pm prev night, else 9am.
      const trigger = new Date(event.effectiveDate);
      if (daysAway === 0) {
        trigger.setHours(6, 30, 0, 0);
      } else if (daysAway === 1) {
        trigger.setDate(trigger.getDate() - 1);
        trigger.setHours(20, 0, 0, 0);
      } else {
        trigger.setDate(trigger.getDate() - daysAway);
        trigger.setHours(9, 0, 0, 0);
      }

      if (trigger <= now) continue;

      const copy = buildMilestoneCopy(event, daysAway, language);
      const id = `${SACRED_ID_PREFIX}${event.id}:${daysAway}`;

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: copy.title,
          body: copy.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: 'sacred-countdown',
        },
      });
      scheduled += 1;
    }
  }

  return scheduled;
}
