# Noor — Architectural Overhaul (Premium Spiritual)

**Date:** 2026-05-24
**Author:** Senior front-end review session
**Status:** Design approved, ready for implementation plan

---

## Why this exists

The app works. But brick by brick, the bricks are different shapes. Twenty-one screens each re-decide what a button looks like, what a modal looks like, what "press feedback" feels like. The audit found 321 `TouchableOpacity` instances with only 84 setting `activeOpacity`, seven modals each reinventing backdrops and headers, 24+ hex colors hardcoded outside the theme, and `QuranScreen.tsx` at 2113 lines doing nine jobs at once.

The user's complaint — "if we have a modal then modal doesn't even have its own background" — is a symptom. The disease is that nothing in this app was designed to be reused; everything was built to ship.

This spec covers fixing that, results-first, across every screen.

---

## Visual DNA — Premium Spiritual

The direction is **Premium Spiritual**: warm cream base, soft white cards with gentle shadows, a single gradient reserved for hero moments, generous breathing room, calligraphic accents used sparingly. It builds on the existing warm palette (`#FAF4E8` background, `#C8780A` accent) and elevates it to the polish level of Calm or Headspace — but in service of a different feeling: reverence, not relaxation.

### Principles

1. **Warmth, not noise.** Cream and brown carry the mood. Color is used to direct attention, not decorate. One gradient per screen, max — usually on the hero card.
2. **Cards float; backgrounds breathe.** Every card is white (or `surfaceElevated`) with a soft brown-tinted shadow. Cards have generous internal padding (`spacing.xl` minimum). Vertical rhythm between cards is `spacing.md`.
3. **Type is the design.** Syne for headings (already in the codebase), Plus Jakarta Sans for body. A proper scale (h1/h2/h3/body/caption) — not ad-hoc font sizes.
4. **Motion is felt, not seen.** Subtle press feedback on every interactive (`activeOpacity: 0.8`, scale-on-press for primary CTAs). Modals slide in with a real backdrop fade. Nothing pops, nothing jitters.
5. **Sacred content gets sacred treatment.** Arabic text always uses Mushaf fonts (Amiri/Noorehuda), proper line height (1.8+), proper `writingDirection: 'rtl'`. Verse references in small accent-colored caps. Never inline with body text.
6. **Empty states are screens too.** Every list/data view has a designed empty state. Every async screen has a designed loading state. Every failure has a designed error.

### Anti-principles (what we will not do)

