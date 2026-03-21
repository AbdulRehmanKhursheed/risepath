export type Language = 'en' | 'ur';

export const LANGUAGES: { id: Language; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
];

export type Translations = {
  // Greetings
  greeting: string;
  morningGreeting: string;
  afternoonGreeting: string;
  eveningGreeting: string;
  // Home
  bestStreak: string;
  dayStreak: string;
  days: string;
  todaysGoals: string;
  tapToComplete: string;
  // Days of week (Mon-Sun)
  weekDays: string[];
  // Prayer names
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  // Prayer status
  prayed: string;
  missed: string;
  upcoming: string;
  // Prayer Tracker screen
  prayerTracker: string;
  timesForLocation: string;
  usingDefault: string;
  thisWeek: string;
  loadingPrayerTimes: string;
  tapToMarkReminders: string;
  // Learn screen
  learn: string;
  kalimasAndDuas: string;
  kalimas: string;
  duas: string;
  tapDuaToExpand: string;
  // Qibla screen
  qiblaDirection: string;
  qiblaSubtitle: string;
  fromNorth: string;
  gettingLocation: string;
  holdPhoneFlat: string;
  you: string;
  qiblaLabel: string;
  turnLeft: string;
  turnRight: string;
  pointPhoneNorth: string;
  // Mood screen
  moodCoach: string;
  moodSubtitle: string;
  low: string;
  great: string;
  coachThinking: string;
  moodPlaceholder: string;
  // Stats screen
  stats: string;
  statsSubtitle: string;
  currentStreak: string;
  longestStreak: string;
  prayerConsistency7: string;
  goalsThisWeek: string;
  moodAverage: string;
  soulReport: string;
  soulReportText: string;
  // Navigation tabs
  homeTab: string;
  prayersTab: string;
  quranTab: string;
  learnTab: string;
  umrahTab: string;
  hajjTab: string;
  janazaTab: string;
  qiblaTab: string;
  moodTab: string;
  statsTab: string;
  // Prayer Settings modal
  prayerSettings: string;
  chooseCalcMethod: string;
  calculationMethod: string;
  selectRegionMethod: string;
  asrCalculation: string;
  hanafiBasis: string;
  save: string;
  cancel: string;
};

const en: Translations = {
  greeting: 'Assalamu Alaikum',
  morningGreeting: 'Good morning. Start your day with intention.',
  afternoonGreeting: 'Good afternoon. Keep the momentum going.',
  eveningGreeting: 'Good evening. Reflect on your day.',

  bestStreak: 'Best streak',
  dayStreak: 'day streak',
  days: 'days',
  todaysGoals: "Today's Goals",
  tapToComplete: 'Tap to complete',

  weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',

  prayed: 'Prayed',
  missed: 'Missed',
  upcoming: 'Upcoming',

  prayerTracker: 'Prayer Tracker',
  timesForLocation: 'Times for your location',
  usingDefault: 'Using Karachi (default)',
  thisWeek: 'This week',
  loadingPrayerTimes: 'Loading prayer times...',
  tapToMarkReminders: 'Tap to mark as prayed • Reminders 5 min before each prayer',

  learn: 'Learn',
  kalimasAndDuas: '6 Kalimas & everyday Duas',
  kalimas: '6 Kalimas',
  duas: 'Duas',
  tapDuaToExpand: 'Tap a dua to expand. Use these in your daily life.',

  qiblaDirection: 'Qibla Direction',
  qiblaSubtitle: 'Face the Kaaba in Mecca when you pray',
  fromNorth: 'from North',
  gettingLocation: 'Getting location...',
  holdPhoneFlat: 'Hold phone flat and rotate until green arrow points up',
  you: 'You',
  qiblaLabel: 'Qibla',
  turnLeft: 'Turn left',
  turnRight: 'Turn right',
  pointPhoneNorth: 'Point your phone North, then turn clockwise to face Qibla',

  moodCoach: 'Mood & Coach',
  moodSubtitle: 'How are you feeling? Get a personalized boost.',
  low: 'Low',
  great: 'Great',
  coachThinking: 'Coach is thinking...',
  moodPlaceholder: 'Select a mood above to get your personalized motivation.',

  stats: 'Stats',
  statsSubtitle: 'Your spiritual journey at a glance',
  currentStreak: 'Current Streak',
  longestStreak: 'Longest Streak',
  prayerConsistency7: 'Prayer Consistency (7 days)',
  goalsThisWeek: 'Goals This Week',
  moodAverage: 'Mood Average',
  soulReport: 'Soul Report',
  soulReportText: 'Shareable weekly summary coming soon. Keep building your streak!',

  homeTab: 'Home',
  prayersTab: 'Prayers',
  quranTab: 'Quran',
  learnTab: 'Learn',
  umrahTab: 'Umrah',
  hajjTab: 'Hajj',
  janazaTab: 'Janaza',
  qiblaTab: 'Qibla',
  moodTab: 'Mood',
  statsTab: 'Stats',

  prayerSettings: 'Prayer Settings',
  chooseCalcMethod: "Choose your region's calculation method",
  calculationMethod: 'Calculation Method',
  selectRegionMethod: 'Different regions use different methods. Select the one used in your area.',
  asrCalculation: 'Asr Calculation (Madhab)',
  hanafiBasis: 'Affects Asr prayer time. Hanafi uses a later time.',
  save: 'Save',
  cancel: 'Cancel',
};

