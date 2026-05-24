# HomeScreen — Accessibility Follow-ups (2026-05-24)

Static audit performed alongside the Day-1 architectural overhaul. The new
typography primitives (<Heading>, <Body>, <Caption>) automatically set
accessibilityRole='header' on headings. This document captures issues that
the static audit found and that should be addressed in later plans.

Files reviewed:
- `src/screens/HomeScreen.tsx`
- `src/components/MenuButton.tsx`
- `src/components/StreakRing.tsx`
- `src/components/TodayCard.tsx`
- `src/components/QuickActions.tsx`
- `src/components/HadithOfDay.tsx`
- `src/components/GoalItem.tsx`
- `src/components/NextEventCard.tsx`
- `src/components/EidHubCard.tsx`
- `src/components/StreakCelebrationModal.tsx`
- `src/components/AdBanner.tsx`
- `src/components/ui/Heading.tsx` (reference: applies role=header)
- `src/components/ui/Text.tsx` (reference: Body/Caption/Label — no a11y role applied)

## Critical (would block screen-reader users)

- **`src/components/StreakRing.tsx:53-54`** — The streak number is rendered as
  a bare integer (`{current}`) with the label below it as a separate `<Text>`
  ("day streak"). A screen reader will announce these as two unrelated
  utterances: "12" then "day streak". On the small chance VoiceOver groups
  them it will still read with no semantic context (e.g. "is at" / "of"
  target). Fix: wrap the ring in a single accessible element with
  `accessible={true}` and an `accessibilityLabel` such as
  `"${current}-day streak, ${target}-day goal"` (localized), then mark the
  inner `<Text>` nodes with `importantForAccessibility="no-hide-descendants"`
  on Android and `accessibilityElementsHidden={true}` on iOS. Same screen
  also calls this with `label={t.dayStreak}` — that label needs to interpolate
  the number rather than be a separate sibling.

