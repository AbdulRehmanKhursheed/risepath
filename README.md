# Noor — Muslim Companion

A trust-first Islamic lifestyle companion combining prayer times, Quran access, Hajj/Umrah/Janaza guidance, daily goals, streaks, and mood coaching. Target market: Pakistan and global Muslim users.

## Features

- **Home**: Streak ring, daily quote, goals checklist, time-based greeting
- **Learn**: 6 Kalimas (Arabic + transliteration + translation) + 13 everyday Duas (eating, bathroom, sleep, wudu, travel, etc.)
- **Prayer Tracker**: Auto prayer times with regional methods and Sunni/Shia-aware setup (including Jafari)
- **Qibla**: Compass showing direction to Kaaba (Mecca), with live device heading when available (Karachi, Muslim World League, Umm Al-Qura, etc.) + Hanafi/Shafi madhab, mark prayed/missed, weekly consistency dots, 5-min-before notifications
- **Hajj Guide**: Complete step-by-step Hajj al-Tamattu' flow
- **Umrah Guide**: Structured journey with duas and practical notes
- **Janaza Guide**: Emergency guidance for ghusl, kafan, prayer, and burial
- **Mood + AI Coach**: 5-point mood scale, Claude-powered motivation based on streak & mood
- **Stats**: Prayer consistency %, goals completed, mood trend, longest streak

## Tech Stack

- Expo SDK 54 + TypeScript (compatible with Expo Go on Play Store & App Store)
- React Navigation (bottom tabs)
- expo-notifications, expo-location
- adhan (prayer times)
- AsyncStorage, react-native-reanimated
- Syne + Plus Jakarta Sans fonts

## Setup

```bash
npm install
cp .env.example .env
# Add EXPO_PUBLIC_CLAUDE_KEY to .env for AI coach
npx expo start
```

## Run

- **iOS**: `npx expo start --ios`
- **Android**: `npx expo start --android`
- **Web**: `npx expo install react-dom react-native-web` then `npx expo start --web`

## Publishing to Google Play

1. **Build EAS**: `npx eas build --platform android --profile production`
2. **Create Play Console** account, add app, complete store listing
3. **Upload AAB** from `eas build` output
4. **Target Pakistan**: In Play Console → Countries, enable Pakistan (and others)
5. **ASO**: Use keywords like "namaz", "azan", "prayer times", "Islamic", "Muslim", "Pakistan"

## Folder Structure

```text
src/
  screens/     Home, Prayers, Quran, Hajj, Umrah, Janaza, Mood, Stats
  components/  StreakRing, PrayerRow, GoalItem, MoodButton, ChatBubble
  hooks/       usePrayerTimes, useLocation, useStreak
  services/    ai.ts, notifications.ts, storage.ts
  constants/   theme.ts, quotes.ts, hajjGuide.ts, janazaGuide.ts
MARKETING/
  PLAY_STORE_COPY.md
  SCREENSHOT_SCRIPT.md
  CONTENT_CALENDAR_30D.md
  LAUNCH_KPI_CHECKLIST.md
```
