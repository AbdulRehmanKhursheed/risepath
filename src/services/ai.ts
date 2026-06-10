import type { Language } from '../constants/translations';

// Module-level language for the mood coach. MoodScreen calls
// getLocalMotivation(streak, mood, missed) without a language argument, so
// LanguageContext pushes the current app language here (on hydration and on
// every user switch) and the coach answers in that language.
let aiLanguage: Language = 'en';

export function setAiLanguage(lang: Language): void {
  aiLanguage = lang;
}

const RESPONSES: Record<number, string[]> = {
  1: [
    `SubhanAllah. Even in your lowest moment, Allah sees you. "No fatigue, anxiety, or sorrow befalls a believer, even the prick of a thorn, except that Allah expiates some of his sins." (Bukhari). Your pain is not wasted. 🤲`,
    `"And He found you lost and guided you." (Quran 93:7). You are never truly lost when Allah knows exactly where you are. Make wudu, sit quietly, and whisper a dua. That is enough for now.`,
    `Ibrahim (AS) was tested by fire. Yunus (AS) was tested in darkness. Ayub (AS) was tested by pain. They all called on Allah — and He answered every single time. Call on Him now. He is listening. 💛`,
    `"Verily, with hardship comes ease — verily, with hardship comes ease." (Quran 94:5-6). Allah repeated it twice. He wants you to hear it twice. Your relief is already written.`,
    `Imam Ahmad used to say "Alhamdulillah in every state." Even this state. Even this moment. Breathe. Say it once: Alhamdulillah. Then say it again. 🌿`,
    `"Call upon Me; I will respond to you." (Quran 40:60). The door is never closed. Tonight, between the adhan and iqama, whisper what is breaking your heart. It is answered.`,
    `The Prophet ﷺ said: "Strange is the affair of the believer — if good reaches him he is grateful, and if hardship reaches him he is patient. All of it is good for him." (Muslim 2999). You are still winning.`,
    `"My Lord, I am in desperate need of whatever good You send down to me." — Musa (AS) said this in his lowest moment, and Allah answered. (Quran 28:24). Pray two rakahs. Say these words. Watch the door open.`,
    `Tears are not weakness. The Prophet ﷺ cried. Abu Bakr (RA) cried. Umar (RA) cried. Cry, then raise your hands. A dua after tears is never rejected. 🤲`,
    `"Do not despair of the mercy of Allah. Indeed, Allah forgives all sins." (Quran 39:53). No matter what you did. No matter how long ago. Come back. That is the entire point.`,
  ],
  2: [
    `"Verily, with every hardship comes ease." (Quran 94:6). Feeling down is not failure — it is human. The difference is what you do next. One salah. One dua. One small step forward.`,
    `"La hawla wa la quwwata illa billah" — There is no power except with Allah. Let that truth settle in. He is your source. Plug back in. ✨`,
    `Umar (RA) had hard days. Ali (RA) had hard days. The Sahaba had hard days. What made them great was that they turned toward Allah instead of away. One prayer. One step. That is all.`,
    `"So remember Me, and I will remember you." (Quran 2:152). Allah is waiting for you to turn to Him. A few words of dhikr right now — SubhanAllah, Alhamdulillah, Allahu Akbar — and He responds.`,
    `The Prophet ﷺ said: "When you wake up in the morning, do not expect to see the evening." We are here for a short time. Do not let a low moment steal a precious day. 💪`,
    `"Hasbunallahu wa ni'mal wakeel" — Allah is sufficient for us and the best Disposer of affairs. Ibrahim (AS) said it in the fire. The Prophet ﷺ said it at Uhud. Say it now. (Bukhari 4563)`,
    `Your heart is a garden. Low days are weather — they pass. Dhikr is the water that keeps the roots alive underneath. Water it today, even if the sky is grey. 🌿`,
    `"And whoever puts their trust in Allah, He is sufficient for them." (Quran 65:3). Whatever is worrying you — hand it over. You were never meant to carry it alone.`,
    `The Prophet ﷺ taught this dua for anxiety: "Allahumma inni a'udhu bika minal-hammi wal-hazan…" (Bukhari 6369). Look it up after this. Say it tonight. It works.`,
    `Small today beats perfect tomorrow. Two rakahs now > planning an all-nighter next week. Stand up. One prayer. That is the whole instruction. ⚡`,
  ],
  3: [
    `Alhamdulillah for stability. "The most beloved deeds to Allah are those done consistently, even if small." (Bukhari). You are building something lasting. Stay the course. ⚡`,
    `Renew your niyyah right now. The same action with a renewed intention earns fresh reward. A prayer prayed with full presence is worth more than a hundred prayed mindlessly. 🌱`,
    `You are in the middle — that is not bad, that is a foundation. Add one small extra today: one extra ayah, one act of kindness, one moment of gratitude. Small + consistent = extraordinary in Allah's sight.`,
    `"Whoever is content with what Allah has given him, he will be the richest of people." (Tirmidhi) Steady, calm, grateful — that is a powerful state to be in. 💛`,
    `The Prophet ﷺ said: "Make things easy and do not make them difficult." You do not have to be perfect today. Just be present. Pray. Make dhikr. That is enough. 🌿`,
    `"And He is with you wherever you are." (Quran 57:4). At work. On your commute. In the quiet. You are never alone. Notice Him once today. It changes everything.`,
    `Send salawat ten times right now. "Whoever sends blessings upon me once, Allah sends blessings on him ten times." (Muslim 408). Quiet day = perfect day for a quiet reward multiplier.`,
    `Call a parent. The Prophet ﷺ said the pleasure of Allah is in the pleasure of the parents. (Tirmidhi 1899). Two minutes, and your scale just got heavier. 💚`,
    `Pick up the Quran for five minutes. Not to finish a juz — just to sit with the Speaker of the universe. "This is a Book We have revealed to you, blessed." (Quran 38:29).`,
    `Clean a small part of your space, make wudu, pray two rakahs of tahiyyat al-wudu. "No Muslim performs wudu well and then prays two rakahs… except that Paradise is guaranteed for him." (Muslim 234)`,
  ],
  4: [
    `Masha Allah! This good feeling is a blessing. Do not let the high go to waste — make a big dua NOW while your heart is open. 🌟`,
    `Alhamdulillah! Use this energy wisely — pray your Sunnah prayers, call your parents, smile at someone. "Smiling at your brother is sadaqah." (Tirmidhi). You can afford to be generous today. 😊`,
    `"If you are grateful, I will surely increase you." (Quran 14:7). Good mood = perfect time for shukr. Count three blessings right now. Watch what happens to your heart. 🙏`,
    `Feeling good? This is the best time to make a serious commitment to Allah. Pick ONE habit for the next 30 days — Fajr on time, Quran after Isha, no complaining. Lock it in today. 🏆`,
    `The Prophet ﷺ said the heart is most receptive when it feels at peace. Right now, ask Allah for something big. Something you have wanted for a long time. Ask with certainty. ✨`,
    `Give something away today — even a little. The Prophet ﷺ said: "Charity does not decrease wealth." (Muslim 2588). Joy + sadaqah compounds beautifully.`,
    `Make istighfar x100. Peace + repentance = a clean slate to carry forward. "Ask forgiveness… He will send rain in abundance and give you wealth and children." (Quran 71:10-12)`,
    `Send a kind message to three people today. The Prophet ﷺ said: "You will not enter Paradise until you love one another." (Muslim 54). Love is a practice, not a feeling.`,
    `Learn one new thing about your deen today — a dua, an ayah, a Sunnah. "Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise." (Muslim 2699)`,
    `Remember those who did not wake up today. You did. That alone is worthy of two rakahs of shukr. Do it now while the feeling is fresh. 💛`,
  ],
  5: [
    `ALLAHU AKBAR! You are on fire! Days like this are rare gifts — do not waste a single minute. Make a commitment, give sadaqah, pray every Sunnah. "If you are grateful, I will surely increase you." (Quran 14:7) 🔥`,
    `You are at your peak! This is the moment to make a promise to Allah — one habit, 30 days. No negotiating. Your future self will be grateful you decided today. 💪`,
    `"Whoever does an atom's weight of good will see it." (Quran 99:7). Every action you take today is being recorded. You are building something eternal right now. Do not stop. ✨🏆`,
    `Masha Allah! Your energy, your momentum, your streak — all of it is seen by Allah. "Indeed, Allah does not allow to be lost the reward of those who do good." (Quran 11:115). Keep going! 🌟`,
    `The Prophet ﷺ said: "Take advantage of five before five: youth before old age, health before sickness, wealth before poverty, free time before business, and life before death." You are in a great moment — use it! ⚡`,
    `This is qiyam-al-layl fuel. Sleep a little earlier tonight, set an alarm for the last third, and ask Allah for everything. He descends to the lowest heaven and says: "Is there anyone calling?" (Bukhari 1145)`,
    `Sadaqah while you are happy hits differently. Give a little today in secret. "The charity given in secret extinguishes the anger of the Lord." (Tirmidhi 664).`,
    `Memorize one new ayah today. One. That is lifelong wealth. The Quran will intercede for you on the Day of Judgement. (Muslim 804). Start now. 📖`,
    `Strong day = strong dua. Ask for Paradise without hesitation. Ask for Al-Firdaws Al-A'la by name. The Prophet ﷺ told us to ask for exactly that. (Bukhari 7423)`,
    `Share this energy. Text someone and say "I'm making dua for you today." The angels say "Ameen, and the same for you." (Muslim 2733). Your reward just doubled. 🌟`,
  ],
};

