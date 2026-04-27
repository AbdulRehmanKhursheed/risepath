import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  PrayerTimes as AdhanPrayerTimes,
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Madhab,
} from 'adhan';
import {
  CalendarRegion,
  EventType,
  getMilestonesFor,
  getQuoteForEvent,
  getUpcomingEvents,
  ResolvedEvent,
  Sect,
} from '../constants/islamicCalendar';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';
import type { Language } from '../constants/translations';
import { storage } from './storage';

export type PrayerTime = {
  name: string;
  time: Date;
};

// Days of prayer notifications kept scheduled ahead. 7 × 5 = 35 entries leaves
// room under Android's ~50 pending-notification cap for streak + sacred schedules.
export const PRAYER_SCHEDULE_DAYS_AHEAD = 7;

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

const ADHAN_METHOD_MAP: Record<CalculationMethodId, () => CalculationParameters> = {
  MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
  Egyptian: () => CalculationMethod.Egyptian(),
  Karachi: () => CalculationMethod.Karachi(),
  UmmAlQura: () => CalculationMethod.UmmAlQura(),
  Dubai: () => CalculationMethod.Dubai(),
  MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
  NorthAmerica: () => CalculationMethod.NorthAmerica(),
  Kuwait: () => CalculationMethod.Kuwait(),
  Qatar: () => CalculationMethod.Qatar(),
  Singapore: () => CalculationMethod.Singapore(),
  Tehran: () => CalculationMethod.Tehran(),
  Turkey: () => CalculationMethod.Turkey(),
  Jafari: () => {
    const p = CalculationMethod.Other();
    p.fajrAngle = 16;
    p.ishaAngle = 14;
    p.maghribAngle = 4;
    return p;
  },
  Other: () => CalculationMethod.Other(),
};

const ADHAN_MADHAB_MAP = { Shafi: Madhab.Shafi, Hanafi: Madhab.Hanafi } as const;

function computePrayerTimesForDate(
  lat: number,
  lng: number,
  date: Date,
  calculationMethod: CalculationMethodId,
  madhab: MadhabId
): PrayerTime[] {
  const coords = new Coordinates(lat, lng);
  const params = ADHAN_METHOD_MAP[calculationMethod]?.() ?? CalculationMethod.Karachi();
  params.madhab = ADHAN_MADHAB_MAP[madhab] ?? Madhab.Shafi;
  const t = new AdhanPrayerTimes(coords, date, params);
  return [
    { name: 'Fajr', time: t.fajr },
    { name: 'Dhuhr', time: t.dhuhr },
    { name: 'Asr', time: t.asr },
    { name: 'Maghrib', time: t.maghrib },
    { name: 'Isha', time: t.isha },
  ];
}

