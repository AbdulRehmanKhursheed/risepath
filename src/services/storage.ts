import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarRegion } from '../constants/islamicCalendar';

const KEYS = {
  STREAK: 'streak',
  PRAYERS: 'prayers',
  GOALS: 'goals',
  MOODS: 'moods',
  LOCATION: 'location',
  PRAYER_SETTINGS: 'prayerSettings',
  FIQH_SCHOOL: 'fiqhSchool',
  CALENDAR_REGION: 'calendarRegion',
  SACRED_COUNTDOWN_PREFS: 'sacredCountdownPrefs',
} as const;

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
};
