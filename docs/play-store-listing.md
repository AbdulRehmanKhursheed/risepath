# Play Store Listing — Noor (ASO-optimised)

Paste-ready ASO copy for Google Play Console. Every field below is engineered
for keyword density, feature breadth, and search-intent capture across the
top 5 Muslim-app markets. Optimised for the Eid al-Adha launch window
(~26 May 2026) but written so the same listing holds up year-round.

Bundle ID: `com.risepath.app` · Track: closed test → production application
on or after **2026-05-06** (14-day, 12-tester gate). Author: Abdul Rehman.

> **Operator's note.** Pasted copy must be exact, including character counts
> and line breaks. Google Play indexes the title, short description, long
> description and screenshot captions independently — and re-indexes within
> 24-48 hours of publish. Do not hand-edit these strings to "make them read
> nicer"; they are deliberately keyword-loaded.

---

## 0. Keyword research — the basis for every choice in this doc

Volume tiers below are based on Sensor Tower / AppTweak benchmarks for the
Muslim-utility category Q4 2025. Keywords are listed by indexable variant
because Google Play tokenises text — `namaz` and `namaz time` are *different*
indexable phrases.

### Tier 1 — must appear in title or short description (highest volume)
| English | Variants that index separately |
|---|---|
| **Prayer Times** | `prayer times`, `salah times`, `namaz time`, `salat`, `waktu sholat` |
| **Azan / Adhan** | `azan`, `adhan`, `athan`, `ezan` (TR), `adzan` (ID), `أذان` |
| **Quran** | `quran`, `qur'an`, `al quran`, `al-quran`, `holy quran`, `قرآن` |
| **Qibla** | `qibla`, `qibla compass`, `qibla finder`, `qibla direction`, `kiblat` (MY) |
| **Dua / Duas** | `dua`, `duas`, `daily dua`, `hisnul muslim`, `adhkar`, `أدعية` |

### Tier 2 — must appear in long description, screenshots, or What's New
| English | Variants |
|---|---|
| **Tasbih** | `tasbih`, `tasbeeh`, `tesbih` (TR), `digital tasbih`, `dhikr counter` |
| **99 Names of Allah** | `99 names of allah`, `asma ul husna`, `asma al husna`, `أسماء الله الحسنى` |
| **Hifz / Memorisation** | `hifz`, `hifdh`, `quran memorization`, `quran memorisation` |
| **Tajweed** | `tajweed`, `tajwid`, `tajweed quran`, `mushaf` |
| **Hadith** | `hadith`, `bukhari`, `muslim`, `sunnah` |
| **Zakat** | `zakat`, `zakat calculator`, `nisab`, `zakat calculator gold`, `زكاة` |
| **Qada / Missed prayers** | `qada`, `qaza namaz`, `kaza`, `missed prayer tracker`, `قضاء` |
| **Hijri Calendar** | `hijri calendar`, `islamic calendar`, `kalender hijriyah` (ID) |
| **Ramadan** | `ramadan`, `ramazan`, `ramadhan` (ID), `roza` |
| **Eid** | `eid`, `eid mubarak`, `eid al-adha`, `eid al-fitr`, `idul adha` (ID) |
| **Hajj / Umrah** | `hajj`, `umrah`, `umra`, `hac` (TR), `حج`, `عمرة` |
| **Janaza** | `janaza`, `funeral prayer`, `salat al-janazah` |

### Tier 3 — long-tail / sect / region (capture in long description only)
- `shia prayer times`, `jafari prayer times`, `sunni prayer times`
- `hanafi asr`, `shafi asr`, `karachi method`, `umm al-qura`, `isna`
- `saheeh international quran`, `maududi tafsir`, `uthmani script`
- `takbeer al-tashreeq`, `day of arafah`, `qurbani guide`, `udhiyah`
- `mawlid`, `ashura`, `arbaeen`, `isra wa miraj`, `shab-e-barat`

### What this means for the listing
- **Title** can only fit ~4 Tier-1 keywords. We pick the 4 with the broadest
  cross-market coverage (`Quran`, `Azan`, `Qibla`, `Dua`).