// Urdu mood-coach pool — same sources/citations as the English entries above.
const RESPONSES_UR: Record<number, string[]> = {
  1: [
    `سبحان اللہ۔ آپ کے سب سے کمزور لمحے میں بھی اللہ آپ کو دیکھ رہا ہے۔ "مومن کو جو بھی تھکن، پریشانی یا غم پہنچتا ہے، حتیٰ کہ کانٹا بھی چبھے، اللہ اس کے بدلے اس کے گناہ معاف فرماتا ہے۔" (بخاری)۔ آپ کا درد ضائع نہیں ہو رہا۔ 🤲`,
    `"اور اس نے آپ کو راہ سے بے خبر پایا تو ہدایت دی۔" (القرآن 93:7)۔ جب اللہ کو معلوم ہے کہ آپ کہاں ہیں تو آپ کبھی حقیقتاً گم نہیں۔ وضو کریں، خاموشی سے بیٹھیں، اور دعا مانگیں۔ ابھی کے لیے یہی کافی ہے۔`,
    `ابراہیم علیہ السلام کو آگ سے آزمایا گیا، یونس علیہ السلام کو اندھیروں سے، ایوب علیہ السلام کو درد سے۔ سب نے اللہ کو پکارا — اور اس نے ہر بار جواب دیا۔ اب آپ پکاریں۔ وہ سن رہا ہے۔ 💛`,
    `"پس بے شک تنگی کے ساتھ آسانی ہے، بے شک تنگی کے ساتھ آسانی ہے۔" (القرآن 94:5-6)۔ اللہ نے اسے دو بار دہرایا۔ وہ چاہتا ہے کہ آپ اسے دو بار سنیں۔ آپ کی راحت لکھی جا چکی ہے۔`,
    `"اللہ کی رحمت سے مایوس نہ ہو۔ بے شک اللہ سارے گناہ معاف فرما دیتا ہے۔" (القرآن 39:53)۔ چاہے آپ نے جو بھی کیا ہو، جتنا بھی پہلے کیا ہو۔ لوٹ آئیں۔ یہی اصل بات ہے۔`,
  ],
  2: [
    `"بے شک ہر تنگی کے ساتھ آسانی ہے۔" (القرآن 94:6)۔ دل کا بوجھل ہونا ناکامی نہیں — یہ انسان ہونا ہے۔ فرق اس میں ہے کہ آپ اب کیا کرتے ہیں۔ ایک نماز۔ ایک دعا۔ ایک چھوٹا قدم آگے۔`,
    `"لا حول ولا قوۃ الا باللہ" — طاقت صرف اللہ کے ساتھ ہے۔ اس سچائی کو دل میں اترنے دیں۔ وہی آپ کا سہارا ہے۔ دوبارہ جڑ جائیں۔ ✨`,
    `"پس تم مجھے یاد کرو، میں تمہیں یاد رکھوں گا۔" (القرآن 2:152)۔ اللہ منتظر ہے کہ آپ اس کی طرف رجوع کریں۔ ابھی چند کلمات ذکر کریں — سبحان اللہ، الحمدللہ، اللہ اکبر — اور وہ جواب دیتا ہے۔`,
    `"حسبنا اللہ ونعم الوکیل" — ہمیں اللہ کافی ہے اور وہ بہترین کارساز ہے۔ ابراہیم علیہ السلام نے آگ میں یہی کہا۔ نبی کریم ﷺ نے اُحد میں یہی کہا۔ اب آپ کہیں۔ (بخاری 4563)`,
    `آج کا چھوٹا عمل کل کے کامل منصوبے سے بہتر ہے۔ ابھی دو رکعت اگلے ہفتے کی ساری رات کی عبادت کے منصوبے سے بہتر ہیں۔ اٹھیں۔ ایک نماز۔ بس یہی حکم ہے۔ ⚡`,
  ],
  3: [
    `استحکام پر الحمدللہ۔ "اللہ کے نزدیک سب سے محبوب اعمال وہ ہیں جو پابندی سے کیے جائیں، چاہے تھوڑے ہوں۔" (بخاری)۔ آپ کچھ دیرپا بنا رہے ہیں۔ ثابت قدم رہیں۔ ⚡`,
    `ابھی اپنی نیت تازہ کریں۔ نئی نیت کے ساتھ وہی عمل تازہ اجر کماتا ہے۔ پوری توجہ سے پڑھی گئی ایک نماز بے دھیانی کی سو نمازوں سے بہتر ہے۔ 🌱`,
    `"جو اللہ کے دیے پر راضی رہا، وہ سب لوگوں سے زیادہ غنی ہے۔" (ترمذی)۔ مستقل، پرسکون، شاکر — یہ ایک طاقتور حالت ہے۔ 💛`,
    `ابھی دس بار درود بھیجیں۔ "جو مجھ پر ایک بار درود بھیجتا ہے، اللہ اس پر دس رحمتیں نازل فرماتا ہے۔" (مسلم 408)۔ خاموش دن = خاموش اجر کا بہترین موقع۔`,
    `پانچ منٹ قرآن اٹھائیں۔ پارہ ختم کرنے کے لیے نہیں — بس کائنات کے خالق کے کلام کے ساتھ بیٹھنے کے لیے۔ "یہ بابرکت کتاب ہے جو ہم نے آپ کی طرف نازل کی۔" (القرآن 38:29)۔`,
  ],
  4: [
    `ماشاء اللہ! یہ اچھا احساس ایک نعمت ہے۔ اس لمحے کو ضائع نہ کریں — ابھی بڑی دعا مانگیں جب دل کھلا ہوا ہے۔ 🌟`,
    `الحمدللہ! اس توانائی کو سمجھداری سے استعمال کریں — سنتیں پڑھیں، والدین کو فون کریں، کسی کو مسکرا کر ملیں۔ "اپنے بھائی کے سامنے مسکرانا صدقہ ہے۔" (ترمذی)۔ 😊`,
    `"اگر تم شکر کرو گے تو میں تمہیں اور زیادہ دوں گا۔" (القرآن 14:7)۔ اچھا موڈ = شکر کا بہترین وقت۔ ابھی تین نعمتیں گنیں۔ دیکھیں دل پر کیا اثر ہوتا ہے۔ 🙏`,
    `آج کچھ صدقہ کریں — تھوڑا ہی سہی۔ نبی کریم ﷺ نے فرمایا: "صدقہ مال کو کم نہیں کرتا۔" (مسلم 2588)۔ خوشی + صدقہ کا حسین امتزاج۔`,
    `یاد کریں جو آج صبح نہیں اٹھ سکے۔ آپ اٹھے۔ صرف یہی دو رکعت شکرانے کے لائق ہے۔ ابھی پڑھ لیں جب احساس تازہ ہے۔ 💛`,
  ],
  5: [
    `اللہ اکبر! آپ پورے جوش میں ہیں! ایسے دن نایاب تحفہ ہیں — ایک منٹ ضائع نہ کریں۔ عہد کریں، صدقہ دیں، ہر سنت پڑھیں۔ "اگر تم شکر کرو گے تو میں تمہیں اور زیادہ دوں گا۔" (القرآن 14:7) 🔥`,
    `آپ اپنے عروج پر ہیں! یہی لمحہ ہے اللہ سے وعدہ کرنے کا — ایک عادت، 30 دن۔ کوئی سودے بازی نہیں۔ آپ کا آنے والا کل آج کے فیصلے پر شکرگزار ہوگا۔ 💪`,
    `"جس نے ذرہ برابر نیکی کی، وہ اسے دیکھ لے گا۔" (القرآن 99:7)۔ آج کا ہر عمل لکھا جا رہا ہے۔ آپ ابھی کچھ ابدی بنا رہے ہیں۔ رکیں نہیں۔ ✨🏆`,
    `یہ قیام اللیل کی توانائی ہے۔ آج ذرا جلدی سوئیں، رات کے آخری تہائی کا الارم لگائیں، اور اللہ سے سب کچھ مانگیں۔ وہ آسمانِ دنیا پر نزول فرماتا ہے: "کوئی ہے جو پکارے؟" (بخاری 1145)`,
    `آج ایک نئی آیت حفظ کریں۔ صرف ایک۔ یہ زندگی بھر کی دولت ہے۔ قرآن قیامت کے دن آپ کی شفاعت کرے گا۔ (مسلم 804)۔ ابھی شروع کریں۔ 📖`,
  ],
};

