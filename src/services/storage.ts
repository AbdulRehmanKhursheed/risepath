import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  STREAK: 'streak',
  PRAYERS: 'prayers',
  GOALS: 'goals',
  MOODS: 'moods',
  LOCATION: 'location',
  PRAYER_SETTINGS: 'prayerSettings',
  FIQH_SCHOOL: 'fiqhSchool',
} as const;

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

export const storage = {
  async getStreak(): Promise<StreakData | null> {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    return raw ? JSON.parse(raw) : null;
  },

  async setStreak(data: StreakData): Promise<void> {
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(data));
  },

  async getPrayers(): Promise<Record<string, PrayerRecord>> {
    const raw = await AsyncStorage.getItem(KEYS.PRAYERS);
    return raw ? JSON.parse(raw) : {};
  },

  async setPrayers(data: Record<string, PrayerRecord>): Promise<void> {
    await AsyncStorage.setItem(KEYS.PRAYERS, JSON.stringify(data));
  },

  async getGoals(): Promise<Goal[]> {
    const raw = await AsyncStorage.getItem(KEYS.GOALS);
    return raw ? JSON.parse(raw) : [];
  },

  async setGoals(goals: Goal[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  async getMoods(): Promise<MoodEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.MOODS);
    return raw ? JSON.parse(raw) : [];
  },

  async setMoods(moods: MoodEntry[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.MOODS, JSON.stringify(moods));
  },

  async getLocation(): Promise<LocationData | null> {
    const raw = await AsyncStorage.getItem(KEYS.LOCATION);
    return raw ? JSON.parse(raw) : null;
  },

  async setLocation(loc: LocationData): Promise<void> {
    await AsyncStorage.setItem(KEYS.LOCATION, JSON.stringify(loc));
  },

  async getPrayerSettings(): Promise<PrayerSettings | null> {
    const raw = await AsyncStorage.getItem(KEYS.PRAYER_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  },

  async setPrayerSettings(settings: PrayerSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.PRAYER_SETTINGS, JSON.stringify(settings));
  },

  async getFiqhSchool(): Promise<'sunni' | 'shia' | null> {
    const raw = await AsyncStorage.getItem(KEYS.FIQH_SCHOOL);
    return (raw as 'sunni' | 'shia') ?? null;
  },

  async setFiqhSchool(school: 'sunni' | 'shia'): Promise<void> {
    await AsyncStorage.setItem(KEYS.FIQH_SCHOOL, school);
  },
};
