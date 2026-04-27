# Noor — 12-Month Muslim Event Growth Roadmap

A practical, week-by-week marketing and content calendar for Noor's first
year on Google Play, anchored to authentic Hijri events that drive Muslim-app
search demand. All dates are Saudi/Umm al-Qura base — actual local dates
shift ±1 day by region (the in-app `region` setting handles this).

**Use this doc to:**
- Plan What's New release notes ahead of each event spike.
- Time push-notification campaigns and in-app announcement banners.
- Schedule monthly `eas update` content drops.
- Sequence the next 12 months of `docs/play-store-listing.md` short-description
  swaps so the listing rides each search-intent wave.

The calendar below assumes a production launch on **2026-05-06** (Eid al-Adha
window) and runs through **2027-05-31** (one full Hijri cycle).

---

## Search-intent timing — why year-round matters

Google Play search volume for Muslim apps is bimodal:
- **Constant baseline:** `prayer times`, `azan`, `quran`, `qibla`, `dua`,
  `tasbih`, `hijri calendar`. This is daily-utility demand, ~2-4× higher in
  the Muslim-majority hemisphere working hours.
- **Event spikes:** `eid mubarak`, `ramadan`, `laylat al-qadr`, `arafah`,
  `qurbani`, `mawlid`, `ashura` — each spikes 5-20× during a 2-3 week window.

A listing that only optimises for evergreen keywords misses the spikes; one
that only optimises for spikes goes dark for 9 months a year. **Noor's
listing must rotate** — see Section 3 below.

---

## 1. Annual event calendar (1447-1448 AH · 2026-05 → 2027-05)

| Event | Saudi base date | Marketing window | Hijri | In-app emphasis | Listing swap | Push campaign | Est. install lift |
|---|---|---|---|---|---|---|---|
| **Eid al-Adha 1447** | 2026-05-27 | 2026-05-06 → 2026-06-01 | 10 Dhul Hijjah | Eid Hub, 10 Days, Arafah, Qurbani | "Eid Guide" in short description | Daily during Dhul Hijjah | 🔥🔥🔥 highest of year |
| **Ayyam al-Tashreeq** | 2026-05-28 → 30 | covered by Eid window | 11-13 Dhul Hijjah | Continued takbeer reminders | (continuation) | Per-Salah takbeer reminder | (continuation) |
| **Islamic New Year 1448** | 2026-06-16 | 2026-06-09 → 2026-06-22 | 1 Muharram | Sacred Journey, Hijri calendar | "Hijri Calendar" in short description | "Renew your niyyah" 1 day before + day-of | 🔥 medium |
| **Day of Ashura** | 2026-06-25 | 2026-06-18 → 2026-06-28 | 10 Muharram | Fasting Sunnahs, sourced content | (keep evergreen) | 9 Muharram + 10 Muharram | 🔥 medium |
| **Mawlid al-Nabi ﷺ (Sunni)** | 2026-08-25 | 2026-08-18 → 2026-08-28 | 12 Rabi al-Awwal | Durood emphasis | (keep evergreen) | "Send durood today" | 🔥 small (sect-sensitive) |
| **Mawlid al-Nabi ﷺ (Shia)** | 2026-08-30 | 2026-08-23 → 2026-09-02 | 17 Rabi al-Awwal | Durood emphasis | (keep evergreen) | "Send durood today" | 🔥 small |
| **Isra wa Mi'raj** | 2027-01-05 | 2026-12-29 → 2027-01-08 | 27 Rajab | Quran 17:1, reflect on Salah | (keep evergreen) | Eve + day-of | 🔥 small |
| **Shab-e-Barat** | 2027-01-24 | 2027-01-17 → 2027-01-27 | 15 Sha'ban | Forgiveness night, sourced duas | (keep evergreen) | Evening of 14 Sha'ban | 🔥 medium (regional) |
| **Ramadan 1448 begins** | 2027-02-08 | 2027-01-15 → 2027-03-12 | 1 Ramadan | Fasting reminders, Quran goals, Suhoor/Iftar | "Ramadan, Quran, Iftar" in short description | Daily Suhoor + Iftar | 🔥🔥🔥 highest of year (with Adha) |
| **Laylat al-Qadr (last 10)** | 2027-02-28 → 2027-03-09 | covered by Ramadan window | 21-29 Ramadan | Last-10-nights special UI | (continuation) | Each odd night 21, 23, 25, 27, 29 | (continuation) |
| **Eid al-Fitr 1448** | 2027-03-10 | 2027-03-03 → 2027-03-15 | 1 Shawwal | Eid Hub Fitr tab, Zakat al-Fitr | "Eid Guide" + "Zakat al-Fitr" in short desc | 3 days before + day-of | 🔥🔥 high |
| **6 Days of Shawwal** | 2027-03-11 → 2027-04-08 | covered by Eid Fitr | 2-30 Shawwal | "Voluntary fasts" content | (keep evergreen) | Reminder week of Eid | 🔥 small |
| **Dhul Hijjah 1448 begins** | 2027-05-08 | 2027-04-25 → 2027-05-21 | 1 Dhul Hijjah | 10 Days of Dhul Hijjah Hub | "10 Days, Arafah, Qurbani" in short desc | Daily during the 10 days | 🔥🔥 high |
| **Day of Arafah 1448** | 2027-05-16 | covered by Dhul Hijjah | 9 Dhul Hijjah | Arafah dua, fasting | (continuation) | Eve + dawn of 9th | 🔥🔥 high |
| **Eid al-Adha 1448** | 2027-05-17 | covered by Dhul Hijjah | 10 Dhul Hijjah | Eid Hub Adha tab, Qurbani | "Eid Guide" continues | Day-of Takbeer | 🔥🔥🔥 highest of year |

