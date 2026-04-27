import { gregorianToHijri } from '../utils/hijri';

// ─────────────────────────────────────────────────────────────────────────────
// "Today's Recommended Act" — surfaces a single high-leverage worship action
// for the user every day. Logic priority:
//   1. Hijri-event override (Day of Arafah, 10 Days of Dhul Hijjah, Ramadan,
//      Last 10 Nights, Eid days, Ashura) — when it's a sacred day, that wins.
//   2. Friday → Jumu'ah-specific Sunnahs.
//   3. Default: a 7-day rotation of evergreen daily acts.
//
// Every act below is sourced. Where a hadith is graded weak by some scholars,
// it is omitted in favour of muttafaqun-alayh (Bukhari + Muslim) and Quran.
// ─────────────────────────────────────────────────────────────────────────────

export type DailyAct = {
  id: string;
  icon: string;
  titleEn: string;
  titleUr: string;
  titleAr: string;
  actionEn: string;
  actionUr: string;
  actionAr: string;
  source: string;
  screen?: 'Quran' | 'Duas' | 'Tasbih' | 'Qibla' | 'Eid' | 'SacredJourney' | 'Hifz' | 'Names';
  // When `screen === 'Quran'` and `surah` is set, the tap deep-links straight
  // to that surah inside the Quran tab (uses QuranNavContext.openSurah).
  surah?: number;
};