- Skeuomorphic prayer mats, mosque silhouettes, or photographic Kaaba imagery in chrome.
- Glassmorphism, frosted blurs as primary surfaces.
- More than two type weights on one screen.
- Color-only state communication (color + icon + text, always).
- Ornamental Islamic patterns as foreground decoration (they're fine as 3% opacity backgrounds, never more).

---

## Strategy — Results-First Sequence

The user explicitly does not want a "tokens-first foundation phase." Every commit must be a visible improvement. So: pick a screen, redesign it end-to-end at the new quality bar, extract reusable pieces as a byproduct. Each screen completed makes the next one cheaper.

```
Day 1   →  HomeScreen end-to-end                  + Button, Card, Heading, semantic color tokens
Day 2   →  BottomSheet primitive                  + migrate PrayerSettingsModal, StreakCelebrationModal
Day 3   →  AsmaulHusnaScreen end-to-end           + PressableRow, AudioControl, ListSection primitives
Day 4   →  DuaScreen + TasbihScreen               (reuse everything from days 1–3)
Day 5–7 →  QuranScreen surgery                    + extract QuranReader, QuranSettings, ReciterPicker, QuranPlayer
Day 8+  →  Remaining 14 screens, ~1 per session   (Stats, Mood, Hifz, Hajj, Janaza, Qurbani, …)
```

**Cross-cutting** (woven into every day, not a separate phase):

- Add `accessibilityLabel` / `accessibilityRole` to every interactive element on every screen as it's touched.
- Replace inline hex colors with theme tokens during each screen's pass.
- Replace inline spacing magic numbers with `theme.spacing.*` during each screen's pass.
- Set up `<I18nProvider>` for RTL during day 1 (HomeScreen — first use site).

---

## Primitives to Extract

These are not built upfront. They are extracted on the day they are first needed.

### Day 1 (during HomeScreen)

- **`<Button>`** — variants: `primary`, `secondary`, `outline`, `ghost`. Props: `onPress`, `label`, `loading`, `disabled`, `icon`, `size` (`sm` | `md` | `lg`), `fullWidth`. Built-in `activeOpacity: 0.8`, `hitSlop: 10`, accessibility label defaults to `label`.
- **`<Card>`** — white surface, `spacing.xl` internal padding by default (overridable), `theme.shadows.md`, `borderRadius.xl`. Variant: `elevated` (heavier shadow) for hero moments.
- **`<Heading>`, `<Body>`, `<Caption>`** — typography primitives that read from `theme.typography.sizes.*` and apply correct fonts + line heights automatically. Eliminate inline `fontSize` everywhere.
- **`<Screen>`** — top-level wrapper handling `SafeAreaView`, status bar style, optional scroll, optional keyboard avoidance. Every screen wraps in this.

### Day 2 (during modal work)

- **`<BottomSheet>`** — the missing primitive. Handles: full backdrop with proper opacity, `statusBarTranslucent` (Android), safe-area insets, Android hardware back, optional swipe-to-dismiss, keyboard avoidance, optional snap points. Props: `visible`, `onClose`, `header`, `children`, `footer`, `maxHeight`, `dismissible`. Replaces 7 ad-hoc modal implementations.
- **`<Dialog>`** — centered alert variant for confirmations. Same backdrop machinery, different layout.

### Day 3 (during AsmaulHusnaScreen)

- **`<PressableRow>`** — replaces `TouchableOpacity` rows with text + chevron. Built-in `activeOpacity`, `hitSlop`, optional left icon, right accessory (chevron / switch / value text), divider style.
- **`<AudioControl>`** — reusable play/pause/scrub control. Used in Asma audio, future Quran audio, future dua audio.
- **`<ListSection>`** — section header + body with consistent spacing for grouped lists.

### Day 5–7 (during QuranScreen surgery)

- **`<QuranReader>`** — pure rendering of verses (mushaf or translation mode). Receives data, emits events.
- **`<QuranSettings>`** — settings BottomSheet (font size, translation, tajweed toggle).
- **`<ReciterPicker>`** — BottomSheet for picking reciter.
- **`<QuranPlayer>`** — audio playback strip (play/pause, surah/verse navigation, speed).
- **`useQuranReaderState()`** — custom hook absorbing the 30+ state variables currently in `QuranScreen.tsx`.

---

## Design Token Additions

Added to `src/constants/theme.ts` as they are needed, not all at once.

```ts
typography: {
  ...existing fonts,
  sizes:      { h1: 28, h2: 22, h3: 18, body: 15, caption: 12, micro: 10 },
  weights:    { regular: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeights:{ tight: 1.2, normal: 1.45, relaxed: 1.7, arabic: 2.0 },
  letterSpacing: { tight: -0.4, normal: 0, wide: 0.5, ultraWide: 1.5 },
},
colors: {
  ...existing,
  inverseText:      '#FFFFFF',
  inverseMuted:     'rgba(255,255,255,0.75)',
  inverseSecondary: 'rgba(255,255,255,0.55)',
  scrim:            'rgba(28,15,6,0.55)',   // standardized modal backdrop
  divider:          'rgba(124,90,64,0.12)', // hairline rules
  disabled:         'rgba(28,15,6,0.35)',
},
opacity: {
  border:   0.25,
  muted:    0.12,
  disabled: 0.5,
  pressed:  0.8,
},
motion: {
  durations: { fast: 150, normal: 220, slow: 320 },
  // Easing values are React Native Animated `Easing` builders, not strings —
  // import { Easing } from 'react-native' and use Easing.inOut(Easing.cubic).
  // Stored here so screens reference one source: theme.motion.easing.standard
  // (set at module init in theme.ts).
},
```

---

## Per-Screen Quality Bar

Every screen redesigned in this overhaul must meet this checklist before it's considered "done." This is the brick-by-brick guarantee.

- [ ] Wrapped in `<Screen>` (safe area + status bar handled).
- [ ] All colors come from `theme.colors.*`. Zero hex literals in the file.
- [ ] All spacing comes from `theme.spacing.*`. Zero magic-number paddings/margins.
- [ ] All font sizes come from `theme.typography.sizes.*`. Zero inline `fontSize`.
- [ ] All buttons are `<Button>`. Zero hand-rolled `TouchableOpacity` with bg color.
- [ ] All modals/sheets are `<BottomSheet>` or `<Dialog>`. Zero hand-rolled `Modal`.
- [ ] All press targets have `accessibilityLabel` and `accessibilityRole`.
- [ ] Dynamic text has `numberOfLines` set.
- [ ] Loading / empty / error states designed and implemented.
- [ ] Tab screens use `useFocusEffect` for data that changes off-screen (per [[project-tab-keep-alive-bug]]).
- [ ] Lists use memoized `renderItem` and `keyExtractor`.
- [ ] Visually verified on iOS and Android (or screenshot diff if remote).

---

## New Features (after foundation feels right)

These are sequenced AFTER days 1–7 — the foundation must be solid first or they'll be built on sand. Each is a separate spec when its turn comes.

1. **Cloud Bookmark Sync.** Opt-in, privacy-first. Bookmarks survive device changes. Supabase backed. UI: a "My Bookmarks" entry in Sidebar + sync toggle in Settings.
2. **Custom Prayer Reminder Offsets.** Instead of one fixed reminder time, let users pick "15 min before," "at iqamah," "30 min before" per prayer. Wire into existing notification service.
3. **Waqf-Aware Audio Playback.** When playing Quran recitation, auto-pause at Waqf Lazim markers (data is already there from the Mushaf reader). Toggle in audio settings.
4. **Tajweed Mini-Lessons.** When tajweed highlighting is toggled on, a one-tap modal explains each color (Qalqalah, Ghunnah, etc.). Educational, low-effort, high-delight.
5. **Friends & Streak Leaderboards.** Optional. Invite friends by code. Shared 7-/30-day Quran/prayer streak challenges. Major retention lever in Muslim Pro. Largest feature — its own spec.

Ordering: 2 → 3 → 4 → 1 → 5. (Reminder offsets and waqf-aware audio are smallest wins; bookmark sync needs backend; leaderboards are biggest.)

---

## Risks & Rollback

- **QuranScreen refactor** is the highest-risk step. Mitigation: do it last, behind the foundation work. Use a feature flag if needed (`useNewQuranReader`) to ship the old reader as fallback for the first few days.
- **User wants visible results daily.** Mitigation: this whole sequence is screen-by-screen for exactly that reason. No invisible foundation work. Every commit ships a visible win.
- **Regression risk on cross-cutting work** (RTL provider, a11y labels). Mitigation: do it incrementally as each screen is touched, not as a separate sweep. If it breaks something, it broke one screen's worth.
- **Scope creep** ("new features" pulling focus from foundation). Mitigation: features are explicitly gated after day 7. Document is the gate.
- **Token migration ordering bug** — if a screen uses a new token name before the token is added to the theme, the app crashes. Mitigation: add the token in the same commit as the screen that first uses it.

## Commit cadence

Per [[feedback-ship-cadence]] and [[feedback-solo-dev-workflow]]: commits directly to `main`, no PRs, one logical commit per screen or per primitive extracted. Every push is a shippable build. Tag a release every 3–5 screens to keep a stable rollback point.

## Implementation plan decomposition

This spec is the overall vision — too large for a single implementation plan. It is split into per-day plans, each producing a shippable build:

- **Plan 1 — HomeScreen + Day-1 primitives.** Token additions, `<Screen>`, `<Heading>/<Body>/<Caption>`, `<Button>`, `<Card>`, HomeScreen redesign, I18nProvider scaffold.
- **Plan 2 — Modal system.** `<BottomSheet>`, `<Dialog>` primitives; migrate `PrayerSettingsModal`, `StreakCelebrationModal`, `WaqfLegendModal`, `AyahSheet`, and the inline modals in DuaScreen / AsmaulHusnaScreen.
- **Plan 3 — AsmaulHusnaScreen redesign.** `<PressableRow>`, `<AudioControl>`, `<ListSection>` primitives; screen redesign + a11y pass.
- **Plan 4 — DuaScreen + TasbihScreen.** Pure consumption — no new primitives expected.
- **Plan 5 — QuranScreen surgery.** Break 2113 lines into `<QuranReader>`, `<QuranSettings>`, `<ReciterPicker>`, `<QuranPlayer>` + `useQuranReaderState()`.
- **Plans 6–N — Remaining screens.** One screen per plan: Stats, Mood, Hifz, Hajj, Janaza, Qurbani, Eid, Takbir, PrayerTracker, Qibla, Onboarding, SacredJourney, Learn, UmrahGuide.

New features (cloud sync, reminder offsets, waqf-aware audio, tajweed lessons, leaderboards) are each their own spec, opened after Plan C concludes.

---

## Out of scope

- Backend or server-side changes (except the future cloud sync feature, which gets its own spec).
- New navigation patterns (the current tab + sidebar structure stays).
- Quran data/translation changes — purely a UI/UX overhaul.
- Tests. The user has explicitly de-prioritized test ceremony in solo-dev mode. Visual verification per-screen, not automated regression.
- Internationalization content work. RTL infrastructure is in scope; translating strings is not.

---

## What "done" looks like

When the last screen has passed the per-screen quality bar checklist, the app should:

- Feel like one designer made it, not 21 different developers.
- Every modal opens the same way, has the same backdrop, dismisses the same way.
- Every button feels the same to press, has the same tap behavior, the same a11y story.
- The theme file is the only place colors, spacing, type, shadows live. Zero greps for hex codes return results outside of `theme.ts`.
- `QuranScreen.tsx` is under 300 lines and reads top-to-bottom in one sitting.
- The app is RTL-ready (provider wired even if Arabic UI is opt-in).
- Every interactive element is screen-reader accessible.

That's the bar. Brick by brick.