---

## 2. Always-on weekly cadence

Independent of major events, the app should already feel alive every week:

| Cadence | Trigger | Channel | Copy notes |
|---|---|---|---|
| **Daily** | 5 prayer reminders 5 min before each Salah | `azan-reminders` | Built. Survives reboot, exact-time. |
| **Weekly Friday** | Jumu'ah reminder at 08:00 local | `sacred-countdown` | Built — see `scheduleJumuahReminder()`. |
| **Daily 21:00** | Streak reminder | `streak-reminders` | Built. Asks user to mark prayers. |
| **Daily** | "Today's Recommended Act" home card | (no notification) | Built — see `TodayCard` + `dailyAct.ts`. Hijri-event aware. |
| **Per-event** | Sacred Countdown notifications at milestones (7, 3, 1, 0 days for Eids; 30/14/7/3/1/0 for Ramadan) | `sacred-countdown` | Built — see `scheduleSacredCountdownNotifications()`. |

This cadence already gives every active user 7 daily prayer + 1 streak + 1
"today's act" (in-app) + the Friday weekly Jumu'ah, plus the per-event
milestone pings during sacred windows. **Resist adding more.** Anything
beyond this risks being perceived as spam in the Play Console reviews
("notification spam" is the second-most-common 1-star complaint for Muslim
apps after "azan time wrong").

---

## 3. Listing rotation calendar

The listing's `short_description` (80 chars) and the **first 250 chars of the
long description** rotate to ride each event's search-intent wave. This is
the highest-leverage ASO move you can make without changing the title.

**Default evergreen short description** (use Aug → Jan, May → Jun):
```
Azan alarm, Prayer Times, Tajweed Quran, Qibla, Dua, Tasbih, Hifz, Hijri
```

**Eid al-Adha window** (May → Jun every year):
```
Azan alarm, Prayer Times, Tajweed Quran, Qibla, Dua, Tasbih, Hifz & Eid Guide
```

**Ramadan window** (~3 weeks before through end of Eid al-Fitr; Jan → Mar 1448):
```
Ramadan, Suhoor, Iftar, Azan, Prayer Times, Tajweed Quran, Dua & Tasbih
```

**Schedule:**
- 2026-05-06 → 2026-06-15: Eid Adha variant
- 2026-06-15 → 2027-01-15: Evergreen variant
- 2027-01-15 → 2027-03-20: Ramadan variant
- 2027-03-20 → 2027-04-25: Evergreen variant
- 2027-04-25 → 2027-06-15: Eid Adha variant
- … repeat

The Play Console listing freshness signal rewards changes ~once per quarter
and penalises weekly churn. This rotation is exactly 4 changes per year —
the right cadence.

---

## 4. Per-event content investment plan

For each major event, the goal is **one trustworthy, sourced, year-over-year-reusable
content drop** in `src/constants/eventGuides.ts` (or the existing `eidGuide.ts`
pattern). Built once, shipped forever.

| Event | Build month | Content depth | Estimated effort |
|---|---|---|---|
| Eid al-Adha | ✅ Done (2026-04) | Full — 7 sections incl. 10 Days, Arafah, Qurbani | 8h |
| Eid al-Fitr | ✅ Done (existing) | Full — 6 sections incl. Zakat al-Fitr, takbeer | 6h |
| Hajj guide | ✅ Done (existing screen) | Step-by-step | 4h verify |
| Umrah guide | ✅ Done (existing screen) | Step-by-step | 2h verify |
| Janaza guide | ✅ Done (existing screen) | Salat al-janazah | 2h verify |
| **Ramadan Hub** | 2026-09 (~5 months pre-Ramadan) | Suhoor / iftar duas, fasting rules, taraweeh, common mistakes, Zakat al-Fitr | 12h **— recommend scholar review** |
| **Last 10 Nights / Laylat al-Qadr** | 2027-01 | Itikaf basics, the Aisha dua, what to do each odd night | 4h |
| **Mawlid** | 2026-07 | Durood, sirah summary — handle Sunni/Shia split with separate sections | 6h **— scholar review** |
| **Ashura** | 2026-06 | Fasting Sunnah for both schools, Karbala remembrance for Shia | 6h **— scholar review for Shia content** |
| **Shab-e-Barat** | 2026-12 | Sourced duas, regional practice notes (this is a sect-and-region-sensitive night) | 4h **— scholar review** |
| **Isra wa Mi'raj** | 2026-12 | Quran 17:1, story summary, Salah reflection | 3h |