- **`src/components/GoalItem.tsx:13-25`** — The `TouchableOpacity` has no
  `accessibilityRole`, no `accessibilityLabel`, and (most importantly) no
  `accessibilityState={{ checked: completed }}`. A goal checkbox should be
  announced as a checkbox with its state ("Read 10 min of Quran, checkbox,
  not checked. Double-tap to activate."). As-is the screen reader just hears
  the text and has no way to know it's interactive nor whether it's done.
  Fix: add `accessibilityRole="checkbox"`, `accessibilityState={{ checked: completed }}`,
  and `accessibilityLabel={text}` (or `accessibilityValue` for completion).

- **`src/components/HadithOfDay.tsx:31`** — The Arabic hadith text is
  rendered as a plain `<Text>` with no `accessibilityLanguage="ar"` and no
  language hint. iOS VoiceOver will try to read Arabic with the
  English/system voice, producing garbled phonetic output. Fix: add
  `accessibilityLanguage="ar"` to the Arabic Text node. Same issue applies
  whenever Urdu strings are rendered in an English locale (e.g. Eid card,
  NextEventCard, TodayCard render Urdu/Arabic in their fallback paths but
  only for users on those locales — lower risk).

## Important (degrades screen-reader experience)

- **`src/components/TodayCard.tsx:82-87`** — The whole card is a
  `TouchableOpacity` with no `accessibilityRole`, no `accessibilityLabel`,
  and no `accessibilityHint`. The screen reader will read each child Text
  (eyebrow, title, body, source, CTA) as separate items with no indication
  that they form one tappable card. Fix: add `accessible={true}`,
  `accessibilityRole="button"`, and an `accessibilityLabel` composed of
  eyebrow + title + action, plus `accessibilityHint={ctaText}` ("Start now").
  Same pattern applies to **`NextEventCard.tsx:86-90`** and the action
  buttons in **`EidHubCard.tsx:189-242`**.

- **`src/components/EidHubCard.tsx:190-242`** — Six action buttons
  (Qurbani, Takbir, Full Guide, Share, etc.) — none have
  `accessibilityRole="button"` or `accessibilityLabel`. The button label
  is interpolated with an emoji (e.g. `🐑 ${qurbaniText}`) so VoiceOver
  will announce "sheep, Qurbani" / "loudspeaker, Takbir". Cleaner to set
  `accessibilityLabel={qurbaniText}` and mark the emoji decorative via the
  label override. Same situation for the Share button (emoji `📤` prefix).

- **`src/components/NextEventCard.tsx:105`** — `countdownTxt` is formatted
  as `"5d · 2h"` for English. VoiceOver will read this as "5d middle dot
  2h" — confusing. Fix: build a separate `accessibilityLabel` for the card
  using full words ("5 days, 2 hours until Eid al-Adha"). The visual middle
  dot is fine to keep; just don't let the screen reader read it.

- **`src/components/HadithOfDay.tsx:26-37`** — The whole card has no
  `accessible={true}` wrapper, so the screen reader will read each Text
  (label, source, arabic, body, narrator) as five separate items with no
  grouping. Not interactive, but the lack of grouping makes it tedious to
  swipe through. Fix: wrap in `<View accessible={true}>` with a composed
  label.

- **`src/components/StreakCelebrationModal.tsx:57-115`** — The modal works
  for screen readers because RN `Modal` handles focus, but:
  - The big emoji (line 103-105) is decorative and will be announced as
    "moon emoji" before the title — add `accessibilityElementsHidden={true}`
    on it (iOS) and `importantForAccessibility="no"` (Android).
  - The CTA `TouchableOpacity` (line 108-110) has no
    `accessibilityRole="button"`. The text inside reads fine, but role is
    missing so VoiceOver won't say "button".
  - No `accessibilityViewIsModal={true}` on the overlay, so background
    elements may still be reachable by swipe under VoiceOver on iOS.

- **`src/components/AdBanner.tsx:36-48`** — The "Sponsored" label
  (line 37) is fine, but the `BannerAd` itself is rendered without any
  surrounding `accessibilityLabel`. Third-party ad SDK should handle its
  own a11y, but worth verifying the SDK announces "advertisement"
  context. Low priority — Google Mobile Ads typically self-labels.

## Minor (polish)

- **`src/components/MenuButton.tsx:10-19`** — Already has
  `accessibilityLabel="Open menu"` and `hitSlop`. Missing
  `accessibilityRole="button"` — without it, on Android TalkBack it may not
  announce "button". Tiny improvement, easy to add.

- **`src/components/MenuButton.tsx:12`** — Label is hard-coded English
  ("Open menu"). Should be localized via `t.openMenu` once that string
  exists.

- **`src/components/QuickActions.tsx:53-67`** — `accessibilityLabel` is set
  to a single word ("Quran", "Dua", "Tasbih", "Qibla"). Works but could be
  more descriptive — e.g. "Open Quran" / "Open Dua list". Also the emoji
  inside the icon circle (line 62) isn't hidden from a11y, so the screen
  reader may announce "book emoji, button, Quran". Add
  `accessibilityElementsHidden={true}` on the icon `<View>`.

- **`src/components/TodayCard.tsx:95`** — Icon emoji is read aloud. Hide
  from a11y once card-level label is added (so the label includes the icon
  meaning intentionally, not the raw emoji name).

- **`src/components/NextEventCard.tsx:98-99`** — Icon circle with emoji
  not hidden from a11y. Same fix as above.

- **`src/components/EidHubCard.tsx:171`** — `headerRow` icon (sheep / star
  emoji) not hidden from a11y. Same fix.

- **`src/screens/HomeScreen.tsx:266-269`** — The quotation mark `"` rendered
  as a large decorative character (styles.quoteMark) is read aloud as
  "quote". Mark `accessibilityElementsHidden={true}` since the actual
  quote text already follows.

- **`src/components/HadithOfDay.tsx:35`** — The "(RA)" suffix on narrator
  names will be read as "R A" by VoiceOver, not "RadiAllahu anhu". Consider
  expanding via `accessibilityLabel` on the narrator Text.

## Verified-good

- **`src/components/MenuButton.tsx:12,15`** — Has both `accessibilityLabel`
  AND `hitSlop`. The hit slop pattern (10px on each side, taking the 38×38
  button to an effective 58×58 touch target) is the gold standard.
- **`src/components/QuickActions.tsx:58-59`** — Already sets
  `accessibilityRole="button"` and a language-aware `accessibilityLabel`
  per locale. Solid baseline; just needs the icon-hidden polish.
- **HomeScreen `<Heading level={1}>` (line 222) and `<Heading level={2}>`
  (line 280)** — These come from `src/components/ui/Heading.tsx`, which sets
  `accessibilityRole="header"`. Verified there's NO duplicate header
  announcement risk: each child component (TodayCard, NextEventCard,
  EidHubCard, HadithOfDay) uses plain `<Text>` for its titles, not
  `<Heading>`, so we don't get nested header roles. The screen has exactly
  two headers: "Assalamu Alaikum" (h1) and "Today's Goals" (h2). Good.
- **`src/components/ui/Heading.tsx:50`** — `accessibilityRole="header"`
  applied once at the primitive level. Centralized = no drift.
- **`src/components/StreakCelebrationModal.tsx:57`** — `onRequestClose` is
  wired up (Android back button dismisses modal correctly).
- **`src/components/TodayCard.tsx:85`** — `disabled={!act.screen}` is
  passed to `TouchableOpacity`, which automatically sets
  `accessibilityState={{ disabled: true }}` on non-actionable days. Good.
- **`src/screens/HomeScreen.tsx:215-219`** — Hero `LinearGradient` has
  `pointerEvents="none"`, so it won't intercept touches OR appear as a
  focusable a11y element. Decorative and properly inert.
- **`src/components/AdBanner.tsx:37`** — The "Sponsored" label is plain
  text and will be announced before the ad, which is correct disclosure
  behavior.