- **Short description** is the second-highest weighted field — pack 7-8
  Tier-1 + Tier-2 keywords here.
- **Long description first 250 chars** is the above-the-fold preview — must
  hit every Tier-1 keyword and the bulk of Tier-2.
- **Screenshot captions** are independently indexed. Make every caption a
  keyword statement, not a marketing line.
- **Localisations** are *not* translations — each market searches differently
  (`adzan` not `azan` in Indonesia; `tesbih` not `tasbih` in Turkey).

---

## 1. English — default locale `en-US`

### 1.1 Title — 30 char limit
```
Noor: Quran, Azan, Qibla, Dua
```
*(29/30 chars. Packs 4 Tier-1 keywords. Drops "Prayer Times" because (a) "Azan" already implies prayer-time search intent and (b) "Qibla" is missing from most competitor titles — that's a search gap to exploit.)*

**Reserve fallback** (if you ever want to test "Prayer Times" in title later):
```
Noor: Quran, Prayer Times, Dua
```
*(30/30 chars. Drops Azan + Qibla but adds the highest-volume English keyword.)*

### 1.2 Short description — 80 char limit
```
Azan reminders, Prayer Times, Tajweed Quran, Qibla, Dua, Tasbih, Hifz & Eid
```
*(75/80 chars. **9 features** packed in: Azan, Prayer Times, Tajweed, Quran, Qibla, Dua, Tasbih, Hifz, Eid. Use "reminders" unless/until the app ships a real full-adhan audio alarm.)*

**Post-Eid evergreen swap** (use after 2026-06-15):
```
Azan reminders, Prayer Times, Tajweed Quran, Qibla, Dua, Tasbih, Hifz, Hijri
```
*(76/80 chars.)*

### 1.3 Long description — 4000 char limit

> The first ~250 chars are the **above-the-fold preview** on Play Store.
> Every Tier-1 keyword and most Tier-2 keywords are packed into that
> opener. The rest of the body uses each keyword 2-3 more times naturally.

```
🌙 Noor — Quran with Tajweed, Prayer Times (Salah · Namaz), Azan reminders, Qibla compass, Dua library, 99 Names of Allah (Asma ul-Husna), digital Tasbih, Hifz tracker, Hijri calendar and a full sourced Eid al-Adha + Eid al-Fitr guide. Free, no account. Built for both Sunni and Shia (Jafari) practice in English, Urdu and Arabic.

✦ AZAN REMINDERS & PRAYER TIMES (SALAH · NAMAZ)
Accurate Salah times calculated for your exact location. 14 calculation methods — Karachi, Umm al-Qura, ISNA (North America), Egyptian, Muslim World League, Moonsighting Committee, Tehran, Jafari, Dubai, Kuwait, Qatar, Singapore, Turkey, custom. Hanafi or Shafi'i Asr. Local reminders 5 minutes before every Fajr, Dhuhr, Asr, Maghrib and Isha — scheduled on your device and refreshed when the app opens.

✦ HOLY QURAN — MUSHAF, TAJWEED, HIFZ
The complete Holy Quran (القرآن الكريم) in Uthmani Mushaf script with Tajweed colour-coding for accurate recitation. Saheeh International (English) and Maududi (Urdu) translations side-by-side. Surah list, juz navigation, full-text search, ayah-by-ayah Hifz tracker for memorisation, daily streak.

✦ EID AL-ADHA & THE 10 SACRED DAYS OF DHUL HIJJAH
The full Eid al-Adha guide — virtues of the 10 Days of Dhul Hijjah, Day of Arafah fasting, Takbeer al-Tashreeq, Eid Salah method (all four madhabs + Jafari), and detailed Qurbani / Udhiyah rules. Every entry sourced to Sahih Bukhari, Sahih Muslim, Tirmidhi, Abu Dawud, Ibn Majah or Quran by ayah. Eid al-Fitr guide with Zakat al-Fitr, the night and morning of Eid, takbeer, and the salah method.

✦ QIBLA COMPASS
Live Qibla direction toward the Kaaba in Mecca with a smooth real-time compass. Works offline once your location is set. No more guessing the direction in hotels, airports, or on the road.

✦ DUA LIBRARY · DAILY ADHKAR · 99 NAMES OF ALLAH
Curated authentic Duas — morning and evening adhkar, sleeping, eating, travel, gratitude, forgiveness, hardship, exam, illness — each with Arabic, transliteration, English and Urdu translation. Plus the 99 Names of Allah (Asma ul-Husna) with meanings and a 6 Kalimas reference for daily revision.

✦ HIFZ TRACKER · MEMORISE QURAN
Memorise the Holy Quran one ayah at a time. Track surahs in progress, set goals, watch your daily streak grow, log revision sessions. Designed for hifz students, ulama, and parents teaching their children.

✦ DIGITAL TASBIH · DHIKR COUNTER
Tasbih counter with vibration. Track Subhanallah, Alhamdulillah, Allahu Akbar, Astaghfirullah, salutations on the Prophet ﷺ — or set any custom dhikr. Daily totals saved automatically. Beautiful interface, large numerals, accessible in low light.

✦ ZAKAT CALCULATOR · QADA TRACKER · CUSTOM REMINDERS
Work out the Zakat due on your wealth — gold or silver nisab, assets, liabilities, the 2.5% rate and the eight recipients, fully offline. Track and make up Qada (missed) prayers with a per-prayer counter and progress bar. Set your own worship reminders — Tahajjud, Duha, morning and evening adhkar — on your times, repeating on the days you choose.

✦ HIJRI / ISLAMIC CALENDAR · SACRED COUNTDOWN
Full Hijri (Islamic) calendar with countdowns to Ramadan, Eid al-Fitr, Eid al-Adha, Day of Arafah, Day of Ashura, Mawlid al-Nabi ﷺ, Isra wa Mi'raj, Arbaeen and Shab-e-Barat. Choose your moonsighting region — Saudi Arabia & Gulf, South Asia, UK, North America, Europe, Africa, Southeast Asia.

✦ HAJJ, UMRAH & JANAZA GUIDES
Step-by-step Hajj guide (Tawaf, Sa'i, Mina, Arafah, Muzdalifah, Jamarat), Umrah guide, and the Janaza prayer (salat al-janazah) — sourced, calm, made for first-timers. Sunnahs, duas, and common mistakes covered.

✦ MOOD COACH · DAILY GOALS · STATS
Mark your prayers, set daily goals, log your mood, and watch your spiritual journey at a glance — current streak, longest streak, prayer consistency, weekly goal progress. Quiet, private, no comparison with anyone else.

✦ PRIVATE BY DESIGN
No account. No login. No profiling of your prayers, Quran reading, mood or personal goals. Your Salah log, Hifz progress, Tasbih totals and streaks live only on your phone — they never leave your device. Ads and anonymous crash diagnostics are disclosed clearly in the Privacy Policy and Play Data Safety form.

🤲 Whether you're a student, a parent, a traveller, a hafiz, or someone returning to your deen — Noor is built to make consistent Salah easier and your relationship with the Quran deeper.

Eid Mubarak 🌙 — Taqabbalallahu Minna wa Minkum. May Allah accept from us and from you.
```

*(~3,810 chars / 4000 limit — includes the Zakat Calculator · Qada Tracker · Custom Reminders section added for v1.0.13. **Tier-1 coverage:** Quran ×8, Prayer Times / Salah / Namaz ×6, Azan / Adhan ×3, Qibla ×3, Dua ×4. **Tier-2 coverage:** Tasbih ×3, 99 Names ×2, Hifz ×3, Tajweed ×2, Hadith / Bukhari / Muslim ×3, Hijri / Islamic Calendar ×2, Eid ×6, Hajj / Umrah / Janaza ×2. **Tier-3 coverage:** Karachi method, ISNA, Umm al-Qura, Jafari, Hanafi, Shafi'i, Saheeh International, Maududi, Uthmani, Day of Arafah, Takbeer al-Tashreeq, Qurbani, Udhiyah, Mawlid, Ashura, Arbaeen, Shab-e-Barat — all named at least once.)*

### 1.4 What's New — 500 char limit (rotate every release)

**v1.0.0 — Eid al-Adha launch:**
```
🌙 Eid Mubarak from Noor. New in 1.0: full Eid al-Adha guide with the 10 Sacred Days of Dhul Hijjah, Day of Arafah fasting, Takbeer al-Tashreeq, Eid Salah for all four madhabs + Jafari, Qurbani / Udhiyah rules — every ruling cited to Bukhari, Muslim or Quran by ayah. Fajr reminders, Quran with Tajweed, Hifz tracker, 99 Names, Tasbih. Welcome.
```
*(~410 chars. Hits Eid · Adha · Dhul Hijjah · Arafah · Takbeer · Salah · Jafari · Qurbani · Udhiyah · Bukhari · Muslim · Fajr · Quran · Tajweed · Hifz · Tasbih.)*

**v1.0.13 — Zakat + Qada + Reminders release:**
```
🌙 New: Zakat Calculator — gold/silver nisab, assets, liabilities, the 2.5% rate and the 8 recipients, fully offline. New: Qada Tracker — count down your missed prayers one salah at a time. New: My Reminders — your own Tahajjud, Duha and adhkar alarms on your times. Plus the Quran with Tajweed, prayer times with 14 methods, Qibla compass, Hifz tracker, digital Tasbih and Hijri calendar. Free, private, no account.
```
*(~430 chars. Hits Zakat · nisab · Qada · missed prayers · Tahajjud · adhkar · Quran · Tajweed · prayer times · Qibla · Hifz · Tasbih · Hijri.)*

**v1.0.1+ template — keep keywords flowing:**
```
🌙 Better Fajr reliability across more devices. New: [feature]. Improved: [feature]. Quran search faster, Hifz tracker more accurate, Hijri calendar more precise, Qibla compass smoother. Includes the full Eid al-Adha guide (10 Days of Dhul Hijjah, Day of Arafah, Takbeer al-Tashreeq, Qurbani rules) and Eid al-Fitr guide (Zakat al-Fitr, Eid Salah). All sourced to Bukhari, Muslim, Tirmidhi, Abu Dawud, Quran.
```
*(Reuse on every minor release — keeps your keyword index hot.)*

### 1.5 Category & tags
- **Category:** `Books & Reference` *(strongly recommended over Lifestyle — less competition, Quran apps consistently rank higher here, and you avoid head-to-head with Muslim Pro and Athan Pro who are both in Lifestyle).*
- **Secondary tags (pick 5):**
  1. `Religion`
  2. `Education`
  3. `Reference`
  4. `Lifestyle` *(catches Lifestyle search even though primary is Books & Reference)*
  5. `Health & Fitness` *(unusual but valid — covers the streak / habit angle)*
- **Content rating:** Everyone. Disclose religious content.

---

## 2. Localisations — keyword-researched, not translated

> **This is where the biggest ranking lift comes from.** Most Muslim apps
> machine-translate their listings; their localised pages rank below natively
> keyword-researched competitors. Each market searches differently — copy
> below uses the local high-volume keyword variants, not direct translation.

> **Always have a native speaker review before publishing.** These drafts are
> keyword-correct and grammatically reasonable, but only a native can catch
> register and fluency issues that affect conversion.

### 2.1 Indonesia — `id-ID` *(largest Muslim install market globally — ~230M Muslims)*

**Local keyword variants that matter:**
- `adzan` (NOT `azan`) — 5-10× higher volume in Indonesia
- `jadwal sholat` (prayer schedule), `waktu sholat` (prayer time)
- `Al-Quran` with hyphen
- `tasbih digital`
- `kalender hijriyah` (NOT `kalender islam`)
- `idul adha`, `idul fitri` (NOT `eid al-adha`)
- `kiblat` (NOT `qibla`)
- `doa harian`

**Title (30):**
```
Noor: Al-Quran, Adzan, Doa
```
*(26/30. `Adzan` is the killer keyword for Indonesia.)*

**Short description (80):**
```
Pengingat adzan, jadwal sholat, Al-Quran tajwid, kiblat, doa harian, tasbih
```
*(74/80.)*

**Long description opener (~500 chars):**
```
🌙 Noor — pendamping Muslim autentik untuk Al-Quran lengkap dengan tajwid, jadwal sholat (waktu sholat akurat), pengingat Adzan, arah kiblat, kumpulan doa harian, Asma ul-Husna 99 nama Allah, tasbih digital, pelacak hifz Al-Quran, kalender hijriyah, dan panduan lengkap Idul Adha + Idul Fitri. Gratis, tanpa akun. Untuk Sunni dan Syiah, dalam Bahasa Indonesia, Inggris dan Arab.

✦ ADZAN & JADWAL SHOLAT
Waktu sholat akurat untuk lokasi Anda. 14 metode perhitungan termasuk Karachi, Umm al-Qura, MWL, dan Jafari. Pengingat Adzan untuk Subuh (Fajr), Zuhur, Ashar, Maghrib, dan Isya — 5 menit sebelum waktu sholat, dijadwalkan langsung di perangkat.

[continue with the same feature sections, translated and keyword-localised]
```

### 2.2 Saudi Arabia & Gulf — `ar` (Arabic)

**Local keyword variants:**
- `أوقات الصلاة` (prayer times — exact phrase indexed)
- `الأذان` and `الاذان` both index — use the standard `الأذان`
- `القرآن الكريم` (the most-searched Quran phrase)
- `القبلة`, `بوصلة القبلة` (qibla compass)
- `الأدعية`, `الأذكار` (duas, adhkar — both high volume)
- `أسماء الله الحسنى` (99 Names — search this phrase)
- `تسبيح إلكتروني` (digital tasbih)
- `عيد الأضحى`, `عيد الفطر`

**Title (30):**
```
نور: القرآن، الأذان، القبلة
```
*(~28 chars. Drops Dua — Arabic characters take more visual width; pack the highest-volume 3.)*

**Short description (80):**
```
الأذان، أوقات الصلاة، القرآن بالتجويد، القبلة، الأدعية، التسبيح، الحفظ
```

**Long description opener:**
```
🌙 نور — رفيقك المسلم الموثوق للقرآن الكريم بالتجويد، أوقات الصلاة الدقيقة، الأذان، بوصلة القبلة، الأدعية والأذكار، أسماء الله الحسنى، التسبيح الرقمي، تتبع حفظ القرآن، التقويم الهجري، ودليل عيد الأضحى وعيد الفطر الكامل. مجاني، بدون حساب، يعمل بلا اتصال. مبني للسنّة والشيعة (الجعفري) معاً، بالعربية والأردية والإنجليزية.

✦ الأذان وأوقات الصلاة
أوقات صلاة دقيقة لموقعك. 14 طريقة حساب — أم القرى، الكويت، قطر، الرابطة الإسلامية، الجعفري وغيرها. تنبيهات قبل كل صلاة بـ٥ دقائق — الفجر، الظهر، العصر، المغرب، العشاء. تستمر بعد إعادة تشغيل الجهاز.

[continue feature sections in Arabic]
```

### 2.3 Pakistan — `ur` (Urdu)

**Local keyword variants:**
- `نماز کے اوقات`, `نماز ٹائم`, `namaz time` (English-Urdu code-switching IS searched)
- `اذان`, `azan` (both index — use both somewhere)
- `قرآن`, `قرآن مجید`, `Quran`
- `قبلہ`, `qibla`
- `تسبیح`, `tasbeeh` (note `eh` ending in PK searches)
- `حج`, `عمرہ`, `جنازہ`
- `عیدالاضحی`, `eid mubarak`

**Title (30):**
```
Noor: قرآن، نماز، اذان، دعا
```
*(~26 chars including spaces. Mixes Latin brand with Urdu keywords — natural for PK users who code-switch.)*

**Short description (80):**
```
اذان الارم، نماز کے اوقات، تجوید کے ساتھ قرآن، قبلہ، دعا، تسبیح، حفظ
```

**Long description opener:**
```
🌙 Noor — آپ کا مستند مسلم ساتھی۔ مکمل قرآن مجید تجوید کے ساتھ، نماز کے اوقات، اذان الارم، قبلہ کمپاس، روزانہ کی دعائیں، اللہ کے ۹۹ نام (اسماء الحسنیٰ)، ڈیجیٹل تسبیح، حفظ ٹریکر، ہجری کیلنڈر، اور عیدالاضحی + عیدالفطر کی مکمل گائیڈ۔ مفت، آف لائن، بغیر اکاؤنٹ۔ سنی اور شیعہ (جعفری) دونوں کے لیے، اردو، انگریزی اور عربی میں۔

✦ اذان اور نماز کے اوقات
آپ کے مقام کے لیے درست نماز کے اوقات۔ ۱۴ کیلکولیشن میتھڈز — کراچی، اُمّ القریٰ، ISNA، جعفری وغیرہ۔ ہر نماز سے ۵ منٹ پہلے یاددہانی — فجر، ظہر، عصر، مغرب، عشاء۔ ڈیوائس ری اسٹارٹ کے بعد بھی کام کرتی ہے۔

[continue feature sections in Urdu]
```

### 2.4 Turkey — `tr-TR`

**Local keyword variants:**
- `ezan` (NOT `azan`)
- `namaz vakti` (singular more common than `namaz vakitleri`)
- `Kur'an` with apostrophe (Turkish convention)
- `kıble` with `ı` (dotless)
- `tesbih` (NOT `tasbih`)
- `dua`
- `hicri takvim`
- `Kurban Bayramı` (NOT `Eid al-Adha`)
- `Ramazan Bayramı` (NOT `Eid al-Fitr`)

**Title (30):**
```
Noor: Kur'an, Ezan, Kıble, Dua
```
*(29/30. Note `Kur'an` with apostrophe — Turkish convention.)*

**Short description (80):**
```
Ezan hatırlatıcı, namaz vakitleri, Tecvidli Kur'an, kıble, dua, tesbih
```

**Long description opener:**
```
🌙 Noor — Tecvidli Kur'an-ı Kerim, namaz vakitleri, Ezan hatırlatıcıları, Kıble pusulası, dua kütüphanesi, Esma-ül Hüsna (Allah'ın 99 ismi), dijital tesbih, hıfz takipçisi, Hicri takvim ve eksiksiz Kurban Bayramı + Ramazan Bayramı rehberi. Ücretsiz, hesapsız. Sünnî ve Câferî için Türkçe, İngilizce ve Arapça.

✦ EZAN VE NAMAZ VAKİTLERİ
Konumunuza göre kesin namaz vakitleri. 14 hesaplama yöntemi — Türkiye Diyanet, MWL, Mısır, Karaçi, Umm al-Qura, Câferî. Her namazdan 5 dakika önce hatırlatma — sabah (Fecr), öğle, ikindi, akşam, yatsı. Cihaz yeniden başlatıldıktan sonra bile çalışır.

[continue feature sections in Turkish]
```

### 2.5 Malaysia — `ms-MY`

**Local keyword variants:**
- `azan` (Malay uses azan, not adzan)
- `waktu solat` (NOT `waktu sembahyang`)
- `Al-Quran`
- `kiblat` (NOT `qibla`)
- `doa harian`
- `tasbih digital`
- `kalendar Hijrah` (with `Hijrah`, not `Hijriah`)
- `Aidiladha`, `Aidilfitri` (Malay Eid names)

**Title (30):**
```
Noor: Al-Quran, Azan, Doa
```
*(25/30.)*

**Short description (80):**
```
Azan, waktu solat, Al-Quran tajwid, kiblat, doa harian, tasbih, hafazan
```

**Long description opener:**
```
🌙 Noor — teman Muslim sahih untuk Al-Quran lengkap dengan tajwid, waktu solat tepat, peringatan azan, arah kiblat, koleksi doa harian, 99 nama Allah (Asma ul-Husna), tasbih digital, pejejak hafazan Al-Quran, kalendar Hijrah, dan panduan lengkap Aidiladha + Aidilfitri. Percuma, tanpa akaun. Untuk Sunni dan Syiah, dalam Bahasa Melayu, Inggeris dan Arab.

[continue feature sections in Malay]
```

### 2.6 Tier-2 markets to add later (in priority order)
1. **Bangladesh `bn-BD`** — `নামাজের সময়`, `আজান`, `কুরআন`, `কিবলা`, `দোয়া`, `তাসবিহ`
2. **France / Maghreb `fr-FR`** — `horaires de prière`, `adhan`, `Coran`, `qibla`, `douaa`, `tasbih`
3. **Iran `fa-IR`** — `اوقات نماز`, `اذان`, `قرآن`, `قبله`, `دعا`, `تسبیح`
4. **India `hi-IN`** — code-switched Urdu/Hindi works; same as `ur` mostly
5. **Egypt-specific `ar-EG`** — Egypt has different search dialect (e.g. `مواقيت الصلاة` vs gulf `أوقات الصلاة`)
6. **UK / US English `en-GB` / `en-US`** — separate locale slots, can fine-tune for "muslim app uk" / "halal app" long-tail

---

## 3. Screenshots — keyword-loaded captions, not marketing copy

Play Store shows the **first 2 screenshots** above the fold on phones. Captions
must be **keyword statements**, not flowery taglines. Bake them into the image
(Google does not overlay them automatically). Use accent `#C8780A`, dark hero
text `#1F2B1C` on `#FAF4E8` background. **8 screenshots minimum, 8 maximum
recommended** — Play surfaces all 8 in the gallery; people swipe.

| # | Screen | Caption (English) — keyword statements |
|---|--------|----|
| 1 | Prayer Tracker (Prayers tab) | **Prayer Times · Azan Reminders · 5 Daily Alerts** |
| 2 | Quran — Mushaf with Tajweed colours | **Holy Quran · Uthmani Mushaf · Tajweed Colours** |
| 3 | Eid screen — 10 Days of Dhul Hijjah section | **Eid al-Adha Guide · 10 Days of Dhul Hijjah · Sourced** |
| 4 | Qibla compass | **Qibla Compass · Direction to Kaaba · Offline** |
| 5 | 99 Names of Allah | **99 Names of Allah · Asma ul-Husna** |
| 6 | Dua Library | **Authentic Dua Library · Daily Adhkar** |
| 7 | Hifz Tracker | **Hifz Tracker · Memorise Quran · Daily Streak** |
| 8 | Tasbih Counter | **Digital Tasbih · Dhikr Counter · Vibration** |

**Rule:** every caption must contain at least one Tier-1 keyword OR two Tier-2
keywords. None of the captions above are wasted on marketing fluff.

**Localised screenshot captions:** translate using the local keyword variants
in section 2 (e.g. screenshot 1 in Indonesian = `Adzan · Jadwal Sholat · 5 Pengingat Harian`). Generate 8 screenshot captions per locale.

---

## 4. Feature graphic — 1024×500 px (mandatory for production)

Suggested layout:
- Left third: stylised crescent (matches the in-app `☾` glyph) on `#FAF4E8`
- Centre: tagline `Quran · Salah · Eid · Qibla · Tasbih` in `#1F2B1C` 60-72pt
- Right third: gradient overlay with three small phone mockups showing Quran, Prayer Times, Eid Hub
- Bottom-right: small `Noor` wordmark in accent `#C8780A`
- **No** screenshots cropped large, **no** Play badges (Google rejects those)

**Localise the feature graphic** for the top 3 markets — pure ASO win that
most apps skip. Cost: ~$50 on Fiverr per locale, multiple-day turnaround.

---

## 5. App icon — A/B candidates

The current icon (golden crescent on cream background) is fine but untested.
Once you're past the 14-day production gate, run a Play Store Listing
Experiment with these candidate variants:
1. **Current** — cream + crescent (calm, intellectual)
2. **Variant A** — green (#1A7A3C) crescent with star (more "Muslim app" coded)
3. **Variant B** — Quran cover with embossed crescent (signals Quran focus)
4. **Variant C** — Kaaba silhouette (signals prayer/qibla/hajj focus)

Run each for 14 days minimum, monitor install rate. **Do not** swap icon mid-Eid
window — visual change tanks recognition during the spike.

---

## 6. Submission checklist (must be green before "Apply for production")

- [ ] Title set to `Noor: Quran, Azan, Qibla, Dua` (exactly 29 chars)
- [ ] Short description set to the v1.0 launch string (76 chars, ends `Eid Guide`)
- [ ] Long description pasted exact, leading with the keyword-rich opener
- [ ] All 8 screenshots uploaded with baked-in keyword captions
- [ ] **5 localisations submitted: en-US (default), id-ID, ar, ur, tr-TR, ms-MY** — each with native-speaker reviewed long description
- [ ] Privacy policy URL pointed at the public copy (not just `docs/index.html` locally)
- [ ] **Data Safety form** accurately declares AdMob advertising identifiers and Sentry crash diagnostics while making clear that prayer, Quran, mood, hifz, and goal data stays on-device
- [ ] Content rating: Everyone, religious content disclosed
- [ ] App category: **`Books & Reference`** (strong recommendation over Lifestyle)
- [ ] 5 tags: Religion · Education · Reference · Lifestyle · Health & Fitness
- [ ] What's New v1.0.0 string pasted (Eid launch version)
- [ ] **All 12 closed testers personally messaged on Day 0** — ask for honest feedback/reviews and one specific feature they tested (notification reliability, Eid guide, Tajweed Quran, etc.); never incentivise or request only 5-star reviews
- [ ] Feature graphic uploaded for at least en-US and the top 2 localised markets

---

## 7. Day-of-launch growth playbook

Once production rollout starts (likely **2026-05-06** if the gate completes
cleanly):

1. **Day 0 — 09:00 PKT:** Push live build. Within 30 minutes:
   - Personal message to all 12 closed testers asking for the review.
   - Post in 3-5 Muslim-tech / Muslim-creator communities (Reddit r/islam,
     r/MuslimLounge, IslamicFinder Discord, WhatsApp deen groups). Lead with
     the **Eid angle**, not "I built an app."
2. **Day 1-3:** Monitor Sentry crash-free rate and Play Console refund rate.
   Anything > 1% crash-free → hold further marketing, fix, re-deploy.
3. **Day 4-9 (pre-Eid window):** Push the in-app **Eid Hub share** across
   your network — every share carries `${PLAY_STORE_URL}` attribution.
   Aim for 100+ organic shares.
4. **Day 10-14 (Eid week):** This is the largest organic search spike of the
   year — `eid mubarak`, `eid namaz`, `qurbani guide`, `takbeer`, `idul adha`.
   The listing copy above is engineered for this. Don't change anything during
   the spike — just watch installs.
5. **Day 15-30 (post-Eid):** Swap the short description to the evergreen
   variant (replace `Eid Guide` with `Hijri Calendar`). Move the Eid section
   to a lower position in the long description, replace the lead paragraph with
   a generic value-prop. Keep the keyword density.

---

## 8. Things I would NOT do

- **Don't** change the title every week. Google Play has a freshness signal but
  large title changes tank rankings short-term while re-indexing.
- **Don't** A/B-test title and category in the same window — both ranking
  signals reset together and you cannot attribute the move.
- **Don't** machine-translate the long description and ship — Arabic and Urdu
  listings will get reported / down-ranked when readers spot awkwardness.
- **Don't** keyword-stuff past the natural-reading bar in the long description.
  Play's spam detector picks this up and de-ranks. The opener is already at
  the maximum acceptable density; do not make it denser.
- **Don't** add a paid tier before week 4 of production data — see the
  ship-and-observe phase plan.
- **Don't** submit before all 5 localisations are native-reviewed. Half-baked
  Indonesian / Arabic listings hurt more than no localised listing at all.
- **Don't** use the same screenshot images across locales without caption swap
  — captions must be in the local language for ASO indexing to work.
