import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarRegion } from '../constants/islamicCalendar';

const KEYS = {
  STREAK: 'streak',
  PRAYERS: 'prayers',
  GOALS: 'goals',
  GOAL_DAYS: 'goalDays_v1',
  MOODS: 'moods',
  LOCATION: 'location',
  PRAYER_SETTINGS: 'prayerSettings',
  FIQH_SCHOOL: 'fiqhSchool',
  CALENDAR_REGION: 'calendarRegion',
  SACRED_COUNTDOWN_PREFS: 'sacredCountdownPrefs',
  LAST_STREAK_MILESTONE: 'lastStreakMilestone',
  HIJRI_OFFSET: 'hijriOffset_v1',
  RECITER_PLAYS: 'reciterPlays_v1',
  CUSTOM_ALARMS: 'customAlarms_v1',
  ZAKAT_INPUTS: 'zakatInputs_v1',
} as const;

// Custom user-set reminders, independent of the auto prayer schedule. The user
// picks the label + time + which weekdays; scheduled under the `alarm:` prefix
// in the notifications service.
export type CustomAlarm = {
  id: string;
  label: string;
  icon: string;
  hour: number;      // 0-23 (local)
  minute: number;    // 0-59
  // Weekdays this alarm fires on, expo convention: Sunday=1 … Saturday=7.
  // A full set of all seven is treated as "every day" (one DAILY trigger).
  days: number[];
  enabled: boolean;
  createdAt: number;
};

// How many custom alarms a user may create. Each daily alarm costs 1 pending
// OS notification; a weekday alarm costs one per selected day. Combined with
// the prayer (≤25) + sacred (≤26) + streak (1) + jumu'ah (1) budget, this keeps
// us clear of iOS's 64-pending cap even in the worst case.
export const MAX_CUSTOM_ALARMS = 10;

// Persisted Zakat calculator inputs (raw strings, exactly as typed) so the
// user can leave and return without re-entering everything.
export type StoredZakatInputs = {
  currency: string;
  goldPricePerGram: string;
  silverPricePerGram: string;
  goldGrams: string;
  silverGrams: string;
  cash: string;
  bank: string;
  business: string;
  receivables: string;
  investments: string;
  liabilities: string;
  nisabBasis: 'gold' | 'silver' | null; // null = auto (resolve from madhab)
};

const CALENDAR_REGION_IDS: CalendarRegion[] = [
  'saudi',
  'southasia',
  'uk',
  'northamerica',
  'europe',
  'africa',
  'southeastasia',
  'global',
];

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type StreakData = {
  current: number;
  lastDate: string;
  longest: number;
};

export type PrayerRecord = {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
};

export type Goal = {
  id: string;
  text: string;
  completed: boolean;
  date: string;
};

export type MoodEntry = {
  date: string;
  mood: number;
  aiResponse: string;
};

export type LocationData = {
  latitude: number;
  longitude: number;
};

export type PrayerSettings = {
  calculationMethod: string;
  madhab: string;
  fiqhSchool?: 'sunni' | 'shia';
};

export type SacredCountdownPrefs = {
  // Per-event mute list. Empty = all events enabled.
  mutedEventIds: string[];
  // Date-string of the last time notifications were scheduled, YYYY-MM-DD.
  lastScheduledAt: string;
  // Master toggle — if false, no Sacred Countdown notifications fire.
  enabled: boolean;
};