Items marked "scholar review" — Mawlid, Ashura, Shab-e-Barat, Ramadan rules
— have legitimate scholarly disagreement across schools. **Do not ship
content for these without a qualified local scholar checking it for both
Sunni and Shia versions** (Noor advertises Jafari support, so both must be
right). The downside risk of incorrect content for these is much higher
than for Eid: a 1-star review citing "wrong Ashura ruling" is harder to
recover from than a generic feature complaint.

---

## 5. Push-notification copy bank

Recommended notification copy per event. Already wired in `notifications.ts`
hookEn / hookLocalized for the events listed there. For ones not yet wired,
follow the same pattern (concise, action-oriented, sourced where possible).

### Day-before cadence (8 PM local previous day)
- Eid: `${event.icon} ${eventName} tomorrow. Takbeer tonight.`
- Arafah: `Tomorrow is Arafah. Suhoor early — one year past, one year future forgiven.`
- Ashura: `Tomorrow is Ashura. Fast the 9th and 10th, or 10th and 11th.`
- Ramadan: `Tomorrow is the first fast. Niyyah, suhoor alarm, early night.`

### Day-of cadence (06:30 AM local)
- Eid: `${event.icon} ${eventName} is today. Eid Mubarak.`
- Arafah: `Arafah. Make du'a generously today — the best of du'as.`
- Friday (08:00): `Friday — Day of Jumu'ah. Recite Surah al-Kahf today.` (already wired)

### Multi-day cadence
- Ramadan day N (07:00): `Ramadan day {N}. Read your daily juz, fast.`
- Last 10 nights (20:00 each odd night): `Tonight could be Laylat al-Qadr. Recite the dua of pardon.`

---

## 6. Marketing channel calendar

Free or near-free channels, in priority order:

| Channel | Cost | Best for | Cadence |
|---|---|---|---|
| **In-app share** (Eid Hub Card, Sacred Journey) | $0 | Pre-event spike | Per event |
| **Reddit** r/islam, r/MuslimLounge | $0 | Initial install seed | 1 post per event |
| **WhatsApp groups** (deen, family, friends) | $0 | Local market PK / IN | Per event |
| **Twitter/X** Muslim-twitter community | $0 | Eid + Ramadan | Per event |
| **Instagram Reels** (15-30 s app demo + tasbih ASMR) | $0 (organic) | Ramadan + Eid | Weekly during peak windows |
| **TikTok** Muslim creator collabs | $0-$50 per creator | Wide reach | 1-2 per event |
| **Play Store listing experiments** | $0 | Conversion optimisation | Continuous |
| **Google Ads UAC** (App campaigns) | $5-50/day | Once paying users prove out | Defer to month 6+ |

Tools you already have: `Sentry` (crash monitoring, free tier), Play Console
stats (built-in), `EidHubCard` share button (built), `SacredJourneyScreen`
share button (built). Don't add Firebase Analytics — it contradicts the
listing's "no tracking" claim.

---

## 7. Decision checkpoints

| When | Decision | Inputs needed |
|---|---|---|
| 2026-06-15 (post-Eid al-Adha) | Did Eid push convert? | Play Console install + retention curve |
| 2026-09-01 | Build Ramadan Hub or defer? | Crash-free rate ≥ 99%, ≥ 5K active users |
| 2026-11-01 | Add iOS launch? | $50/mo dev cert affordable; Android 1-star rate < 5% |
| 2027-01-15 | Pre-Ramadan content & marketing budget | Active user count, organic install rate |
| 2027-04-01 | Premium tier launch? | DAU > 10K, retention curve stable |

The 2026-08 decision point in `MEMORY.md` ("ship-and-observe ends ≈
2026-08-20") becomes the gate for Ramadan-Hub content investment. Don't
build it before that date — you'll know more from production data after.

---

## 8. What I would NOT do

- **Don't** build a content guide for Mawlid / Shab-e-Barat / Ashura without
  scholar review. Authenticity is Noor's biggest moat — wrong content
  destroys it.
- **Don't** add daily push notifications beyond the 5 prayer reminders +
  Friday Jumu'ah + 1 streak. Spam = 1-star reviews.
- **Don't** A/B-test listing during a major event spike. You can't attribute
  the move when the search wave is already lifting installs.
- **Don't** localise the listing for events you haven't budgeted scholar
  review for. Better to have an English-only Mawlid section than a
  machine-translated Urdu one with a controversial wording.
- **Don't** spend marketing money before retention is proven. Acquiring
  100K users who churn at D1 is worse than 10K who stick at D30.