// Arabic mood-coach pool — same sources/citations as the English entries above.
const RESPONSES_AR: Record<number, string[]> = {
  1: [
    `سبحان الله. حتى في أضعف لحظاتك، الله يراك. "ما يصيب المؤمن من نَصَب ولا وَصَب ولا همّ ولا حَزَن، حتى الشوكة يُشاكها، إلا كفّر الله بها من خطاياه." (البخاري). ألمك لا يضيع. 🤲`,
    `"وَوَجَدَكَ ضَالًّا فَهَدَى" (القرآن 93:7). لن تكون ضائعًا حقًا ما دام الله يعلم مكانك. توضأ، واجلس بهدوء، واهمس بدعاء. هذا يكفي الآن.`,
    `ابتُلي إبراهيم عليه السلام بالنار، ويونس عليه السلام بالظلمات، وأيوب عليه السلام بالألم. كلهم دعوا الله — فأجابهم في كل مرة. ادعُه الآن. إنه يسمعك. 💛`,
    `"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا، إِنَّ مَعَ الْعُسْرِ يُسْرًا" (القرآن 94:5-6). كررها الله مرتين. يريدك أن تسمعها مرتين. فرجك مكتوب.`,
    `"لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ، إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا" (القرآن 39:53). مهما فعلت، ومهما مضى من الزمن. عُد. هذا هو المقصود كله.`,
  ],
  2: [
    `"إِنَّ مَعَ الْعُسْرِ يُسْرًا" (القرآن 94:6). الشعور بالضيق ليس فشلًا — إنه إنسانية. الفرق فيما تفعله الآن. صلاة واحدة. دعاء واحد. خطوة صغيرة للأمام.`,
    `"لا حول ولا قوة إلا بالله" — لا قوة إلا بالله. دع هذه الحقيقة تستقر في قلبك. هو مصدر قوتك. عُد إليه. ✨`,
    `"فَاذْكُرُونِي أَذْكُرْكُمْ" (القرآن 2:152). الله ينتظر أن تتوجه إليه. بضع كلمات من الذكر الآن — سبحان الله، الحمد لله، الله أكبر — وهو يستجيب.`,
    `"حسبنا الله ونعم الوكيل". قالها إبراهيم عليه السلام في النار، وقالها النبي ﷺ في أُحد. قلها أنت الآن. (البخاري 4563)`,
    `قليلٌ اليوم خيرٌ من كاملٍ غدًا. ركعتان الآن خير من خطة قيام ليلة كاملة الأسبوع القادم. قم. صلاة واحدة. هذه هي التعليمات كلها. ⚡`,
  ],
  3: [
    `الحمد لله على الثبات. "أحب الأعمال إلى الله أدومها وإن قلّ." (البخاري). أنت تبني شيئًا باقيًا. اثبت على الطريق. ⚡`,
    `جدّد نيتك الآن. نفس العمل بنية متجددة يكسب أجرًا جديدًا. صلاة بحضور قلب خير من مئة صلاة بغفلة. 🌱`,
    `"من رضي بما قسم الله له كان أغنى الناس." (الترمذي). ثابت، هادئ، شاكر — هذه حالة قوية. 💛`,
    `صلِّ على النبي عشر مرات الآن. "من صلى عليّ صلاة واحدة صلى الله عليه بها عشرًا." (مسلم 408). يوم هادئ = فرصة مثالية لأجر مضاعف.`,
    `أمسك المصحف خمس دقائق. ليس لإنهاء جزء — بل لتجلس مع كلام رب العالمين. "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ" (القرآن 38:29).`,
  ],
  4: [
    `ما شاء الله! هذا الشعور الطيب نعمة. لا تدع هذه اللحظة تضيع — ادعُ دعاءً عظيمًا الآن وقلبك منشرح. 🌟`,
    `الحمد لله! استخدم هذه الطاقة بحكمة — صلِّ السنن، اتصل بوالديك، ابتسم لأحد. "تبسمك في وجه أخيك صدقة." (الترمذي). 😊`,
    `"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ" (القرآن 14:7). المزاج الطيب = أفضل وقت للشكر. عُدّ ثلاث نعم الآن. وانظر ماذا يحدث لقلبك. 🙏`,
    `تصدّق اليوم بشيء — ولو قليلًا. قال النبي ﷺ: "ما نقصت صدقة من مال." (مسلم 2588). الفرح + الصدقة مزيج جميل.`,
    `تذكّر من لم يستيقظ هذا الصباح. أنت استيقظت. هذا وحده يستحق ركعتي شكر. صلّهما الآن والشعور ما زال حيًا. 💛`,
  ],
  5: [
    `الله أكبر! أنت في قمة حماسك! أيام كهذه هدايا نادرة — لا تضيّع دقيقة واحدة. اعقد عزمًا، تصدّق، صلِّ كل السنن. "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ" (القرآن 14:7) 🔥`,
    `أنت في أفضل حالاتك! هذه لحظة العهد مع الله — عادة واحدة، 30 يومًا. بلا مساومة. ستشكر نفسك غدًا على قرار اليوم. 💪`,
    `"فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ" (القرآن 99:7). كل عمل تعمله اليوم يُسجَّل. أنت تبني شيئًا أبديًا الآن. لا تتوقف. ✨🏆`,
    `هذه طاقة قيام الليل. نَم مبكرًا قليلًا الليلة، واضبط منبهًا للثلث الأخير، واسأل الله كل شيء. إنه ينزل إلى السماء الدنيا فيقول: "هل من داعٍ؟" (البخاري 1145)`,
    `احفظ آية جديدة اليوم. آية واحدة. هذا كنز للعمر كله. القرآن يشفع لصاحبه يوم القيامة. (مسلم 804). ابدأ الآن. 📖`,
  ],
};