// ─── Default 7-day evergreen rotation ───────────────────────────────────────
const ROTATION: DailyAct[] = [
  {
    id: 'rot-quran-daily',
    icon: '📖',
    titleEn: 'Read 10 ayahs of Qur\'an today',
    titleUr: 'آج قرآن کی ۱۰ آیات پڑھیں',
    titleAr: 'اقرأ ١٠ آيات من القرآن اليوم',
    actionEn: 'Even one page. Consistency over volume — the Prophet ﷺ said the most beloved deeds to Allah are the most consistent.',
    actionUr: 'ایک صفحہ بھی کافی ہے۔ مقدار سے زیادہ مستقل مزاجی — حضور ﷺ نے فرمایا اللہ کو سب سے محبوب وہ عمل ہیں جو ہمیشہ کیے جائیں۔',
    actionAr: 'حتى صفحة واحدة. الاستمرارية أحب من الكثرة — قال ﷺ: أحب الأعمال إلى الله أدومها.',
    source: 'Bukhari 6464, Muslim 783',
    screen: 'Quran',
  },
  {
    id: 'rot-adhkar',
    icon: '🤲',
    titleEn: 'Morning & evening adhkar',
    titleUr: 'صبح اور شام کے اذکار',
    titleAr: 'أذكار الصباح والمساء',
    actionEn: 'A protective shield for the day. Recite after Fajr and Asr — the times the Prophet ﷺ recommended.',
    actionUr: 'دن بھر کی حفاظت کا قلعہ۔ فجر اور عصر کے بعد پڑھیں — حضور ﷺ کا مسنون وقت۔',
    actionAr: 'حصن الوقت. اقرأها بعد الفجر والعصر — كما أوصى النبي ﷺ.',
    source: 'Hisnul Muslim · Abu Dawud 5077',
    screen: 'Duas',
  },
  {
    id: 'rot-durood',
    icon: '🌹',
    titleEn: 'Send 100 durood on the Prophet ﷺ',
    titleUr: 'حضور ﷺ پر ۱۰۰ بار درود',
    titleAr: 'صلِّ على النبي ﷺ مائة مرة',
    actionEn: 'For every salutation on him, Allah sends ten salutations on you and erases ten sins.',
    actionUr: 'ہر درود پر اللہ آپ پر دس رحمتیں بھیجتا اور دس گناہ مٹا دیتا ہے۔',
    actionAr: 'لكل صلاة عليه ﷺ: عشر صلوات من الله، ومحو عشر سيئات.',
    source: 'Muslim 408, Nasai 1297',
    screen: 'Tasbih',
  },
  {
    id: 'rot-istighfar',
    icon: '💧',
    titleEn: 'Tawbah & istighfar — 100 times',
    titleUr: 'توبہ اور استغفار — ۱۰۰ بار',
    titleAr: 'التوبة والاستغفار ١٠٠ مرة',
    actionEn: 'The Prophet ﷺ — though sinless — sought forgiveness 100 times a day. Astaghfirullah wa atubu ilayh.',
    actionUr: 'حضور ﷺ معصوم ہونے کے باوجود دن میں ۱۰۰ بار استغفار فرماتے۔ "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ"۔',
    actionAr: 'كان النبي ﷺ — وهو المعصوم — يستغفر مئة مرة كل يوم. "أستغفر الله وأتوب إليه".',
    source: 'Bukhari 6307, Muslim 2702',
    screen: 'Tasbih',
  },
  {
    id: 'rot-sadaqah',
    icon: '🤝',
    titleEn: 'Give sadaqah today, even small',
    titleUr: 'آج صدقہ کریں، چاہے تھوڑا ہو',
    titleAr: 'تصدّق اليوم، ولو بشيء قليل',
    actionEn: 'Sadaqah extinguishes sins as water extinguishes fire. A smile to your brother is sadaqah too.',
    actionUr: 'صدقہ گناہوں کو ایسے بجھاتا ہے جیسے پانی آگ کو۔ بھائی سے مسکراہٹ بھی صدقہ ہے۔',
    actionAr: 'الصدقة تطفئ الخطيئة كما يطفئ الماء النار. وتبسمك في وجه أخيك صدقة.',
    source: 'Tirmidhi 614, 1956',
  },
  {
    id: 'rot-ayatul-kursi',
    icon: '✨',
    titleEn: 'Ayat al-Kursi after every Salah',
    titleUr: 'ہر نماز کے بعد آیت الکرسی',
    titleAr: 'آية الكرسي بعد كل صلاة',
    actionEn: 'Whoever recites it after every fard salah — nothing prevents him from Jannah except death. Open Surah al-Baqarah, ayah 255.',
    actionUr: 'جو ہر فرض نماز کے بعد پڑھے، اس کے اور جنت کے درمیان موت کے سوا کوئی رکاوٹ نہیں۔ سورۃ البقرہ، آیت ۲۵۵۔',
    actionAr: 'من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت. سورة البقرة، الآية ٢٥٥.',
    source: 'Nasai · Sunan al-Kubra 9928',
    screen: 'Quran',
    surah: 2, // Surah al-Baqarah, ayah 255 lives near the start of juz 3 — user scrolls
  },
  {
    id: 'rot-silat-rahim',
    icon: '☎️',
    titleEn: 'Call a relative you haven\'t spoken to',
    titleUr: 'کسی بھولے رشتہ دار کو فون کریں',
    titleAr: 'اتصل بقريب لم تتواصل معه',
    actionEn: 'Silat al-rahim extends your life and increases your provision — agreed upon.',
    actionUr: 'صلہ رحمی عمر اور رزق میں اضافہ کرتی ہے — متفق علیہ۔',
    actionAr: 'صلة الرحم تطيل العمر وتزيد الرزق — متفق عليه.',
    source: 'Bukhari 5985, Muslim 2557',
  },
];