const ur: Translations = {
  greeting: 'السلام علیکم',
  morningGreeting: 'صبح بخیر۔ آج کا آغاز نیت کے ساتھ کریں۔',
  afternoonGreeting: 'دوپہر بخیر۔ اپنی کوشش جاری رکھیں۔',
  eveningGreeting: 'شام بخیر۔ آج کے دن کا جائزہ لیں۔',

  bestStreak: 'بہترین سلسلہ',
  dayStreak: 'دن کا سلسلہ',
  days: 'دن',
  todaysGoals: 'آج کے اہداف',
  tapToComplete: 'مکمل کرنے کے لیے ٹیپ کریں',

  weekDays: ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'],

  fajr: 'فجر',
  dhuhr: 'ظہر',
  asr: 'عصر',
  maghrib: 'مغرب',
  isha: 'عشاء',

  prayed: 'پڑھی',
  missed: 'چھوٹ گئی',
  upcoming: 'آنے والی',

  prayerTracker: 'نماز ٹریکر',
  timesForLocation: 'آپ کے مقام کے اوقات',
  usingDefault: 'کراچی (پہلے سے طے شدہ)',
  thisWeek: 'اس ہفتے',
  loadingPrayerTimes: 'نماز کے اوقات لوڈ ہو رہے ہیں...',
  tapToMarkReminders: 'نشان زد کرنے کے لیے ٹیپ کریں • ہر نماز سے ۵ منٹ پہلے یاددہانی',

  learn: 'سیکھیں',
  kalimasAndDuas: '۶ کلمے اور روزمرہ کی دعائیں',
  kalimas: '۶ کلمے',
  duas: 'دعائیں',
  tapDuaToExpand: 'دعا کھولنے کے لیے ٹیپ کریں۔ روزانہ انہیں استعمال کریں۔',

  qiblaDirection: 'قبلہ کی سمت',
  qiblaSubtitle: 'نماز میں خانہ کعبہ مکہ کی طرف منہ کریں',
  fromNorth: 'شمال سے',
  gettingLocation: 'مقام معلوم ہو رہا ہے...',
  holdPhoneFlat: 'فون کو سیدھا رکھیں اور گھمائیں جب تک سبز تیر اوپر نہ آئے',
  you: 'آپ',
  qiblaLabel: 'قبلہ',
  turnLeft: 'بائیں مڑیں',
  turnRight: 'دائیں مڑیں',
  pointPhoneNorth: 'فون کو شمال کی طرف رکھیں، پھر دائیں گھمائیں',

  moodCoach: 'موڈ اور کوچ',
  moodSubtitle: 'آپ کیسا محسوس کر رہے ہیں؟',
  low: 'کم',
  great: 'بہترین',
  coachThinking: 'جواب تیار ہو رہا ہے...',
  moodPlaceholder: 'اپنی حوصلہ افزائی کے لیے اوپر موڈ منتخب کریں۔',

  stats: 'اعداد و شمار',
  statsSubtitle: 'آپ کی روحانی ترقی کا جائزہ',
  currentStreak: 'موجودہ سلسلہ',
  longestStreak: 'طویل ترین سلسلہ',
  prayerConsistency7: 'نماز کی مستقل مزاجی (۷ دن)',
  goalsThisWeek: 'اس ہفتے کے اہداف',
  moodAverage: 'اوسط موڈ',
  soulReport: 'روحانی رپورٹ',
  soulReportText: 'ہفتہ وار خلاصہ جلد آ رہا ہے۔ اپنا سلسلہ جاری رکھیں!',

  homeTab: 'ہوم',
  prayersTab: 'نمازیں',
  quranTab: 'قرآن',
  learnTab: 'سیکھیں',
  umrahTab: 'عمرہ',
  hajjTab: 'حج',
  janazaTab: 'جنازہ',
  qiblaTab: 'قبلہ',
  moodTab: 'موڈ',
  statsTab: 'اعداد',

  prayerSettings: 'نماز کی ترتیبات',
  chooseCalcMethod: 'اپنے علاقے کا حساب کتاب کا طریقہ منتخب کریں',
  calculationMethod: 'حساب کتاب کا طریقہ',
  selectRegionMethod: 'مختلف علاقے مختلف طریقے استعمال کرتے ہیں۔ اپنے علاقے کا طریقہ منتخب کریں۔',
  asrCalculation: 'عصر کا حساب (مذہب)',
  hanafiBasis: 'عصر کے وقت پر اثر ڈالتا ہے۔ حنفی طریقہ بعد میں ہوتا ہے۔',
  save: 'محفوظ کریں',
  cancel: 'منسوخ',
};

export const translations: Record<Language, Translations> = { en, ur };