const MISSED_NOTES = [
  `P.S. — You still have a missed prayer today. Make it up before you sleep — the door is always open. Allah loves the one who returns. 🤲`,
  `One more thing — do not forget your missed prayer(s). Qadha before you sleep. "The best of sinners are those who repent." (Ibn Majah) 🌙`,
  `Reminder — make up your missed prayer(s) today. It takes only a few minutes and wipes the slate clean. 🙌`,
];

const MISSED_NOTES_UR = [
  `یاد رہے — آج کی قضا نماز ابھی باقی ہے۔ سونے سے پہلے ادا کر لیں — دروازہ ہمیشہ کھلا ہے۔ اللہ لوٹنے والے سے محبت کرتا ہے۔ 🤲`,
  `ایک اور بات — اپنی قضا نمازیں نہ بھولیں۔ سونے سے پہلے قضا۔ "بہترین خطاکار وہ ہیں جو توبہ کرتے ہیں۔" (ابن ماجہ) 🌙`,
  `یاد دہانی — آج اپنی قضا نمازیں ادا کر لیں۔ صرف چند منٹ لگتے ہیں اور حساب صاف ہو جاتا ہے۔ 🙌`,
];

const MISSED_NOTES_AR = [
  `ملاحظة — ما زالت عليك صلاة فائتة اليوم. اقضِها قبل أن تنام — الباب مفتوح دائمًا. الله يحب التوّابين. 🤲`,
  `أمر آخر — لا تنسَ صلاتك الفائتة. اقضِها قبل النوم. "كل بني آدم خطّاء وخير الخطّائين التوابون." (ابن ماجه) 🌙`,
  `تذكير — اقضِ صلاتك الفائتة اليوم. دقائق معدودة وتُمحى الصفحة. 🙌`,
];