// Cancels pending prayer reminders and schedules `daysAhead` worth of fresh
// ones. Idempotent — safe to call repeatedly (app open, AppState 'active',
// settings change). Only touches `pr:` IDs, so streak and sacred-countdown
// schedules are untouched.
export async function schedulePrayerNotificationsAhead(
  lat: number,
  lng: number,
  calculationMethod: CalculationMethodId,
  madhab: MadhabId,
  daysAhead: number = PRAYER_SCHEDULE_DAYS_AHEAD
): Promise<number> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(PRAYER_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const now = new Date();
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    // Anchor at noon to avoid DST/midnight edge cases when computing prayer times.
    const target = new Date(now);
    target.setDate(target.getDate() + dayOffset);
    target.setHours(12, 0, 0, 0);
    const prayers = computePrayerTimesForDate(lat, lng, target, calculationMethod, madhab);

    for (const prayer of prayers) {
      const triggerTime = new Date(prayer.time.getTime() - 5 * 60 * 1000);
      if (triggerTime <= now) continue;
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
      scheduled += 1;
    }
  }
  return scheduled;
}

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[]
): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(PRAYER_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  for (const prayer of prayerTimes) {
    const triggerTime = new Date(prayer.time.getTime() - 5 * 60 * 1000);
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

// Reads location + calc method + madhab from storage and rebuilds the prayer
// schedule. Called from app boot, AppState 'active', and PrayerTrackerScreen.
// Falls back to Karachi defaults if no location is stored.
export async function rebuildPrayerScheduleFromStorage(): Promise<number> {
  const [loc, settings] = await Promise.all([
    storage.getLocation(),
    storage.getPrayerSettings(),
  ]);
  const lat = loc?.latitude ?? 24.8607;
  const lng = loc?.longitude ?? 67.0011;
  const method = (settings?.calculationMethod as CalculationMethodId) ?? 'Karachi';
  const madhab = (settings?.madhab as MadhabId) ?? 'Shafi';
  return schedulePrayerNotificationsAhead(lat, lng, method, madhab);
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // All three reminder channels are HIGH importance: prayer, sacred-event and
  // streak reminders are the app's core promise — they must wake the screen,
  // show heads-up, and survive DND for users who opt in. Android only allows
  // *lowering* a channel's importance after creation; HIGH from the start.
  await Notifications.setNotificationChannelAsync('azan-reminders', {
    name: 'Prayer Reminders',
    description: '5-min advance reminder before each Salah (Fajr, Dhuhr, Asr, Maghrib, Isha)',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync('sacred-countdown', {
    name: 'Sacred Events',
    description: 'Eid, Ramadan, Day of Arafah, Mawlid and other Islamic event reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync('streak-reminders', {
    name: 'Daily Streak',
    description: 'Evening reminder to mark prayers and keep your daily streak',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// Fires a notification a few seconds in the future, useful from the Prayer
// Settings sheet to verify the device's notification path end-to-end:
// permission, channel importance, sound, vibration, lockscreen visibility,
// and OEM battery whitelist all light up at once.
export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;
  await setupNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: `test:${Date.now()}`,
    content: {
      title: '🔔 Noor — test notification',
      body: 'If you can read this, your notifications are working. Fajr will fire on time.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: 'azan-reminders',
    },
  });
  return true;
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

// ─── Weekly Jumu'ah reminder ─────────────────────────────────────────────────
// Fires every Friday at 08:00 local time. Recommends Surah al-Kahf, ghusl,
// going early to the mosque, and abundant durood. Ramps up year-round
// engagement (52 firings per year vs 1-2 for Eid).

const JUMUAH_ID_PREFIX = 'jumu:';

const JUMUAH_COPY: Record<Language, { title: string; body: string }> = {
  en: {
    title: '🕌 Friday — Day of Jumu\'ah',
    body: 'Recite Surah al-Kahf today. Take ghusl, wear your best, go early to the mosque, send abundant durood.',
  },
  ur: {
    title: '🕌 جمعہ — یوم الجمعہ',
    body: 'آج سورۃ الکہف پڑھیں۔ غسل کریں، بہترین لباس پہنیں، جلدی مسجد جائیں، کثرت سے درود بھیجیں۔',
  },
  ar: {
    title: '🕌 الجمعة — يوم الجمعة',
    body: 'اقرأ سورة الكهف. اغتسل، البس أحسن ثيابك، تبكّر إلى المسجد، أكثر من الصلاة على النبي ﷺ.',
  },
};

export async function scheduleJumuahReminder(
  language: Language = 'en'
): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier.startsWith(JUMUAH_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const copy = JUMUAH_COPY[language] ?? JUMUAH_COPY.en;

  // expo-notifications WEEKLY weekday: Sunday=1 ... Saturday=7. Friday = 6.
  await Notifications.scheduleNotificationAsync({
    identifier: `${JUMUAH_ID_PREFIX}weekly`,
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 8,
      minute: 0,
      channelId: 'sacred-countdown',
    },
  });
}

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
export const SACRED_MUTE_ALL_ID = '__all__';

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

  if (mutedIds.includes(SACRED_MUTE_ALL_ID)) return 0;

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