export const storage = {
  async getStreak(): Promise<StreakData | null> {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    return parseJson<StreakData | null>(raw, null);
  },

  async setStreak(data: StreakData): Promise<void> {
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(data));
  },

  async getPrayers(): Promise<Record<string, PrayerRecord>> {
    const raw = await AsyncStorage.getItem(KEYS.PRAYERS);
    return parseJson<Record<string, PrayerRecord>>(raw, {});
  },

  async setPrayers(data: Record<string, PrayerRecord>): Promise<void> {
    await AsyncStorage.setItem(KEYS.PRAYERS, JSON.stringify(data));
  },

  async getGoals(): Promise<Goal[]> {
    const raw = await AsyncStorage.getItem(KEYS.GOALS);
    return parseJson<Goal[]>(raw, []);
  },

  async setGoals(goals: Goal[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  // Days the user completed ≥1 goal — feed into computeStreak so the streak
  // grows from goal completion too, not only prayer marking. Goals don't keep
  // historical state per-day in the Goal record, so this is a separate
  // monotonic log of YYYY-MM-DD strings.
  async getGoalDays(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEYS.GOAL_DAYS);
    return parseJson<string[]>(raw, []);
  },

  async addGoalDay(date: string): Promise<void> {
    const days = await this.getGoalDays();
    if (!days.includes(date)) {
      days.push(date);
      await AsyncStorage.setItem(KEYS.GOAL_DAYS, JSON.stringify(days));
    }
  },

  async getMoods(): Promise<MoodEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.MOODS);
    return parseJson<MoodEntry[]>(raw, []);
  },

  async setMoods(moods: MoodEntry[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.MOODS, JSON.stringify(moods));
  },

  async getLocation(): Promise<LocationData | null> {
    const raw = await AsyncStorage.getItem(KEYS.LOCATION);
    return parseJson<LocationData | null>(raw, null);
  },

  async setLocation(loc: LocationData): Promise<void> {
    await AsyncStorage.setItem(KEYS.LOCATION, JSON.stringify(loc));
  },

  async getPrayerSettings(): Promise<PrayerSettings | null> {
    const raw = await AsyncStorage.getItem(KEYS.PRAYER_SETTINGS);
    return parseJson<PrayerSettings | null>(raw, null);
  },

  async setPrayerSettings(settings: PrayerSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.PRAYER_SETTINGS, JSON.stringify(settings));
  },

  async getFiqhSchool(): Promise<'sunni' | 'shia' | null> {
    const raw = await AsyncStorage.getItem(KEYS.FIQH_SCHOOL);
    return raw === 'sunni' || raw === 'shia' ? raw : null;
  },

  async setFiqhSchool(school: 'sunni' | 'shia'): Promise<void> {
    await AsyncStorage.setItem(KEYS.FIQH_SCHOOL, school);
  },

  async getCalendarRegion(): Promise<CalendarRegion | null> {
    const raw = await AsyncStorage.getItem(KEYS.CALENDAR_REGION);
    return CALENDAR_REGION_IDS.includes(raw as CalendarRegion) ? (raw as CalendarRegion) : null;
  },

  async setCalendarRegion(region: CalendarRegion): Promise<void> {
    await AsyncStorage.setItem(KEYS.CALENDAR_REGION, region);
  },

  async getSacredCountdownPrefs(): Promise<SacredCountdownPrefs> {
    const raw = await AsyncStorage.getItem(KEYS.SACRED_COUNTDOWN_PREFS);
    return parseJson<SacredCountdownPrefs>(raw, { mutedEventIds: [], lastScheduledAt: '', enabled: true });
  },

  async setSacredCountdownPrefs(prefs: SacredCountdownPrefs): Promise<void> {
    await AsyncStorage.setItem(KEYS.SACRED_COUNTDOWN_PREFS, JSON.stringify(prefs));
  },

  // Returns null when the key has never been written. Lets the caller
  // distinguish "fresh install / upgrade" from "this user has explicitly
  // seen milestone 0" so we can silently seed instead of celebrating
  // retroactively.
  async getLastStreakMilestone(): Promise<number | null> {
    const raw = await AsyncStorage.getItem(KEYS.LAST_STREAK_MILESTONE);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  },

  async setLastStreakMilestone(n: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_STREAK_MILESTONE, String(n));
  },

  // Hijri-date day offset (range -3..+3). The tabular Julian-Day algorithm
  // used by formatHijri can drift ±1-2 days from a user's regional moon-
  // sighting authority (e.g. Pakistan's Ruet committee). Users adjust here
  // until the displayed date matches their masjid. Returns null when the
  // user has never set it — callers default to 0 (or a region-specific
  // first-launch guess) themselves.
  async getHijriOffsetRaw(): Promise<number | null> {
    const raw = await AsyncStorage.getItem(KEYS.HIJRI_OFFSET);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return Math.max(-3, Math.min(3, Math.round(n)));
  },

  async getHijriOffset(): Promise<number> {
    return (await this.getHijriOffsetRaw()) ?? 0;
  },

  async setHijriOffset(n: number): Promise<void> {
    const clamped = Math.max(-3, Math.min(3, Math.round(n)));
    await AsyncStorage.setItem(KEYS.HIJRI_OFFSET, String(clamped));
  },

  // Per-reciter play counts. Used to surface "Your favorites" at the top of
  // the reciter picker, so users see the voices they actually listen to first.
  async getReciterPlays(): Promise<Record<string, number>> {
    const raw = await AsyncStorage.getItem(KEYS.RECITER_PLAYS);
    return parseJson<Record<string, number>>(raw, {});
  },

  async incrementReciterPlay(id: string): Promise<void> {
    if (!id) return;
    const plays = await this.getReciterPlays();
    plays[id] = (plays[id] ?? 0) + 1;
    await AsyncStorage.setItem(KEYS.RECITER_PLAYS, JSON.stringify(plays));
  },

  async getCustomAlarms(): Promise<CustomAlarm[]> {
    const raw = await AsyncStorage.getItem(KEYS.CUSTOM_ALARMS);
    const list = parseJson<CustomAlarm[]>(raw, []);
    // Defensive: only keep well-formed entries so a corrupted write can't crash
    // the scheduler or the screen.
    return Array.isArray(list)
      ? list.filter(
          (a) =>
            a &&
            typeof a.id === 'string' &&
            typeof a.hour === 'number' &&
            typeof a.minute === 'number' &&
            Array.isArray(a.days)
        )
      : [];
  },

  async setCustomAlarms(alarms: CustomAlarm[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CUSTOM_ALARMS, JSON.stringify(alarms));
  },

  async getZakatInputs(): Promise<StoredZakatInputs | null> {
    const raw = await AsyncStorage.getItem(KEYS.ZAKAT_INPUTS);
    return parseJson<StoredZakatInputs | null>(raw, null);
  },

  async setZakatInputs(inputs: StoredZakatInputs): Promise<void> {
    await AsyncStorage.setItem(KEYS.ZAKAT_INPUTS, JSON.stringify(inputs));
  },
};