// ─── Friday Sunnah ──────────────────────────────────────────────────────────
const JUMUAH: DailyAct = {
  id: 'jumuah',
  icon: '🕌',
  titleEn: 'Friday — Day of Jumu\'ah',
  titleUr: 'جمعہ — یوم الجمعہ',
  titleAr: 'الجمعة — يوم الجمعة',
  actionEn: 'Recite Surah al-Kahf today. Take ghusl, wear your best, go early to the mosque, send abundant durood — and seek the hour when du\'a is accepted.',
  actionUr: 'آج سورۃ الکہف پڑھیں۔ غسل کریں، بہترین لباس پہنیں، جلدی مسجد جائیں، کثرت سے درود بھیجیں — اور قبولیتِ دعا کی گھڑی تلاش کریں۔',
  actionAr: 'اقرأ سورة الكهف اليوم. اغتسل، البس أحسن ثيابك، تبكّر إلى المسجد، أكثر من الصلاة على النبي ﷺ، وتحرَّ ساعة الإجابة.',
  source: 'Bayhaqi · Muslim 854 · Abu Dawud 1047',
  screen: 'Quran',
  surah: 18, // Surah al-Kahf
};

// ─── Hijri-event overrides ──────────────────────────────────────────────────
// Returns null if no override applies; otherwise the act for today. `sect`
// influences events that are observed differently across schools — Ashura
// being the primary case (Sunni: voluntary fast; Shia: day of mourning for
// Husayn (RA)). Pass null for unknown / not yet selected; default falls back
// to the Sunni rendering since that's what most generic Muslim users expect.
function hijriOverride(now: Date, sect: 'sunni' | 'shia' | null): DailyAct | null {
  const h = gregorianToHijri(now);

  // Dhul Hijjah (month 12) — first 10 days are the most virtuous of the year.
  if (h.month === 12) {
    if (h.day === 9) {
      return {
        id: 'arafah',
        icon: '🤲',
        titleEn: 'Day of Arafah — fast today',
        titleUr: 'یومِ عرفہ — آج روزہ',
        titleAr: 'يوم عرفة — صم اليوم',
        actionEn: 'Fasting today expiates the sins of the previous year AND the coming year. Make abundant du\'a — it is the best du\'a.',
        actionUr: 'آج کا روزہ پچھلے اور آنے والے سال کے گناہوں کا کفارہ ہے۔ کثرت سے دعا کریں — یہ بہترین دعا ہے۔',
        actionAr: 'صوم هذا اليوم يكفّر السنة الماضية والآتية. أكثر من الدعاء — فهو خير الدعاء.',
        source: 'Muslim 1162, Tirmidhi 3585',
        screen: 'Eid',
      };
    }
    if (h.day === 10) {
      return {
        id: 'eid-adha-day',
        icon: '🐑',
        titleEn: 'Eid al-Adha — Takbeer, Salah, Qurbani',
        titleUr: 'عیدالاضحی — تکبیر، نماز، قربانی',
        titleAr: 'عيد الأضحى — تكبير، صلاة، أضحية',
        actionEn: 'Recite Takbeer al-Tashreeq aloud. Pray Eid Salah, then offer Qurbani. Eat nothing before the Salah — Sunnah of Eid al-Adha.',
        actionUr: 'تکبیراتِ تشریق بلند آواز سے پڑھیں۔ نمازِ عید پھر قربانی۔ نماز سے پہلے کچھ نہ کھائیں — یہ عیدالاضحی کی سنت ہے۔',
        actionAr: 'كبّر التكبير بصوت مسموع. صلِّ العيد ثم اذبح الأضحية. لا تأكل قبل الصلاة — سنة عيد الأضحى.',
        source: 'Tirmidhi 542, Ibn Majah 1756',
        screen: 'Eid',
      };
    }
    if (h.day >= 11 && h.day <= 13) {
      return {
        id: 'tashreeq',
        icon: '📅',
        titleEn: `Ayyam al-Tashreeq — day ${h.day - 10} of 3`,
        titleUr: `ایامِ تشریق — تیسرا دن ${h.day - 10}/۳`,
        titleAr: `أيام التشريق — اليوم ${h.day - 10} من ٣`,
        actionEn: 'Days of eating, drinking, and dhikr of Allah. Continue Takbeer al-Tashreeq after every fard Salah through Asr of the 13th.',
        actionUr: 'کھانے، پینے اور اللہ کے ذکر کے دن۔ ہر فرض نماز کے بعد ۱۳ ذوالحجہ کی عصر تک تکبیراتِ تشریق جاری رکھیں۔',
        actionAr: 'أيام أكل وشرب وذكر لله. واصل تكبير التشريق بعد كل فريضة حتى عصر الثالث عشر.',
        source: 'Muslim 1141',
        screen: 'Eid',
      };
    }
    if (h.day >= 1 && h.day <= 8) {
      return {
        id: 'dhul-hijjah-10',
        icon: '🕋',
        titleEn: `Dhul Hijjah — day ${h.day} of the Sacred 10`,
        titleUr: `ذوالحجہ — مقدس ۱۰ دنوں کا دن ${h.day}`,
        titleAr: `ذو الحجة — يوم ${h.day} من العشر المباركة`,
        actionEn: 'No deeds are more beloved to Allah than righteous deeds in these days. Fast if you can, increase Takbeer / Tahmeed / Tahleel, give sadaqah.',
        actionUr: 'ان دنوں سے زیادہ کوئی نیک عمل اللہ کو محبوب نہیں۔ روزہ، تکبیر، تحمید، تہلیل، صدقہ بڑھائیں۔',
        actionAr: 'لا أحب إلى الله من العمل الصالح في هذه الأيام. صم إن استطعت، أكثر من التكبير والتحميد والتهليل والصدقة.',
        source: 'Bukhari 969, Tirmidhi 757',
        screen: 'Eid',
      };
    }
  }

  // Ramadan (month 9) — daily fasting + Quran goal.
  if (h.month === 9) {
    if (h.day >= 21) {
      // Last 10 nights — Laylat al-Qadr seeking.
      return {
        id: 'qadr',
        icon: '✨',
        titleEn: `Last 10 Nights — night ${h.day - 20} of seeking Laylat al-Qadr`,
        titleUr: `آخری ۱۰ راتیں — شبِ قدر کی تلاش، رات ${h.day - 20}`,
        titleAr: `العشر الأواخر — ليلة ${h.day - 20} من طلب ليلة القدر`,
        actionEn: 'Better than a thousand months. Recite: Allahumma innaka Afuwwun, tuhibbul-afwa, fa\'fu anni — and revive the night with Salah and Qur\'an.',
        actionUr: 'ہزار مہینوں سے بہتر۔ پڑھیں: "اللّٰهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي" — رات کو نماز اور تلاوت سے زندہ کریں۔',
        actionAr: 'خير من ألف شهر. اقرأ: "اللهم إنك عفو تحب العفو فاعف عني"، وأحيِ ليلتك بالصلاة والقرآن.',
        source: "Qur'an 97:3, Tirmidhi 3513",
        screen: 'Quran',
      };
    }
    return {
      id: 'ramadan-day',
      icon: '🌙',
      titleEn: `Ramadan — day ${h.day} of fasting`,
      titleUr: `رمضان — روزہ، دن ${h.day}`,
      titleAr: `رمضان — اليوم ${h.day} من الصيام`,
      actionEn: 'Read your daily juz. The Prophet ﷺ would review the entire Qur\'an with Jibreel ﷺ in this month.',
      actionUr: 'آج کا پارہ پڑھیں۔ حضور ﷺ اس مہینے میں جبریل ؑ کے ساتھ پورا قرآن دور فرماتے تھے۔',
      actionAr: 'اقرأ جزءك اليومي. كان النبي ﷺ يدارس القرآن كاملاً مع جبريل ﷺ في هذا الشهر.',
      source: 'Bukhari 6, Muslim 2308',
      screen: 'Quran',
    };
  }

  // Muharram (month 1) — Ashura on the 10th, fast also 9th or 11th.
  if (h.month === 1) {
    if (h.day === 1) {
      return {
        id: 'islamic-new-year',
        icon: '🌙',
        titleEn: 'Islamic New Year — renew your intention',
        titleUr: 'اسلامی نیا سال — نیت کی تجدید کریں',
        titleAr: 'رأس السنة الهجرية — جدّد نيتك',
        actionEn: 'A new Hijri year. Set your worship goals, give a sadaqah of opening, and increase istighfar for the year past.',
        actionUr: 'نیا ہجری سال۔ عبادت کے اہداف بنائیں، افتتاحی صدقہ کریں، اور پچھلے سال کے لیے کثرت سے استغفار کریں۔',
        actionAr: 'سنة هجرية جديدة. ضع أهداف عبادتك، تصدّق صدقة افتتاح، وأكثر من الاستغفار للعام الماضي.',
        source: 'Tradition',
      };
    }
    if (h.day === 9 || h.day === 10 || h.day === 11) {
      // Ashura is observed very differently across schools. Sunni tradition
      // emphasises voluntary fasting on the 9th + 10th (or 10th + 11th).
      // Shia tradition observes the day as mourning for Imam Husayn (RA) and
      // the martyrs of Karbala — fasting is generally not done. The card we
      // surface must respect both; sect comes from storage when available.
      if (sect === 'shia') {
        return {
          id: 'ashura-shia',
          icon: '🕯️',
          titleEn: 'Ashura — Imam Husayn (RA) and Karbala',
          titleUr: 'عاشورہ — امام حسین (رض) اور کربلا',
          titleAr: 'عاشوراء — الإمام الحسين (ع) وكربلاء',
          actionEn:
            'A day of mourning and remembrance for Imam Husayn (RA), the grandson of the Prophet ﷺ, and the martyrs of Karbala. Reflect on patience, justice, and standing for truth in the face of oppression.',
          actionUr:
            'حضور ﷺ کے نواسے امام حسین (رض) اور شہدائے کربلا کی یاد اور غم کا دن۔ صبر، عدل اور ظلم کے سامنے حق پر ڈٹے رہنے پر غور کریں۔',
          actionAr:
            'يوم حزن وذكرى للإمام الحسين (ع) سبط النبي ﷺ وشهداء كربلاء. تأمّل في الصبر والعدل والثبات على الحق في وجه الظلم.',
          source: 'Tradition (Shia)',
        };
      }
      return {
        id: 'ashura',
        icon: '🕯️',
        titleEn: h.day === 10 ? 'Ashura — fast today' : `Ashura — fast the ${h.day === 9 ? '9th and 10th' : '10th and 11th'}`,
        titleUr: 'عاشورہ — روزہ',
        titleAr: 'عاشوراء — صم اليوم',
        actionEn: 'Fasting Ashura expiates the sins of the previous year. The Prophet ﷺ said he would fast the 9th alongside the 10th to differ from the People of the Book.',
        actionUr: 'عاشورہ کا روزہ پچھلے سال کے گناہوں کا کفارہ ہے۔ حضور ﷺ نے فرمایا کہ اہلِ کتاب سے مختلف ہونے کے لیے ۹ اور ۱۰ دونوں روزے رکھنے کا ارادہ ہے۔',
        actionAr: 'صوم عاشوراء يكفّر السنة الماضية. وكان النبي ﷺ هَمَّ بصوم التاسع مع العاشر مخالفةً لأهل الكتاب.',
        source: 'Muslim 1162, Muslim 1134',
      };
    }
  }

  return null;
}

// ─── Public selector ────────────────────────────────────────────────────────
export function getTodayAct(
  now: Date = new Date(),
  sect: 'sunni' | 'shia' | null = null
): DailyAct {
  const override = hijriOverride(now, sect);
  if (override) return override;

  // JS Date.getDay(): Sunday=0 ... Friday=5, Saturday=6
  if (now.getDay() === 5) return JUMUAH;

  // Day-of-year mod 7 for stable rotation across the day.
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return ROTATION[dayOfYear % ROTATION.length];
}