function streakSuffix(streak: number): string {
  if (aiLanguage === 'ur') {
    if (streak >= 30) return `\n\n🔥 ${streak} دن کا سلسلہ — آپ کچھ حقیقی بنا رہے ہیں۔ اب اسے ٹوٹنے نہ دیں۔`;
    if (streak >= 7) return `\n\n⚡ ${streak} دن کا سلسلہ — یہ رفتار برقرار رکھیں!`;
    if (streak === 0) return `\n\n🌱 ہر ماہر کبھی نیا سیکھنے والا تھا۔ آپ کا سلسلہ آج سے شروع ہوتا ہے۔`;
    return '';
  }
  if (aiLanguage === 'ar') {
    if (streak >= 30) return `\n\n🔥 سلسلة ${streak} يومًا — أنت تبني شيئًا حقيقيًا. لا تقطعها الآن.`;
    if (streak >= 7) return `\n\n⚡ سلسلة ${streak} يومًا — حافظ على هذا الزخم!`;
    if (streak === 0) return `\n\n🌱 كل خبير كان مبتدئًا يومًا. سلسلتك تبدأ اليوم.`;
    return '';
  }
  if (streak >= 30) return `\n\n🔥 ${streak} day streak — you are building something real. Do not break it now.`;
  if (streak >= 7) return `\n\n⚡ ${streak} day streak — keep the momentum going!`;
  if (streak === 0) return `\n\n🌱 Every expert was once a beginner. Your streak starts with today.`;
  return '';
}

export function getLocalMotivation(streak: number, mood: number, missed: number): string {
  const level = Math.min(Math.max(Math.round(mood), 1), 5);
  const pools =
    aiLanguage === 'ur' ? RESPONSES_UR : aiLanguage === 'ar' ? RESPONSES_AR : RESPONSES;
  const pool = pools[level];
  let response = pool[Math.floor(Math.random() * pool.length)];

  response += streakSuffix(streak);

  if (missed > 0) {
    const notes =
      aiLanguage === 'ur' ? MISSED_NOTES_UR : aiLanguage === 'ar' ? MISSED_NOTES_AR : MISSED_NOTES;
    const note = notes[Math.floor(Math.random() * notes.length)];
    response += `\n\n${note}`;
  }

  return response;
}
